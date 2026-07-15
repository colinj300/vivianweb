import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAuthorized } from "@/lib/admin";

// GET /api/admin/stripe → your Stripe balance + recent payments, so you can
// see money received without logging into Stripe.
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ connected: false });
  }

  try {
    const stripe = new Stripe(key);
    const [balance, charges] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.charges.list({ limit: 25 }),
    ]);

    const sumUsd = (arr) =>
      (arr || [])
        .filter((b) => b.currency === "usd")
        .reduce((t, b) => t + b.amount, 0) / 100;

    const payments = charges.data
      .filter((c) => c.paid || c.status === "succeeded")
      .map((c) => ({
        id: c.id,
        amount: c.amount / 100,
        refunded: c.refunded,
        amountRefunded: (c.amount_refunded || 0) / 100,
        currency: (c.currency || "usd").toUpperCase(),
        created: (c.created || 0) * 1000,
        name: c.billing_details?.name || "",
        email: c.billing_details?.email || c.receipt_email || "",
        description: c.description || "",
        live: c.livemode,
      }));

    return NextResponse.json({
      connected: true,
      live: charges.data[0]?.livemode ?? true,
      available: sumUsd(balance.available),
      pending: sumUsd(balance.pending),
      payments,
      dashboardUrl: "https://dashboard.stripe.com/payments",
    });
  } catch (err) {
    console.error("Stripe insights error:", err?.message);
    return NextResponse.json(
      { connected: true, error: err?.message || "Couldn't reach Stripe." },
      { status: 500 }
    );
  }
}
