import { NextResponse } from "next/server";
import { site } from "@/lib/config";
import { isAuthorized } from "@/lib/admin";
import { integrationStatus, sendEmail, sendSMS } from "@/lib/notify";

// What's connected — shown as the status panel in the admin.
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const i = integrationStatus();
  return NextResponse.json({ ...i, contactEmail: site.contactEmail });
}

// Send a test message to yourself so you can confirm email/text really works.
export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { channel } = await req.json().catch(() => ({}));

  if (channel === "text") {
    const r = await sendSMS(
      `Test text from ${site.brand} — if you got this, customer texting is working!`
    );
    return NextResponse.json({
      ok: r.ok,
      skipped: !!r.skipped,
      to: process.env.OWNER_PHONE || "",
      channel: "text",
    });
  }

  // default: email test (sent to the shop's contact address)
  const r = await sendEmail({
    to: site.contactEmail,
    subject: `Test email from ${site.brand} admin ✓`,
    text:
      `This is a test email from your ${site.brand} admin panel.\n\n` +
      `If you're reading this, your email system (receipts, order ` +
      `confirmations, and review notices) is working.`,
    html:
      `<div style="font-family:sans-serif;color:#2e3263;max-width:520px;margin:auto">` +
      `<h2 style="color:#3e5fae">Your email is working! 🎉</h2>` +
      `<p>This is a test from your <b>${site.brand}</b> admin panel.</p>` +
      `<p style="color:#5d4f7c">If you're reading this, your receipts, order ` +
      `confirmations, and "ready for review" notices will all send correctly.</p>` +
      `</div>`,
  });
  return NextResponse.json({
    ok: r.ok,
    skipped: !!r.skipped,
    to: site.contactEmail,
    from: integrationStatus().emailFrom,
    error: r.error || "",
    channel: "email",
  });
}
