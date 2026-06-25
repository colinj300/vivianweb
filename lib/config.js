// =====================================================================
//  EDIT THIS FILE TO CUSTOMIZE YOUR SITE
//  Everything here is plain text/numbers. Change the words, change the
//  prices — no coding knowledge needed. Save the file and the site
//  updates automatically.
// =====================================================================

export const site = {
  // The artist's first name — used for personal touches ("Hi, I'm Vivian!").
  artistName: "Vivian",
  // The shop / brand name — shown as the site title, nav, footer, hero.
  brand: "Visuals by Vivian",
  tagline: "hand-made art & custom commissions",
  // A short bio for the About page
  bio: `Hi, I'm Vivian! I'm an artist who loves bringing ideas to life with
  soft colors and lots of heart. Whether it's a portrait of your pet, a
  character design, or a gift for someone special, I'd love to make
  something just for you. Every piece is hand-made with care.`,
  // Where contact-form messages should be emailed (used by the contact API)
  contactEmail: "amanda@amandatwiggsjohns.com",
  // Social links (leave a value as "" to hide that icon)
  socials: {
    instagram: "https://instagram.com/__vivian__n",
    tiktok: "",
    twitter: "",
    email: "mailto:amanda@amandatwiggsjohns.com",
  },
  // ---- Live chat (Tawk.to — free, with a phone app so you reply fast) ----
  // 1. Sign up at https://tawk.to and create a property.
  // 2. Admin → Channels → Chat Widget → copy the "src" of the embed code
  //    (looks like https://embed.tawk.to/XXXXXXXX/YYYYYYY).
  // 3. Paste it below. Until then, the chat bubble simply doesn't appear.
  chat: {
    tawkSrc: "",
  },
};

// ---------------------------------------------------------------------
//  MEDIUMS + SIZES  (sizes ordered small → big)
//  `basePrice` already includes ONE subject (e.g. one pet in a portrait).
//  Set `allowCustom: true` to offer a "custom size" option that you price
//  yourself when you review the request.
// ---------------------------------------------------------------------
export const mediums = [
  {
    id: "canvas-paper",
    name: "Canvas Paper",
    allowCustom: true,
    sizes: [
      { id: "cp-4x4", name: '4" × 4"', basePrice: 20 },
      { id: "cp-4x6", name: '4" × 6"', basePrice: 25 },
      { id: "cp-5x5", name: '5" × 5"', basePrice: 30 },
      { id: "cp-6x6", name: '6" × 6"', basePrice: 35 },
      { id: "cp-8x10", name: '8" × 10"', basePrice: 50 },
      { id: "cp-9x12", name: '9" × 12"', basePrice: 65 },
    ],
  },
  {
    id: "canvas",
    name: "Canvas",
    allowCustom: false,
    sizes: [
      { id: "cv-3x3", name: '3" × 3"', basePrice: 30 },
      { id: "cv-8x10", name: '8" × 10"', basePrice: 70 },
      { id: "cv-9x12", name: '9" × 12"', basePrice: 80 },
      { id: "cv-20x20", name: '20" × 20"', basePrice: 150 },
      { id: "cv-18x24", name: '18" × 24"', basePrice: 250 },
      { id: "cv-24x36", name: '24" × 36"', basePrice: 280 },
    ],
  },
];

// ---------------------------------------------------------------------
//  EXTRA PRICING RULES
// ---------------------------------------------------------------------
export const pricing = {
  // Each subject beyond the first one included in the base price.
  additionalSubject: 20,
  // Complex background / scenery (landscapes, detailed settings, etc.).
  complexBackground: 10,
};

// ---------------------------------------------------------------------
//  BACKGROUND OPTIONS
//  Simple backgrounds are free; a complex/scenery background costs extra.
// ---------------------------------------------------------------------
export const backgrounds = [
  { id: "none", name: "Just the subject", price: 0 },
  { id: "solid", name: "Solid color", price: 0 },
  { id: "polka", name: "Polka dots", price: 0 },
  { id: "stripes", name: "Stripes", price: 0 },
  { id: "pattern", name: "Simple pattern", price: 0 },
  { id: "complex", name: "Complex background / scenery", price: pricing.complexBackground },
];

// Default price (USD) for a new ACEO listing in the shop.
export const aceoPrice = 8;

// ---------------------------------------------------------------------
//  AVAILABILITY
//  Vivian only takes this many commissions at once. Once that many are
//  "in progress", new requests join a waitlist automatically.
// ---------------------------------------------------------------------
export const maxActiveCommissions = 8;

// ---------------------------------------------------------------------
//  GALLERY
//  Add your artwork here. Put the image files in /public/art/ and
//  reference them like "/art/my-painting.jpg".
//   - `size` is the label shown on the little name plaque.
//   - `w` and `h` set the displayed shape (use the canvas dimensions so
//     the proportions match the real piece). `tier` controls how big it
//     shows in the gallery: "small", "medium", or "large".
//  Until you add the real image files, friendly placeholders are shown.
// ---------------------------------------------------------------------
export const gallery = [
  { src: "/art/lola.jpg", title: "Lola", size: "15 × 30 in", w: 30, h: 15, tier: "large" },
  { src: "/art/the-lost-duck.jpg", title: "The Lost Duck", size: "20 × 20 in", w: 20, h: 20, tier: "medium" },
  { src: "/art/gingham-dog.jpg", title: "Gingham Dog", size: "4 × 6 in", w: 4, h: 6, tier: "small" },
  { src: "/art/chubby-ass-tabby.jpg", title: "Chubby Ass Tabby", size: "4 × 6 in", w: 4, h: 6, tier: "small" },
  { src: "/art/giant-shark.jpg", title: "Giant Shark", size: "2.5 × 3.5 in", w: 3.5, h: 2.5, tier: "tiny" },
  { src: "/art/two-cows-in-field.png", title: "Two Cows in Field", size: "16 × 20 in", w: 20, h: 16, tier: "medium" },
  { src: "/art/burst.jpg", title: "Burst", size: "10 × 10 in", w: 10, h: 10, tier: "medium" },
  { src: "/art/ingredients.jpg", title: "Ingredients", size: "18 × 24 in", w: 24, h: 18, tier: "medium" },
];
