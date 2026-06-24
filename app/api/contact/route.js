import { NextResponse } from "next/server";
import { site } from "@/lib/config";

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Please fill in every field. ♡" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    // If an email provider (Resend) is configured, actually deliver the message.
    if (apiKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM || "onboarding@resend.dev",
          to: site.contactEmail,
          reply_to: email,
          subject: `🎨 New message from ${name} (${site.artistName} site)`,
          text: `From: ${name} <${email}>\n\n${message}`,
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error("Resend error:", detail);
        return NextResponse.json(
          { error: "Could not send right now. Please email us directly." },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    // No provider yet — log so nothing is lost during local preview.
    console.log("📬 New contact message (email provider not configured yet):", {
      name,
      email,
      message,
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
