// =====================================================================
//  EDIT THIS FILE TO CUSTOMIZE YOUR SITE
//  Everything here is plain text/numbers. Change the words, change the
//  prices — no coding knowledge needed. Save the file and the site
//  updates automatically.
// =====================================================================

export const site = {
  // The artist's name / brand shown across the site
  artistName: "Vivian",
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
    instagram: "https://instagram.com/",
    tiktok: "",
    twitter: "",
    email: "mailto:amanda@amandatwiggsjohns.com",
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
//  AVAILABILITY
//  Vivian only takes this many commissions at once. Once that many are
//  "in progress", new requests join a waitlist automatically.
// ---------------------------------------------------------------------
export const maxActiveCommissions = 8;

// ---------------------------------------------------------------------
//  GALLERY
//  Add your artwork here. Put the image files in /public/art/ and
//  reference them like "/art/my-painting.jpg".
//  Until you add real images, friendly placeholders are shown.
// ---------------------------------------------------------------------
export const gallery = [
  { src: "/art/sample-1.jpg", title: "Spring Bloom", note: "Watercolor • personal work" },
  { src: "/art/sample-2.jpg", title: "Star Gazer", note: "Digital • character design" },
  { src: "/art/sample-3.jpg", title: "Cozy Cat", note: "Commission • pet portrait" },
  { src: "/art/sample-4.jpg", title: "Dreamscape", note: "Full render" },
  { src: "/art/sample-5.jpg", title: "Little Friend", note: "Pet portrait" },
  { src: "/art/sample-6.jpg", title: "Petal Portrait", note: "Full render • commission" },
];
