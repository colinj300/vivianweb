"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { commissionTypes, canvasSizes, addOns } from "@/lib/config";

export default function CommissionsPage() {
  const [typeId, setTypeId] = useState(commissionTypes[0].id);
  const [sizeId, setSizeId] = useState(canvasSizes[0].id);
  const [picked, setPicked] = useState([]); // add-on ids
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const type = commissionTypes.find((t) => t.id === typeId);
  const size = canvasSizes.find((s) => s.id === sizeId);

  const total = useMemo(() => {
    const addTotal = picked.reduce((sum, id) => {
      const a = addOns.find((x) => x.id === id);
      return sum + (a ? a.priceAdd : 0);
    }, 0);
    return type.basePrice + size.priceAdd + addTotal;
  }, [type, size, picked]);

  function toggleAddOn(id) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function handleCheckout() {
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Please add your name and email so we can reach you about your art. ♡");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeId,
          sizeId,
          addOnIds: picked,
          details,
          name,
          email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Stripe Checkout
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch (e) {
      setError("Could not start checkout. Please try again or contact us.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="section-title text-center">Customize your commission</h1>
      <p className="mt-3 text-center text-plum/70">
        Build your perfect piece below. The price updates as you go! ✨
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* ---------- BUILDER ---------- */}
        <div className="space-y-8">
          {/* TYPE */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">1. Choose a style</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {commissionTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeId(t.id)}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                    typeId === t.id
                      ? "border-rose bg-petal/60 shadow-soft"
                      : "border-petal/50 bg-white/60 hover:border-bubblegum"
                  }`}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span>
                    <span className="block font-semibold text-grape">{t.name}</span>
                    <span className="block text-xs text-plum/70">{t.blurb}</span>
                    <span className="mt-1 block text-sm font-semibold text-rose">
                      from ${t.basePrice}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SIZE */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">2. Pick a canvas size</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {canvasSizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSizeId(s.id)}
                  className={`flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                    sizeId === s.id
                      ? "border-rose bg-petal/60 shadow-soft"
                      : "border-petal/50 bg-white/60 hover:border-bubblegum"
                  }`}
                >
                  <span className="font-semibold text-grape">{s.name}</span>
                  <span className="text-sm font-semibold text-rose">
                    {s.priceAdd > 0 ? `+$${s.priceAdd}` : "included"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ADD-ONS */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">3. Add extras (optional)</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {addOns.map((a) => {
                const on = picked.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAddOn(a.id)}
                    className={`flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                      on
                        ? "border-rose bg-petal/60 shadow-soft"
                        : "border-petal/50 bg-white/60 hover:border-bubblegum"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold text-grape">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border-2 text-xs text-white ${
                          on ? "border-rose bg-rose" : "border-bubblegum"
                        }`}
                      >
                        {on ? "✓" : ""}
                      </span>
                      {a.name}
                    </span>
                    <span className="text-sm font-semibold text-rose">+${a.priceAdd}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETAILS */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">4. Tell me about your idea</h2>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Describe what you'd like — characters, colors, references, vibe... the more detail the better! ♡"
              className="mt-4 w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-4 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
            />
            <p className="mt-2 text-sm text-plum/60">
              Not sure yet?{" "}
              <Link href="/contact" className="font-semibold text-rose underline">
                Message me first
              </Link>{" "}
              — I&apos;m happy to chat before you order!
            </p>
          </div>
        </div>

        {/* ---------- ORDER SUMMARY ---------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card border-2 border-bubblegum/60">
            <h2 className="font-display text-2xl text-grape">Your order ♡</h2>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-plum/70">{type.emoji} {type.name}</dt>
                <dd className="font-semibold text-plum">${type.basePrice}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-plum/70">{size.name}</dt>
                <dd className="font-semibold text-plum">
                  {size.priceAdd > 0 ? `+$${size.priceAdd}` : "—"}
                </dd>
              </div>
              {picked.map((id) => {
                const a = addOns.find((x) => x.id === id);
                return (
                  <div key={id} className="flex justify-between">
                    <dt className="text-plum/70">{a.name}</dt>
                    <dd className="font-semibold text-plum">+${a.priceAdd}</dd>
                  </div>
                );
              })}
            </dl>

            <div className="mt-4 border-t border-petal pt-4">
              <div className="flex items-end justify-between">
                <span className="text-plum/70">Total</span>
                <span className="font-display text-3xl text-rose">${total}</span>
              </div>
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
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary mt-5 w-full disabled:opacity-60"
            >
              {loading ? "Taking you to checkout…" : `💳 Pay $${total} with Stripe`}
            </button>
            <p className="mt-3 text-center text-xs text-plum/60">
              Secure checkout powered by Stripe. You&apos;ll get an email
              confirmation. ♡
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
