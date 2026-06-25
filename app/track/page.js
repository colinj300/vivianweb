"use client";

import { useState } from "react";
import { Heart, ThumbsDown, Check, Search, PartyPopper } from "lucide-react";
import { STAGES, STAGE_LABELS } from "@/lib/commissions";

export default function TrackPage() {
  const [order, setOrder] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // review UI
  const [choice, setChoice] = useState(null); // "loved" | "revision"
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function lookup(e) {
    e?.preventDefault();
    setError("");
    setData(null);
    setChoice(null);
    setNotes("");
    if (!order.trim()) return setError("Please enter your order number.");
    setLoading(true);
    try {
      const res = await fetch(`/api/track?order=${encodeURIComponent(order.trim())}`);
      if (res.status === 404) {
        setError("We couldn't find that order number. Double-check it with Vivian.");
      } else if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Something went wrong.");
      } else {
        setData(await res.json());
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitReview(response) {
    setError("");
    if (response === "revision" && !notes.trim()) {
      return setError("Please tell us what you'd like changed.");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: data.orderNumber, response, notes }),
      });
      const d = await res.json();
      if (res.ok) {
        setData({ ...data, review: d.review });
      } else {
        setError(d.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentIndex = data ? STAGES.indexOf(data.stage) : -1;
  const readyForReview = data?.stage === "ready_for_review";

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="section-title text-center">Check on your commission</h1>
      <p className="mt-3 text-center text-plum/70">
        Enter the order number Vivian gave you to see how your piece is coming
        along.
      </p>

      <form onSubmit={lookup} className="mx-auto mt-8 flex max-w-md gap-3">
        <input
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          placeholder="e.g. VBV-7K3QX"
          className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
        />
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
          <Search className="h-4 w-4" /> {loading ? "…" : "Check"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-center text-sm font-semibold text-rose">{error}</p>
      )}

      {data && (
        <div className="card mt-10">
          <div className="text-center">
            <p className="text-sm text-plum/60">Order</p>
            <p className="font-display text-3xl text-grape">{data.orderNumber}</p>
            {(data.mediumName || data.sizeName) && (
              <p className="mt-1 text-sm text-plum/70">
                {[data.mediumName, data.sizeName].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* progress bar */}
          <div className="mt-8 flex items-start justify-between">
            {STAGES.map((s, i) => {
              const done = i <= currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <div key={s} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <div className={`h-1 flex-1 rounded-full ${i === 0 ? "opacity-0" : done ? "bg-rose" : "bg-petal"}`} />
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                        done
                          ? "border-rose bg-rose text-white"
                          : "border-petal bg-white text-petal"
                      } ${isCurrent ? "ring-4 ring-petal/60" : ""}`}
                    >
                      {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <span className="text-sm font-bold">{i + 1}</span>}
                    </div>
                    <div className={`h-1 flex-1 rounded-full ${i === STAGES.length - 1 ? "opacity-0" : i < currentIndex ? "bg-rose" : "bg-petal"}`} />
                  </div>
                  <span className={`mt-2 px-1 text-xs font-semibold ${done ? "text-grape" : "text-plum/50"}`}>
                    {STAGE_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* review section */}
          {data.review ? (
            <div className="mt-8 rounded-2xl bg-lilac/50 p-5 text-center">
              {data.review.response === "loved" ? (
                <>
                  <PartyPopper className="mx-auto h-10 w-10 text-rose" strokeWidth={1.5} />
                  <p className="mt-2 font-semibold text-grape">You approved your piece!</p>
                  <p className="text-sm text-plum/70">
                    Vivian will get it finished and on its way to you. Thank you!
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-grape">Revision requested ♥</p>
                  <p className="mt-1 text-sm text-plum/70">
                    Vivian got your notes and is making changes. You&apos;ll be able
                    to review again soon.
                  </p>
                  <p className="mt-3 rounded-xl bg-white/70 p-3 text-left text-sm text-plum/80">
                    “{data.review.notes}”
                  </p>
                </>
              )}
            </div>
          ) : readyForReview ? (
            <div className="mt-8">
              <p className="text-center font-semibold text-grape">
                Your piece is ready! What do you think?
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => submitReview("loved")}
                  disabled={submitting}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all disabled:opacity-60 ${
                    choice === "loved"
                      ? "border-rose bg-petal/60"
                      : "border-petal/60 bg-white/60 hover:border-rose"
                  }`}
                >
                  <Heart className="h-8 w-8 text-rose" strokeWidth={1.75} />
                  <span className="font-semibold text-grape">I love it!</span>
                </button>
                <button
                  onClick={() => setChoice("revision")}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${
                    choice === "revision"
                      ? "border-rose bg-petal/60"
                      : "border-petal/60 bg-white/60 hover:border-rose"
                  }`}
                >
                  <ThumbsDown className="h-8 w-8 text-grape" strokeWidth={1.75} />
                  <span className="font-semibold text-grape">I don&apos;t like…</span>
                </button>
              </div>

              {choice === "revision" && (
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-semibold text-grape">
                    What would you like changed?
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Tell Vivian what you'd like adjusted — colors, details, anything!"
                    className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
                  />
                  <button
                    onClick={() => submitReview("revision")}
                    disabled={submitting}
                    className="btn-primary mt-3 w-full disabled:opacity-60"
                  >
                    {submitting ? "Sending…" : "Send my notes"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-plum/60">
              {currentIndex < 1
                ? "Your spot is locked in — Vivian will start soon!"
                : "Vivian is working on your piece. Check back for updates!"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
