import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site, preorder } from "@/lib/config";
import { isAuthorized } from "@/lib/admin";
import {
  listPreorders,
  updatePreorder,
  getPreorderSettings,
  savePreorderSettings,
} from "@/lib/store";
import { preorderState } from "@/lib/preorder";
import { sendEmail } from "@/lib/notify";

async function snapshot() {
  const [orders, settings] = await Promise.all([listPreorders(), getPreorderSettings()]);
  const paid = orders.filter((o) => o.status === "paid" || o.status === "fulfilled");
  const count = paid.reduce((t, o) => t + (Number(o.quantity) || 1), 0);
  const state = preorderState({ count });
  const revenue = paid.reduce((t, o) => t + (Number(o.amount) || 0), 0);
  const refunded = orders.filter((o) => o.status === "refunded").length;

  return {
    product: {
      title: preorder.title,
      price: preorder.price,
      goal: preorder.goal,
      deadline: preorder.deadline,
      shipBy: preorder.shipBy,
      active: preorder.active,
    },
    image: settings.image || preorder.image || "",
    state,
    revenue,
    refundedCount: refunded,
    orders: orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };
}

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await snapshot());
}

// Refund a single paid pre-order via Stripe.
async function refundOne(stripe, o) {
  if (o.status !== "paid" && o.status !== "fulfilled") return { ok: false, skipped: true };
  if (!o.paymentIntent) return { ok: false, error: "no payment intent" };
  try {
    await stripe.refunds.create({ payment_intent: o.paymentIntent });
    await updatePreorder(o.id, { status: "refunded", refundedAt: new Date().toISOString() });
    if (o.email) {
      await sendEmail({
        to: o.email,
        subject: `Your pre-order was refunded — ${site.brand}`,
        text:
          `Hi ${o.name || "there"},\n\nUnfortunately "${preorder.title}" didn't reach its ` +
          `pre-order goal, so I've fully refunded your $${o.amount}. It should return to your ` +
          `card in a few business days.\n\nThank you so much for the support — I hope to bring ` +
          `these back another time!\n— ${site.artistName}`,
        html:
          `<div style="font-family:sans-serif;color:#2e3263;max-width:520px;margin:auto">` +
          `<h2 style="color:#3e5fae">You've been refunded 💜</h2>` +
          `<p>Hi ${o.name || "there"}, unfortunately <b>${preorder.title}</b> didn't reach its ` +
          `pre-order goal, so I've fully refunded your <b>$${o.amount}</b>. It should return to ` +
          `your card in a few business days.</p>` +
          `<p>Thank you so much for the support — I hope to bring these back another time!</p>` +
          `<p style="color:#8c64bd">— ${site.artistName}</p></div>`,
      });
    }
    return { ok: true };
  } catch (err) {
    console.error("Refund error:", err?.message);
    return { ok: false, error: err?.message };
  }
}

export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "setImage") {
    await savePreorderSettings({ image: (body.image || "").trim() });
    return NextResponse.json(await snapshot());
  }

  if (action === "fulfill" || action === "fulfillAll") {
    const orders = await listPreorders();
    const targets =
      action === "fulfillAll"
        ? orders.filter((o) => o.status === "paid")
        : orders.filter((o) => o.id === body.id && o.status === "paid");
    for (const o of targets) {
      await updatePreorder(o.id, { status: "fulfilled", fulfilledAt: new Date().toISOString() });
    }
    return NextResponse.json(await snapshot());
  }

  if (action === "refund" || action === "refundAll") {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json({ error: "Payments aren't connected." }, { status: 503 });
    }
    const stripe = new Stripe(key);
    const orders = await listPreorders();
    const targets =
      action === "refundAll"
        ? orders.filter((o) => o.status === "paid" || o.status === "fulfilled")
        : orders.filter((o) => o.id === body.id);

    let refunded = 0;
    const failures = [];
    for (const o of targets) {
      const r = await refundOne(stripe, o);
      if (r.ok) refunded++;
      else if (!r.skipped) failures.push({ id: o.id, error: r.error });
    }
    const snap = await snapshot();
    return NextResponse.json({ ...snap, refunded, failures });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
