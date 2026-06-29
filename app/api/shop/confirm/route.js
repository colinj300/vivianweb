import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site } from "@/lib/config";
import { getAceo, updateAceo } from "@/lib/store";
import { sendSMS, sendEmail } from "@/lib/notify";

// Called by the thank-you page after checkout. Verifies the payment with
// Stripe and marks the ACEO sold (so it disappears from the shop).
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
    const aceoId = session.metadata?.aceoId;
    let title = "";
    if (aceoId) {
      const aceo = await getAceo(aceoId);
      title = aceo?.title || "";
      // First confirmation only — mark sold and send the receipts/alerts once.
      if (aceo && aceo.status !== "sold") {
        await updateAceo(aceoId, { status: "sold", soldAt: new Date().toISOString() });

        const buyerEmail = session.customer_details?.email || "";
        const buyerName = session.customer_details?.name || "there";
        const ship = session.shipping_details || session.customer_details;
        const addr = ship?.address
          ? `${ship.name || buyerName}\n${ship.address.line1}${ship.address.line2 ? ", " + ship.address.line2 : ""}\n` +
            `${ship.address.city}, ${ship.address.state} ${ship.address.postal_code}\n${ship.address.country}`
          : "(see Stripe for address)";

        // Tell Vivian she made a sale.
        await sendSMS(
          `🎉 ACEO SOLD: "${title}" ($${aceo.price}) to ${buyerName}` +
            (buyerEmail ? ` (${buyerEmail})` : "") + `\nShip to:\n${addr}`
        );
        await sendEmail({
          to: site.contactEmail,
          replyTo: buyerEmail || undefined,
          subject: `ACEO sold: "${title}" — $${aceo.price}`,
          text: `You sold "${title}" for $${aceo.price}.\n\nBuyer: ${buyerName}${buyerEmail ? ` (${buyerEmail})` : ""}\n\nShip to:\n${addr}`,
        });

        // Receipt / thank-you to the buyer.
        if (buyerEmail) {
          await sendEmail({
            to: buyerEmail,
            subject: `Thank you for your order! — ${site.brand}`,
            text:
              `Hi ${buyerName},\n\nThank you for buying "${title}" from ${site.brand}!\n` +
              `Amount paid: $${aceo.price}\n\n` +
              `Vivian will pack it up and ship it to you soon. 💜\n— ${site.artistName}`,
            html:
              `<div style="font-family:sans-serif;color:#2e3263;max-width:520px;margin:auto">` +
              `<h2 style="color:#3e5fae">Thank you for your order! 🎨</h2>` +
              `<p>Hi ${buyerName}, thank you for buying <b>${title}</b> from ${site.brand}!</p>` +
              (aceo.imageUrl
                ? `<p><img src="${aceo.imageUrl}" alt="${title}" style="max-width:100%;border-radius:14px;border:3px solid #ddd6f2"/></p>`
                : "") +
              `<p style="color:#5d4f7c">Amount paid: <b>$${aceo.price}</b></p>` +
              `<p>Vivian will pack it up and ship it to you soon. 💜</p>` +
              `<p style="color:#8c64bd">— ${site.artistName}</p>` +
              `</div>`,
          });
        }
      }
    }
    return NextResponse.json({ ok: true, paid: true, title });
  } catch (err) {
    console.error("Shop confirm error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
