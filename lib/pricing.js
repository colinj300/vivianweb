import { mediums, pricing, backgrounds, shipping } from "@/lib/config";

const DOMESTIC = [
  "",
  "us",
  "usa",
  "u.s.",
  "u.s.a.",
  "united states",
  "united states of america",
  "america",
];

export function isDomestic(country) {
  return DOMESTIC.includes((country || "").trim().toLowerCase());
}

// Flat shipping estimate from the destination + piece size.
export function computeShipping({ sizeLabel, country }) {
  const base = isDomestic(country) ? shipping.domestic : shipping.international;
  const nums = (sizeLabel || "").match(/\d+(\.\d+)?/g);
  const maxInch = nums ? Math.max(...nums.map(Number)) : 0;
  const big = maxInch >= shipping.largeOverInches;
  return base + (big ? shipping.largeSurcharge : 0);
}

// Look up a size (and its medium) by size id, across all mediums.
export function findSize(sizeId) {
  for (const m of mediums) {
    const s = m.sizes.find((x) => x.id === sizeId);
    if (s) return { medium: m, size: s };
  }
  return null;
}

// Single source of truth for the estimate. Used by the commission form
// (to show the live total) and by the server (to record the estimate).
//
// `sizeId` may be the special value "custom" for a custom-size request, in
// which case the base price is quoted later (during review) and only the
// add-ons are summed for the estimate.
export function computeEstimate({
  mediumId,
  sizeId,
  customSize = "",
  additionalSubjects = 0,
  backgroundId = "none",
  country,
}) {
  const medium = mediums.find((m) => m.id === mediumId);
  if (!medium) return null;

  const isCustom = sizeId === "custom";
  let size = null;
  if (isCustom) {
    if (!medium.allowCustom) return null;
  } else {
    size = medium.sizes.find((s) => s.id === sizeId);
    if (!size) return null;
  }

  const background =
    backgrounds.find((b) => b.id === backgroundId) || backgrounds[0];

  const sizeLabelForShip = isCustom ? customSize : size.name;
  const ship = computeShipping({ sizeLabel: sizeLabelForShip, country });

  const subjects = Math.max(0, Number(additionalSubjects) || 0);
  const extras = subjects * pricing.additionalSubject + background.price + ship;
  const base = isCustom ? 0 : size.basePrice;
  const total = base + extras;

  const lines = [];
  if (isCustom) {
    lines.push({
      label: `${medium.name} — custom size (price quoted at review)`,
      amount: null,
    });
  } else {
    lines.push({
      label: `${medium.name} · ${size.name} (includes 1 subject)`,
      amount: size.basePrice,
    });
  }
  if (subjects > 0) {
    lines.push({
      label: `${subjects} extra subject${subjects > 1 ? "s" : ""}`,
      amount: subjects * pricing.additionalSubject,
    });
  }
  if (background.price > 0) {
    lines.push({ label: background.name, amount: background.price });
  } else if (background.id !== "none") {
    lines.push({ label: `${background.name} background`, amount: 0 });
  }
  lines.push({
    label: `Shipping (${isDomestic(country) ? "US" : "international"})`,
    amount: ship,
  });

  // A human label for the chosen size (used in records / notifications).
  const sizeLabel = isCustom
    ? `Custom: ${customSize || "(size TBD)"}`
    : size.name;

  return {
    total,
    extras,
    shipping: ship,
    isCustom,
    medium,
    size,
    sizeLabel,
    customSize,
    subjects,
    background,
    lines,
  };
}
