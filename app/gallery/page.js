import Link from "next/link";
import { Sparkles } from "lucide-react";
import { gallery } from "@/lib/config";
import ArtImage from "@/components/ArtImage";

export const metadata = { title: "Gallery" };

// How much space each piece takes — bigger canvases show bigger.
const tierSpan = {
  tiny: "col-span-1 sm:col-span-1 lg:col-span-1",
  small: "col-span-2 sm:col-span-2 lg:col-span-2",
  medium: "col-span-2 sm:col-span-2 lg:col-span-3",
  large: "col-span-2 sm:col-span-4 lg:col-span-6",
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="section-title text-center">Gallery</h1>
      <p className="mt-3 text-center text-plum/70">
        A little collection of pieces I&apos;ve made.
      </p>

      <div className="mt-12 grid grid-cols-2 items-start gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-6 [grid-auto-flow:dense]">
        {gallery.map((art, i) => (
          <div key={i} className={tierSpan[art.tier] || tierSpan.medium}>
            <ArtImage {...art} index={i} />
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-plum/70">Love what you see?</p>
        <Link href="/commissions" className="btn-primary mt-4">
          <Sparkles className="h-4 w-4" /> Commission your own
        </Link>
      </div>
    </div>
  );
}
