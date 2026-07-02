import { NextResponse } from "next/server";
import { site } from "@/lib/config";
import { listCommissions, getByOrderNumber, updateCommission } from "@/lib/store";
import { sendSMS, sendEmail } from "@/lib/notify";

// Show only a first name + last initial on the public reviews page.
function displayName(full) {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A happy customer";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// GET /api/reviews → public list of customer reviews
export async function GET() {
  const all = await listCommissions();
  const reviews = all
    .filter((c) => c.testimonial && !c.testimonial.hidden)
    .map((c) => ({
      id: c.id,
      name: displayName(c.name),
      rating: c.testimonial.rating,
      text: c.testimonial.text,
      at: c.testimonial.at,
      piece: [c.mediumName, c.sizeName].filter(Boolean).join(" · "),
    }))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  return NextResponse.json({ reviews });
}

// POST /api/reviews  { order, rating: 1-5, text }
// Customers can review once they've approved their finished piece.
export async function POST(req) {
  const { order, rating, text } = await req.json();

  const c = await getByOrderNumber(order);
  if (!c || !c.orderNumber) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const eligible = c.review?.response === "loved" || c.status === "completed";
  if (!eligible) {
    return NextResponse.json(
      { error: "You can leave a review once you've approved your finished piece." },
      { status: 400 }
    );
  }
  const stars = Math.round(Number(rating));
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Please pick a star rating." }, { status: 400 });
  }
  if (!text?.trim()) {
    return NextResponse.json(
      { error: "Please write a few words about your commission." },
      { status: 400 }
    );
  }

  // One review per order — resubmitting updates it (and keeps the hidden
  // flag if Vivian hid the previous version).
  const testimonial = {
    rating: stars,
    text: text.trim().slice(0, 1000),
    at: new Date().toISOString(),
    hidden: c.testimonial?.hidden || false,
  };
  await updateCommission(c.id, { testimonial });

  const starsLabel = "★".repeat(stars) + "☆".repeat(5 - stars);
  await sendSMS(
    `New review from ${c.name} (${c.orderNumber}): ${starsLabel}\n"${testimonial.text.slice(0, 500)}"`
  );
  await sendEmail({
    to: site.contactEmail,
    replyTo: c.email || undefined,
    subject: `New ${stars}-star review from ${c.name} (${c.orderNumber})`,
    text:
      `${c.name} left a review on order ${c.orderNumber}:\n\n` +
      `${starsLabel}\n\n"${testimonial.text}"\n\n` +
      `It's now live on your Reviews page. You can hide it from the admin panel.`,
  });

  return NextResponse.json({ ok: true, testimonial: { rating: stars, text: testimonial.text } });
}
