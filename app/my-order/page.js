"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Mail, MessageSquare } from "lucide-react";

export default function MyOrderPage() {
  const [order, setOrder] = useState("");
  const [found, setFound] = useState(null); // order summary or null
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("email"); // email | text
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const lookup = useCallback(async (value) => {
    setError("");
    setFound(null);
    if (!value?.trim()) return;
    try {
      const res = await fetch(`/api/track?order=${encodeURIComponent(value.trim())}`);
      if (res.ok) setFound(await res.json());
      else setFound(false);
    } catch {
      setFound(false);
    }
  }, []);

  useEffect(() => {
    const o = new URLSearchParams(window.location.search).get("order");
    if (o) {
      setOrder(o);
      lookup(o);
    }
  }, [lookup]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!order.trim()) return setError("Please enter your order number.");
    if (method === "email" && !email.trim()) return setError("Please add your email.");
    if (method === "text" && !phone.trim()) return setError("Please add your phone number.");
    setBusy(true);
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order, email, phone, contactMethod: method }),
      });
      const d = await res.json();
      if (res.ok) setDone(true);
      else setError(d.error || "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
        <Check className="h-16 w-16 text-rose" strokeWidth={1.5} />
        <h1 className="section-title mt-6">You&apos;re all set!</h1>
        <p className="mt-4 text-plum/75">
          Thanks! I&apos;ll send your commission updates by{" "}
          {method === "text" ? "text" : "email"}. You can check your progress
          anytime.
        </p>
        <Link href={`/track?order=${encodeURIComponent(order)}`} className="btn-primary mt-6">
          Track my commission
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="section-title text-center">Your commission details</h1>
      <p className="mt-3 text-center text-plum/70">
        Pop in your contact info so I can send you updates and a preview when
        your piece is ready. ♥
      </p>

      <form onSubmit={submit} className="card mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-grape">Order number</label>
          <input
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            onBlur={() => lookup(order)}
            placeholder="e.g. VBV-7K3QX"
            className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
          />
          {found && (
            <p className="mt-1 text-xs font-semibold text-grape">
              Found it! {found.name ? `${found.name}'s ` : ""}
              {[found.mediumName, found.sizeName].filter(Boolean).join(" · ")}
            </p>
          )}
          {found === false && (
            <p className="mt-1 text-xs text-rose">Hmm, that order number isn&apos;t found yet.</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-grape">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-grape">Phone (for texts)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-grape">
            How would you like updates?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "email", label: "Email", Icon: Mail },
              { id: "text", label: "Text", Icon: MessageSquare },
            ].map(({ id, label, Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setMethod(id)}
                className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3 font-semibold transition-all ${
                  method === id
                    ? "border-rose bg-petal/60 text-grape shadow-soft"
                    : "border-petal/60 bg-white/60 text-plum/70 hover:border-bubblegum"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm font-semibold text-rose">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? "Saving…" : "Save my info"}
        </button>
      </form>
    </div>
  );
}
