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
      mediumId,
      sizeId,
      customSize,
      additionalSubjects,
      backgroundId,
      images,
      request,
    } = body;

    // images is an array of already-uploaded photo URLs (from /api/upload).
    const photos = Array.isArray(images)
      ? images.filter((u) => typeof u === "string" && u.startsWith("http")).slice(0, 8)
      : [];

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Please add your name and email so we can reach you." },
        { status: 400 }
      );
    }
    if (!request?.trim()) {
      return NextResponse.json(
        { error: "Please describe what you'd like in the request box." },
        { status: 400 }
      );
    }

    const estimate = computeEstimate({
      mediumId,
      sizeId,
      customSize,
      additionalSubjects,
      backgroundId,
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
      email: email.trim().slice(0, 200),
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

    await sendSMS(
      `New commission request${waitNote}\n${record.name} (${record.email})\n` +
        `${estimate.medium.name} · ${estimate.sizeLabel}${subjectsNote}${bgNote}${photoNote} — ${priceNote}\n` +
        `"${record.request.slice(0, 600)}"`
    );

    await sendEmail({
      to: site.contactEmail,
      replyTo: record.email,
      subject: `Commission request from ${record.name}${open ? "" : " (WAITLIST)"}`,
      text:
        `Name: ${record.name}\nEmail: ${record.email}\n` +
        `Medium: ${estimate.medium.name}\nSize: ${estimate.sizeLabel}\n` +
        `Extra subjects: ${estimate.subjects}\n` +
        `Background: ${estimate.background.name}\n` +
        `Estimate: $${estimate.total}${estimate.isCustom ? " (extras only — base quoted at review)" : ""}\n` +
        `Status: ${status}\n` +
        (photos.length ? `\nPet photos:\n${photos.join("\n")}\n` : "") +
        `\nRequest:\n${record.request}`,
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
