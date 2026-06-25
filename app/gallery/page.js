import Link from "next/link";
import { Sparkles } from "lucide-react";
import { gallery } from "@/lib/config";
import ArtImage from "@/components/ArtImage";

export const metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="section-title text-center">Gallery</h1>
      <p className="mt-3 text-center text-plum/70">
        A little collection of pieces I&apos;ve made.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((art, i) => (
          <ArtImage key={i} {...art} index={i} />
        ))}
      </div>

      <div className="mt-14 text-center">
        <p className="text-plum/70">Love what you see?</p>
        <Link href="/commissions" className="btn-primary mt-4">
          <Sparkles className="h-4 w-4" /> Commission your own
        </Link>
      </div>
    </div>
  );
}
