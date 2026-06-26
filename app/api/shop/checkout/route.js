import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site } from "@/lib/config";
import { getAceo } from "@/lib/store";

// Start a Stripe Checkout for a single ACEO.
export async function POST(req) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "The shop isn't connected to payments yet." },
      { status: 503 }
    );
  }

  const { aceoId } = await req.json();
  const aceo = await getAceo(aceoId);
  if (!aceo) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  if (aceo.status !== "available") {
    return NextResponse.json({ error: "Sorry, that piece just sold!" }, { status: 409 });
  }

  try {
    const stripe = new Stripe(key);
    const origin =
      req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: aceo.price * 100,
            product_data: {
              name: `${site.brand} — ACEO: ${aceo.title}`,
              images: aceo.imageUrl ? [aceo.imageUrl] : undefined,
            },
          },
        },
      ],
      // Collect a shipping address for the physical card.
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      metadata: { aceoId: aceo.id, kind: "aceo" },
      success_url: `${origin}/shop/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Shop checkout error:", err);
    return NextResponse.json(
      { error: err?.message || "Could not start checkout." },
      { status: 500 }
    );
  }
}
