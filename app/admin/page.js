"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Ruler, User, Mountain, DollarSign, CreditCard } from "lucide-react";
import { STATUSES, STATUS_LABELS, STAGES, STAGE_LABELS } from "@/lib/commissions";

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

  // On open, check whether we already have a valid session.
  useEffect(() => {
    load().finally(() => setChecking(false));
  }, [load]);

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
    await load();
    setBusy(false);
  }

  const updateStatus = (id, status) => post({ id, status });
  const updateStage = (id, stage) => post({ id, stage });
  const setPrice = (id, finalPrice) => post({ id, finalPrice });

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
        <h1 className="section-title">Commissions</h1>
        <div className="flex gap-2">
          <button onClick={() => load()} className="btn-secondary !py-2 text-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={logout} className="btn-secondary !py-2 text-sm">
            Log out
          </button>
        </div>
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

      {/* requests */}
      <div className="mt-8 space-y-5">
        {data.commissions.length === 0 && (
          <p className="text-center text-plum/60">No requests yet.</p>
        )}
        {data.commissions.map((c) => (
          <CommissionCard
            key={c.id}
            c={c}
            busy={busy}
            onStatus={updateStatus}
            onStage={updateStage}
            onPrice={setPrice}
            onLink={makeLink}
          />
        ))}
      </div>
    </div>
  );
}

function CommissionCard({ c, busy, onStatus, onStage, onPrice, onLink }) {
  const [price, setPriceInput] = useState(c.finalPrice ?? c.estimate ?? "");
  const [emailCustomer, setEmailCustomer] = useState(true);
  const color = STATUS_COLOR[c.status] || STATUS_COLOR.pending;

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-grape">{c.name}</h3>
          <a href={`mailto:${c.email}`} className="text-sm text-rose underline">
            {c.email}
          </a>
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
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-plum/80">
        <span className="flex items-center gap-1"><Ruler className="h-4 w-4" /> {c.mediumName ? `${c.mediumName} · ` : ""}{c.sizeName}</span>
        <span className="flex items-center gap-1"><User className="h-4 w-4" /> {1 + (c.additionalSubjects || 0)} subject(s)</span>
        <span className="flex items-center gap-1"><Mountain className="h-4 w-4" /> {c.complexBackground ? "complex bg" : "no bg"}</span>
        <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> {c.isCustom ? `extras $${c.estimate} + base TBD` : `est $${c.estimate}`}{c.finalPrice ? ` · final $${c.finalPrice}` : ""}</span>
      </div>

      <p className="mt-3 whitespace-pre-line rounded-2xl bg-blush/70 p-3 text-sm text-plum/80">
        {c.request}
      </p>

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
            <span className="font-semibold text-grape">★ Customer approved this piece!</span>
          ) : (
            <>
              <span className="font-semibold text-rose">Revision requested:</span>{" "}
              {c.review.notes}
            </>
          )}
        </div>
      )}

      {/* status controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-plum/50">Status:</span>
        {STATUSES.map((s) => (
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
      </div>

      {/* progress stage (only once approved) */}
      {c.status === "approved" && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-plum/50">Progress:</span>
          {STAGES.map((s) => (
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
