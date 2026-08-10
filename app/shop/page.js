"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flower2, ShoppingBag } from "lucide-react";

function CategoryHeading({ children, count }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="font-display text-xl text-grape">{children}</h2>
      {count != null && (
        <span className="rounded-full bg-petal/60 px-2 py-0.5 text-xs font-semibold text-grape">
          {count}
        </span>
      )}
      <span className="h-px flex-1 bg-petal/70" />
    </div>
  );
}

export default function ShopPage() {
  const [items, setItems] = useState(null); // shop items (aceo/sticker/original)
  const [configOriginals, setConfigOriginals] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const [a, o] = await Promise.all([
      fetch("/api/shop/aceos", { cache: "no-store" }),
      fetch("/api/shop/originals", { cache: "no-store" }),
    ]);
    setItems((await a.json()).aceos || []);
    setConfigOriginals((await o.json()).originals || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function checkout(id, body) {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok && d.url) window.location.href = d.url;
      else {
        setError(d.error || "Could not start checkout.");
        if (res.status === 409) load();
        setBusyId(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setBusyId(null);
    }
  }

  const all = items || [];
  const stickers = all.filter((i) => (i.type || "aceo") === "sticker");
  const aceos = all.filter((i) => (i.type || "aceo") === "aceo");
  // originals = built-in (config) + admin-added (store)
  const originals = [
    ...configOriginals.map((o) => ({
      key: `cfg-${o.id}`, id: o.id, source: "config",
      title: o.title, image: o.image, price: o.price,
      details: o.description, size: o.size, status: o.status,
    })),
    ...all.filter((i) => i.type === "original").map((o) => ({
      key: `st-${o.id}`, id: o.id, source: "store",
      title: o.title, image: o.imageUrl, price: o.price,
      details: o.details, size: "", status: o.status,
    })),
  ];

  const availAceos = aceos.filter((a) => a.status === "available");
  const soldAceos = aceos.filter((a) => a.status === "sold");

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="section-title text-center">Shop</h1>
      <p className="mt-3 text-center text-plum/70">
        Little bits of hand-made art to take home. ♥
      </p>

      {error && <p className="mt-5 text-center text-sm font-semibold text-rose">{error}</p>}

      {/* Stickers */}
      <section className="mt-12">
        <CategoryHeading count={items ? stickers.length : undefined}>Stickers</CategoryHeading>
        {items === null ? (
          <p className="text-center text-plum/50">Loading…</p>
        ) : stickers.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-petal bg-white/50 p-6 text-center text-sm text-plum/60">
            No stickers listed yet — check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {stickers.map((s) => (
              <div key={s.id} className="card flex flex-col p-3">
                <div className="overflow-hidden rounded-xl border-2 border-petal" style={{ aspectRatio: "1 / 1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.imageUrl} alt={s.title} className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-3 text-center font-plaque text-lg text-plum">{s.title}</h3>
                <p className="text-center font-semibold text-rose">${s.price}</p>
                <button
                  onClick={() => checkout(s.id, { aceoId: s.id })}
                  disabled={busyId === s.id}
                  className="btn-primary mt-2 w-full !py-2 text-sm disabled:opacity-60"
                >
                  <ShoppingBag className="h-4 w-4" /> {busyId === s.id ? "…" : "Buy"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Originals */}
      {originals.length > 0 && (
        <section className="mt-12">
          <CategoryHeading count={originals.filter((o) => o.status === "available").length}>
            Originals
          </CategoryHeading>
          <div className="grid gap-6 sm:grid-cols-2">
            {originals.map((o) => (
              <div key={o.key} className="card flex flex-col gap-4 sm:flex-row">
                <div className="relative mx-auto w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-petal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={o.image}
                    alt={o.title}
                    className={`w-full object-cover ${o.status === "sold" ? "opacity-60 grayscale" : ""}`}
                  />
                  {o.status === "sold" && (
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-grape">
                      Sold
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-2xl text-grape">{o.title}</h3>
                    <span className="font-display text-2xl text-rose">${o.price}</span>
                  </div>
                  {o.size && <p className="text-sm text-plum/60">{o.size} · original</p>}
                  {o.details && <p className="mt-2 text-sm text-plum/75">{o.details}</p>}
                  {o.status === "available" ? (
                    <button
                      onClick={() =>
                        checkout(o.id, o.source === "config" ? { originalId: o.id } : { aceoId: o.id })
                      }
                      disabled={busyId === o.id}
                      className="btn-primary mt-3 w-full disabled:opacity-60"
                    >
                      <ShoppingBag className="h-4 w-4" /> {busyId === o.id ? "…" : `Buy — $${o.price}`}
                    </button>
                  ) : (
                    <p className="mt-3 rounded-2xl bg-lilac/40 p-2 text-center text-sm font-semibold text-plum/60">
                      This original has found a home ♥
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ACEOs */}
      <section className="mt-12">
        <CategoryHeading count={items ? availAceos.length : undefined}>ACEOs</CategoryHeading>
        <p className="-mt-2 mb-5 text-sm text-plum/60">
          Tiny 2.5&quot; × 3.5&quot; hand-painted originals — one of a kind. Once it&apos;s gone,
          it&apos;s gone!
        </p>
        {items === null ? (
          <p className="text-center text-plum/50">Loading…</p>
        ) : availAceos.length === 0 && soldAceos.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-petal bg-white/50 p-8 text-center">
            <Flower2 className="mx-auto h-10 w-10 text-lavender" strokeWidth={1.5} />
            <p className="mt-3 text-plum/70">No ACEOs are listed right now — check back soon!</p>
            <Link href="/commissions" className="btn-primary mt-5">Or commission a custom piece</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {availAceos.map((a) => (
                <div key={a.id} className="card flex flex-col p-3">
                  <div className="overflow-hidden rounded-xl border-2 border-petal" style={{ aspectRatio: "2.5 / 3.5" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover" />
                  </div>
                  <h3 className="mt-3 text-center font-plaque text-lg text-plum">{a.title}</h3>
                  <p className="text-center font-semibold text-rose">${a.price}</p>
                  <button
                    onClick={() => checkout(a.id, { aceoId: a.id })}
                    disabled={busyId === a.id}
                    className="btn-primary mt-2 w-full !py-2 text-sm disabled:opacity-60"
                  >
                    <ShoppingBag className="h-4 w-4" /> {busyId === a.id ? "…" : "Buy"}
                  </button>
                </div>
              ))}
            </div>
            {soldAceos.length > 0 && (
              <>
                <h3 className="mt-10 text-center font-display text-lg text-grape">Recently sold ♥</h3>
                <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                  {soldAceos.map((a) => (
                    <div key={a.id} className="relative">
                      <div className="overflow-hidden rounded-xl border-2 border-petal grayscale" style={{ aspectRatio: "2.5 / 3.5" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover opacity-70" />
                      </div>
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-grape">
                        Sold
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
