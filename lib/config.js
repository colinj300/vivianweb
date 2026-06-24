// =====================================================================
//  💜  EDIT THIS FILE TO CUSTOMIZE YOUR SITE  💜
//  Everything here is plain text/numbers. Change the words, change the
//  prices — no coding knowledge needed. Save the file and the site
//  updates automatically.
// =====================================================================

export const site = {
  // The artist's name / brand shown across the site
  artistName: "Vivian",
  tagline: "hand-made art & custom commissions ✿",
  // A short bio for the About page
  bio: `Hi, I'm Vivian! I'm an artist who loves bringing ideas to life with
  soft colors and lots of heart. Whether it's a portrait of your pet, a
  character design, or a gift for someone special, I'd love to make
  something just for you. Every piece is hand-made with care. ♡`,
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
//  COMMISSION OPTIONS
//  These power the "Customize your commission" form on the order page.
//  Prices are in whole US dollars.
// ---------------------------------------------------------------------

// 1) The TYPE of artwork. `basePrice` is the starting price.
export const commissionTypes = [
  {
    id: "sketch",
    name: "Sketch",
    basePrice: 25,
    blurb: "A clean line sketch — perfect for a quick, charming piece.",
    emoji: "✏️",
  },
  {
    id: "flat-color",
    name: "Flat Color",
    basePrice: 45,
    blurb: "Line art filled with lovely flat colors.",
    emoji: "🎨",
  },
  {
    id: "full-render",
    name: "Full Render",
    basePrice: 90,
    blurb: "Fully shaded, polished artwork with a background.",
    emoji: "🌸",
  },
  {
    id: "chibi",
    name: "Chibi / Cute Style",
    basePrice: 35,
    blurb: "An adorable chibi version of your character or pet.",
    emoji: "🧸",
  },
];

// 2) CANVAS SIZE. `priceAdd` is added on top of the base price.
export const canvasSizes = [
  { id: "small", name: 'Small — 5" × 7"', priceAdd: 0 },
  { id: "medium", name: 'Medium — 8" × 10"', priceAdd: 15 },
  { id: "large", name: 'Large — 11" × 14"', priceAdd: 35 },
  { id: "xl", name: 'Extra Large — 16" × 20"', priceAdd: 60 },
  { id: "digital", name: "Digital file only (any size)", priceAdd: 0 },
];

// 3) EXTRA ADD-ONS. Buyers can pick any number of these.
export const addOns = [
  { id: "extra-character", name: "Extra character", priceAdd: 20 },
  { id: "detailed-bg", name: "Detailed background", priceAdd: 25 },
  { id: "rush", name: "Rush order (1 week)", priceAdd: 30 },
  { id: "commercial", name: "Commercial use license", priceAdd: 40 },
  { id: "print", name: "Add a physical print", priceAdd: 15 },
];

// ---------------------------------------------------------------------
//  GALLERY
//  Add your artwork here. Put the image files in /public/art/ and
//  reference them like "/art/my-painting.jpg".
//  Until you add real images, friendly placeholders are shown.
// ---------------------------------------------------------------------
export const gallery = [
  { src: "/art/sample-1.jpg", title: "Spring Bloom", note: "Watercolor • personal work" },
  { src: "/art/sample-2.jpg", title: "Star Gazer", note: "Digital • character design" },
  { src: "/art/sample-3.jpg", title: "Cozy Cat", note: "Commission • flat color" },
  { src: "/art/sample-4.jpg", title: "Dreamscape", note: "Full render" },
  { src: "/art/sample-5.jpg", title: "Little Friend", note: "Chibi commission" },
  { src: "/art/sample-6.jpg", title: "Petal Portrait", note: "Full render • commission" },
];
