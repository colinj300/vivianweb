import Link from "next/link";
import { Palette, Sparkles, Heart } from "lucide-react";
import { site } from "@/lib/config";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <div className="grid items-center gap-10 md:grid-cols-[1fr_1.4fr]">
        <div className="relative flex justify-center">
          <div className="animate-float rounded-blob bg-gradient-to-br from-petal to-lilac p-2 shadow-soft">
            <div className="flex h-56 w-56 items-center justify-center rounded-blob bg-white/60">
              <Palette className="h-24 w-24 text-rose" strokeWidth={1.25} />
            </div>
          </div>
          <Sparkles className="absolute -top-2 right-6 h-7 w-7 animate-sparkle text-grape" strokeWidth={1.5} />
        </div>

        <div>
          <h1 className="section-title">Hi, I&apos;m {site.artistName}!</h1>
          <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-plum/80">
            {site.bio}
          </p>
          <Link href="/commissions" className="btn-primary mt-8">
            Let&apos;s make something <Heart className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
