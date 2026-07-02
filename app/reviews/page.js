"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
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

  useEffect(() => {
    fetch("/api/reviews", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .catch(() => setReviews([]));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="section-title text-center">Kind words</h1>
      <p className="mt-3 text-center text-plum/70">
        Real reviews from real commissions. ♥
      </p>

      {reviews === null && (
        <p className="mt-12 text-center text-plum/60">Loading reviews…</p>
      )}

      {reviews !== null && reviews.length === 0 && (
        <div className="card mx-auto mt-12 max-w-md text-center">
          <Heart className="mx-auto h-10 w-10 text-rose" strokeWidth={1.5} />
          <p className="mt-3 font-semibold text-grape">No reviews just yet!</p>
          <p className="mt-1 text-sm text-plum/70">
            Be the first — order a commission and share what you think.
          </p>
          <Link href="/commissions" className="btn-primary mt-5">
            Order a commission
          </Link>
        </div>
      )}

      {reviews !== null && reviews.length > 0 && (
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="card flex flex-col">
              <Stars rating={r.rating} />
              <p className="mt-3 flex-1 text-plum/80">“{r.text}”</p>
              <div className="mt-4 border-t border-petal/60 pt-3 text-sm">
                <span className="font-semibold text-grape">{r.name}</span>
                {r.piece && <span className="text-plum/60"> · {r.piece}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviews !== null && reviews.length > 0 && (
        <div className="mt-12 text-center">
          <p className="text-plum/70">Want one of your own?</p>
          <Link href="/commissions" className="btn-primary mt-3">
            Order a commission
          </Link>
        </div>
      )}

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
