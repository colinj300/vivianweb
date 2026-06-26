import { NextResponse } from "next/server";
import { getByOrderNumber, updateCommission } from "@/lib/store";
import { sendSMS } from "@/lib/notify";

// A customer (e.g. from an Instagram DM order) submits their email/phone and
// preferred update method, tied to their order number.
export async function POST(req) {
  const { order, email, phone, contactMethod } = await req.json();

  const c = await getByOrderNumber(order);
  if (!c || !c.orderNumber) {
    return NextResponse.json(
      { error: "We couldn't find that order number — double-check it with Vivian." },
      { status: 404 }
    );
  }

  const method = contactMethod === "text" ? "text" : "email";
  if (method === "text" && !phone?.trim()) {
    return NextResponse.json(
      { error: "Add a phone number to get text updates." },
      { status: 400 }
    );
  }
  if (method === "email" && !email?.trim()) {
    return NextResponse.json(
      { error: "Add an email to get email updates." },
      { status: 400 }
    );
  }

  await updateCommission(c.id, {
    email: (email || "").trim().slice(0, 200),
    phone: (phone || "").trim().slice(0, 40),
    contactMethod: method,
  });

  await sendSMS(`${c.name} added their contact info for order ${c.orderNumber} (prefers ${method}).`);

  return NextResponse.json({ ok: true, orderNumber: c.orderNumber });
}
