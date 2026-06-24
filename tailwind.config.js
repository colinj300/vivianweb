/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cute purple/pink palette
        blush: "#fff0f7",
        petal: "#ffd6ec",
        bubblegum: "#ff9ed8",
        rose: "#ff6fb5",
        grape: "#b06ab3",
        plum: "#8a4fa8",
        lilac: "#e7d6ff",
        lavender: "#c8a8f0",
        cream: "#fffaf3",
      },
      fontFamily: {
        display: ["var(--font-display)", "cursive"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(176, 106, 179, 0.35)",
        glow: "0 0 25px rgba(255, 111, 181, 0.45)",
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
