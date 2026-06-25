"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Check, Heart, Mail, ClipboardList } from "lucide-react";
import { canvasSizes, pricing } from "@/lib/config";
import { computeEstimate } from "@/lib/pricing";

export default function CommissionsPage() {
  const [sizeId, setSizeId] = useState(null);
  const [extraSubjects, setExtraSubjects] = useState(0);
  const [complexBg, setComplexBg] = useState(false);
  const [request, setRequest] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { waitlisted, estimate }

  const estimate = useMemo(() => {
    if (!sizeId) return null;
    return computeEstimate({
      sizeId,
      additionalSubjects: extraSubjects,
      complexBackground: complexBg,
    });
  }, [sizeId, extraSubjects, complexBg]);

  async function submit() {
    setError("");
    if (!sizeId) return setError("Please pick a canvas size.");
    if (!request.trim()) return setError("Tell me about your commission in the request box.");
    if (!name.trim() || !email.trim()) return setError("Please add your name and email.");

    setLoading(true);
    try {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          sizeId,
          additionalSubjects: extraSubjects,
          complexBackground: complexBg,
          request,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone({ waitlisted: data.waitlisted, estimate: data.estimate });
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Could not send your request. Please try again or contact us.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Thank-you / confirmation screen ----
  if (done) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
        {done.waitlisted ? (
          <ClipboardList className="h-16 w-16 animate-wiggle text-rose" strokeWidth={1.25} />
        ) : (
          <Mail className="h-16 w-16 animate-wiggle text-rose" strokeWidth={1.25} />
        )}
        <h1 className="section-title mt-6">
          {done.waitlisted ? "You're on the waitlist!" : "Request received!"}
        </h1>
        <p className="mt-4 text-plum/75">
          {done.waitlisted
            ? "I'm currently at full capacity, so you've been added to the waitlist. I'll reach out as soon as a spot opens up — thank you for your patience!"
            : "Thank you so much! I'll read over your request and get back to you soon to confirm the details and final price before any payment."}
        </p>
        <p className="mt-4 text-plum/60">
          Your estimate was{" "}
          <span className="font-semibold text-rose">${done.estimate}</span> (final
          price confirmed after review).
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/gallery" className="btn-secondary">Browse the gallery</Link>
          <Link href="/" className="btn-primary">Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="section-title text-center">Request a commission</h1>
      <p className="mt-3 text-center text-plum/70">
        Build your piece below to see an estimate. I&apos;ll review every request
        personally and confirm the final price before you pay.
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* ---------- BUILDER ---------- */}
        <div className="space-y-8">
          {/* CANVAS SIZE */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">1. Choose a canvas size</h2>
            <p className="mt-1 text-sm text-plum/60">
              Each size includes one subject (like one pet in a portrait).
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {canvasSizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSizeId(s.id)}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 transition-all ${
                    sizeId === s.id
                      ? "border-rose bg-petal/60 shadow-soft"
                      : "border-petal/50 bg-white/60 hover:border-bubblegum"
                  }`}
                >
                  <span className="font-display text-xl text-grape">{s.name}</span>
                  <span className="mt-1 text-sm font-semibold text-rose">${s.basePrice}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SUBJECTS */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">2. How many subjects?</h2>
            <p className="mt-1 text-sm text-plum/60">
              One subject is included. Each additional subject is +${pricing.additionalSubject}.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => setExtraSubjects((n) => Math.max(0, n - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-bubblegum text-grape hover:bg-petal"
                aria-label="Remove a subject"
              >
                <Minus className="h-5 w-5" />
              </button>
              <div className="text-center">
                <div className="font-display text-3xl text-grape">{1 + extraSubjects}</div>
                <div className="text-xs text-plum/60">
                  total subject{extraSubjects > 0 ? "s" : ""}
                </div>
              </div>
              <button
                onClick={() => setExtraSubjects((n) => Math.min(20, n + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-bubblegum text-grape hover:bg-petal"
                aria-label="Add a subject"
              >
                <Plus className="h-5 w-5" />
              </button>
              {extraSubjects > 0 && (
                <span className="ml-2 text-sm font-semibold text-rose">
                  +${extraSubjects * pricing.additionalSubject}
                </span>
              )}
            </div>
          </div>

          {/* BACKGROUND */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">3. Background</h2>
            <button
              onClick={() => setComplexBg((v) => !v)}
              className={`mt-4 flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                complexBg
                  ? "border-rose bg-petal/60 shadow-soft"
                  : "border-petal/50 bg-white/60 hover:border-bubblegum"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-white ${
                    complexBg ? "border-rose bg-rose" : "border-bubblegum"
                  }`}
                >
                  {complexBg && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                <span>
                  <span className="block font-semibold text-grape">
                    Complex background / scenery
                  </span>
                  <span className="block text-xs text-plum/60">
                    Landscapes or detailed settings
                  </span>
                </span>
              </span>
              <span className="font-semibold text-rose">+${pricing.complexBackground}</span>
            </button>
          </div>

          {/* REQUEST */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">4. Describe your commission</h2>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={5}
              placeholder="Tell me everything! What/who would you like drawn, colors, style, reference photos you'll send, the vibe, deadline... the more detail the better"
              className="mt-4 w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-4 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
            />
            <p className="mt-2 text-sm text-plum/60">
              Have a question first?{" "}
              <Link href="/contact" className="font-semibold text-rose underline">
                Message me here
              </Link>{" "}
              — happy to chat before you request!
            </p>
          </div>
        </div>

        {/* ---------- ESTIMATE SUMMARY ---------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card border-2 border-bubblegum/60">
            <h2 className="flex items-center gap-2 font-display text-2xl text-grape">
              Your estimate <Heart className="h-5 w-5" strokeWidth={1.75} />
            </h2>

            {!estimate ? (
              <p className="mt-4 text-sm text-plum/60">
                Pick a canvas size to see your estimate.
              </p>
            ) : (
              <>
                <dl className="mt-4 space-y-2 text-sm">
                  {estimate.lines.map((l, i) => (
                    <div key={i} className="flex justify-between gap-3">
                      <dt className="text-plum/70">{l.label}</dt>
                      <dd className="font-semibold text-plum">${l.amount}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 border-t border-petal pt-4">
                  <div className="flex items-end justify-between">
                    <span className="text-plum/70">Estimated total</span>
                    <span className="font-display text-3xl text-rose">${estimate.total}</span>
                  </div>
                </div>
              </>
            )}

            <div className="mt-4 flex gap-2 rounded-2xl bg-lilac/50 p-3 text-xs text-plum/75">
              <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose" strokeWidth={2} />
              <span>
                This is an <strong>estimate</strong>. I review every request and
                confirm the final price with you before any payment — no surprises.
              </span>
            </div>

            {/* contact fields */}
            <div className="mt-5 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Your email"
                className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
              />
            </div>

            {error && <p className="mt-3 text-sm font-semibold text-rose">{error}</p>}

            <button
              onClick={submit}
              disabled={loading}
              className="btn-primary mt-5 w-full disabled:opacity-60"
            >
              {loading ? (
                "Sending your request…"
              ) : (
                <>
                  <Mail className="h-4 w-4" /> Send commission request
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-plum/60">
              No payment now. I&apos;ll reply with a secure payment link once your
              details are confirmed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
