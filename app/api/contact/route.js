import { NextResponse } from "next/server";
import { site } from "@/lib/config";
import { sendSMS, sendEmail } from "@/lib/notify";

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Please fill in every field. ♡" },
        { status: 400 }
      );
    }

    // Text Vivian the inquiry.
    await sendSMS(
      `💌 New message from ${name} (${email}):\n${message.slice(0, 1200)}`
    );

    // Also email it if Resend is configured (nice to have a copy).
    await sendEmail({
      to: site.contactEmail,
      replyTo: email,
      subject: `🎨 New message from ${name} (${site.artistName} site)`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
