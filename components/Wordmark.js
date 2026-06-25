// The "Visuals by Vivian" wordmark, with a different font per word:
//   Visuals → Coldia (Great Vibes stand-in)   by → Times New Roman
//   Vivian  → Advercase (EB Garamond stand-in)
// Pass a size via className (e.g. "text-2xl" or "text-6xl").
export default function Wordmark({ className = "" }) {
  return (
    <span className={`inline-flex items-baseline gap-[0.2em] ${className}`}>
      <span className="font-coldia text-grape">Visuals</span>
      <span
        className="italic text-plum/70 text-[0.6em]"
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        by
      </span>
      <span className="font-display text-rose">Vivian</span>
    </span>
  );
}
