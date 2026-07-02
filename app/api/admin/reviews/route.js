import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/admin";
import {
  listCommissions,
  getCommission,
  updateCommission,
  listReviews,
  updateReview,
  deleteReview,
} from "@/lib/store";

// All reviews (commission + open), including hidden ones — admin view.
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [all, open] = await Promise.all([listCommissions(), listReviews()]);

  const fromOrders = all
    .filter((c) => c.testimonial)
    .map((c) => ({
      id: c.id,
      source: "order",
      name: c.name,
      orderNumber: c.orderNumber || "",
      rating: c.testimonial.rating,
      text: c.testimonial.text,
      at: c.testimonial.at,
      hidden: !!c.testimonial.hidden,
    }));

  const fromAnyone = open.map((r) => ({
    id: r.id,
    source: "open",
    name: r.name,
    orderNumber: "",
    rating: r.rating,
    text: r.text,
    at: r.at,
    hidden: !!r.hidden,
  }));

  const reviews = [...fromOrders, ...fromAnyone].sort(
    (a, b) => new Date(b.at) - new Date(a.at)
  );
  return NextResponse.json({ reviews });
}

// Hide / un-hide a review. { source, id, hidden }
export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { source, id, hidden } = await req.json();
  if (!id || typeof hidden !== "boolean") {
    return NextResponse.json({ error: "Missing id or hidden flag" }, { status: 400 });
  }

  if (source === "order") {
    const c = await getCommission(id);
    if (!c?.testimonial) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await updateCommission(id, { testimonial: { ...c.testimonial, hidden } });
  } else {
    const r = await updateReview(id, { hidden });
    if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// Remove a review permanently. ?source=order|open&id=...
export async function DELETE(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const source = req.nextUrl.searchParams.get("source");
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (source === "order") {
    await updateCommission(id, { testimonial: null });
  } else {
    await deleteReview(id);
  }
  return NextResponse.json({ ok: true });
}
