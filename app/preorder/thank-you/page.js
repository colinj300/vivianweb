"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { PartyPopper } from "lucide-react";

function ThankYouInner() {
  const [state, setState] = useState("loading"); // loading | ok | error
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get("session_id");
    if (!sid) return setState("error");
    fetch(`/api/preorder/confirm?session_id=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.paid) {
          setInfo(d);
          setState("ok");
        } else setState("error");
      })
      .catch(() => setState("error"));
  }, []);

  if (state === "loading") {
    return <p className="mx-auto max-w-md px-5 py-24 text-center text-plum/60">Confirming your pre-order…</p>;
  }
  if (state === "error") {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="section-title">Hmm, something went off</h1>
        <p className="mt-3 text-plum/70">
          If you were charged, don&apos;t worry — your pre-order is safe. Reach out and
          I&apos;ll confirm it for you.
        </p>
        <Link href="/preorder" className="btn-primary mt-6">Back to the pre-order</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
      <PartyPopper className="h-16 w-16 text-rose" strokeWidth={1.5} />
      <h1 className="section-title mt-6">Pre-order confirmed!</h1>
      <p className="mt-4 text-plum/75">
        Thank you for pre-ordering{info?.quantity > 1 ? ` ${info.quantity} sheets of` : ""}{" "}
        <strong>{info?.title}</strong>! A confirmation is on its way to your email.
      </p>
      <p className="mt-2 text-sm text-plum/60">
        It ships once we hit our goal — and if we don&apos;t, you&apos;ll be fully refunded. 💜
      </p>
      <Link href="/preorder" className="btn-primary mt-6">See the pre-order progress</Link>
    </div>
  );
}

export default function PreorderThankYou() {
  return (
    <Suspense fallback={<p className="px-5 py-24 text-center text-plum/60">Loading…</p>}>
      <ThankYouInner />
    </Suspense>
  );
}
