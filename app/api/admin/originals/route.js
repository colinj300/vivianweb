import { NextResponse } from "next/server";
import Stripe from "stripe";
import { originals } from "@/lib/config";
import { isAuthorized } from "@/lib/admin";
import { getOriginalSale, saveOriginalSale } from "@/lib/store";
import { orderFromSession } from "@/lib/stripeOrder";

// GET → each original with its sale (buyer + shipping) if it's sold.
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await Promise.all(
    originals.map(async (o) => {
      const sale = await getOriginalSale(o.id);
      return {
        id: o.id,
        title: o.title,
        image: o.image,
        price: o.price,
        size: o.size,
        status: sale ? "sold" : "available",
        sale: sale || null,
      };
    })
  );
  return NextResponse.json({ originals: items });
}

// PATCH { id, action: "fetchBuyer" } → backfill buyer + address from Stripe
// for an original that sold before we recorded it (or to re-sync).
export async function PATCH(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, action } = await req.json();
  if (action !== "fetchBuyer" || !id) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const o = originals.find((x) => x.id === id);
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Payments aren't connected." }, { status: 503 });

  try {
    const stripe = new Stripe(key);
    const existing = await getOriginalSale(id);
    let match = null;
    if (existing?.sessionId) {
      match = await stripe.checkout.sessions.retrieve(existing.sessionId);
    } else {
      const list = await stripe.checkout.sessions.list({ limit: 100 });
      const found = list.data.find(
        (s) => s.metadata?.originalId === id && s.payment_status === "paid"
      );
      if (found) match = await stripe.checkout.sessions.retrieve(found.id);
    }
    if (!match) {
      return NextResponse.json(
        { error: "Couldn't find this sale in Stripe (older than the last 100 orders?)." },
        { status: 404 }
      );
    }
    const order = orderFromSession(match);
    await saveOriginalSale({
      id: o.id,
      title: o.title,
      status: "sold",
      soldAt: existing?.soldAt || new Date().toISOString(),
      sessionId: order.sessionId,
      buyer: order.buyer,
      shipping: order.shipping,
      soldPrice: order.amount || o.price,
      image: o.image,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Original fetchBuyer error:", err?.message);
    return NextResponse.json({ error: err?.message || "Stripe lookup failed." }, { status: 500 });
  }
}
