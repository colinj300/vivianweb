import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site } from "@/lib/config";
import { isAuthorized } from "@/lib/admin";
import { getCommission, updateCommission } from "@/lib/store";
import { sendEmail } from "@/lib/notify";

// Create a Stripe payment link for the final (reviewed) price and attach it
// to the commission. Optionally emails the link to the customer.
export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Add your Stripe key (STRIPE_SECRET_KEY) to create payment links." },
      { status: 503 }
    );
  }

  const { id, amount, emailCustomer } = await req.json();
  const commission = await getCommission(id);
  if (!commission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dollars = Math.round(Number(amount ?? commission.finalPrice ?? commission.estimate));
  if (!dollars || dollars < 1) {
    return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  }

  try {
    const stripe = new Stripe(key);
    const origin =
      req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: dollars * 100,
      product_data: { name: `${site.brand} — Commission for ${commission.name}` },
    });

    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        commission_id: commission.id,
        customer_name: commission.name,
        size: commission.sizeName,
      },
      after_completion: {
        type: "redirect",
        redirect: { url: `${origin}/success` },
      },
    });

    await updateCommission(id, { finalPrice: dollars, paymentLink: link.url });

    if (emailCustomer) {
      const orderLine = commission.orderNumber
        ? `Your order number is ${commission.orderNumber}. ` +
          `Track your commission's progress any time at ${origin}/track\n\n`
        : "";
      await sendEmail({
        to: commission.email,
        subject: `Your commission from ${site.brand} — payment link`,
        text:
          `Hi ${commission.name}!\n\nThank you for your commission request. ` +
          `Here's your secure payment link for $${dollars}:\n${link.url}\n\n` +
          orderLine +
          `Once payment is received I'll get started. Thank you!\n— ${site.artistName}`,
      });
    }

    return NextResponse.json({ ok: true, url: link.url, finalPrice: dollars });
  } catch (err) {
    console.error("Payment link error:", err);
    return NextResponse.json({ error: "Could not create payment link." }, { status: 500 });
  }
}
