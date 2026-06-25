"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flower2, ShoppingBag } from "lucide-react";

export default function ShopPage() {
  const [aceos, setAceos] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/shop/aceos", { cache: "no-store" });
    const d = await res.json();
    setAceos(d.aceos || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function buy(id) {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceoId: id }),
      });
      const d = await res.json();
      if (res.ok && d.url) {
        window.location.href = d.url;
      } else {
        setError(d.error || "Could not start checkout.");
        if (res.status === 409) load(); // refresh — it sold
        setBusyId(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setBusyId(null);
    }
  }

  const available = (aceos || []).filter((a) => a.status === "available");
  const sold = (aceos || []).filter((a) => a.status === "sold");

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="section-title text-center">ACEO Shop</h1>
      <p className="mt-3 text-center text-plum/70">
        Tiny 2.5&quot; × 3.5&quot; hand-painted originals — one of a kind. Once
        it&apos;s gone, it&apos;s gone!
      </p>

      {error && (
        <p className="mt-5 text-center text-sm font-semibold text-rose">{error}</p>
      )}

      {aceos === null ? (
        <p className="mt-12 text-center text-plum/50">Loading…</p>
      ) : available.length === 0 && sold.length === 0 ? (
        <div className="mt-12 text-center">
          <Flower2 className="mx-auto h-12 w-12 text-lavender" strokeWidth={1.5} />
          <p className="mt-3 text-plum/70">
            No ACEOs are listed right now — check back soon!
          </p>
          <Link href="/commissions" className="btn-primary mt-6">
            Or commission a custom piece
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {available.map((a) => (
              <div key={a.id} className="card flex flex-col p-3">
                <div className="overflow-hidden rounded-xl border-2 border-petal" style={{ aspectRatio: "2.5 / 3.5" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-3 text-center font-plaque text-lg text-plum">{a.title}</h3>
                <p className="text-center font-semibold text-rose">${a.price}</p>
                <button
                  onClick={() => buy(a.id)}
                  disabled={busyId === a.id}
                  className="btn-primary mt-2 w-full !py-2 text-sm disabled:opacity-60"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {busyId === a.id ? "…" : "Buy"}
                </button>
              </div>
            ))}
          </div>

          {sold.length > 0 && (
            <>
              <h2 className="mt-14 text-center font-display text-2xl text-grape">
                Recently sold ♥
              </h2>
              <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {sold.map((a) => (
                  <div key={a.id} className="relative">
                    <div
                      className="overflow-hidden rounded-xl border-2 border-petal grayscale"
                      style={{ aspectRatio: "2.5 / 3.5" }}
                    >
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
    </div>
  );
}
