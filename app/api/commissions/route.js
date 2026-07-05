import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { site } from "@/lib/config";
import { computeEstimate } from "@/lib/pricing";
import { saveCommission, hasOpenSlot, countWaitlist } from "@/lib/store";
import { sendSMS, sendEmail } from "@/lib/notify";

// A buyer submits a commission REQUEST here. Nothing is charged — Vivian
// reviews it, may adjust the price, then sends a payment link.
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      instagram,
      phone,
      contactMethod,
      shipping: shipIn,
      mediumId,
      sizeId,
      customSize,
      additionalSubjects,
      backgroundId,
      images,
      request,
    } = body;

    const clip = (v) => String(v || "").trim().slice(0, 120);
    const shipping = shipIn
      ? {
          name: clip(name),
          line1: clip(shipIn.line1),
          line2: clip(shipIn.line2),
          city: clip(shipIn.city),
          state: clip(shipIn.state),
          zip: clip(shipIn.zip),
          country: clip(shipIn.country) || "United States",
        }
      : null;

    // images is an array of already-uploaded photo URLs (from /api/upload).
    const photos = Array.isArray(images)
      ? images.filter((u) => typeof u === "string" && u.startsWith("http")).slice(0, 8)
      : [];

    const method = ["instagram", "text", "email"].includes(contactMethod)
      ? contactMethod
      : "instagram";

    if (!name?.trim()) {
      return NextResponse.json({ error: "Please add your name." }, { status: 400 });
    }
    // Both are required so Vivian always has two ways to reach the customer.
    if (!instagram?.trim()) {
      return NextResponse.json(
        { error: "Please add your Instagram handle." },
        { status: 400 }
      );
    }
    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Please add your email." }, { status: 400 });
    }
    if (!request?.trim()) {
      return NextResponse.json(
        { error: "Please describe what you'd like in the request box." },
        { status: 400 }
      );
    }
    if (!shipping || !shipping.line1 || !shipping.city || !shipping.state || !shipping.zip) {
      return NextResponse.json(
        { error: "Please add your shipping address." },
        { status: 400 }
      );
    }

    const estimate = computeEstimate({
      mediumId,
      sizeId,
      customSize,
      additionalSubjects,
      backgroundId,
      country: shipping?.country,
    });
    if (!estimate) {
      return NextResponse.json({ error: "Please pick a size." }, { status: 400 });
    }
    if (estimate.isCustom && !customSize?.trim()) {
      return NextResponse.json(
        { error: "Please enter your custom size." },
        { status: 400 }
      );
    }

    // If all slots are full, this request joins the waitlist.
    const open = await hasOpenSlot();
    const status = open ? "pending" : "waitlist";

    const record = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      name: name.trim().slice(0, 200),
      email: (email || "").trim().slice(0, 200),
      instagram: (instagram || "").trim().slice(0, 80),
      phone: (phone || "").trim().slice(0, 40),
      contactMethod: method,
      shipping,
      shippingCost: estimate.shipping,
      mediumId,
      mediumName: estimate.medium.name,
      sizeId,
      isCustom: estimate.isCustom,
      customSize: estimate.isCustom ? (customSize || "").trim().slice(0, 200) : "",
      sizeName: estimate.sizeLabel,
      additionalSubjects: estimate.subjects,
      backgroundId: estimate.background.id,
      backgroundName: estimate.background.name,
      images: photos,
      request: request.trim().slice(0, 4000),
      estimate: estimate.total,
      estimateNote: estimate.isCustom ? "base price quoted at review" : "",
      finalPrice: null,
      paymentLink: null,
      status, // pending | approved | completed | waitlist | declined
    };

    await saveCommission(record);

    const waitNote = open
      ? ""
      : ` (WAITLIST — currently full, #${await countWaitlist()} in line)`;

    const subjectsNote = estimate.subjects > 0 ? `, +${estimate.subjects} subject(s)` : "";
    const bgNote = `, ${estimate.background.name.toLowerCase()}`;
    const photoNote = photos.length ? `, ${photos.length} photo(s)` : "";
    const priceNote = estimate.isCustom
      ? `est extras $${estimate.total} + base quoted`
      : `est $${estimate.total}`;
    const contactLabel =
      method === "instagram"
        ? `Instagram ${record.instagram}`
        : method === "text"
        ? `Text ${record.phone}`
        : `Email ${record.email}`;

    await sendSMS(
      `New commission request${waitNote}\n${record.name} — ${contactLabel}\n` +
        `${estimate.medium.name} · ${estimate.sizeLabel}${subjectsNote}${bgNote}${photoNote} — ${priceNote}\n` +
        `"${record.request.slice(0, 600)}"`
    );

    await sendEmail({
      to: site.contactEmail,
      replyTo: record.email || undefined,
      subject: `Commission request from ${record.name}${open ? "" : " (WAITLIST)"}`,
      text:
        `Name: ${record.name}\nContact: ${contactLabel} (prefers ${method})\n` +
        `Medium: ${estimate.medium.name}\nSize: ${estimate.sizeLabel}\n` +
        `Extra subjects: ${estimate.subjects}\n` +
        `Background: ${estimate.background.name}\n` +
        `Estimate: $${estimate.total}${estimate.isCustom ? " (extras only — base quoted at review)" : ""}\n` +
        `Status: ${status}\n` +
        (photos.length ? `\nReference photos:\n${photos.join("\n")}\n` : "") +
        `\nRequest:\n${record.request}`,
    });

    // Confirmation email to the customer (only if they gave an email).
    const priceLine = estimate.isCustom
      ? "Your price will be quoted when Vivian reviews your custom size."
      : `Estimated total: $${estimate.total} (final price confirmed before any payment).`;
    if (record.email) await sendEmail({
      to: record.email,
      subject: `Thanks for your commission request! — ${site.brand}`,
      text:
        `Hi ${record.name},\n\nThank you for your commission request! Here's what you asked for:\n` +
        `${estimate.medium.name} · ${estimate.sizeLabel}\n` +
        `${1 + estimate.subjects} subject(s), ${estimate.background.name}\n${priceLine}\n\n` +
        (open
          ? `Vivian will review it and reach out soon to confirm the details and price.`
          : `Vivian is currently full, so you're on the waitlist — she'll reach out as a spot opens up.`) +
        `\n\nThank you! — ${site.artistName}`,
      html:
        `<div style="font-family:sans-serif;color:#2e3263;max-width:520px;margin:auto">` +
        `<h2 style="color:#3e5fae">Thanks for your request! 🎨</h2>` +
        `<p>Hi ${record.name}, I got your commission request. Here's what you asked for:</p>` +
        `<ul style="color:#5d4f7c">` +
        `<li>${estimate.medium.name} · ${estimate.sizeLabel}</li>` +
        `<li>${1 + estimate.subjects} subject(s) · ${estimate.background.name}</li>` +
        `</ul>` +
        `<p>${priceLine}</p>` +
        `<p>${open ? "I'll review it and reach out soon to confirm the details and price." : "I'm currently full, so you're on the waitlist — I'll reach out as a spot opens up."}</p>` +
        `<p style="color:#8c64bd">Thank you! — ${site.artistName}</p>` +
        `</div>`,
    });

    return NextResponse.json({
      ok: true,
      status,
      waitlisted: !open,
      estimate: estimate.total,
    });
  } catch (err) {
    console.error("Commission request error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or contact us." },
      { status: 500 }
    );
  }
}
