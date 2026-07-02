import Link from "next/link";
import { Flower2, Heart } from "lucide-react";
import { site } from "@/lib/config";
import Wordmark from "@/components/Wordmark";
import SocialLinks from "@/components/SocialLinks";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-petal/60 bg-white/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5 py-10 text-center">
        <p className="flex items-center justify-center gap-1.5">
          <Wordmark className="text-2xl" />
          <Flower2 className="h-5 w-5 text-rose" strokeWidth={1.75} />
        </p>
        <p className="mt-2 text-plum/70">{site.tagline}</p>

        <SocialLinks className="mt-5 justify-center" size={11} />

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-plum/60">
          <Link href="/gallery" className="hover:text-rose">Gallery</Link>
          <Link href="/commissions" className="hover:text-rose">Commissions</Link>
          <Link href="/reviews" className="hover:text-rose">Reviews</Link>
          <Link href="/about" className="hover:text-rose">About</Link>
          <Link href="/contact" className="hover:text-rose">Contact</Link>
        </div>

        <p className="mt-6 text-xs text-plum/50">
          © {new Date().getFullYear()} {site.brand}. Made with{" "}
          <Heart className="inline-block h-3.5 w-3.5 align-[-2px]" strokeWidth={2} />
        </p>
      </div>
    </footer>
  );
}
