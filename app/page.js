import Link from "next/link";
import { Sparkles, Flower2, Heart, PawPrint, Users, Mountain, ArrowRight, Frame, Printer, Sticker } from "lucide-react";
import { site, mediums, pricing } from "@/lib/config";
import Wordmark from "@/components/Wordmark";

const allSizes = mediums.flatMap((m) => m.sizes);
const startingPrice = Math.min(...allSizes.map((s) => s.basePrice));
const mediumNames = mediums.map((m) => m.name).join(" or ");

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-petal px-4 py-1 text-sm font-semibold text-grape">
              commissions are open
              <Heart className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <h1 className="mt-5">
              <Wordmark stacked className="text-6xl md:text-7xl" />
            </h1>
            <p className="mt-5 max-w-md text-lg text-plum/80">{site.tagline}</p>
            <p className="mt-2 max-w-md text-plum/70">
              Custom artwork made just for you — pick your style, your size, and
              the details. Let&apos;s create something adorable together!
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/commissions" className="btn-primary">
                <Sparkles className="h-4 w-4" /> Order a commission
              </Link>
              <Link href="/gallery" className="btn-secondary">
                See the gallery
              </Link>
            </div>
          </div>

          {/* floating blob art */}
          <div className="relative flex justify-center">
            <div className="absolute -z-10 h-72 w-72 animate-float rounded-blob bg-gradient-to-br from-bubblegum to-lavender opacity-70 blur-2xl" />
            <div className="animate-float rounded-blob bg-gradient-to-br from-petal to-lilac p-2 shadow-soft">
              <div className="flex h-72 w-72 items-center justify-center rounded-blob bg-white/60">
                <Flower2 className="h-28 w-28 animate-wiggle text-rose" strokeWidth={1.25} />
              </div>
            </div>
            <Sparkles className="absolute -top-2 left-4 h-8 w-8 animate-sparkle text-grape" strokeWidth={1.5} />
            <Heart className="absolute bottom-6 right-2 h-6 w-6 animate-sparkle text-rose" strokeWidth={1.5} />
          </div>
        </div>
      </section>

      {/* WHAT I MAKE / PRICING */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="section-title text-center">Commissions</h2>
        <p className="mt-3 text-center text-plum/70">
          Custom pet portraits and more — pick your canvas size, add subjects,
          and tell me your idea. Pieces start at ${startingPrice}.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { Icon: PawPrint, t: "Pick your size", d: `Choose ${mediumNames} in a range of sizes — each includes one subject.` },
            { Icon: Users, t: "Add subjects", d: `Want more than one pet or person? Each extra subject is just +$${pricing.additionalSubject}.` },
            { Icon: Mountain, t: "Custom scenery", d: `Add a complex background or landscape for +$${pricing.complexBackground}.` },
          ].map((c) => (
            <div key={c.t} className="card text-center transition-transform hover:-translate-y-1">
              <c.Icon className="mx-auto h-10 w-10 text-rose" strokeWidth={1.5} />
              <h3 className="mt-3 font-display text-2xl text-grape">{c.t}</h3>
              <p className="mt-2 text-sm text-plum/70">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/commissions" className="btn-primary">
            Request a commission <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* BUY MY ARTWORK */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="section-title text-center">Buy my artwork</h2>
        <p className="mt-3 text-center text-plum/70">
          Collectible mini originals now — prints and stickers coming soon!
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {/* ACEOs — available */}
          <div className="card flex flex-col items-center text-center transition-transform hover:-translate-y-1">
            <Frame className="h-10 w-10 text-rose" strokeWidth={1.5} />
            <h3 className="mt-3 font-display text-2xl text-grape">ACEOs</h3>
            <p className="mt-2 text-sm text-plum/70">
              Hand-painted 2.5&quot; × 3.5&quot; art cards — tiny, collectible
              originals.
            </p>
            <Link href="/contact" className="btn-primary mt-4 !py-2 text-sm">
              Inquire to buy
            </Link>
          </div>

          {/* Prints — coming soon */}
          <div className="card relative flex flex-col items-center text-center opacity-90">
            <span className="absolute right-3 top-3 rounded-full bg-lilac px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-grape">
              Available soon
            </span>
            <Printer className="h-10 w-10 text-bubblegum" strokeWidth={1.5} />
            <h3 className="mt-3 font-display text-2xl text-grape">Prints</h3>
            <p className="mt-2 text-sm text-plum/70">
              High-quality prints of favorite pieces for your walls.
            </p>
            <span className="mt-4 rounded-full border-2 border-petal px-4 py-2 text-sm font-semibold text-plum/50">
              Coming soon
            </span>
          </div>

          {/* Stickers — coming soon */}
          <div className="card relative flex flex-col items-center text-center opacity-90">
            <span className="absolute right-3 top-3 rounded-full bg-lilac px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-grape">
              Available soon
            </span>
            <Sticker className="h-10 w-10 text-bubblegum" strokeWidth={1.5} />
            <h3 className="mt-3 font-display text-2xl text-grape">Stickers</h3>
            <p className="mt-2 text-sm text-plum/70">
              Cute weatherproof stickers of my art — perfect for anything.
            </p>
            <span className="mt-4 rounded-full border-2 border-petal px-4 py-2 text-sm font-semibold text-plum/50">
              Coming soon
            </span>
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link href="/gallery" className="btn-secondary">
            Browse the gallery
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="section-title text-center">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { n: "1", t: "Send a request", d: "Pick your canvas size and subjects, describe your idea, and see an instant estimate." },
            { n: "2", t: "I confirm & you pay", d: "I review your request, confirm the final price, and send you a secure Stripe payment link." },
            { n: "3", t: "Receive your art", d: "I'll create your piece with love and send it your way. Yay!" },
          ].map((s) => (
            <div key={s.n} className="card text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose to-grape font-display text-xl text-white">
                {s.n}
              </div>
              <h3 className="mt-4 font-display text-2xl text-grape">{s.t}</h3>
              <p className="mt-2 text-sm text-plum/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
