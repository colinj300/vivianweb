import Link from "next/link";
import { Sparkles, Flower2, Heart, PawPrint, Users, Mountain, ArrowRight } from "lucide-react";
import { site, canvasSizes, pricing, gallery } from "@/lib/config";
import ArtImage from "@/components/ArtImage";

const startingPrice = Math.min(...canvasSizes.map((s) => s.basePrice));

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
            <h1 className="mt-5 font-display text-5xl leading-tight text-grape md:text-6xl">
              {site.artistName}&apos;s
              <br />
              <span className="text-rose">little art shop</span>
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
            { Icon: PawPrint, t: "Pick your size", d: `Choose from ${canvasSizes[0].name} up to ${canvasSizes[canvasSizes.length - 1].name}. Each size includes one subject.` },
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

      {/* GALLERY PREVIEW */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="section-title text-center">Recent work</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.slice(0, 6).map((art, i) => (
            <ArtImage key={i} {...art} index={i} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/gallery" className="btn-secondary">
            View full gallery
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
