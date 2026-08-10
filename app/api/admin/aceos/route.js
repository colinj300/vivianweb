import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { aceoPrice } from "@/lib/config";
import { isAuthorized } from "@/lib/admin";
import { listAceos, saveAceo, updateAceo, deleteAceo, getAceo, listStickerOrders } from "@/lib/store";
import { orderFromSession } from "@/lib/stripeOrder";

// List all shop items (owner view) + sticker orders to fulfill.
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [aceos, stickerOrders] = await Promise.all([listAceos(), listStickerOrders()]);
  stickerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ aceos, stickerOrders });
}

// Create a new listing.
export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { title, imageUrl, price, type, details } = await req.json();
  if (!imageUrl || !String(imageUrl).startsWith("http")) {
    return NextResponse.json({ error: "Please upload an image first." }, { status: 400 });
  }
  const kind = ["aceo", "sticker", "original"].includes(type) ? type : "aceo";
  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    type: kind,
    title: (title || "Untitled").trim().slice(0, 120),
    imageUrl,
    details: (details || "").trim().slice(0, 1000),
    price: Math.max(1, Math.round(Number(price) || aceoPrice)),
    status: "available", // available | sold  (stickers stay available)
  };
  await saveAceo(record);
  return NextResponse.json({ ok: true, aceo: record });
}

// Update a listing (status / price / title), or backfill buyer info.
export async function PATCH(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, status, price, title, action } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Backfill the buyer + shipping address from Stripe for an order that
  // sold before we started saving those details (or to re-sync).
  if (action === "fetchBuyer") {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json({ error: "Payments aren't connected." }, { status: 503 });
    }
    const aceo = await getAceo(id);
    if (!aceo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    try {
      const stripe = new Stripe(key);
      let match = null;
      // Prefer the session id if we already have one; otherwise scan recent
      // paid checkout sessions for one tagged with this ACEO.
      if (aceo.sessionId) {
        match = await stripe.checkout.sessions.retrieve(aceo.sessionId);
      } else {
        const list = await stripe.checkout.sessions.list({ limit: 100 });
        const found = list.data.find(
          (s) => s.metadata?.aceoId === id && s.payment_status === "paid"
        );
        if (found) match = await stripe.checkout.sessions.retrieve(found.id);
      }
      if (!match) {
        return NextResponse.json(
          { error: "Couldn't find this sale in Stripe (it may be older than the last 100 orders)." },
          { status: 404 }
        );
      }
      const order = orderFromSession(match);
      const updated = await updateAceo(id, {
        status: "sold",
        sessionId: order.sessionId,
        buyer: order.buyer,
        shipping: order.shipping,
        soldPrice: order.amount || aceo.price,
      });
      return NextResponse.json({ ok: true, aceo: updated });
    } catch (err) {
      console.error("ACEO fetchBuyer error:", err?.message);
      return NextResponse.json({ error: err?.message || "Stripe lookup failed." }, { status: 500 });
    }
  }

  const patch = {};
  if (status && ["available", "sold"].includes(status)) patch.status = status;
  if (price !== undefined && price !== "") patch.price = Math.max(1, Math.round(Number(price)));
  if (title !== undefined) patch.title = String(title).trim().slice(0, 120);
  const updated = await updateAceo(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, aceo: updated });
}

// Delete a listing.
export async function DELETE(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteAceo(id);
  return NextResponse.json({ ok: true });
}
