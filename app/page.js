import Link from "next/link";
import { site, commissionTypes, gallery } from "@/lib/config";
import ArtImage from "@/components/ArtImage";

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-block rounded-full bg-petal px-4 py-1 text-sm font-semibold text-grape">
              commissions are open ♡
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
                ✨ Order a commission
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
                <span className="text-7xl animate-wiggle">🌸</span>
              </div>
            </div>
            <span className="absolute -top-2 left-4 text-3xl animate-sparkle">✨</span>
            <span className="absolute bottom-6 right-2 text-2xl animate-sparkle">💜</span>
          </div>
        </div>
      </section>

      {/* COMMISSION TYPES */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="section-title text-center">What I can make for you</h2>
        <p className="mt-3 text-center text-plum/70">
          Pick a style — then customize everything on the order page.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {commissionTypes.map((t) => (
            <div key={t.id} className="card text-center transition-transform hover:-translate-y-1">
              <div className="text-4xl">{t.emoji}</div>
              <h3 className="mt-3 font-display text-2xl text-grape">{t.name}</h3>
              <p className="mt-2 text-sm text-plum/70">{t.blurb}</p>
              <p className="mt-4 font-semibold text-rose">from ${t.basePrice}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/commissions" className="btn-primary">
            Start your custom order →
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
            { n: "1", t: "Customize", d: "Choose your art style, canvas size, and any extras on the commission page." },
            { n: "2", t: "Chat & checkout", d: "Have questions first? Message me anytime. When you're ready, pay securely with Stripe." },
            { n: "3", t: "Receive your art", d: "I'll create your piece with love and send it your way. Yay! 🎉" },
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
