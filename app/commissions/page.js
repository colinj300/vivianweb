"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Heart, Mail, ClipboardList, ImagePlus, X } from "lucide-react";
import { site, mediums, pricing, backgrounds } from "@/lib/config";
import { computeEstimate } from "@/lib/pricing";
import { compressImage } from "@/lib/compressImage";

export default function CommissionsPage() {
  const [mediumId, setMediumId] = useState(mediums[0].id);
  const [sizeId, setSizeId] = useState(null);
  const [customSize, setCustomSize] = useState("");
  const [extraSubjects, setExtraSubjects] = useState(0);
  const [backgroundId, setBackgroundId] = useState("none");
  const [photos, setPhotos] = useState([]); // [{ url, name }]
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const [request, setRequest] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactMethod, setContactMethod] = useState("instagram"); // instagram | email
  const [instagram, setInstagram] = useState("");
  const [ship, setShip] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const setShipField = (k) => (e) => setShip((s) => ({ ...s, [k]: e.target.value }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { waitlisted, estimate }
  const fileRef = useRef(null);

  const medium = mediums.find((m) => m.id === mediumId);
  const isCustom = sizeId === "custom";

  // Switching medium resets the size choice (sizes differ per medium).
  function pickMedium(id) {
    setMediumId(id);
    setSizeId(null);
    setCustomSize("");
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadNote("");
    setUploading(true);
    for (const file of files) {
      if (photos.length >= 8) break;
      try {
        const compressed = await compressImage(file);
        const fd = new FormData();
        fd.append("file", compressed);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await res.json().catch(() => ({}));
        if (res.ok && d.url) {
          setPhotos((p) => [...p, { url: d.url, name: file.name }]);
        } else {
          setUploadNote(
            d.error ||
              "Couldn't upload that photo — you can still send your request and email photos after."
          );
        }
      } catch {
        setUploadNote("Couldn't upload that photo. Please try again.");
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(url) {
    setPhotos((p) => p.filter((x) => x.url !== url));
  }

  const estimate = useMemo(() => {
    if (!sizeId) return null;
    return computeEstimate({
      mediumId,
      sizeId,
      customSize,
      additionalSubjects: extraSubjects,
      backgroundId,
      country: ship.country,
    });
  }, [mediumId, sizeId, customSize, extraSubjects, backgroundId, ship.country]);

  const contactValue = contactMethod === "instagram" ? instagram : email;

  async function submit() {
    setError("");
    if (!sizeId) return setError("Please pick a size.");
    if (isCustom && !customSize.trim()) return setError("Please enter your custom size.");
    if (!request.trim()) return setError("Tell me about your commission in the request box.");
    if (!name.trim()) return setError("Please add your name.");
    if (!contactValue.trim()) {
      return setError(
        contactMethod === "instagram"
          ? "Please add your Instagram handle."
          : "Please add your email."
      );
    }
    if (!ship.line1.trim() || !ship.city.trim() || !ship.state.trim() || !ship.zip.trim()) {
      return setError("Please add your shipping address so I can include shipping.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          instagram,
          contactMethod,
          shipping: ship,
          mediumId,
          sizeId,
          customSize,
          additionalSubjects: extraSubjects,
          backgroundId,
          images: photos.map((p) => p.url),
          request,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone({ waitlisted: data.waitlisted, estimate: data.estimate, isCustom });
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Could not send your request. Please try again or contact us.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Thank-you / confirmation screen ----
  if (done) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
        {done.waitlisted ? (
          <ClipboardList className="h-16 w-16 animate-wiggle text-rose" strokeWidth={1.25} />
        ) : (
          <Mail className="h-16 w-16 animate-wiggle text-rose" strokeWidth={1.25} />
        )}
        <h1 className="section-title mt-6">
          {done.waitlisted ? "You're on the waitlist!" : "Request received!"}
        </h1>
        <p className="mt-4 text-plum/75">
          {done.waitlisted
            ? "I'm currently at full capacity, so you've been added to the waitlist. I'll reach out as soon as a spot opens up — thank you for your patience!"
            : "Thank you so much! I'll read over your request and get back to you soon to confirm the details and final price before any payment."}
        </p>
        <p className="mt-4 text-plum/60">
          {done.isCustom ? (
            <>
              Since you chose a custom size, I&apos;ll quote your price when I
              review the request
              {done.estimate > 0 && (
                <> (plus <span className="font-semibold text-rose">${done.estimate}</span> in add-ons)</>
              )}
              .
            </>
          ) : (
            <>
              Your estimate was{" "}
              <span className="font-semibold text-rose">${done.estimate}</span> (final
              price confirmed after review).
            </>
          )}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/gallery" className="btn-secondary">Browse the gallery</Link>
          <Link href="/" className="btn-primary">Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="section-title text-center">Request a commission</h1>
      <p className="mt-3 text-center text-plum/70">
        Build your piece below to see an estimate. I&apos;ll review every request
        personally and confirm the final price before you pay.
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* ---------- BUILDER ---------- */}
        <div className="space-y-8">
          {/* MEDIUM + SIZE */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">1. Choose your size</h2>

            {/* medium toggle */}
            <div className="mt-4 inline-flex rounded-full border-2 border-petal bg-white/60 p-1">
              {mediums.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pickMedium(m.id)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
                    mediumId === m.id
                      ? "bg-rose text-white shadow-soft"
                      : "text-grape hover:bg-petal/60"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <p className="mt-3 text-sm text-plum/60">
              Each size includes one subject (like one pet in a portrait).
            </p>

            {/* size bubbles for the selected medium */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {medium.sizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSizeId(s.id)}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 transition-all ${
                    sizeId === s.id
                      ? "border-rose bg-petal/60 shadow-soft"
                      : "border-petal/50 bg-white/60 hover:border-bubblegum"
                  }`}
                >
                  <span className="font-display text-xl text-grape">{s.name}</span>
                  <span className="mt-1 text-sm font-semibold text-rose">${s.basePrice}</span>
                </button>
              ))}

              {/* custom size bubble (if this medium allows it) */}
              {medium.allowCustom && (
                <button
                  onClick={() => setSizeId("custom")}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 transition-all ${
                    isCustom
                      ? "border-rose bg-petal/60 shadow-soft"
                      : "border-bubblegum/70 bg-white/60 hover:border-bubblegum"
                  }`}
                >
                  <span className="font-display text-xl text-grape">Custom size</span>
                  <span className="mt-1 text-sm font-semibold text-rose">quoted</span>
                </button>
              )}
            </div>

            {/* custom size input */}
            {isCustom && (
              <div className="mt-4">
                <label className="mb-1 block text-sm font-semibold text-grape">
                  Your custom size
                </label>
                <input
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  placeholder='e.g., 7" × 9"'
                  className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
                />
                <p className="mt-2 text-xs text-plum/60">
                  I&apos;ll work out the price for your custom size when I review the
                  request.
                </p>
              </div>
            )}
          </div>

          {/* SUBJECTS */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">2. How many subjects?</h2>
            <p className="mt-1 text-sm text-plum/60">
              One subject is included. Each additional subject is +${pricing.additionalSubject}.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => setExtraSubjects((n) => Math.max(0, n - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-bubblegum text-grape hover:bg-petal"
                aria-label="Remove a subject"
              >
                <Minus className="h-5 w-5" />
              </button>
              <div className="text-center">
                <div className="font-display text-3xl text-grape">{1 + extraSubjects}</div>
                <div className="text-xs text-plum/60">
                  total subject{extraSubjects > 0 ? "s" : ""}
                </div>
              </div>
              <button
                onClick={() => setExtraSubjects((n) => Math.min(20, n + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-bubblegum text-grape hover:bg-petal"
                aria-label="Add a subject"
              >
                <Plus className="h-5 w-5" />
              </button>
              {extraSubjects > 0 && (
                <span className="ml-2 text-sm font-semibold text-rose">
                  +${extraSubjects * pricing.additionalSubject}
                </span>
              )}
            </div>
          </div>

          {/* BACKGROUND */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">3. Background</h2>
            <p className="mt-1 text-sm text-plum/60">
              Simple backgrounds are free. A complex scene is +${pricing.complexBackground}.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {backgrounds.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBackgroundId(b.id)}
                  className={`flex flex-col items-center rounded-2xl border-2 p-3 text-center transition-all ${
                    backgroundId === b.id
                      ? "border-rose bg-petal/60 shadow-soft"
                      : "border-petal/50 bg-white/60 hover:border-bubblegum"
                  }`}
                >
                  <span className="font-semibold text-grape">{b.name}</span>
                  <span className="mt-1 text-xs font-semibold text-rose">
                    {b.price > 0 ? `+$${b.price}` : "free"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* PET PHOTOS */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">4. Reference photos</h2>
            <p className="mt-1 text-sm text-plum/60">
              Upload clear photos of your pet, person, or any reference/inspo
              images so I can capture it just right. Optional — up to 8.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {photos.map((p) => (
                <div
                  key={p.url}
                  className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-petal"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.url)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-grape shadow"
                    aria-label="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {photos.length < 8 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-bubblegum text-grape transition hover:bg-petal disabled:opacity-60"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs font-semibold">
                    {uploading ? "Uploading…" : "Add photo"}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onFiles}
              className="hidden"
            />
            {uploadNote && <p className="mt-2 text-xs font-semibold text-rose">{uploadNote}</p>}
          </div>

          {/* REQUEST */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">5. Describe your commission</h2>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={5}
              placeholder="Tell me everything! What/who would you like drawn, colors, style, reference photos you'll send, the vibe, deadline... the more detail the better"
              className="mt-4 w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-4 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
            />
            <p className="mt-2 text-sm text-plum/60">
              Have a question first?{" "}
              <Link href="/contact" className="font-semibold text-rose underline">
                Message me here
              </Link>{" "}
              — happy to chat before you request!
            </p>
          </div>

          {/* SHIPPING ADDRESS */}
          <div className="card">
            <h2 className="font-display text-2xl text-grape">6. Shipping address</h2>
            <p className="mt-1 text-sm text-plum/60">
              Where should I ship your finished piece? Shipping is added to your
              estimate.
            </p>
            <div className="mt-4 space-y-3">
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
            </div>
          </div>
        </div>

        {/* ---------- ESTIMATE SUMMARY ---------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card border-2 border-bubblegum/60">
            <h2 className="flex items-center gap-2 font-display text-2xl text-grape">
              Your estimate <Heart className="h-5 w-5" strokeWidth={1.75} />
            </h2>

            {!estimate ? (
              <p className="mt-4 text-sm text-plum/60">
                Pick a size to see your estimate.
              </p>
            ) : (
              <>
                <dl className="mt-4 space-y-2 text-sm">
                  {estimate.lines.map((l, i) => (
                    <div key={i} className="flex justify-between gap-3">
                      <dt className="text-plum/70">{l.label}</dt>
                      <dd className="font-semibold text-plum">
                        {l.amount === null ? "quoted" : `$${l.amount}`}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 border-t border-petal pt-4">
                  {estimate.isCustom ? (
                    <div className="text-right">
                      <span className="font-display text-2xl text-rose">
                        Price quoted at review
                      </span>
                      {estimate.extras > 0 && (
                        <p className="text-sm text-plum/70">
                          + ${estimate.extras} in add-ons
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-end justify-between">
                      <span className="text-plum/70">Estimated total</span>
                      <span className="font-display text-3xl text-rose">${estimate.total}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="mt-4 flex gap-2 rounded-2xl bg-lilac/50 p-3 text-xs text-plum/75">
              <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose" strokeWidth={2} />
              <span>
                This is an <strong>estimate</strong>. I review every request and
                confirm the final price with you before any payment — no surprises.
              </span>
            </div>

            {/* contact fields */}
            <div className="mt-5 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
              />

              <div>
                <p className="mb-1 text-sm font-semibold text-grape">
                  How should I reach you?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "instagram", label: "Instagram" },
                    { id: "email", label: "Email" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setContactMethod(m.id)}
                      className={`rounded-2xl border-2 py-2 text-sm font-semibold transition-all ${
                        contactMethod === m.id
                          ? "border-rose bg-petal/60 text-grape shadow-soft"
                          : "border-petal/60 bg-white/60 text-plum/70 hover:border-bubblegum"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {contactMethod === "instagram" && (
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@yourhandle"
                  className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
                />
              )}
              {contactMethod === "email" && (
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Your email"
                  className="w-full rounded-2xl border-2 border-petal/60 bg-white/70 p-3 text-plum placeholder:text-plum/40 focus:border-rose focus:outline-none"
                />
              )}
              <p className="text-xs text-plum/60">
                P.S. Follow{" "}
                <a
                  href={site.socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-rose underline"
                >
                  @__vivian__n
                </a>{" "}
                on Instagram — DMs are the easiest way for me to chat with you
                about your commission!
              </p>
            </div>

            {error && <p className="mt-3 text-sm font-semibold text-rose">{error}</p>}

            <button
              onClick={submit}
              disabled={loading}
              className="btn-primary mt-5 w-full disabled:opacity-60"
            >
              {loading ? (
                "Sending your request…"
              ) : (
                <>
                  <Mail className="h-4 w-4" /> Send commission request
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-plum/60">
              No payment now. I&apos;ll reply with a secure payment link once your
              details are confirmed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
