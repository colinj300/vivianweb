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

// Accept either the Upstash names or Vercel KV names, whichever the
// integration injected.
const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
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

export async function deleteCommission(id) {
  if (useRedis) {
    await redis(["LREM", INDEX_KEY, "0", id]);
    await redis(["DEL", itemKey(id)]);
  } else {
    mem.ids = mem.ids.filter((x) => x !== id);
    mem.items.delete(id);
  }
  return true;
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

// =====================================================================
//  ACEO shop listings (separate from commissions)
// =====================================================================
const ACEO_INDEX = "aceo_ids";
const aceoKey = (id) => `aceo:${id}`;
const memA =
  globalThis.__aceoMem || (globalThis.__aceoMem = { ids: [], items: new Map() });

export async function saveAceo(record) {
  if (useRedis) {
    await redis(["SET", aceoKey(record.id), JSON.stringify(record)]);
    await redis(["LPUSH", ACEO_INDEX, record.id]);
  } else {
    memA.ids.unshift(record.id);
    memA.items.set(record.id, record);
  }
  return record;
}

export async function listAceos() {
  if (useRedis) {
    const ids = (await redis(["LRANGE", ACEO_INDEX, "0", "-1"])) || [];
    if (ids.length === 0) return [];
    const raw = await redis(["MGET", ...ids.map(aceoKey)]);
    return raw.filter(Boolean).map((r) => JSON.parse(r));
  }
  return memA.ids.map((id) => memA.items.get(id)).filter(Boolean);
}

export async function getAceo(id) {
  if (useRedis) {
    const raw = await redis(["GET", aceoKey(id)]);
    return raw ? JSON.parse(raw) : null;
  }
  return memA.items.get(id) || null;
}

export async function updateAceo(id, patch) {
  const current = await getAceo(id);
  if (!current) return null;
  const updated = { ...current, ...patch };
  if (useRedis) {
    await redis(["SET", aceoKey(id), JSON.stringify(updated)]);
  } else {
    memA.items.set(id, updated);
  }
  return updated;
}

export async function deleteAceo(id) {
  if (useRedis) {
    await redis(["LREM", ACEO_INDEX, "0", id]);
    await redis(["DEL", aceoKey(id)]);
  } else {
    memA.ids = memA.ids.filter((x) => x !== id);
    memA.items.delete(id);
  }
  return true;
}

// =====================================================================
//  Open site reviews (from anyone — not tied to a commission order)
// =====================================================================
const REVIEW_INDEX = "site_review_ids";
const reviewKey = (id) => `site_review:${id}`;
const memR =
  globalThis.__reviewMem || (globalThis.__reviewMem = { ids: [], items: new Map() });

export async function saveReview(record) {
  if (useRedis) {
    await redis(["SET", reviewKey(record.id), JSON.stringify(record)]);
    await redis(["LPUSH", REVIEW_INDEX, record.id]);
  } else {
    memR.ids.unshift(record.id);
    memR.items.set(record.id, record);
  }
  return record;
}

export async function listReviews() {
  if (useRedis) {
    const ids = (await redis(["LRANGE", REVIEW_INDEX, "0", "-1"])) || [];
    if (ids.length === 0) return [];
    const raw = await redis(["MGET", ...ids.map(reviewKey)]);
    return raw.filter(Boolean).map((r) => JSON.parse(r));
  }
  return memR.ids.map((id) => memR.items.get(id)).filter(Boolean);
}

export async function updateReview(id, patch) {
  const current = useRedis
    ? await (async () => {
        const raw = await redis(["GET", reviewKey(id)]);
        return raw ? JSON.parse(raw) : null;
      })()
    : memR.items.get(id) || null;
  if (!current) return null;
  const updated = { ...current, ...patch };
  if (useRedis) {
    await redis(["SET", reviewKey(id), JSON.stringify(updated)]);
  } else {
    memR.items.set(id, updated);
  }
  return updated;
}

export async function deleteReview(id) {
  if (useRedis) {
    await redis(["LREM", REVIEW_INDEX, "0", id]);
    await redis(["DEL", reviewKey(id)]);
  } else {
    memR.ids = memR.ids.filter((x) => x !== id);
    memR.items.delete(id);
  }
  return true;
}

// =====================================================================
//  Finance ledger (manual income/expense entries added in the admin;
//  commission + ACEO income is computed automatically, not stored here)
// =====================================================================
const FINANCE_INDEX = "finance_ids";
const financeKey = (id) => `finance:${id}`;
const memF =
  globalThis.__financeMem || (globalThis.__financeMem = { ids: [], items: new Map() });

export async function saveFinanceEntry(record) {
  if (useRedis) {
    await redis(["SET", financeKey(record.id), JSON.stringify(record)]);
    await redis(["LPUSH", FINANCE_INDEX, record.id]);
  } else {
    memF.ids.unshift(record.id);
    memF.items.set(record.id, record);
  }
  return record;
}

export async function listFinanceEntries() {
  if (useRedis) {
    const ids = (await redis(["LRANGE", FINANCE_INDEX, "0", "-1"])) || [];
    if (ids.length === 0) return [];
    const raw = await redis(["MGET", ...ids.map(financeKey)]);
    return raw.filter(Boolean).map((r) => JSON.parse(r));
  }
  return memF.ids.map((id) => memF.items.get(id)).filter(Boolean);
}

export async function deleteFinanceEntry(id) {
  if (useRedis) {
    await redis(["LREM", FINANCE_INDEX, "0", id]);
    await redis(["DEL", financeKey(id)]);
  } else {
    memF.ids = memF.ids.filter((x) => x !== id);
    memF.items.delete(id);
  }
  return true;
}

export { useRedis };
