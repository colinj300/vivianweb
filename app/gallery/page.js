import Link from "next/link";
import { Sparkles } from "lucide-react";
import { gallery } from "@/lib/config";
import ArtImage from "@/components/ArtImage";

export const metadata = { title: "Gallery" };

// Each piece's height (in viewport-height units) by canvas size, so bigger
// canvases hang bigger on the wall. Width follows the real aspect ratio.
const tierH = { tiny: 13, small: 19, medium: 23, large: 29 };

// Staggered vertical offsets so pieces sit at alternating levels, like a
// real gallery wall instead of a tidy grid.
const offsets = [
  "translate-y-0",
  "translate-y-[7vh]",
  "-translate-y-[6vh]",
  "translate-y-[4vh]",
  "-translate-y-[8vh]",
  "translate-y-[5vh]",
];

export default function GalleryPage() {
  return (
    <div className="flex min-h-[calc(100vh-68px)] flex-col px-4">
      <div className="pt-6 text-center">
        <h1 className="section-title">Gallery</h1>
        <p className="mt-1 text-sm text-plum/70">
          A little exhibition of pieces I&apos;ve made.
        </p>
      </div>

      {/* the wall */}
      <div className="flex flex-1 flex-wrap content-center items-center justify-center gap-x-7 gap-y-0 py-4">
        {gallery.map((art, i) => {
          const h = tierH[art.tier] || tierH.medium;
          const widthVh = h * (art.w / art.h);
          return (
            <div
              key={i}
              className={offsets[i % offsets.length]}
              style={{ width: `${widthVh}vh`, maxWidth: "88vw" }}
            >
              <ArtImage {...art} index={i} />
            </div>
          );
        })}
      </div>

      <div className="pb-6 text-center">
        <Link href="/commissions" className="btn-primary">
          <Sparkles className="h-4 w-4" /> Commission your own
        </Link>
      </div>
    </div>
  );
}
