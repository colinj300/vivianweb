"use client";

import { useEffect, useState } from "react";
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
  };
}

// The "Ducks in the Park" sticker pre-order, shown as a product card in the
// shop's Stickers category. Pulls live count / countdown from /api/preorder.
export default function PreorderCard() {
  const [data, setData] = useState(null);
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

  if (!data) return <p className="text-plum/50">Loading…</p>;
  if (!data.active) {
    return <p className="text-sm text-plum/60">No stickers listed right now — check back soon!</p>;
  }

  const pct = Math.min(100, Math.round((data.count / data.goal) * 100));
  const maxPer = data.maxPerOrder || 10;

  return (
    <div className="card flex flex-col gap-5 sm:flex-row">
      {/* sticker sheet image */}
      <div
        className="relative mx-auto w-40 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-lavender to-bubblegum shadow-soft"
        style={{ aspectRatio: "3 / 6" }}
      >
        {data.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.image} alt={data.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-white">
            <Sticker className="h-10 w-10" strokeWidth={1.5} />
            <p className="mt-2 text-xs">{data.title}</p>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-rose px-2 py-0.5 text-[10px] font-bold text-white shadow">
          Pre-order
        </span>
      </div>

      {/* info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-2xl text-grape">{data.title}</h3>
          <span className="font-display text-2xl text-rose">${data.price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-plum/60">{data.sheetSize}</p>

        {/* progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-grape">
              {data.count} <span className="text-plum/60">of {data.goal} pre-ordered</span>
            </span>
            {data.open && cd && (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose">
                <Clock className="h-3.5 w-3.5" />
                {cd.days}d {cd.hours}h {cd.mins}m left
              </span>
            )}
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-petal/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-bubblegum to-rose transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <p className="mt-3 text-sm text-plum/75">{data.description}</p>

        <div className="mt-3 flex flex-col gap-1 text-xs text-plum/70">
          <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-grape" /> Ships by {data.shipBy}</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-grape" /> Full refund if we don&apos;t reach {data.goal} pre-orders</span>
        </div>

        {/* buy / status */}
        {data.open ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-3 rounded-full border-2 border-petal bg-white/70 px-3 py-1.5">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="text-grape disabled:opacity-40" aria-label="Fewer">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[1.5rem] text-center font-semibold text-plum">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(maxPer, q + 1))} disabled={qty >= maxPer} className="text-grape disabled:opacity-40" aria-label="More">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button onClick={buy} disabled={busy} className="btn-primary flex-1 disabled:opacity-60">
                <ShoppingBag className="h-4 w-4" />
                {busy ? "…" : `Pre-order — $${(data.price * qty).toFixed(2)}`}
              </button>
            </div>
            {error && <p className="mt-2 text-sm font-semibold text-rose">{error}</p>}
          </div>
        ) : data.met ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-grape/10 p-3 text-sm text-grape">
            <PartyPopper className="h-5 w-5" /> Funded! Pre-orders are closed — ships by {data.shipBy}.
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-rose/10 p-3 text-sm text-plum/80">
            This drop didn&apos;t reach its goal — everyone who pre-ordered is being refunded.
          </div>
        )}
      </div>
    </div>
  );
}
