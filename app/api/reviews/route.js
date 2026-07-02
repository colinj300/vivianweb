import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { site } from "@/lib/config";
import {
  listCommissions,
  getByOrderNumber,
  updateCommission,
  listReviews,
  saveReview,
} from "@/lib/store";
import { sendSMS, sendEmail } from "@/lib/notify";

// Show only a first name + last initial on the public reviews page.
function displayName(full) {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A happy customer";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// GET /api/reviews → public list: commission reviews (verified) + open reviews
export async function GET() {
  const [all, open] = await Promise.all([listCommissions(), listReviews()]);

  const fromOrders = all
    .filter((c) => c.testimonial && !c.testimonial.hidden)
    .map((c) => ({
      id: c.id,
      name: displayName(c.name),
      rating: c.testimonial.rating,
      text: c.testimonial.text,
      at: c.testimonial.at,
      piece: [c.mediumName, c.sizeName].filter(Boolean).join(" · "),
      verified: true,
    }));

  const fromAnyone = open
    .filter((r) => !r.hidden)
    .map((r) => ({
      id: r.id,
      name: displayName(r.name),
      rating: r.rating,
      text: r.text,
      at: r.at,
      piece: "",
      verified: false,
    }));

  const reviews = [...fromOrders, ...fromAnyone].sort(
    (a, b) => new Date(b.at) - new Date(a.at)
  );
  return NextResponse.json({ reviews });
}

// POST /api/reviews  { name?, order?, rating: 1-5, text }
// With a valid order number → a verified review saved on that commission.
// Without one → an open review anyone can leave.
export async function POST(req) {
  const { name, order, rating, text } = await req.json();

  const stars = Math.round(Number(rating));
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Please pick a star rating." }, { status: 400 });
  }
  if (!text?.trim()) {
    return NextResponse.json(
      { error: "Please write a few words about your experience." },
      { status: 400 }
    );
  }
  const cleanText = text.trim().slice(0, 1000);
  const starsLabel = "★".repeat(stars) + "☆".repeat(5 - stars);

  // ---- Verified path: they gave an order number --------------------------
  if (order?.trim()) {
    const c = await getByOrderNumber(order);
    if (!c || !c.orderNumber) {
      return NextResponse.json(
        { error: "That order number wasn't found — you can leave it blank to review anyway." },
        { status: 404 }
      );
    }
    const eligible = c.review?.response === "loved" || c.status === "completed";
    if (!eligible) {
      return NextResponse.json(
        {
          error:
            "That order isn't finished yet — you can review it once you've approved your piece, or leave the order number blank.",
        },
        { status: 400 }
      );
    }

    // One review per order — resubmitting updates it (and keeps the hidden
    // flag if Vivian hid the previous version).
    const testimonial = {
      rating: stars,
      text: cleanText,
      at: new Date().toISOString(),
      hidden: c.testimonial?.hidden || false,
    };
    await updateCommission(c.id, { testimonial });

    await sendSMS(
      `New review from ${c.name} (${c.orderNumber}): ${starsLabel}\n"${cleanText.slice(0, 500)}"`
    );
    await sendEmail({
      to: site.contactEmail,
      replyTo: c.email || undefined,
      subject: `New ${stars}-star review from ${c.name} (${c.orderNumber})`,
      text:
        `${c.name} left a review on order ${c.orderNumber}:\n\n` +
        `${starsLabel}\n\n"${cleanText}"\n\n` +
        `It's now live on your Reviews page. You can hide it from the admin panel.`,
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      testimonial: { rating: stars, text: cleanText },
    });
  }

  // ---- Open path: anyone, no order number --------------------------------
  if (!name?.trim()) {
    return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  }

  const record = {
    id: randomUUID(),
    name: name.trim().slice(0, 100),
    rating: stars,
    text: cleanText,
    at: new Date().toISOString(),
    hidden: false,
  };
  await saveReview(record);

  await sendSMS(
    `New site review from ${record.name}: ${starsLabel}\n"${cleanText.slice(0, 500)}"`
  );
  await sendEmail({
    to: site.contactEmail,
    subject: `New ${stars}-star site review from ${record.name}`,
    text:
      `${record.name} left a review on your site:\n\n` +
      `${starsLabel}\n\n"${cleanText}"\n\n` +
      `It's now live on your Reviews page. You can hide or remove it from the admin panel (Reviews tab).`,
  });

  return NextResponse.json({ ok: true, verified: false });
}
