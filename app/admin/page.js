"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Ruler, User, Mountain, DollarSign, CreditCard, ImagePlus, Trash2, X, Star } from "lucide-react";
import { STATUSES, STATUS_LABELS, STAGES, STAGE_LABELS } from "@/lib/commissions";
import { aceoPrice, mediums, backgrounds } from "@/lib/config";
import { compressImage } from "@/lib/compressImage";

const STATUS_COLOR = {
  pending: "bg-lilac text-plum",
  approved: "bg-bubblegum text-white",
  completed: "bg-grape text-white",
  waitlist: "bg-petal text-grape",
  declined: "bg-plum/20 text-plum",
};

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("commissions"); // commissions | aceos
  const [diag, setDiag] = useState(null);
  const [testMsg, setTestMsg] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // The session cookie is sent automatically — no password handling here.
  const load = useCallback(async () => {
    const res = await fetch("/api/admin/commissions", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return false;
    }
    setData(await res.json());
    setAuthed(true);
    return true;
  }, []);

  const loadDiag = useCallback(async () => {
    const res = await fetch("/api/admin/diagnostics", { cache: "no-store" });
    if (res.ok) setDiag(await res.json());
  }, []);

  async function sendTest(channel) {
    setTestMsg("Sending…");
    const res = await fetch("/api/admin/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setTestMsg("Couldn't send the test — try again.");
    if (d.skipped) {
      setTestMsg(
        channel === "text"
          ? "Texting isn't switched on yet (Twilio). Nothing was sent — add the Twilio keys to enable it."
          : "Email isn't switched on yet (Resend). Nothing was sent — add RESEND_API_KEY to enable it."
      );
    } else if (d.ok) {
      setTestMsg(
        channel === "text"
          ? `✓ Test text sent to your phone${d.to ? ` (${d.to})` : ""}. If it doesn't arrive, double-check OWNER_PHONE and your Twilio number.`
          : `✓ Test email sent to ${d.to}. Check your inbox (and spam) — if it's there, your receipts, confirmations, and review notices all work.`
      );
    } else if (channel === "email") {
      const detail = d.error || "Unknown error.";
      const fromOnboarding = (d.from || "").includes("resend.dev");
      setTestMsg(
        `✗ Resend rejected the send (from ${d.from || "?"} → ${d.to}):\n"${detail}"` +
          (fromOnboarding
            ? `\n\nMost likely fix: you're sending from Resend's shared "onboarding@resend.dev", which can only email the address you signed up to Resend with. Verify your own domain (or sender) in Resend, then set a CONTACT_FROM env var like "Vivian <hello@yourdomain.com>" and redeploy.`
            : "")
      );
    } else {
      setTestMsg(`✗ ${d.error || "The provider returned an error — check that your keys are correct."}`);
    }
  }

  // On open, check whether we already have a valid session.
  useEffect(() => {
    load()
      .then((ok) => {
        if (ok) loadDiag();
      })
      .finally(() => setChecking(false));
  }, [load, loadDiag]);

  async function login(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      setPw("");
      await load();
      loadDiag();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not log in.");
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setData(null);
  }

  async function post(body) {
    setBusy(true);
    const res = await fetch("/api/admin/commissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401) setAuthed(false);
    const d = await res.json().catch(() => ({}));
    await load();
    setBusy(false);
    return d;
  }

  const updateStatus = (id, status) => post({ id, status });
  const setPrice = (id, finalPrice) => post({ id, finalPrice });
  const addProgress = (id, url) => post({ id, addProgressImage: url });
  const removeProgress = (id, url) => post({ id, removeProgressImage: url });
  const hideReview = (id, hidden) => post({ id, hideTestimonial: hidden });
  const removeReview = (id) => {
    if (confirm("Remove this customer review completely? This can't be undone.")) {
      post({ id, removeTestimonial: true });
    }
  };
  async function updateStage(id, stage, proofImage) {
    const d = await post({ id, stage, proofImage });
    if (stage !== "ready_for_review" && stage !== "in_progress") return;

    const sent = d?.sent || {};
    const channels = [];
    if (sent.email) channels.push("email");
    if (sent.text) channels.push("text");
    const what = stage === "ready_for_review" ? "review link" : '"in progress" update';

    let msg = channels.length
      ? `Sent the ${what} by ${channels.join(" + ")}.`
      : `Marked ${stage === "ready_for_review" ? "ready for review" : "in progress"}.`;

    if (d?.manual) {
      const where =
        d.manual.platform === "instagram"
          ? `Instagram ${d.manual.handle || "(no handle on file)"}`
          : d.manual.platform === "text"
          ? `text ${d.manual.handle || "(no number on file)"}`
          : d.manual.platform;
      msg +=
        `\n\n⚠ They chose ${where} as their contact, which can't be sent automatically.\n` +
        `Please send them this link yourself:\n${d.manual.url}\n\n` +
        `(It's also saved on this order's card with a Copy button.)`;
    } else if (!channels.length) {
      msg +=
        `\n\n(No message went out — they may have no contact info on file, or ` +
        `Resend/Twilio isn't set up yet. The review link is on the card to send manually.)`;
    }
    alert(msg);
  }

  async function removeCommission(id) {
    if (!confirm("Decline and permanently remove this commission? This can't be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/commissions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.status === 401) setAuthed(false);
    await load();
    setBusy(false);
  }

  async function makeLink(id, amount, emailCustomer) {
    setBusy(true);
    const res = await fetch("/api/admin/payment-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, amount, emailCustomer }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) alert(d.error || "Could not create link");
    await load();
    setBusy(false);
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-5 py-24">
        <h1 className="section-title text-center">Admin</h1>
        <form onSubmit={login} className="card mt-8 space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Admin password"
            autoComplete="current-password"
            className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum focus:border-rose focus:outline-none"
          />
          {error && <p className="text-sm font-semibold text-rose">{error}</p>}
          <button className="btn-primary w-full" disabled={checking}>
            {checking ? "…" : "Log in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-full border-2 border-petal bg-white/60 p-1">
          {[
            ["commissions", "Commissions"],
            ["aceos", "ACEO Shop"],
            ["preorders", "Pre-orders"],
            ["reviews", "Reviews"],
            ["money", "Money"],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                view === v ? "bg-rose text-white shadow-soft" : "text-grape hover:bg-petal/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {view === "commissions" && (
            <button onClick={() => load()} className="btn-secondary !py-2 text-sm">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          )}
          <button onClick={logout} className="btn-secondary !py-2 text-sm">
            Log out
          </button>
        </div>
      </div>

      {view === "aceos" && <AceoManager />}
      {view === "preorders" && <PreorderManager />}
      {view === "reviews" && <ReviewsManager />}
      {view === "money" && <MoneyManager />}
      {view === "commissions" && (
      <>
      <h1 className="sr-only">Commissions</h1>

      {/* notifications & system status */}
      <div className="card mt-6">
        <button
          onClick={() => {
            setShowStatus((v) => !v);
            if (!diag) loadDiag();
          }}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-bold text-grape">Notifications &amp; system status</span>
          <span className="text-sm font-semibold text-plum/60">
            {showStatus ? "Hide" : "Check"}
          </span>
        </button>
        {showStatus && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Email (receipts, confirmations, review notices)", diag?.email],
                ["Customer texting", diag?.text],
                ["Card payments", diag?.payments],
                ["Image uploads", diag?.uploads],
                ["Saved order data (survives redeploys)", diag?.storage],
              ].map(([label, on]) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-xl bg-blush/50 px-3 py-2 text-sm"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      on ? "bg-green-500" : "bg-plum/25"
                    }`}
                  />
                  <span className="text-plum/80">{label}</span>
                  <span
                    className={`ml-auto shrink-0 text-xs font-semibold ${
                      on ? "text-green-600" : "text-plum/40"
                    }`}
                  >
                    {on ? "on" : "not set up"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => sendTest("email")} disabled={busy} className="btn-secondary !py-2 text-sm">
                Send test email
              </button>
              <button onClick={() => sendTest("text")} disabled={busy} className="btn-secondary !py-2 text-sm">
                Send test text
              </button>
              {diag?.contactEmail && (
                <span className="text-xs text-plum/50">
                  Email tests go to {diag.contactEmail}; texts go to your phone.
                </span>
              )}
            </div>
            {testMsg && (
              <p className="whitespace-pre-line rounded-xl bg-lilac/40 p-3 text-sm text-plum/80">
                {testMsg}
              </p>
            )}
          </div>
        )}
      </div>

      {/* slot summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <div className="font-display text-4xl text-grape">
            {data.active}/{data.capacity}
          </div>
          <div className="text-sm text-plum/70">active</div>
        </div>
        <div className="card text-center">
          <div className="font-display text-4xl text-rose">{data.openSlots}</div>
          <div className="text-sm text-plum/70">open slots</div>
        </div>
        <div className="card text-center">
          <div className="font-display text-4xl text-grape">
            {data.commissions.filter((c) => c.status === "waitlist").length}
          </div>
          <div className="text-sm text-plum/70">on waitlist</div>
        </div>
      </div>

      <AddCommission onAdded={() => load()} />

      {/* requests — active pipeline first (pending → in the works → waitlist) */}
      {(() => {
        const cardProps = {
          busy,
          onStatus: updateStatus,
          onStage: updateStage,
          onPrice: setPrice,
          onLink: makeLink,
          onDelete: removeCommission,
          onAddProgress: addProgress,
          onRemoveProgress: removeProgress,
          onHideReview: hideReview,
          onRemoveReview: removeReview,
        };
        const rank = { pending: 0, approved: 1, waitlist: 2, declined: 3 };
        const active = data.commissions
          .filter((c) => c.status !== "completed")
          .sort(
            (a, b) =>
              (rank[a.status] ?? 9) - (rank[b.status] ?? 9) ||
              new Date(b.createdAt) - new Date(a.createdAt)
          );
        const completed = data.commissions
          .filter((c) => c.status === "completed")
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return (
          <>
            <div className="mt-8 space-y-5">
              {active.length === 0 && (
                <p className="text-center text-plum/60">
                  {completed.length
                    ? "Nothing in the works — everything is completed! 🎉"
                    : "No requests yet."}
                </p>
              )}
              {active.map((c) => (
                <CommissionCard key={c.id} c={c} {...cardProps} />
              ))}
            </div>

            {/* completed orders */}
            {completed.length > 0 && (
              <div className="mt-10">
                <button
                  onClick={() => setShowCompleted((v) => !v)}
                  className="flex w-full items-center justify-between rounded-2xl border-2 border-petal bg-white/60 px-5 py-3 text-left"
                >
                  <span className="font-display text-xl text-grape">
                    Completed orders ({completed.length})
                  </span>
                  <span className="text-sm font-semibold text-plum/60">
                    {showCompleted ? "Hide" : "Show"}
                  </span>
                </button>
                {showCompleted && (
                  <div className="mt-5 space-y-5">
                    {completed.map((c) => (
                      <CommissionCard key={c.id} c={c} {...cardProps} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}
      </>
      )}
    </div>
  );
}

function CommissionCard({ c, busy, onStatus, onStage, onPrice, onLink, onDelete, onAddProgress, onRemoveProgress, onHideReview, onRemoveReview }) {
  const [price, setPriceInput] = useState(c.finalPrice ?? c.estimate ?? "");
  const [emailCustomer, setEmailCustomer] = useState(true);
  const [proofUrl, setProofUrl] = useState(c.proofImage || "");
  const [proofBusy, setProofBusy] = useState(false);
  const proofRef = useRef(null);
  const [progressBusy, setProgressBusy] = useState(false);
  const progressRef = useRef(null);
  const [origin, setOrigin] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const color = STATUS_COLOR[c.status] || STATUS_COLOR.pending;

  useEffect(() => setOrigin(window.location.origin), []);
  const reviewUrl = c.orderNumber ? `${origin}/track?order=${c.orderNumber}` : "";
  const pref = c.contactMethod || "email";

  async function uploadProgress(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgressBusy(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) onAddProgress(c.id, d.url);
      else alert(d.error || "Upload failed.");
    } catch {
      alert("Upload failed. Please try again.");
    }
    setProgressBusy(false);
    if (progressRef.current) progressRef.current.value = "";
  }

  async function uploadProof(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofBusy(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) setProofUrl(d.url);
      else alert(d.error || "Upload failed.");
    } catch {
      alert("Upload failed. Please try again.");
    }
    setProofBusy(false);
    if (proofRef.current) proofRef.current.value = "";
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-grape">{c.name}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
            {c.instagram ? (
              <a
                href={`https://instagram.com/${c.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-rose underline"
              >
                {c.instagram.startsWith("@") ? c.instagram : `@${c.instagram}`}
              </a>
            ) : (
              <span className="font-semibold text-rose/70">no IG on file</span>
            )}
            {c.email ? (
              <a href={`mailto:${c.email}`} className="text-rose underline">
                {c.email}
              </a>
            ) : (
              <span className="font-semibold text-rose/70">no email on file</span>
            )}
            {c.phone && <span className="text-plum/70">{c.phone}</span>}
            <span className="text-xs font-semibold text-grape">
              (prefers {c.contactMethod === "instagram" ? "Instagram DM" : c.contactMethod || "email"})
            </span>
          </div>
          <p className="mt-1 text-xs text-plum/50">
            {new Date(c.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
            {STATUS_LABELS[c.status] || c.status}
          </span>
          {c.orderNumber && (
            <p className="mt-1 font-mono text-sm font-bold text-grape">{c.orderNumber}</p>
          )}
          {c.review && (
            <p
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                c.review.response === "loved"
                  ? "bg-grape/15 text-grape"
                  : "bg-rose/15 text-rose"
              }`}
            >
              {c.review.response === "loved" ? "♥ Customer approved" : "Revision requested"}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-plum/80">
        <span className="flex items-center gap-1"><Ruler className="h-4 w-4" /> {c.mediumName ? `${c.mediumName} · ` : ""}{c.sizeName}</span>
        <span className="flex items-center gap-1"><User className="h-4 w-4" /> {1 + (c.additionalSubjects || 0)} subject(s)</span>
        <span className="flex items-center gap-1"><Mountain className="h-4 w-4" /> {c.backgroundName || (c.complexBackground ? "complex bg" : "no bg")}</span>
        <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> {c.isCustom ? `extras $${c.estimate} + base TBD` : c.estimate != null ? `est $${c.estimate}` : "price TBD"}{c.finalPrice ? ` · final $${c.finalPrice}` : ""}</span>
      </div>

      {c.orderNumber && (!c.email || !c.instagram) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-plum/70">
          <span>Missing contact info — send them this form:</span>
          <button
            onClick={() =>
              navigator.clipboard?.writeText(`${window.location.origin}/my-order?order=${c.orderNumber}`)
            }
            className="rounded-full border border-bubblegum px-2 py-0.5 font-semibold text-grape hover:bg-petal"
          >
            Copy info-form link
          </button>
        </div>
      )}

      <p className="mt-3 whitespace-pre-line rounded-2xl bg-blush/70 p-3 text-sm text-plum/80">
        {c.request}
      </p>

      {Array.isArray(c.images) && c.images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {c.images.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="pet reference"
                className="h-20 w-20 rounded-xl border border-petal object-cover hover:opacity-80"
              />
            </a>
          ))}
        </div>
      )}

      {/* review from customer */}
      {c.review && (
        <div
          className={`mt-3 rounded-2xl p-3 text-sm ${
            c.review.response === "loved"
              ? "bg-grape/10 text-grape"
              : "bg-rose/10 text-plum/80"
          }`}
        >
          {c.review.response === "loved" ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-grape">★ Customer approved this piece!</span>
              {c.status === "approved" && (
                <button
                  disabled={busy}
                  onClick={() => onStatus(c.id, "completed")}
                  className="rounded-full bg-grape px-3 py-1 text-xs font-semibold text-white transition hover:bg-grape/85 disabled:opacity-40"
                >
                  Shipped it? Mark completed ✓
                </button>
              )}
            </span>
          ) : (
            <>
              <span className="font-semibold text-rose">Revision requested:</span>{" "}
              {c.review.notes}
            </>
          )}
        </div>
      )}

      {/* public review the customer left (shown on /reviews) */}
      {c.testimonial && (
        <div className="mt-3 rounded-2xl border border-petal/60 bg-white/70 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-4 w-4 ${
                    n <= c.testimonial.rating ? "fill-rose text-rose" : "text-petal"
                  }`}
                  strokeWidth={1.5}
                />
              ))}
            </span>
            <span className="text-xs font-semibold text-plum/50">
              Public review {c.testimonial.hidden ? "(hidden from site)" : "(live on /reviews)"}
            </span>
            <span className="ml-auto flex gap-2">
              <button
                disabled={busy}
                onClick={() => onHideReview(c.id, !c.testimonial.hidden)}
                className="rounded-full border border-bubblegum px-2 py-0.5 text-xs font-semibold text-grape hover:bg-petal disabled:opacity-40"
              >
                {c.testimonial.hidden ? "Show on site" : "Hide from site"}
              </button>
              <button
                disabled={busy}
                onClick={() => onRemoveReview(c.id)}
                className="rounded-full border border-rose/50 px-2 py-0.5 text-xs font-semibold text-rose hover:bg-rose/10 disabled:opacity-40"
              >
                Remove
              </button>
            </span>
          </div>
          <p className="mt-2 text-plum/80">“{c.testimonial.text}”</p>
        </div>
      )}

      {c.shipping && (
        <div className="mt-3 rounded-2xl border border-bubblegum/50 bg-white/70 p-3 text-sm">
          <p className="font-semibold text-grape">📦 Ship to:</p>
          <p className="whitespace-pre-line text-plum/80">
            {`${c.shipping.name}\n${c.shipping.line1}${c.shipping.line2 ? ", " + c.shipping.line2 : ""}\n${c.shipping.city}, ${c.shipping.state} ${c.shipping.zip}\n${c.shipping.country}`}
          </p>
          <button
            onClick={() =>
              navigator.clipboard?.writeText(
                `${c.shipping.name}\n${c.shipping.line1}${c.shipping.line2 ? "\n" + c.shipping.line2 : ""}\n${c.shipping.city}, ${c.shipping.state} ${c.shipping.zip}\n${c.shipping.country}`
              )
            }
            className="mt-1 rounded-full border border-bubblegum px-3 py-0.5 text-xs font-semibold text-grape hover:bg-petal"
          >
            Copy address
          </button>
        </div>
      )}

      {/* status controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-plum/50">Status:</span>
        {STATUSES.filter((s) => s !== "declined").map((s) => (
          <button
            key={s}
            disabled={busy || c.status === s}
            onClick={() => onStatus(c.id, s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
              c.status === s
                ? "bg-grape text-white"
                : "border border-bubblegum text-grape hover:bg-petal"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
        <button
          disabled={busy}
          onClick={() => onDelete(c.id)}
          className="rounded-full border border-rose/50 px-3 py-1 text-xs font-semibold text-rose transition hover:bg-rose/10 disabled:opacity-40"
        >
          Decline &amp; remove
        </button>
      </div>

      {/* progress stage + send-for-review (only once approved) */}
      {c.status === "approved" && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-plum/50">Progress:</span>
            {["not_started", "in_progress"].map((s) => (
              <button
                key={s}
                disabled={busy || c.stage === s}
                onClick={() => onStage(c.id, s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                  c.stage === s
                    ? "bg-rose text-white"
                    : "border border-bubblegum text-grape hover:bg-petal"
                }`}
              >
                {STAGE_LABELS[s]}
              </button>
            ))}
            {c.stage === "ready_for_review" && (
              <span className="rounded-full bg-rose px-3 py-1 text-xs font-semibold text-white">
                ✓ Sent for review
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-petal/60 bg-blush/50 p-3">
            <p className="text-xs font-semibold text-grape">
              Finished? Send the customer a photo to review:
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => proofRef.current?.click()}
                disabled={proofBusy}
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-bubblegum text-grape hover:bg-petal disabled:opacity-60"
              >
                {proofUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proofUrl} alt="" className="h-full w-full object-cover" />
                ) : proofBusy ? (
                  "…"
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
              </button>
              <input ref={proofRef} type="file" accept="image/*" onChange={uploadProof} className="hidden" />
              <button
                disabled={busy || !proofUrl}
                onClick={() => onStage(c.id, "ready_for_review", proofUrl)}
                className="btn-primary !py-2 text-sm disabled:opacity-50"
              >
                {c.stage === "ready_for_review" ? "Resend review notice" : "Send for review & notify"}
              </button>
              {pref === "instagram" && (
                <span className="text-xs text-rose">prefers Instagram — you&apos;ll get the link to DM</span>
              )}
              {pref !== "instagram" && !c.email && pref !== "text" && (
                <span className="text-xs text-rose">no email on file</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* progress photos the customer can see on /track */}
      {c.orderNumber && (
        <div className="mt-2 rounded-2xl border border-petal/60 bg-white/60 p-3">
          <p className="text-xs font-semibold text-grape">
            Progress photos (the customer sees these when they track their order):
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {Array.isArray(c.progressImages) &&
              c.progressImages.map((p) => (
                <div key={p.url} className="relative">
                  <a href={p.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt="progress"
                      className="h-16 w-16 rounded-xl border border-petal object-cover hover:opacity-80"
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemoveProgress(c.id, p.url)}
                    disabled={busy}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose text-white shadow hover:bg-rose/80 disabled:opacity-40"
                    aria-label="Remove progress photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            <button
              type="button"
              onClick={() => progressRef.current?.click()}
              disabled={progressBusy}
              className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-bubblegum text-[10px] font-semibold text-grape hover:bg-petal disabled:opacity-60"
            >
              {progressBusy ? (
                "…"
              ) : (
                <>
                  <ImagePlus className="h-4 w-4" />
                  Add
                </>
              )}
            </button>
            <input
              ref={progressRef}
              type="file"
              accept="image/*"
              onChange={uploadProgress}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* shareable status/review link — esp. for non-email customers */}
      {c.orderNumber && (
        <div className="mt-2 rounded-2xl border border-bubblegum/60 bg-lilac/30 p-3">
          <p className="text-xs font-semibold text-grape">
            Status &amp; review link (send this to the customer so they can track and approve):
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={reviewUrl}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-xl border border-petal/60 bg-white/80 px-3 py-1.5 text-xs text-plum"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(reviewUrl);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 1500);
              }}
              className="rounded-full border border-bubblegum px-3 py-1 text-xs font-semibold text-grape hover:bg-petal"
            >
              {linkCopied ? "Copied!" : "Copy link"}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-plum/60">
            {pref === "instagram" ? (
              <>
                They prefer <b>Instagram</b> {c.instagram || ""} — auto-send isn&apos;t possible,
                so DM them this link when their piece is in progress / ready.
              </>
            ) : pref === "text" ? (
              <>
                They prefer <b>text</b> {c.phone || ""} — they&apos;ll be texted automatically
                (if Twilio is on){c.email ? " and emailed a copy" : ""}. Copy here to send it yourself too.
              </>
            ) : (
              <>They&apos;ll get this link by <b>email</b> automatically when you mark in progress / ready for review.</>
            )}
          </p>
        </div>
      )}

      {/* pricing + payment link */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-petal/60 pt-4">
        <label className="text-sm text-plum/70">Final $</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPriceInput(e.target.value)}
          className="w-24 rounded-xl border-2 border-petal/60 bg-white/70 p-2 text-plum focus:border-rose focus:outline-none"
        />
        <button
          disabled={busy}
          onClick={() => onPrice(c.id, price)}
          className="btn-secondary !py-2 text-sm"
        >
          Save price
        </button>
        <label className="flex items-center gap-1 text-sm text-plum/70">
          <input
            type="checkbox"
            checked={emailCustomer}
            onChange={(e) => setEmailCustomer(e.target.checked)}
          />
          email link to customer
        </label>
        <button
          disabled={busy}
          onClick={() => onLink(c.id, price, emailCustomer)}
          className="btn-primary !py-2 text-sm"
        >
          <CreditCard className="h-4 w-4" /> Create payment link
        </button>
      </div>

      {c.paymentLink && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <a href={c.paymentLink} target="_blank" rel="noreferrer" className="break-all text-rose underline">
            {c.paymentLink}
          </a>
          <button
            onClick={() => navigator.clipboard?.writeText(c.paymentLink)}
            className="rounded-full border border-bubblegum px-3 py-1 text-xs text-grape hover:bg-petal"
          >
            copy
          </button>
        </div>
      )}
    </div>
  );
}

// Sticker pre-order dashboard: progress toward goal, listing photo, buyer
// list, and the one-click "refund everyone" button if the goal is missed.
function PreorderManager() {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/preorders", { cache: "no-store" });
    if (res.ok) setD(await res.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function act(body, confirmMsg) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/preorders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setD(j);
      if (typeof j.refunded === "number") {
        setMsg(
          `Refunded ${j.refunded} order(s).` +
            (j.failures?.length ? ` ${j.failures.length} failed — check Stripe.` : "")
        );
      }
    } else {
      setMsg(j.error || "Something went wrong.");
    }
    setBusy(false);
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.url) await act({ action: "setImage", image: j.url });
      else setMsg(j.error || "Upload failed.");
    } catch {
      setMsg("Upload failed. Please try again.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (d === null) return <p className="mt-6 text-plum/60">Loading…</p>;

  const s = d.state;
  const fmt = (n) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;
  const pct = Math.min(100, Math.round((s.count / s.goal) * 100));
  const phaseLabel =
    s.phase === "open" ? "Open" : s.phase === "funded" ? "Funded ✓" : "Goal missed";
  const phaseColor =
    s.phase === "open"
      ? "bg-lilac text-plum/80"
      : s.phase === "funded"
      ? "bg-grape/15 text-grape"
      : "bg-rose/15 text-rose";

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-grape">
          Pre-orders — {d.product.title}
        </h2>
        <button onClick={load} className="btn-secondary !py-2 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
      {!d.product.active && (
        <p className="mt-1 text-sm font-semibold text-rose">
          This pre-order is hidden from the site (set <code>active: true</code> in config.js to show it).
        </p>
      )}

      {/* summary */}
      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <div className="card text-center">
          <div className="font-display text-3xl text-grape">{s.count}/{s.goal}</div>
          <div className="text-sm text-plum/70">pre-ordered</div>
        </div>
        <div className="card text-center">
          <div className="font-display text-3xl text-rose">{fmt(d.revenue)}</div>
          <div className="text-sm text-plum/70">collected</div>
        </div>
        <div className="card text-center">
          <div className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${phaseColor}`}>
            {phaseLabel}
          </div>
          <div className="mt-1 text-xs text-plum/50">
            deadline {d.product.deadline}
          </div>
        </div>
        <div className="card text-center">
          <div className="font-display text-3xl text-grape">{d.refundedCount}</div>
          <div className="text-sm text-plum/70">refunded</div>
        </div>
      </div>

      {/* progress bar */}
      <div className="mt-4 h-4 overflow-hidden rounded-full bg-petal/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-bubblegum to-rose"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* deadline-passed prompts */}
      {s.phase === "failed" && (
        <div className="mt-5 rounded-2xl border-2 border-rose/40 bg-rose/5 p-4">
          <p className="font-semibold text-rose">
            The deadline passed and you fell short ({s.count}/{s.goal}).
          </p>
          <p className="mt-1 text-sm text-plum/70">
            Refund every buyer through Stripe in one click. Each person gets their money back
            and an email letting them know.
          </p>
          <button
            onClick={() =>
              act(
                { action: "refundAll" },
                `Refund ALL ${s.count} paid pre-order(s) through Stripe? This can't be undone.`
              )
            }
            disabled={busy}
            className="mt-3 rounded-full bg-rose px-4 py-2 text-sm font-bold text-white hover:bg-rose/85 disabled:opacity-50"
          >
            Refund everyone
          </button>
        </div>
      )}
      {s.phase === "funded" && (
        <div className="mt-5 rounded-2xl border-2 border-grape/30 bg-grape/5 p-4">
          <p className="font-semibold text-grape">
            You hit your goal! 🎉 Time to print and ship by {d.product.shipBy}.
          </p>
          <button
            onClick={() => act({ action: "fulfillAll" }, "Mark all paid pre-orders as fulfilled/shipped?")}
            disabled={busy}
            className="mt-3 rounded-full bg-grape px-4 py-2 text-sm font-bold text-white hover:bg-grape/85 disabled:opacity-50"
          >
            Mark all as shipped
          </button>
        </div>
      )}

      {/* listing photo */}
      <div className="mt-6 card">
        <p className="font-semibold text-grape">Listing photo</p>
        <p className="mt-1 text-sm text-plum/60">
          This is what buyers see on the pre-order page. Upload the real sticker sheet photo.
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="h-24 w-24 overflow-hidden rounded-xl border-2 border-petal bg-lilac/40">
            {d.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-plum/40">
                <ImagePlus className="h-6 w-6" />
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-secondary !py-2 text-sm disabled:opacity-60"
            >
              {uploading ? "Uploading…" : d.image ? "Replace photo" : "Upload photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          </div>
        </div>
      </div>

      {msg && <p className="mt-4 rounded-xl bg-lilac/40 p-3 text-sm font-semibold text-plum/80">{msg}</p>}

      {/* buyer list */}
      <h3 className="mt-8 font-display text-xl text-grape">Buyers ({d.orders.length})</h3>
      {d.orders.length === 0 && (
        <p className="mt-3 text-center text-plum/60">No pre-orders yet.</p>
      )}
      <div className="mt-4 space-y-3">
        {d.orders.map((o) => (
          <div key={o.id} className="card">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold text-grape">{o.name || "Buyer"}</span>
              {o.email && (
                <a href={`mailto:${o.email}`} className="text-sm text-rose underline">
                  {o.email}
                </a>
              )}
              <span className="text-sm text-plum/70">
                ×{o.quantity} · {fmt(o.amount)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  o.status === "refunded"
                    ? "bg-plum/15 text-plum/70"
                    : o.status === "fulfilled"
                    ? "bg-grape/15 text-grape"
                    : "bg-lilac text-plum/80"
                }`}
              >
                {o.status}
              </span>
              <span className="ml-auto text-xs text-plum/50">
                {new Date(o.createdAt).toLocaleDateString()}
              </span>
            </div>
            {o.shipping && (
              <p className="mt-2 whitespace-pre-line text-xs text-plum/60">
                {`${o.shipping.name}\n${o.shipping.line1}${o.shipping.line2 ? ", " + o.shipping.line2 : ""}\n${o.shipping.city}, ${o.shipping.state} ${o.shipping.zip} ${o.shipping.country}`}
              </p>
            )}
            {(o.status === "paid" || o.status === "fulfilled") && (
              <div className="mt-2 flex gap-2">
                {o.status === "paid" && (
                  <button
                    disabled={busy}
                    onClick={() => act({ action: "fulfill", id: o.id })}
                    className="rounded-full border border-bubblegum px-3 py-1 text-xs font-semibold text-grape hover:bg-petal disabled:opacity-40"
                  >
                    Mark shipped
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={() =>
                    act({ action: "refund", id: o.id }, `Refund ${o.name || "this buyer"} (${fmt(o.amount)})?`)
                  }
                  className="rounded-full border border-rose/50 px-3 py-1 text-xs font-semibold text-rose hover:bg-rose/10 disabled:opacity-40"
                >
                  Refund
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Profit & expense tracker. Commission + ACEO income is pulled in
// automatically; Vivian adds everything else (supplies, other income) here.
function MoneyManager() {
  const [data, setData] = useState(null); // { entries, totals }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // add-entry form
  const [type, setType] = useState("expense");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/finance", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (n) => {
    const v = Math.round(n * 100) / 100;
    const abs = Math.abs(v);
    const s = abs % 1 === 0 ? `$${abs}` : `$${abs.toFixed(2)}`;
    return v < 0 ? `−${s}` : s;
  };

  async function addEntry(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label, amount, at: date || undefined }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setData(d);
      setLabel("");
      setAmount("");
      setDate("");
    } else {
      setError(d.error || "Couldn't add that entry.");
    }
    setBusy(false);
  }

  async function removeEntry(id) {
    if (!confirm("Remove this entry?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/finance?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) setData(await res.json());
    setBusy(false);
  }

  const t = data?.totals;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-grape">Profits &amp; expenses</h2>
        <button onClick={load} className="btn-secondary !py-2 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
      <p className="mt-1 text-sm text-plum/60">
        Commissions and ACEO sales are added automatically. Add your supplies,
        shipping costs, and any other income or expenses below.
      </p>

      {/* summary */}
      {t && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="card text-center">
            <div className="font-display text-3xl text-grape">{fmt(t.income)}</div>
            <div className="text-sm text-plum/70">income</div>
            <div className="mt-1 text-xs text-plum/50">{fmt(t.monthIncome)} this month</div>
          </div>
          <div className="card text-center">
            <div className="font-display text-3xl text-rose">{fmt(t.expenses)}</div>
            <div className="text-sm text-plum/70">expenses</div>
            <div className="mt-1 text-xs text-plum/50">{fmt(t.monthExpenses)} this month</div>
          </div>
          <div className="card text-center">
            <div className={`font-display text-3xl ${t.profit < 0 ? "text-rose" : "text-grape"}`}>
              {fmt(t.profit)}
            </div>
            <div className="text-sm text-plum/70">profit</div>
            <div className="mt-1 text-xs text-plum/50">{fmt(t.monthProfit)} this month</div>
          </div>
        </div>
      )}

      {/* add manual entry */}
      <form onSubmit={addEntry} className="card mt-6">
        <p className="font-semibold text-grape">Add an entry</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border-2 border-petal bg-white/60 p-1">
            {[
              ["expense", "Expense"],
              ["income", "Income"],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setType(v)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                  type === v ? "bg-rose text-white shadow-soft" : "text-grape hover:bg-petal/60"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={type === "expense" ? "e.g. Canvas paper + paints" : "e.g. Art fair sales"}
            className="min-w-0 flex-1 rounded-2xl border-2 border-petal/60 bg-white/70 p-2.5 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <span className="text-plum/60">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-24 rounded-2xl border-2 border-petal/60 bg-white/70 p-2.5 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
            />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-2xl border-2 border-petal/60 bg-white/70 p-2.5 text-sm text-plum focus:border-rose focus:outline-none"
          />
          <button disabled={busy} className="btn-primary !py-2.5 text-sm disabled:opacity-60">
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-plum/50">
          Leave the date empty to use today.
        </p>
        {error && <p className="mt-2 text-sm font-semibold text-rose">{error}</p>}
      </form>

      {/* ledger */}
      {data === null && <p className="mt-6 text-plum/60">Loading…</p>}
      {data !== null && data.entries.length === 0 && (
        <p className="mt-6 text-center text-plum/60">
          Nothing yet — approved commissions and ACEO sales will show up here
          automatically.
        </p>
      )}
      <div className="mt-5 space-y-2">
        {(data?.entries || []).map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-petal/60 bg-white/70 px-4 py-2.5 text-sm"
          >
            <span className="w-20 shrink-0 text-xs text-plum/50">
              {new Date(e.at).toLocaleDateString()}
            </span>
            <span className="min-w-0 flex-1 font-semibold text-plum/80">{e.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                e.source === "manual"
                  ? "bg-lilac text-plum/70"
                  : "bg-grape/10 text-grape"
              }`}
            >
              {e.source === "commission"
                ? "Commission"
                : e.source === "aceo"
                ? "ACEO"
                : e.source === "preorder"
                ? "Pre-order"
                : "Manual"}
              {e.estimated ? " · est." : ""}
            </span>
            <span
              className={`w-24 shrink-0 text-right font-bold ${
                e.type === "expense" ? "text-rose" : "text-grape"
              }`}
            >
              {e.type === "expense" ? "−" : "+"}
              {fmt(e.amount)}
            </span>
            {e.source === "manual" ? (
              <button
                disabled={busy}
                onClick={() => removeEntry(e.id)}
                className="rounded-full border border-rose/50 px-2 py-0.5 text-xs font-semibold text-rose hover:bg-rose/10 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="w-[34px]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// All public reviews in one place — commission reviews + open site reviews.
function ReviewsManager() {
  const [reviews, setReviews] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/reviews", { cache: "no-store" });
    if (res.ok) setReviews((await res.json()).reviews);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setHidden(r, hidden) {
    setBusy(true);
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: r.source, id: r.id, hidden }),
    });
    await load();
    setBusy(false);
  }

  async function remove(r) {
    if (!confirm("Remove this review completely? This can't be undone.")) return;
    setBusy(true);
    await fetch(
      `/api/admin/reviews?source=${encodeURIComponent(r.source)}&id=${encodeURIComponent(r.id)}`,
      { method: "DELETE" }
    );
    await load();
    setBusy(false);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-grape">Public reviews</h2>
        <button onClick={load} className="btn-secondary !py-2 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
      <p className="mt-1 text-sm text-plum/60">
        Everything shown on your Reviews page — from commission orders and from
        the open &quot;leave a review&quot; form. Hide anything you don&apos;t
        want on the site, or remove it for good.
      </p>

      {reviews === null && <p className="mt-6 text-plum/60">Loading…</p>}
      {reviews !== null && reviews.length === 0 && (
        <p className="mt-6 text-center text-plum/60">No reviews yet.</p>
      )}

      <div className="mt-5 space-y-4">
        {(reviews || []).map((r) => (
          <div key={`${r.source}-${r.id}`} className={`card ${r.hidden ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${
                      n <= r.rating ? "fill-rose text-rose" : "text-petal"
                    }`}
                    strokeWidth={1.5}
                  />
                ))}
              </span>
              <span className="font-semibold text-grape">{r.name}</span>
              {r.source === "order" ? (
                <span className="rounded-full bg-grape/10 px-2 py-0.5 text-xs font-semibold text-grape">
                  Verified · {r.orderNumber}
                </span>
              ) : (
                <span className="rounded-full bg-lilac px-2 py-0.5 text-xs font-semibold text-plum/70">
                  Open review
                </span>
              )}
              {r.hidden && (
                <span className="rounded-full bg-plum/15 px-2 py-0.5 text-xs font-semibold text-plum/70">
                  Hidden from site
                </span>
              )}
              <span className="ml-auto text-xs text-plum/50">
                {new Date(r.at).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-2 text-sm text-plum/80">“{r.text}”</p>
            <div className="mt-3 flex gap-2">
              <button
                disabled={busy}
                onClick={() => setHidden(r, !r.hidden)}
                className="rounded-full border border-bubblegum px-3 py-1 text-xs font-semibold text-grape hover:bg-petal disabled:opacity-40"
              >
                {r.hidden ? "Show on site" : "Hide from site"}
              </button>
              <button
                disabled={busy}
                onClick={() => remove(r)}
                className="rounded-full border border-rose/50 px-3 py-1 text-xs font-semibold text-rose hover:bg-rose/10 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddCommission({ onAdded }) {
  const blank = {
    name: "",
    email: "",
    instagram: "",
    mediumId: mediums[0].id,
    sizeName: "",
    subjects: 1,
    backgroundId: "none",
    price: "",
    notes: "",
  };
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function add() {
    if (!f.name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/admin/commissions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: f.name,
        email: f.email,
        instagram: f.instagram,
        mediumId: f.mediumId,
        sizeName: f.sizeName,
        additionalSubjects: Math.max(0, (Number(f.subjects) || 1) - 1),
        backgroundId: f.backgroundId,
        price: f.price,
        notes: f.notes,
      }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setLast(`Added ${d.commission?.name} — order ${d.commission?.orderNumber}`);
      setF(blank);
      onAdded?.();
    }
    setBusy(false);
  }

  if (!open) {
    return (
      <div className="mt-6">
        <button onClick={() => setOpen(true)} className="btn-secondary !py-2 text-sm">
          + Add a commission (off-site order)
        </button>
        {last && <span className="ml-3 text-sm font-semibold text-grape">{last}</span>}
      </div>
    );
  }

  return (
    <div className="card mt-6">
      <h2 className="font-display text-2xl text-grape">Add a commission</h2>
      <p className="mt-1 text-sm text-plum/60">
        For orders from Instagram, in person, etc. Creates it in progress with an
        order number.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input value={f.name} onChange={set("name")} placeholder="Customer name" className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum focus:border-rose focus:outline-none" />
        <input value={f.instagram} onChange={set("instagram")} placeholder="Instagram @handle (optional)" className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum focus:border-rose focus:outline-none" />
        <input value={f.email} onChange={set("email")} placeholder="Email (optional)" className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum focus:border-rose focus:outline-none" />
        <select value={f.mediumId} onChange={set("mediumId")} className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum focus:border-rose focus:outline-none">
          {mediums.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input value={f.sizeName} onChange={set("sizeName")} placeholder='Size (e.g. 11x4)' className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum focus:border-rose focus:outline-none" />
        <label className="flex items-center gap-2 text-sm text-plum/70">
          Subjects
          <input type="number" min="1" value={f.subjects} onChange={set("subjects")} className="w-20 rounded-2xl border-2 border-petal/60 bg-white/70 p-2 text-plum focus:border-rose focus:outline-none" />
        </label>
        <select value={f.backgroundId} onChange={set("backgroundId")} className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum focus:border-rose focus:outline-none">
          {backgrounds.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-plum/70">
          Price $
          <input type="number" value={f.price} onChange={set("price")} placeholder="optional" className="w-28 rounded-2xl border-2 border-petal/60 bg-white/70 p-2 text-plum focus:border-rose focus:outline-none" />
        </label>
        <input value={f.notes} onChange={set("notes")} placeholder="Notes (e.g. 1 bunny)" className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum focus:border-rose focus:outline-none sm:col-span-2" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={add} disabled={busy} className="btn-primary !py-2 text-sm disabled:opacity-60">
          {busy ? "Adding…" : "Add commission"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-secondary !py-2 text-sm">
          Done
        </button>
        {last && <span className="text-sm font-semibold text-grape">{last}</span>}
      </div>
    </div>
  );
}

function AceoManager() {
  const [aceos, setAceos] = useState(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(aceoPrice);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  async function load() {
    const res = await fetch("/api/admin/aceos", { cache: "no-store" });
    if (res.ok) setAceos((await res.json()).aceos);
  }
  useEffect(() => {
    load();
  }, []);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("");
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) setImageUrl(d.url);
      else setMsg(d.error || "Upload failed. Make sure the Blob store is connected.");
    } catch {
      setMsg("Upload failed. Please try again.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function create() {
    setMsg("");
    if (!imageUrl) return setMsg("Upload a photo first.");
    setBusy(true);
    const res = await fetch("/api/admin/aceos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, price, imageUrl }),
    });
    if (res.ok) {
      setTitle("");
      setPrice(aceoPrice);
      setImageUrl("");
      await load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Could not create listing.");
    }
    setBusy(false);
  }

  async function setStatus(id, status) {
    setBusy(true);
    await fetch("/api/admin/aceos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
    setBusy(false);
  }

  async function remove(id) {
    if (!confirm("Delete this listing?")) return;
    setBusy(true);
    await fetch(`/api/admin/aceos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
    setBusy(false);
  }

  async function fetchBuyer(id) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/aceos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "fetchBuyer" }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(d.error || "Couldn't fetch buyer info from Stripe.");
    await load();
    setBusy(false);
  }

  const sold = (aceos || []).filter((a) => a.status === "sold");

  return (
    <div className="mt-6">
      {/* create form */}
      <div className="card">
        <h2 className="font-display text-2xl text-grape">Add an ACEO</h2>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-32 w-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 border-dashed border-bubblegum text-grape hover:bg-petal disabled:opacity-60"
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-semibold">{uploading ? "Uploading…" : "Photo"}</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

          <div className="flex flex-1 flex-col gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Sleepy Cat)"
              className="rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum focus:border-rose focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-plum/70">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-24 rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum focus:border-rose focus:outline-none"
              />
              <button onClick={create} disabled={busy || uploading} className="btn-primary !py-2 text-sm disabled:opacity-60">
                Add listing
              </button>
            </div>
            {msg && <p className="text-sm font-semibold text-rose">{msg}</p>}
          </div>
        </div>
      </div>

      {/* listings */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {aceos === null && <p className="text-plum/50">Loading…</p>}
        {aceos && aceos.length === 0 && <p className="text-plum/60">No listings yet.</p>}
        {(aceos || []).map((a) => (
          <div key={a.id} className="card p-3">
            <div className="overflow-hidden rounded-xl border-2 border-petal" style={{ aspectRatio: "2.5 / 3.5" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.imageUrl}
                alt={a.title}
                className={`h-full w-full object-cover ${a.status === "sold" ? "opacity-60 grayscale" : ""}`}
              />
            </div>
            <p className="mt-2 truncate text-center font-semibold text-grape">{a.title}</p>
            <p className="text-center text-sm text-rose">
              ${a.price} · {a.status}
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <button
                disabled={busy}
                onClick={() => setStatus(a.id, a.status === "sold" ? "available" : "sold")}
                className="rounded-full border border-bubblegum px-3 py-1 text-xs font-semibold text-grape hover:bg-petal"
              >
                {a.status === "sold" ? "Mark available" : "Mark sold"}
              </button>
              <button
                disabled={busy}
                onClick={() => remove(a.id)}
                className="rounded-full border border-rose/40 px-2 py-1 text-xs text-rose hover:bg-rose/10"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* sold orders — buyer + shipping address */}
      {sold.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-2xl text-grape">Sold orders — ship these</h2>
          <p className="mt-1 text-sm text-plum/60">
            Buyer and shipping address for each sold ACEO, straight from Stripe.
          </p>
          <div className="mt-4 space-y-4">
            {sold.map((a) => (
              <div key={a.id} className="card flex flex-wrap gap-4">
                <div className="h-24 w-[68px] shrink-0 overflow-hidden rounded-xl border-2 border-petal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-grape">{a.title}</span>
                    <span className="text-sm text-rose">${a.soldPrice ?? a.price}</span>
                    {a.soldAt && (
                      <span className="text-xs text-plum/50">
                        sold {new Date(a.soldAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {(a.buyer?.name || a.buyer?.email) && (
                    <p className="mt-0.5 text-sm text-plum/80">
                      {a.buyer?.name}
                      {a.buyer?.email && (
                        <>
                          {" · "}
                          <a href={`mailto:${a.buyer.email}`} className="text-rose underline">
                            {a.buyer.email}
                          </a>
                        </>
                      )}
                    </p>
                  )}

                  {a.shipping ? (
                    <div className="mt-2 rounded-xl border border-bubblegum/50 bg-white/70 p-3 text-sm">
                      <p className="whitespace-pre-line text-plum/80">
                        {`${a.shipping.name}\n${a.shipping.line1}${a.shipping.line2 ? ", " + a.shipping.line2 : ""}\n${a.shipping.city}, ${a.shipping.state} ${a.shipping.zip}\n${a.shipping.country}`}
                      </p>
                      <button
                        onClick={() =>
                          navigator.clipboard?.writeText(
                            `${a.shipping.name}\n${a.shipping.line1}${a.shipping.line2 ? "\n" + a.shipping.line2 : ""}\n${a.shipping.city}, ${a.shipping.state} ${a.shipping.zip}\n${a.shipping.country}`
                          )
                        }
                        className="mt-1 rounded-full border border-bubblegum px-3 py-0.5 text-xs font-semibold text-grape hover:bg-petal"
                      >
                        Copy address
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-plum/60">No address saved for this sale.</span>
                      <button
                        disabled={busy}
                        onClick={() => fetchBuyer(a.id)}
                        className="rounded-full bg-grape px-3 py-1 text-xs font-semibold text-white hover:bg-grape/85 disabled:opacity-50"
                      >
                        {busy ? "…" : "Fetch address from Stripe"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
