import { NextResponse } from "next/server";
import { originals } from "@/lib/config";
import { listOriginalSales } from "@/lib/store";

// Public list of original paintings + whether each has sold.
export async function GET() {
  const sales = await listOriginalSales();
  const soldIds = new Set(sales.map((s) => s.id));
  const items = originals.map((o) => ({
    id: o.id,
    title: o.title,
    image: o.image,
    price: o.price,
    size: o.size,
    description: o.description,
    status: soldIds.has(o.id) ? "sold" : "available",
  }));
  return NextResponse.json({ originals: items });
}
