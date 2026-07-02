"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star, Heart, BadgeCheck } from "lucide-react";
import { site } from "@/lib/config";

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? "fill-rose text-rose" : "text-petal"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(null); // null = loading

  // leave-a-review form
  const [name, setName] = useState("");
  const [order, setOrder] = useState("");
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [posted, setPosted] = useState(false);

  const load = useCallback(() => {
    fetch("/api/reviews", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e?.preventDefault();
    setError("");
    if (!stars) return setError("Please pick a star rating.");
    if (!text.trim()) return setError("Please write a few words!");
    if (!order.trim() && !name.trim()) return setError("Please add your name.");
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, order, rating: stars, text }),
      });
      const d = await res.json();
      if (res.ok) {
        setPosted(true);
        load();
      } else {
        setError(d.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="section-title text-center">Kind words</h1>
      <p className="mt-3 text-center text-plum/70">
        Reviews from customers and friends of the shop. ♥
      </p>

      {reviews === null && (
        <p className="mt-12 text-center text-plum/60">Loading reviews…</p>
      )}

      {reviews !== null && reviews.length === 0 && (
        <div className="card mx-auto mt-12 max-w-md text-center">
          <Heart className="mx-auto h-10 w-10 text-rose" strokeWidth={1.5} />
          <p className="mt-3 font-semibold text-grape">No reviews just yet!</p>
          <p className="mt-1 text-sm text-plum/70">
            Be the first — leave one below.
          </p>
        </div>
      )}

      {reviews !== null && reviews.length > 0 && (
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="card flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <Stars rating={r.rating} />
                {r.verified && (
                  <span className="flex items-center gap-1 rounded-full bg-grape/10 px-2 py-0.5 text-xs font-semibold text-grape">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified commission
                  </span>
                )}
              </div>
              <p className="mt-3 flex-1 text-plum/80">“{r.text}”</p>
              <div className="mt-4 border-t border-petal/60 pt-3 text-sm">
                <span className="font-semibold text-grape">{r.name}</span>
                {r.piece && <span className="text-plum/60"> · {r.piece}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* leave a review — open to everyone */}
      <div className="card mx-auto mt-14 max-w-lg">
        {posted ? (
          <div className="text-center">
            <Heart className="mx-auto h-10 w-10 text-rose" strokeWidth={1.5} />
            <p className="mt-3 font-semibold text-grape">Thank you for your review!</p>
            <p className="mt-1 text-sm text-plum/70">It&apos;s live on this page now. ♥</p>
            <button
              type="button"
              onClick={() => {
                setPosted(false);
                setName("");
                setOrder("");
                setStars(0);
                setText("");
              }}
              className="mt-4 text-sm font-semibold text-rose underline"
            >
              Write another
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2 className="text-center font-display text-2xl text-grape">
              Leave a review
            </h2>
            <div className="mt-4 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      n <= stars ? "fill-rose text-rose" : "text-petal"
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="How was your experience with Vivian's art?"
                className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
              />
              <input
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder='Order number (optional — adds a "verified" badge)'
                className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-sm text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
              />
            </div>
            {error && (
              <p className="mt-3 text-center text-sm font-semibold text-rose">{error}</p>
            )}
            <button type="submit" disabled={busy} className="btn-primary mt-4 w-full disabled:opacity-60">
              {busy ? "Posting…" : "Post my review"}
            </button>
          </form>
        )}
      </div>

      <div className="mt-12 text-center">
        <p className="text-plum/70">Want a piece of your own?</p>
        <Link href="/commissions" className="btn-primary mt-3">
          Order a commission
        </Link>
      </div>

      <p className="mt-10 text-center text-xs text-plum/60">
        P.S. Follow{" "}
        <a
          href={site.socials.instagram}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-rose underline"
        >
          @__vivian__n
        </a>{" "}
        on Instagram to see works in progress!
      </p>
    </div>
  );
}
