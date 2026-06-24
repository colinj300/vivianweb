"use client";

import { useState } from "react";
import { site } from "@/lib/config";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Could not send. Please try again or email us directly.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="section-title text-center">Let&apos;s chat ♡</h1>
      <p className="mt-3 text-center text-plum/70">
        Have a question or a special request before you order? Send a message
        and I&apos;ll get back to you soon!
      </p>

      <div className="card mt-10">
        {status === "sent" ? (
          <div className="py-10 text-center">
            <div className="text-5xl animate-wiggle">💌</div>
            <h2 className="mt-4 font-display text-3xl text-grape">Message sent!</h2>
            <p className="mt-2 text-plum/70">
              Thank you for reaching out — I&apos;ll reply as soon as I can. ♡
            </p>
            <button onClick={() => setStatus("idle")} className="btn-secondary mt-6">
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-semibold text-grape">Your name</label>
              <input
                required
                value={form.name}
                onChange={update("name")}
                className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
                placeholder="What should I call you?"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-grape">Your email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={update("email")}
                className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
                placeholder="so I can reply ♡"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-grape">Your message</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={update("message")}
                className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
                placeholder="Tell me about your idea, ask a question, or just say hi!"
              />
            </div>

            {status === "error" && (
              <p className="text-sm font-semibold text-rose">
                {errorMsg}{" "}
                <a href={site.socials.email} className="underline">
                  Email me directly instead
                </a>
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-primary w-full disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "💌 Send message"}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-plum/60">
        Prefer email? Reach me at{" "}
        <a href={site.socials.email} className="font-semibold text-rose underline">
          {site.contactEmail}
        </a>
      </p>
    </div>
  );
}
