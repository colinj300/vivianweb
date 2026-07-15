import { NextResponse } from "next/server";
import { orderStateCounts } from "@/lib/orderStates";

// Public: aggregate order counts per US state (for the map on /reviews).
// Only counts are returned — no customer names or addresses.
export async function GET() {
  const data = await orderStateCounts();
  return NextResponse.json({
    states: data.states,
    stateCount: data.stateCount,
    orderCount: data.orderCount,
  });
}
