import { Palette, Sparkles } from "lucide-react";
import { site } from "@/lib/config";
import SocialLinks from "@/components/SocialLinks";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-20">
      <div className="grid items-center gap-10 md:grid-cols-[1fr_1.2fr]">
        <div className="relative flex justify-center">
          <div className="animate-float rounded-blob bg-gradient-to-br from-petal to-lilac p-2 shadow-soft">
            <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-blob bg-white/60">
              {site.portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.portrait} alt={site.artistName} className="h-full w-full object-cover" />
              ) : (
                <Palette className="h-24 w-24 text-rose" strokeWidth={1.25} />
              )}
            </div>
          </div>
          <Sparkles className="absolute -top-2 right-6 h-7 w-7 animate-sparkle text-grape" strokeWidth={1.5} />
        </div>

        <div className="text-center md:text-left">
          <h1 className="section-title">Hi, I&apos;m {site.artistName}!</h1>
          <p className="mt-4 text-lg text-plum/70">Come say hi and follow along ♥</p>
          <SocialLinks className="mt-6 justify-center md:justify-start" size={15} />
        </div>
      </div>
    </div>
  );
}
