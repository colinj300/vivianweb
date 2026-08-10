import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site, originals } from "@/lib/config";
import { getAceo, getOriginalSale } from "@/lib/store";

// Start a Stripe Checkout for a single shop item — an ACEO or an original.
export async function POST(req) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "The shop isn't connected to payments yet." },
      { status: 503 }
    );
  }

  const { aceoId, originalId } = await req.json();

  // Resolve the item (ACEO from the store, or an original from config).
  let item; // { name, price, image, metadata }
  if (originalId) {
    const o = originals.find((x) => x.id === originalId);
    if (!o) return NextResponse.json({ error: "Item not found." }, { status: 404 });
    if (await getOriginalSale(o.id)) {
      return NextResponse.json({ error: "Sorry, that piece just sold!" }, { status: 409 });
    }
    item = {
      name: `${site.brand} — Original: ${o.title}`,
      price: o.price,
      image: o.image,
      metadata: { originalId: o.id, kind: "original" },
    };
  } else {
    const aceo = await getAceo(aceoId);
    if (!aceo) return NextResponse.json({ error: "Item not found." }, { status: 404 });
    if (aceo.status !== "available") {
      return NextResponse.json({ error: "Sorry, that piece just sold!" }, { status: 409 });
    }
    const kind = aceo.type || "aceo";
    const label = kind === "sticker" ? "Sticker" : kind === "original" ? "Original" : "ACEO";
    item = {
      name: `${site.brand} — ${label}: ${aceo.title}`,
      price: aceo.price,
      image: aceo.imageUrl,
      metadata: { aceoId: aceo.id, kind },
    };
  }

  try {
    const stripe = new Stripe(key);
    const origin =
      req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    // Config image paths are relative; Stripe needs absolute URLs.
    const imageUrl = item.image
      ? item.image.startsWith("http")
        ? item.image
        : `${origin}${item.image}`
      : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(item.price * 100),
            product_data: {
              name: item.name,
              images: imageUrl ? [imageUrl] : undefined,
            },
          },
        },
      ],
      // Collect a shipping address for the physical piece.
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      metadata: item.metadata,
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
