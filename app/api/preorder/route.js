import { NextResponse } from "next/server";
import { preorder } from "@/lib/config";
import { listPreorders, getPreorderSettings } from "@/lib/store";
import { preorderState } from "@/lib/preorder";

// Count paid (non-refunded) sheets toward the goal.
export async function countPaidSheets() {
  const all = await listPreorders();
  return all
    .filter((p) => p.status === "paid" || p.status === "fulfilled")
    .reduce((t, p) => t + (Number(p.quantity) || 1), 0);
}

// GET /api/preorder → public info: product, live count, and campaign state.
export async function GET() {
  if (!preorder.active) {
    return NextResponse.json({ active: false });
  }
  const [count, settings] = await Promise.all([countPaidSheets(), getPreorderSettings()]);
  const state = preorderState({ count });

  return NextResponse.json({
    active: true,
    title: preorder.title,
    price: preorder.price,
    sheetSize: preorder.sheetSize,
    description: preorder.description,
    image: settings.image || preorder.image || "",
    shipBy: preorder.shipBy,
    maxPerOrder: preorder.maxPerOrder,
    ...state,
  });
}
