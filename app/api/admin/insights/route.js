import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/admin";
import { listCommissions, listAceos, listPreorders } from "@/lib/store";
import { normalizeState } from "@/lib/usStates";

// GET /api/admin/insights → count of orders per US state (for the map).
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [commissions, aceos, preorders] = await Promise.all([
    listCommissions(),
    listAceos(),
    listPreorders(),
  ]);

  // Every real order that has a shipping address contributes its state.
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

  return NextResponse.json({
    states,
    stateCount: Object.keys(states).length,
    orderCount: mapped,
    unmapped,
  });
}
