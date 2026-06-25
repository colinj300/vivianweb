import { NextResponse } from "next/server";
import { listAceos } from "@/lib/store";

// Public listing for the shop — only safe fields.
export async function GET() {
  const all = await listAceos();
  const aceos = all.map((a) => ({
    id: a.id,
    title: a.title,
    imageUrl: a.imageUrl,
    price: a.price,
    status: a.status,
  }));
  return NextResponse.json({ aceos });
}
