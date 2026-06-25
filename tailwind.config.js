/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette built from #3e5fae (blue), #8c64bd (purple), #baace3 (lavender)
        blush: "#f2f2fb", // page background — pale periwinkle white
        petal: "#ddd6f2", // light lavender (soft accent / hovers)
        bubblegum: "#a98fd6", // mid lavender-purple
        rose: "#8c64bd", // primary accent — purple (#8c64bd)
        grape: "#3e5fae", // deep accent + headings — blue (#3e5fae)
        plum: "#2e3263", // body text — dark indigo
        lilac: "#e7e2f7", // very light lavender
        lavender: "#baace3", // lavender (#baace3)
        cream: "#f8f7fd",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        plaque: ["var(--font-plaque)", "cursive"],
        coldia: ["var(--font-coldia)", "cursive"],
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(62, 95, 174, 0.28)",
        glow: "0 0 25px rgba(140, 100, 189, 0.45)",
      },
      borderRadius: {
        blob: "40% 60% 55% 45% / 55% 45% 60% 40%",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        wiggle: "wiggle 3s ease-in-out infinite",
        sparkle: "sparkle 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
