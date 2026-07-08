import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site, preorder } from "@/lib/config";
import { getPreorder, savePreorder } from "@/lib/store";
import { sendSMS, sendEmail } from "@/lib/notify";
import { countPaidSheets } from "../route";

// Called by the thank-you page after checkout. Verifies payment, records the
// pre-order (once), and sends confirmation emails.
export async function GET(req) {
  const key = process.env.STRIPE_SECRET_KEY;
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!key || !sessionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  try {
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: false, paid: false });
    }

    const already = await getPreorder(session.id);
    const qty = Math.max(1, Math.round(Number(session.metadata?.quantity) || 1));
    const email = session.customer_details?.email || "";
    const name = session.customer_details?.name || "there";

    if (!already) {
      const ship = session.shipping_details || session.customer_details;
      const record = {
        id: session.id,
        paymentIntent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || "",
        name,
        email,
        quantity: qty,
        amount: (session.amount_total || 0) / 100,
        shipping: ship?.address
          ? {
              name: ship.name || name,
              line1: ship.address.line1 || "",
              line2: ship.address.line2 || "",
              city: ship.address.city || "",
              state: ship.address.state || "",
              zip: ship.address.postal_code || "",
              country: ship.address.country || "",
            }
          : null,
        status: "paid", // paid | refunded | fulfilled
        createdAt: new Date().toISOString(),
      };
      await savePreorder(record);

      const count = await countPaidSheets();
      await sendSMS(
        `New pre-order: ${qty}× "${preorder.title}" from ${name} ($${record.amount}). ` +
          `Now at ${count}/${preorder.goal}.`
      );
      if (email) {
        await sendEmail({
          to: email,
          subject: `Pre-order confirmed: ${preorder.title} — ${site.brand}`,
          text:
            `Hi ${name},\n\nThank you for pre-ordering "${preorder.title}" (${qty} sheet${qty > 1 ? "s" : ""})!\n` +
            `Amount paid: $${record.amount}\n\n` +
            `This is a pre-order — it ships by ${preorder.shipBy}. If we don't reach ` +
            `${preorder.goal} pre-orders by ${preorder.deadline}, you'll get a full ` +
            `automatic refund.\n\nThank you for supporting my art! 💜\n— ${site.artistName}`,
          html:
            `<div style="font-family:sans-serif;color:#2e3263;max-width:520px;margin:auto">` +
            `<h2 style="color:#3e5fae">Pre-order confirmed! 🦆</h2>` +
            `<p>Hi ${name}, thank you for pre-ordering <b>${preorder.title}</b> ` +
            `(${qty} sheet${qty > 1 ? "s" : ""})!</p>` +
            `<p style="color:#5d4f7c">Amount paid: <b>$${record.amount}</b></p>` +
            `<p>This is a pre-order — it ships by <b>${preorder.shipBy}</b>. If we don't reach ` +
            `${preorder.goal} pre-orders by ${preorder.deadline}, you'll get a full automatic refund.</p>` +
            `<p style="color:#8c64bd">Thank you for supporting my art! 💜 — ${site.artistName}</p>` +
            `</div>`,
        });
      }
    }

    return NextResponse.json({ ok: true, paid: true, title: preorder.title, quantity: qty });
  } catch (err) {
    console.error("Pre-order confirm error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
