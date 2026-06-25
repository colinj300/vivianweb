// =====================================================================
//  Tiny data store for commission requests + the waitlist.
//
//  • In production: uses Upstash Redis (a free, Vercel-friendly database)
//    via its REST API — just set UPSTASH_REDIS_REST_URL and
//    UPSTASH_REDIS_REST_TOKEN. No extra packages needed.
//  • In local preview (no Upstash env): falls back to an in-memory store
//    so everything works while you try it out. (This resets whenever the
//    dev server restarts — that's expected for preview only.)
// =====================================================================

import { maxActiveCommissions } from "@/lib/config";

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(URL && TOKEN);

const INDEX_KEY = "commission_ids";
const itemKey = (id) => `commission:${id}`;

// ---- Upstash REST helper -------------------------------------------------
async function redis(command) {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.result;
}

// ---- In-memory fallback --------------------------------------------------
const mem = globalThis.__commissionMem || (globalThis.__commissionMem = { ids: [], items: new Map() });

// ---- Public API ----------------------------------------------------------
export async function saveCommission(record) {
  if (useRedis) {
    await redis(["SET", itemKey(record.id), JSON.stringify(record)]);
    await redis(["LPUSH", INDEX_KEY, record.id]);
  } else {
    mem.ids.unshift(record.id);
    mem.items.set(record.id, record);
  }
  return record;
}

export async function listCommissions() {
  if (useRedis) {
    const ids = (await redis(["LRANGE", INDEX_KEY, "0", "-1"])) || [];
    if (ids.length === 0) return [];
    const raw = await redis(["MGET", ...ids.map(itemKey)]);
    return raw.filter(Boolean).map((r) => JSON.parse(r));
  }
  return mem.ids.map((id) => mem.items.get(id)).filter(Boolean);
}

export async function getCommission(id) {
  if (useRedis) {
    const raw = await redis(["GET", itemKey(id)]);
    return raw ? JSON.parse(raw) : null;
  }
  return mem.items.get(id) || null;
}

// Look up a commission by its customer-facing order number.
export async function getByOrderNumber(orderNumber) {
  if (!orderNumber) return null;
  const wanted = String(orderNumber).trim().toUpperCase();
  const all = await listCommissions();
  return all.find((c) => (c.orderNumber || "").toUpperCase() === wanted) || null;
}

export async function updateCommission(id, patch) {
  const current = await getCommission(id);
  if (!current) return null;
  const updated = { ...current, ...patch };
  if (useRedis) {
    await redis(["SET", itemKey(id), JSON.stringify(updated)]);
  } else {
    mem.items.set(id, updated);
  }
  return updated;
}

// How many commissions are currently active (approved & taking a slot).
export async function countActive() {
  const all = await listCommissions();
  return all.filter((c) => c.status === "approved").length;
}

// Is there an open slot right now?
export async function hasOpenSlot() {
  return (await countActive()) < maxActiveCommissions;
}

export async function countWaitlist() {
  const all = await listCommissions();
  return all.filter((c) => c.status === "waitlist").length;
}

export { useRedis };
