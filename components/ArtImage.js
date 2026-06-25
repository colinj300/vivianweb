"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, Flower2 } from "lucide-react";

// Shows a piece of artwork at its true canvas proportions (via w/h) inside a
// cute matted floral frame, with a little striped name plaque underneath. A
// gradient placeholder fills the same shape until the real image loads (and
// stays if the file is missing), so the layout always looks finished.
const gradients = [
  "from-bubblegum to-lavender",
  "from-rose to-grape",
  "from-lavender to-bubblegum",
  "from-grape to-rose",
  "from-bubblegum to-rose",
  "from-rose to-lavender",
];

// Corner flowers (color + rotation) for the floral frame.
const corners = [
  { pos: "-left-2 -top-2", color: "text-rose", rot: "-rotate-12" },
  { pos: "-right-2 -top-2", color: "text-grape", rot: "rotate-12" },
  { pos: "-left-2 -bottom-2", color: "text-lavender", rot: "rotate-45" },
  { pos: "-right-2 -bottom-2", color: "text-bubblegum", rot: "-rotate-45" },
];

export default function ArtImage({ src, title, size, note, w = 1, h = 1, index = 0 }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  const grad = gradients[index % gradients.length];

  // If the image was already cached, its `load` event can fire before React
  // attaches the onLoad handler, so check `complete` right after mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <figure className="flex flex-col items-center">
      <div className="relative w-full">
        {/* matted floral frame */}
        <div className="rounded-2xl border-2 border-petal bg-white p-[3%] shadow-soft">
          <div
            className="relative overflow-hidden rounded-xl border border-lavender/70"
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
        </div>

        {/* corner flowers */}
        {corners.map((c) => (
          <Flower2
            key={c.pos}
            className={`absolute ${c.pos} ${c.color} ${c.rot} h-5 w-5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]`}
            strokeWidth={1.75}
          />
        ))}
      </div>

      {/* striped name plaque */}
      <figcaption className="plaque z-10 -mt-3 max-w-[92%]">
        <span className="block font-plaque text-base leading-tight text-plum">{title}</span>
        {(size || note) && (
          <span className="block font-plaque text-xs text-grape">{size || note}</span>
        )}
      </figcaption>
    </figure>
  );
}
