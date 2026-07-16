import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site, preorder } from "@/lib/config";
import { getPreorderSettings } from "@/lib/store";
import { preorderState } from "@/lib/preorder";
import { countPaidSheets } from "../route";

// Start a Stripe Checkout for a sticker pre-order (pay now, ship later).
export async function POST(req) {
  if (!preorder.active) {
    return NextResponse.json({ error: "Pre-orders aren't open right now." }, { status: 400 });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "The shop isn't connected to payments yet." },
      { status: 503 }
    );
  }

  // Pre-orders close once the deadline passes.
  const count = await countPaidSheets();
  const state = preorderState({ count });
  if (!state.open) {
    return NextResponse.json(
      { error: "Pre-orders are closed for this drop." },
      { status: 409 }
    );
  }

  const { quantity } = await req.json().catch(() => ({}));
  const qty = Math.max(1, Math.min(preorder.maxPerOrder, Math.round(Number(quantity) || 1)));

  try {
    const stripe = new Stripe(key);
    const origin =
      req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const settings = await getPreorderSettings();
    const image = settings.image || preorder.image || "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: qty,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(preorder.price * 100),
            product_data: {
              name: `${preorder.title} — pre-order (${preorder.sheetSize})`,
              description: `Ships by ${preorder.shipBy}. Full refund if the goal isn't met.`,
              images: image ? [image] : undefined,
            },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      metadata: { kind: "preorder", title: preorder.title, quantity: String(qty) },
      success_url: `${origin}/preorder/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Pre-order checkout error:", err);
    return NextResponse.json(
      { error: err?.message || "Could not start checkout." },
      { status: 500 }
    );
  }
}
