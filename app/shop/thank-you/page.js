"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PartyPopper } from "lucide-react";

export default function ShopThankYou() {
  const [state, setState] = useState("loading"); // loading | ok | error
  const [title, setTitle] = useState("");

  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get("session_id");
    if (!sid) {
      setState("ok");
      return;
    }
    fetch(`/api/shop/confirm?session_id=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then((d) => {
        setTitle(d.title || "");
        setState(d.ok ? "ok" : "error");
      })
      .catch(() => setState("error"));
  }, []);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
      <PartyPopper className="h-16 w-16 animate-wiggle text-rose" strokeWidth={1.25} />
      <h1 className="section-title mt-6">Thank you!</h1>
      <p className="mt-4 text-plum/75">
        {state === "loading"
          ? "Confirming your order…"
          : state === "error"
          ? "Your payment may still be processing — if you were charged, your order is safe and Vivian will be in touch."
          : `Your ACEO${title ? ` "${title}"` : ""} is on its way! I'll pack it up with care and ship it out. ♥`}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/shop" className="btn-secondary">
          Back to the shop
        </Link>
        <Link href="/" className="btn-primary">
          Home
        </Link>
      </div>
    </div>
  );
}
