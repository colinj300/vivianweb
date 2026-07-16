import { mapExtraStates } from "@/lib/config";
import { listCommissions, listAceos, listPreorders } from "@/lib/store";
import { normalizeState } from "@/lib/usStates";

// Aggregate how many real orders shipped to each US state. Returns only
// counts (no names/addresses), so it's safe to expose publicly.
export async function orderStateCounts() {
  const [commissions, aceos, preorders] = await Promise.all([
    listCommissions(),
    listAceos(),
    listPreorders(),
  ]);

  const orders = [
    ...commissions.filter((c) => c.status === "approved" || c.status === "completed"),
    ...aceos.filter((a) => a.status === "sold"),
    ...preorders.filter((p) => p.status === "paid" || p.status === "fulfilled"),
  ];

  const states = {};
  let mapped = 0;
  let unmapped = 0;
  for (const o of orders) {
    const raw = o.shipping?.state;
    if (!raw) continue;
    const code = normalizeState(raw);
    if (code) {
      states[code] = (states[code] || 0) + 1;
      mapped++;
    } else {
      unmapped++;
    }
  }

  // Seed states from config (past sales the site didn't record, etc.).
  for (const [raw, n] of Object.entries(mapExtraStates || {})) {
    const code = normalizeState(raw);
    const count = Number(n) || 0;
    if (!code || count <= 0) continue;
    states[code] = (states[code] || 0) + count;
    mapped += count;
  }

  return {
    states,
    stateCount: Object.keys(states).length,
    orderCount: mapped,
    unmapped,
  };
}
