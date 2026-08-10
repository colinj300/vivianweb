import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site, originals } from "@/lib/config";
import {
  getAceo,
  updateAceo,
  getOriginalSale,
  saveOriginalSale,
  getStickerOrder,
  saveStickerOrder,
} from "@/lib/store";
import { sendSMS, sendEmail } from "@/lib/notify";
import { orderFromSession, formatAddress } from "@/lib/stripeOrder";

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
    const originalId = session.metadata?.originalId;
    let title = "";

    // An original painting sold — record it (once) and send receipts.
    if (originalId) {
      const o = originals.find((x) => x.id === originalId);
      title = o?.title || "";
      if (o && !(await getOriginalSale(o.id))) {
        const order = orderFromSession(session);
        const buyerName = order.buyer.name || "there";
        const buyerEmail = order.buyer.email;
        const addr = formatAddress(order.shipping);

        await saveOriginalSale({
          id: o.id,
          title: o.title,
          status: "sold",
          soldAt: new Date().toISOString(),
          sessionId: order.sessionId,
          buyer: order.buyer,
          shipping: order.shipping,
          soldPrice: order.amount || o.price,
          image: o.image,
        });

        await sendSMS(
          `🎉 ORIGINAL SOLD: "${o.title}" ($${o.price}) to ${buyerName}` +
            (buyerEmail ? ` (${buyerEmail})` : "") + `\nShip to:\n${addr}`
        );
        await sendEmail({
          to: site.contactEmail,
          replyTo: buyerEmail || undefined,
          subject: `Original sold: "${o.title}" — $${o.price}`,
          text: `You sold the original "${o.title}" for $${o.price} (shipping included).\n\nBuyer: ${buyerName}${buyerEmail ? ` (${buyerEmail})` : ""}\n\nShip to:\n${addr}`,
        });
        if (buyerEmail) {
          await sendEmail({
            to: buyerEmail,
            subject: `Thank you for your order! — ${site.brand}`,
            text:
              `Hi ${buyerName},\n\nThank you for buying the original "${o.title}" from ${site.brand}!\n` +
              `Amount paid: $${o.price} (shipping included)\n\n` +
              `Vivian will pack it up and ship it to you soon. 💜\n— ${site.artistName}`,
            html:
              `<div style="font-family:sans-serif;color:#2e3263;max-width:520px;margin:auto">` +
              `<h2 style="color:#3e5fae">Thank you for your order! 🎨</h2>` +
              `<p>Hi ${buyerName}, thank you for buying the original <b>${o.title}</b> from ${site.brand}!</p>` +
              `<p style="color:#5d4f7c">Amount paid: <b>$${o.price}</b> (shipping included)</p>` +
              `<p>Vivian will pack it up and ship it to you soon. 💜</p>` +
              `<p style="color:#8c64bd">— ${site.artistName}</p></div>`,
          });
        }
      }
      return NextResponse.json({ ok: true, paid: true, title });
    }

    if (aceoId) {
      const aceo = await getAceo(aceoId);
      title = aceo?.title || "";
      const kind = aceo?.type || "aceo";
      const order = orderFromSession(session);
      const buyerName = order.buyer.name || "there";
      const buyerEmail = order.buyer.email;
      const addr = formatAddress(order.shipping);

      const buyerReceipt = () =>
        buyerEmail &&
        sendEmail({
          to: buyerEmail,
          subject: `Thank you for your order! — ${site.brand}`,
          text:
            `Hi ${buyerName},\n\nThank you for buying "${title}" from ${site.brand}!\n` +
            `Amount paid: $${order.amount || aceo.price}\n\n` +
            `Vivian will pack it up and ship it to you soon. 💜\n— ${site.artistName}`,
          html:
            `<div style="font-family:sans-serif;color:#2e3263;max-width:520px;margin:auto">` +
            `<h2 style="color:#3e5fae">Thank you for your order! 🎨</h2>` +
            `<p>Hi ${buyerName}, thank you for buying <b>${title}</b> from ${site.brand}!</p>` +
            (aceo.imageUrl
              ? `<p><img src="${aceo.imageUrl}" alt="${title}" style="max-width:100%;border-radius:14px;border:3px solid #ddd6f2"/></p>`
              : "") +
            `<p style="color:#5d4f7c">Amount paid: <b>$${order.amount || aceo.price}</b></p>` +
            `<p>Vivian will pack it up and ship it to you soon. 💜</p>` +
            `<p style="color:#8c64bd">— ${site.artistName}</p></div>`,
        });

      if (aceo && kind === "sticker") {
        // Stickers are restockable — log the order (once) instead of marking sold.
        if (!(await getStickerOrder(session.id))) {
          await saveStickerOrder({
            id: session.id,
            itemId: aceo.id,
            title,
            amount: order.amount || aceo.price,
            buyer: order.buyer,
            shipping: order.shipping,
            createdAt: new Date().toISOString(),
          });
          await sendSMS(
            `🎉 STICKER ORDER: "${title}" ($${order.amount || aceo.price}) — ${buyerName}` +
              (buyerEmail ? ` (${buyerEmail})` : "") + `\nShip to:\n${addr}`
          );
          await sendEmail({
            to: site.contactEmail,
            replyTo: buyerEmail || undefined,
            subject: `Sticker order: "${title}" — $${order.amount || aceo.price}`,
            text: `New sticker order: "${title}" for $${order.amount || aceo.price}.\n\nBuyer: ${buyerName}${buyerEmail ? ` (${buyerEmail})` : ""}\n\nShip to:\n${addr}`,
          });
          await buyerReceipt();
        }
      } else if (aceo && aceo.status !== "sold") {
        // One-of-a-kind (ACEO / original) — mark sold once and alert.
        const label = kind === "original" ? "ORIGINAL" : "ACEO";
        await updateAceo(aceoId, {
          status: "sold",
          soldAt: new Date().toISOString(),
          sessionId: order.sessionId,
          buyer: order.buyer,
          shipping: order.shipping,
          soldPrice: order.amount || aceo.price,
        });
        await sendSMS(
          `🎉 ${label} SOLD: "${title}" ($${order.amount || aceo.price}) to ${buyerName}` +
            (buyerEmail ? ` (${buyerEmail})` : "") + `\nShip to:\n${addr}`
        );
        await sendEmail({
          to: site.contactEmail,
          replyTo: buyerEmail || undefined,
          subject: `${kind === "original" ? "Original" : "ACEO"} sold: "${title}" — $${order.amount || aceo.price}`,
          text: `You sold "${title}" for $${order.amount || aceo.price}.\n\nBuyer: ${buyerName}${buyerEmail ? ` (${buyerEmail})` : ""}\n\nShip to:\n${addr}`,
        });
        await buyerReceipt();
      }
    }
    return NextResponse.json({ ok: true, paid: true, title });
  } catch (err) {
    console.error("Shop confirm error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
