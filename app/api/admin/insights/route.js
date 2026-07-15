import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/admin";
import { orderStateCounts } from "@/lib/orderStates";

// GET /api/admin/insights → count of orders per US state (for the map).
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await orderStateCounts());
}
