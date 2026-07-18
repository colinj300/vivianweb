import { mapTargetTotal, mapSpread } from "@/lib/config";
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

  // Top the map up to the target total with spread "filler" orders, taken
  // from the front of the list until we reach the target. Real orders always
  // keep their real locations; only the remainder is filled in.
  let remaining = Math.max(0, (mapTargetTotal || 0) - mapped);
  for (const [raw, base] of mapSpread || []) {
    if (remaining <= 0) break;
    const code = normalizeState(raw);
    const take = Math.min(Number(base) || 0, remaining);
    if (!code || take <= 0) continue;
    states[code] = (states[code] || 0) + take;
    mapped += take;
    remaining -= take;
  }

  return {
    states,
    stateCount: Object.keys(states).length,
    orderCount: mapped,
    unmapped,
  };
}
