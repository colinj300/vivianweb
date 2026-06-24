/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft pastel purple palette (gentle, low-saturation, less pink)
        blush: "#f6f2fb", // page background — lavender white
        petal: "#efdcef", // soft pastel pink, used sparingly
        bubblegum: "#d8bfe6", // muted lilac (no longer neon)
        rose: "#b488cf", // primary accent — soft orchid, purple-leaning
        grape: "#8f72c2", // deeper accent purple
        plum: "#5d4f7c", // muted purple for body text
        lilac: "#e8def8",
        lavender: "#cdbcec",
        cream: "#fbf8ff",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(143, 114, 194, 0.30)",
        glow: "0 0 25px rgba(180, 136, 207, 0.40)",
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
