"use client";

import { useState } from "react";
import { Palette } from "lucide-react";

// Shows the artwork if the image file exists in /public/art.
// If it's missing (e.g. before real art is uploaded), it falls back to a
// cute gradient placeholder so the layout always looks finished.
const gradients = [
  "from-petal to-lavender",
  "from-bubblegum to-lilac",
  "from-rose to-grape",
  "from-lilac to-petal",
  "from-lavender to-bubblegum",
  "from-petal to-rose",
];

export default function ArtImage({ src, title, note, index = 0 }) {
  const [errored, setErrored] = useState(false);
  const grad = gradients[index % gradients.length];

  return (
    <figure className="group relative overflow-hidden rounded-3xl shadow-soft border border-white/60">
      {!errored && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          onError={() => setErrored(true)}
          className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div
          className={`flex h-64 w-full items-center justify-center bg-gradient-to-br ${grad}`}
        >
          <Palette className="h-12 w-12 animate-float text-white/85" strokeWidth={1.5} />
        </div>
      )}

      <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-plum/70 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="font-display text-lg text-white">{title}</p>
        {note && <p className="text-sm text-white/85">{note}</p>}
      </figcaption>
    </figure>
  );
}
