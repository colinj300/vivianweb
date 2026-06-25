"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";

// Shows a piece of artwork at its true canvas proportions (via w/h) with a
// little striped name plaque underneath. A cute gradient placeholder fills
// the same shape until the real image loads (and stays if the file is
// missing), so the layout always looks finished.
const gradients = [
  "from-bubblegum to-lavender",
  "from-rose to-grape",
  "from-lavender to-bubblegum",
  "from-grape to-rose",
  "from-bubblegum to-rose",
  "from-rose to-lavender",
];

export default function ArtImage({ src, title, size, note, w = 1, h = 1, index = 0 }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  const grad = gradients[index % gradients.length];

  // If the image was already cached, its `load` event can fire before React
  // attaches the onLoad handler, so check `complete` right after mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <figure className="flex flex-col items-center">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-white/60 shadow-soft"
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        {/* placeholder (behind the image; hidden once the image loads) */}
        {!loaded && (
          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${grad}`}>
            <Palette className="h-12 w-12 text-white/90" strokeWidth={1.5} />
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
            className={`h-full w-full object-cover transition-opacity duration-500 hover:scale-105 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>

      {/* striped name plaque */}
      <figcaption className="plaque z-10 -mt-4 max-w-[88%]">
        <span className="block font-plaque text-xl leading-tight text-plum">{title}</span>
        {(size || note) && (
          <span className="block font-plaque text-sm text-grape">{size || note}</span>
        )}
      </figcaption>
    </figure>
  );
}
