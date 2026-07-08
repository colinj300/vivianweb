"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Clock, Truck, ShieldCheck, ShoppingBag, PartyPopper, Sticker } from "lucide-react";

function useCountdown(deadlineISO) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!deadlineISO) return;
    const end = new Date(deadlineISO).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadlineISO]);
  if (left == null) return null;
  const s = Math.floor(left / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
    done: left <= 0,
  };
}

function CountBox({ n, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[3rem] rounded-2xl bg-grape px-3 py-2 font-display text-3xl text-white tabular-nums">
        {String(n).padStart(2, "0")}
      </span>
      <span className="mt-1 text-xs font-semibold text-plum/60">{label}</span>
    </div>
  );
}

export default function PreorderPage() {
  const [data, setData] = useState(null); // null loading; {active:false} hidden
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cd = useCountdown(data?.deadlineISO);

  useEffect(() => {
    fetch("/api/preorder", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ active: false }));
  }, []);

  async function buy() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/preorder/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      const d = await res.json();
      if (res.ok && d.url) window.location.href = d.url;
      else {
        setError(d.error || "Could not start checkout.");
        setBusy(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  if (data === null) {
    return <p className="mx-auto max-w-lg px-5 py-24 text-center text-plum/50">Loading…</p>;
  }
  if (!data.active) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="section-title">No pre-orders right now</h1>
        <p className="mt-3 text-plum/70">Check back soon for the next drop!</p>
        <Link href="/shop" className="btn-primary mt-6">Visit the shop</Link>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((data.count / data.goal) * 100));
  const maxPer = data.maxPerOrder || 10;

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <div className="grid items-start gap-10 md:grid-cols-2">
        {/* image */}
        <div className="relative overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br from-lavender to-bubblegum shadow-soft" style={{ aspectRatio: "3 / 6", maxHeight: 620 }}>
          {data.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.image} alt={data.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
              <Sticker className="h-16 w-16" strokeWidth={1.5} />
              <p className="mt-3 font-display text-2xl">{data.title}</p>
              <p className="mt-1 text-sm text-white/80">{data.sheetSize}</p>
              <p className="mt-4 text-xs text-white/70">Photo coming soon ♥</p>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-rose px-3 py-1 text-xs font-bold text-white shadow">
            Pre-order
          </span>
        </div>

        {/* details */}
        <div>
          <h1 className="font-display text-4xl text-grape">{data.title}</h1>
          <p className="mt-1 text-plum/60">{data.sheetSize}</p>
          <p className="mt-3 font-display text-3xl text-rose">${data.price.toFixed(2)}</p>

          {/* countdown */}
          {data.open && cd && (
            <div className="mt-6 rounded-3xl border-2 border-petal bg-white/60 p-4">
              <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-grape">
                <Clock className="h-4 w-4" /> Pre-orders close in
              </p>
              <div className="mt-3 flex justify-center gap-3">
                <CountBox n={cd.days} label="days" />
                <CountBox n={cd.hours} label="hrs" />
                <CountBox n={cd.mins} label="min" />
                <CountBox n={cd.secs} label="sec" />
              </div>
            </div>
          )}

          {/* progress toward goal */}
          <div className="mt-6">
            <div className="flex items-end justify-between">
              <span className="font-display text-2xl text-grape">
                {data.count} <span className="text-lg text-plum/60">of {data.goal} pre-ordered</span>
              </span>
              <span className="text-sm font-semibold text-rose">{pct}%</span>
            </div>
            <div className="mt-2 h-4 overflow-hidden rounded-full bg-petal/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-bubblegum to-rose transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            {data.open && !data.met && (
              <p className="mt-2 text-sm text-plum/60">
                Just {data.remaining} more to unlock the print run — grab yours!
              </p>
            )}
            {data.open && data.met && (
              <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-grape">
                <PartyPopper className="h-4 w-4" /> Goal reached — it&apos;s happening! Still time to join.
              </p>
            )}
          </div>

          {/* buy / status */}
          {data.open ? (
            <div className="mt-6">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center gap-3 rounded-full border-2 border-petal bg-white/70 px-3 py-1.5">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="text-grape disabled:opacity-40"
                    disabled={qty <= 1}
                    aria-label="Fewer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[1.5rem] text-center font-semibold text-plum">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(maxPer, q + 1))}
                    className="text-grape disabled:opacity-40"
                    disabled={qty >= maxPer}
                    aria-label="More"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button onClick={buy} disabled={busy} className="btn-primary flex-1 disabled:opacity-60">
                  <ShoppingBag className="h-4 w-4" />
                  {busy ? "…" : `Pre-order — $${(data.price * qty).toFixed(2)}`}
                </button>
              </div>
              {error && <p className="mt-3 text-sm font-semibold text-rose">{error}</p>}
            </div>
          ) : data.met ? (
            <div className="mt-6 rounded-2xl bg-grape/10 p-4 text-grape">
              <p className="flex items-center gap-2 font-semibold">
                <PartyPopper className="h-5 w-5" /> Funded! Pre-orders are closed.
              </p>
              <p className="mt-1 text-sm text-plum/70">
                Thank you to everyone who ordered — sheets ship by {data.shipBy}. 💜
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-rose/10 p-4 text-plum/80">
              <p className="font-semibold text-rose">This drop didn&apos;t reach its goal.</p>
              <p className="mt-1 text-sm">
                Everyone who pre-ordered is being fully refunded — thank you for the support!
              </p>
            </div>
          )}

          {/* reassurance */}
          <div className="mt-6 space-y-2 text-sm text-plum/70">
            <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-grape" /> Ships by {data.shipBy}</p>
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-grape" /> Full refund if we don&apos;t reach {data.goal} pre-orders</p>
          </div>

          <p className="mt-6 whitespace-pre-line text-plum/80">{data.description}</p>
        </div>
      </div>
    </div>
  );
}
