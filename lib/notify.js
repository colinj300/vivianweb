// =====================================================================
//  Notifications — text Vivian an SMS (and optionally an email) when a
//  new message or commission request comes in.
//
//  SMS uses Twilio. Set these env vars to turn it on:
//    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (your Twilio
//    number, e.g. +15551234567), OWNER_PHONE (your cell, e.g. +15559876543)
//
//  Email uses Resend (optional): RESEND_API_KEY, CONTACT_FROM
//
//  If nothing is configured, messages are logged to the server console so
//  the site still works during local preview.
// =====================================================================

export async function sendSMS(message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const to = process.env.OWNER_PHONE;

  if (!sid || !token || !from || !to) {
    console.log("SMS (Twilio not configured yet):", message);
    return { ok: true, skipped: true };
  }

  const body = new URLSearchParams({ To: to, From: from, Body: message });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    console.error("Twilio error:", await res.text());
    return { ok: false };
  }
  return { ok: true };
}

export async function sendEmail({ to, replyTo, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("Email (Resend not configured yet):", { to, subject, text });
    return { ok: true, skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "onboarding@resend.dev",
      to,
      reply_to: replyTo,
      subject,
      text,
      ...(html ? { html } : {}),
    }),
  });

  if (!res.ok) {
    console.error("Resend error:", await res.text());
    return { ok: false };
  }
  return { ok: true };
}
