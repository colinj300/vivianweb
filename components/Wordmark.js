// The "Visuals by Vivian" wordmark, with a different font per word:
//   Visuals → Coldia (Great Vibes stand-in)   by → Times New Roman
//   Vivian  → Advercase (EB Garamond stand-in)
//
// Pass a size via className (e.g. "text-2xl"). Set `stacked` for the big
// vertical hero treatment; default is a compact horizontal lockup for the
// nav and footer.
const times = { fontFamily: '"Times New Roman", Times, serif' };

export default function Wordmark({ className = "", stacked = false }) {
  if (stacked) {
    return (
      <span className={`inline-flex flex-col leading-[0.9] ${className}`}>
        <span className="font-coldia text-grape text-[1.45em] leading-none">Visuals</span>
        <span
          style={times}
          className="-mt-[0.45em] ml-[3.2em] text-[0.5em] italic text-plum/60"
        >
          by
        </span>
        <span className="font-display text-rose text-[1.05em] leading-none -mt-[0.3em]">Vivian</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-baseline gap-[0.2em] ${className}`}>
      <span className="font-coldia text-grape">Visuals</span>
      <span style={times} className="text-[0.6em] italic text-plum/70">
        by
      </span>
      <span className="font-display text-rose">Vivian</span>
    </span>
  );
}
