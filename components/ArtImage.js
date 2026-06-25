"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";

// Shows a piece of artwork at its true canvas proportions (via w/h) wreathed
// in a floral border (stemless blossoms with the occasional leaf), with a
// striped name plaque underneath. A gradient placeholder fills the same shape
// until the real image loads, so the layout always looks finished.
const gradients = [
  "from-bubblegum to-lavender",
  "from-rose to-grape",
  "from-lavender to-bubblegum",
  "from-grape to-rose",
  "from-bubblegum to-rose",
  "from-rose to-lavender",
];

const petalColors = ["text-rose", "text-bubblegum", "text-grape", "text-lavender"];

// A stemless 5-petal blossom.
function Blossom({ idx = 0, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} ${petalColors[idx % petalColors.length]} drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]`}
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5.8" r="3.5" />
      <circle cx="18.3" cy="10.4" r="3.5" />
      <circle cx="15.9" cy="17.8" r="3.5" />
      <circle cx="8.1" cy="17.8" r="3.5" />
      <circle cx="5.7" cy="10.4" r="3.5" />
      <circle cx="12" cy="11.6" r="2.7" fill="#fff7e6" />
    </svg>
  );
}

// An occasional leaf (kept in-palette).
function Leaf({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} text-lavender drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]`}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 21C6.6 16.4 6.6 8.6 12 3.6C17.4 8.6 17.4 16.4 12 21Z" />
    </svg>
  );
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Builds a row/column of blossoms with a leaf every 3rd spot.
function Garland({ n, offset, vertical }) {
  return (
    <div
      className={`pointer-events-none absolute flex ${
        vertical
          ? "inset-y-[9%] left-0 -translate-x-1/2 flex-col"
          : "inset-x-0 top-0 -translate-y-1/2"
      } items-center justify-between`}
    >
      {Array.from({ length: n }).map((_, i) =>
        (i + offset) % 3 === 2 ? (
          <Leaf key={i} className="h-4 w-4 shrink-0" />
        ) : (
          <Blossom key={i} idx={i + offset} className="h-4 w-4 shrink-0" />
        )
      )}
    </div>
  );
}

function FloralBorder({ w, h }) {
  const ar = w / h;
  const topN = clamp(Math.round(3.2 * ar) + 1, 3, 13);
  const sideN = clamp(Math.round(3.2 / ar), 2, 12);
  return (
    <>
      {/* top */}
      <Garland n={topN} offset={0} />
      {/* bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-1/2 items-center justify-between">
        {Array.from({ length: topN }).map((_, i) =>
          (i + 1) % 3 === 2 ? (
            <Leaf key={i} className="h-4 w-4 shrink-0" />
          ) : (
            <Blossom key={i} idx={i + 2} className="h-4 w-4 shrink-0" />
          )
        )}
      </div>
      {/* left */}
      <Garland n={sideN} offset={1} vertical />
      {/* right */}
      <div className="pointer-events-none absolute inset-y-[9%] right-0 flex translate-x-1/2 flex-col items-center justify-between">
        {Array.from({ length: sideN }).map((_, i) =>
          (i + 2) % 3 === 2 ? (
            <Leaf key={i} className="h-4 w-4 shrink-0" />
          ) : (
            <Blossom key={i} idx={i + 3} className="h-4 w-4 shrink-0" />
          )
        )}
      </div>
    </>
  );
}

export default function ArtImage({ src, title, size, note, w = 1, h = 1, index = 0 }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  const grad = gradients[index % gradients.length];

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <figure className="flex flex-col items-center">
      <div className="relative w-[88%]">
        {/* the painting */}
        <div
          className="relative overflow-hidden rounded-lg border-4 border-white bg-white shadow-soft"
          style={{ aspectRatio: `${w} / ${h}` }}
        >
          {!loaded && (
            <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${grad}`}>
              <Palette className="h-10 w-10 text-white/90" strokeWidth={1.5} />
            </div>
          )}
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={src}
              alt={title}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(false)}
              className={`h-full w-full object-cover transition-opacity duration-500 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </div>

        {/* floral wreath around the painting */}
        <FloralBorder w={w} h={h} />
      </div>

      {/* striped name plaque */}
      <figcaption className="plaque z-10 mt-1 max-w-[92%]">
        <span className="block font-plaque text-base leading-tight text-plum">{title}</span>
        {(size || note) && (
          <span className="block font-plaque text-xs text-grape">{size || note}</span>
        )}
      </figcaption>
    </figure>
  );
}
