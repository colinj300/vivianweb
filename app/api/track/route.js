import { NextResponse } from "next/server";
import { site } from "@/lib/config";
import { getByOrderNumber, updateCommission } from "@/lib/store";
import { sendSMS, sendEmail } from "@/lib/notify";

// Only commissions that have been approved (and so have an order number and
// a progress stage) are trackable.
function publicView(c) {
  return {
    found: true,
    orderNumber: c.orderNumber,
    stage: c.stage || "not_started",
    mediumName: c.mediumName || "",
    sizeName: c.sizeName || "",
    name: c.name || "",
    proofImage: c.proofImage || "",
    review: c.review || null,
  };
}

// GET /api/track?order=VBV-XXXXX  → progress for a customer's order
export async function GET(req) {
  const order = req.nextUrl.searchParams.get("order");
  if (!order?.trim()) {
    return NextResponse.json({ error: "Please enter your order number." }, { status: 400 });
  }
  const c = await getByOrderNumber(order);
  if (!c || !c.orderNumber) {
    return NextResponse.json({ found: false }, { status: 404 });
  }
  return NextResponse.json(publicView(c));
}

// POST /api/track  { order, response: "loved"|"revision", notes, shipping }
export async function POST(req) {
  const { order, response, notes, shipping } = await req.json();

  const c = await getByOrderNumber(order);
  if (!c || !c.orderNumber) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if ((c.stage || "") !== "ready_for_review") {
    return NextResponse.json(
      { error: "This order isn't ready for review yet." },
      { status: 400 }
    );
  }
  if (!["loved", "revision"].includes(response)) {
    return NextResponse.json({ error: "Invalid response." }, { status: 400 });
  }
  if (response === "revision" && !notes?.trim()) {
    return NextResponse.json(
      { error: "Please tell us what you'd like changed." },
      { status: 400 }
    );
  }

  // Validate shipping when they approve.
  let cleanShipping = null;
  if (response === "loved") {
    const s = shipping || {};
    if (!s.name?.trim() || !s.line1?.trim() || !s.city?.trim() || !s.state?.trim() || !s.zip?.trim()) {
      return NextResponse.json(
        { error: "Please include your full shipping address." },
        { status: 400 }
      );
    }
    const clip = (v) => String(v || "").trim().slice(0, 120);
    cleanShipping = {
      name: clip(s.name),
      line1: clip(s.line1),
      line2: clip(s.line2),
      city: clip(s.city),
      state: clip(s.state),
      zip: clip(s.zip),
      country: clip(s.country) || "United States",
    };
  }

  const review = {
    response,
    notes: (notes || "").trim().slice(0, 2000),
    at: new Date().toISOString(),
  };
  const updated = await updateCommission(c.id, {
    review,
    ...(cleanShipping ? { shipping: cleanShipping } : {}),
  });

  // Let Vivian know how the customer responded.
  if (response === "loved") {
    const addr = `${cleanShipping.name}\n${cleanShipping.line1}${cleanShipping.line2 ? ", " + cleanShipping.line2 : ""}\n${cleanShipping.city}, ${cleanShipping.state} ${cleanShipping.zip}\n${cleanShipping.country}`;
    await sendSMS(`Order ${c.orderNumber}: ${c.name} LOVES it! 🎉 Ship to:\n${addr}`);
    await sendEmail({
      to: site.contactEmail,
      subject: `Order ${c.orderNumber} approved by ${c.name} — ready to ship`,
      text: `${c.name} loves their commission (${c.orderNumber})!\n\nShip to:\n${addr}`,
    });
  } else {
    await sendSMS(
      `Order ${c.orderNumber}: ${c.name} requested changes:\n${review.notes.slice(0, 600)}`
    );
    await sendEmail({
      to: site.contactEmail,
      replyTo: c.email,
      subject: `Order ${c.orderNumber} — revision requested by ${c.name}`,
      text: `${c.name} (${c.email}) requested changes to ${c.orderNumber}:\n\n${review.notes}`,
    });
  }

  return NextResponse.json({ ok: true, review: updated.review });
}
