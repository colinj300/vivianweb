"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { RefreshCw, Ruler, User, Mountain, DollarSign, CreditCard, ImagePlus, Trash2 } from "lucide-react";
import { STATUSES, STATUS_LABELS, STAGES, STAGE_LABELS } from "@/lib/commissions";
import { aceoPrice } from "@/lib/config";

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
        <div className="inline-flex rounded-full border-2 border-petal bg-white/60 p-1">
          {[
            ["commissions", "Commissions"],
            ["aceos", "ACEO Shop"],
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
      {view === "commissions" && (
      <>
      <h1 className="sr-only">Commissions</h1>

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
      </>
      )}
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
        <span className="flex items-center gap-1"><Mountain className="h-4 w-4" /> {c.backgroundName || (c.complexBackground ? "complex bg" : "no bg")}</span>
        <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> {c.isCustom ? `extras $${c.estimate} + base TBD` : `est $${c.estimate}`}{c.finalPrice ? ` · final $${c.finalPrice}` : ""}</span>
      </div>

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
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setImageUrl(blob.url);
    } catch (err) {
      setMsg(err?.message || "Upload failed. Make sure the Blob store is connected.");
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
    </div>
  );
}
