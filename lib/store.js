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
//  Original-painting sales. The listings live in config; here we only
//  record which ones have sold (keyed by the config `id`), with buyer +
//  shipping details for fulfillment.
// =====================================================================
const ORIGINAL_INDEX = "original_sale_ids";
const originalKey = (id) => `original:${id}`;
const memOr =
  globalThis.__originalMem || (globalThis.__originalMem = { ids: [], items: new Map() });

export async function saveOriginalSale(record) {
  const exists = await getOriginalSale(record.id);
  if (useRedis) {
    await redis(["SET", originalKey(record.id), JSON.stringify(record)]);
    if (!exists) await redis(["LPUSH", ORIGINAL_INDEX, record.id]);
  } else {
    if (!exists) memOr.ids.unshift(record.id);
    memOr.items.set(record.id, record);
  }
  return record;
}

export async function getOriginalSale(id) {
  if (useRedis) {
    const raw = await redis(["GET", originalKey(id)]);
    return raw ? JSON.parse(raw) : null;
  }
  return memOr.items.get(id) || null;
}

export async function listOriginalSales() {
  if (useRedis) {
    const ids = (await redis(["LRANGE", ORIGINAL_INDEX, "0", "-1"])) || [];
    if (ids.length === 0) return [];
    const raw = await redis(["MGET", ...ids.map(originalKey)]);
    return raw.filter(Boolean).map((r) => JSON.parse(r));
  }
  return memOr.ids.map((id) => memOr.items.get(id)).filter(Boolean);
}

// =====================================================================
//  Sticker pre-orders (pay now, ship later) + a settings blob for the
//  admin-editable listing image.
// =====================================================================
const PREORDER_INDEX = "preorder_ids";
const preorderKey = (id) => `preorder:${id}`;
const PREORDER_SETTINGS = "preorder_settings";
const memP =
  globalThis.__preorderMem ||
  (globalThis.__preorderMem = { ids: [], items: new Map(), settings: {} });

// Save keyed by the Stripe session id so a refreshed thank-you page can't
// record the same pre-order twice.
export async function savePreorder(record) {
  const exists = await getPreorder(record.id);
  if (useRedis) {
    await redis(["SET", preorderKey(record.id), JSON.stringify(record)]);
    if (!exists) await redis(["LPUSH", PREORDER_INDEX, record.id]);
  } else {
    if (!exists) memP.ids.unshift(record.id);
    memP.items.set(record.id, record);
  }
  return record;
}

export async function getPreorder(id) {
  if (useRedis) {
    const raw = await redis(["GET", preorderKey(id)]);
    return raw ? JSON.parse(raw) : null;
  }
  return memP.items.get(id) || null;
}

export async function listPreorders() {
  if (useRedis) {
    const ids = (await redis(["LRANGE", PREORDER_INDEX, "0", "-1"])) || [];
    if (ids.length === 0) return [];
    const raw = await redis(["MGET", ...ids.map(preorderKey)]);
    return raw.filter(Boolean).map((r) => JSON.parse(r));
  }
  return memP.ids.map((id) => memP.items.get(id)).filter(Boolean);
}

export async function updatePreorder(id, patch) {
  const current = await getPreorder(id);
  if (!current) return null;
  const updated = { ...current, ...patch };
  if (useRedis) {
    await redis(["SET", preorderKey(id), JSON.stringify(updated)]);
  } else {
    memP.items.set(id, updated);
  }
  return updated;
}

export async function getPreorderSettings() {
  if (useRedis) {
    const raw = await redis(["GET", PREORDER_SETTINGS]);
    return raw ? JSON.parse(raw) : {};
  }
  return memP.settings || {};
}

export async function savePreorderSettings(patch) {
  const current = await getPreorderSettings();
  const updated = { ...current, ...patch };
  if (useRedis) {
    await redis(["SET", PREORDER_SETTINGS, JSON.stringify(updated)]);
  } else {
    memP.settings = updated;
  }
  return updated;
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
