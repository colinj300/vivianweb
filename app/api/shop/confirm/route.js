import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAceo, updateAceo } from "@/lib/store";

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
      if (aceo && aceo.status !== "sold") {
        await updateAceo(aceoId, { status: "sold", soldAt: new Date().toISOString() });
      }
    }
    return NextResponse.json({ ok: true, paid: true, title });
  } catch (err) {
    console.error("Shop confirm error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
