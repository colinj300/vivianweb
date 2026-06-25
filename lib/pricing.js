import { canvasSizes, pricing } from "@/lib/config";

// Single source of truth for the estimate. Used by the commission form
// (to show the live total) and by the server (to record the estimate).
export function computeEstimate({ sizeId, additionalSubjects = 0, complexBackground = false }) {
  const size = canvasSizes.find((s) => s.id === sizeId);
  if (!size) return null;

  const subjects = Math.max(0, Number(additionalSubjects) || 0);
  let total = size.basePrice;
  total += subjects * pricing.additionalSubject;
  if (complexBackground) total += pricing.complexBackground;

  const lines = [
    { label: `${size.name} (includes 1 subject)`, amount: size.basePrice },
  ];
  if (subjects > 0) {
    lines.push({
      label: `${subjects} extra subject${subjects > 1 ? "s" : ""}`,
      amount: subjects * pricing.additionalSubject,
    });
  }
  if (complexBackground) {
    lines.push({ label: "Complex background / scenery", amount: pricing.complexBackground });
  }

  return { total, size, subjects, complexBackground: !!complexBackground, lines };
}
