"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Flower2 } from "lucide-react";
import { site } from "@/lib/config";

const links = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-petal/60">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-2xl text-rose hover:text-grape transition-colors">
          <span className="inline-flex items-center gap-1.5">
            {site.brand}
            <Flower2 className="h-5 w-5 animate-sparkle" strokeWidth={1.75} />
          </span>
        </Link>

        {/* desktop */}
        <ul className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="font-semibold text-plum/80 hover:text-rose transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/commissions" className="btn-primary !px-5 !py-2 text-sm">
              Order now
            </Link>
          </li>
        </ul>

        {/* mobile toggle */}
        <button
          className="md:hidden text-2xl text-grape"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* mobile menu */}
      {open && (
        <ul className="md:hidden flex flex-col gap-1 px-5 pb-4">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-2 font-semibold text-plum/80 hover:bg-petal"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="pt-1">
            <Link
              href="/commissions"
              onClick={() => setOpen(false)}
              className="btn-primary w-full !py-2 text-sm"
            >
              Order now
            </Link>
          </li>
        </ul>
      )}
    </header>
  );
}
