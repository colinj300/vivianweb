import { NextResponse } from "next/server";
import Stripe from "stripe";
import { commissionTypes, canvasSizes, addOns, site } from "@/lib/config";

// Recompute the price on the server from the trusted config so the amount
// charged can never be tampered with by the browser.
function priceOrder({ typeId, sizeId, addOnIds = [] }) {
  const type = commissionTypes.find((t) => t.id === typeId);
  const size = canvasSizes.find((s) => s.id === sizeId);
  if (!type || !size) return null;

  const picked = addOns.filter((a) => addOnIds.includes(a.id));
  const total =
    type.basePrice + size.priceAdd + picked.reduce((s, a) => s + a.priceAdd, 0);

  const description = [
    `${type.name} commission`,
    size.name,
    ...picked.map((a) => a.name),
  ].join(" · ");

  return { total, description, type, size, picked };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const order = priceOrder(body);
    if (!order) {
      return NextResponse.json({ error: "Invalid selection." }, { status: 400 });
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      // Friendly message so the site still runs before keys are added.
      return NextResponse.json(
        {
          error:
            "Payments aren't connected yet. (Add your Stripe key to start accepting orders.)",
        },
        { status: 503 }
      );
    }

    const stripe = new Stripe(key);

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: order.total * 100, // cents
            product_data: {
              name: `${site.artistName} — ${order.type.name} Commission`,
              description: order.description,
            },
          },
        },
      ],
      // Keep the buyer's brief with the order so Vivian sees it in Stripe.
      metadata: {
        customer_name: (body.name || "").slice(0, 200),
        commission_type: order.type.name,
        canvas_size: order.size.name,
        add_ons: order.picked.map((a) => a.name).join(", "),
        details: (body.details || "").slice(0, 480),
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Could not create checkout session." },
      { status: 500 }
    );
  }
}
