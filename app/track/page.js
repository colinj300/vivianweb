"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [ship, setShip] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const setShipField = (k) => (e) => setShip((s) => ({ ...s, [k]: e.target.value }));

  const doLookup = useCallback(async (value) => {
    setError("");
    setData(null);
    setChoice(null);
    setNotes("");
    if (!value?.trim()) return setError("Please enter your order number.");
    setLoading(true);
    try {
      const res = await fetch(`/api/track?order=${encodeURIComponent(value.trim())}`);
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
  }, []);

  // Open straight to an order if the email link includes ?order=VBV-XXXXX
  useEffect(() => {
    const o = new URLSearchParams(window.location.search).get("order");
    if (o) {
      setOrder(o);
      doLookup(o);
    }
  }, [doLookup]);

  async function lookup(e) {
    e?.preventDefault();
    doLookup(order);
  }

  async function submitReview(response) {
    setError("");
    if (response === "revision" && !notes.trim()) {
      return setError("Please tell us what you'd like changed.");
    }
    if (response === "loved") {
      if (!ship.name.trim() || !ship.line1.trim() || !ship.city.trim() || !ship.state.trim() || !ship.zip.trim()) {
        return setError("Please fill in your shipping address so Vivian can ship it.");
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: data.orderNumber,
          response,
          notes,
          shipping: response === "loved" ? ship : undefined,
        }),
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

          {/* preview photo of the finished piece */}
          {data.proofImage && readyForReview && (
            <div className="mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.proofImage}
                alt="Your finished commission"
                className="mx-auto max-h-96 w-auto rounded-2xl border-4 border-petal shadow-soft"
              />
            </div>
          )}

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
                  onClick={() => setChoice("loved")}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${
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

              {choice === "loved" && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-semibold text-grape">
                    Yay! Where should I ship it?
                  </p>
                  <input value={ship.name} onChange={setShipField("name")} placeholder="Full name" className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none" />
                  <input value={ship.line1} onChange={setShipField("line1")} placeholder="Street address" className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none" />
                  <input value={ship.line2} onChange={setShipField("line2")} placeholder="Apt / unit (optional)" className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={ship.city} onChange={setShipField("city")} placeholder="City" className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none" />
                    <input value={ship.state} onChange={setShipField("state")} placeholder="State" className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={ship.zip} onChange={setShipField("zip")} placeholder="ZIP" className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none" />
                    <input value={ship.country} onChange={setShipField("country")} placeholder="Country" className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none" />
                  </div>
                  <button
                    onClick={() => submitReview("loved")}
                    disabled={submitting}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {submitting ? "Sending…" : "Confirm & send shipping info"}
                  </button>
                </div>
              )}

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
