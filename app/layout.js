import "./globals.css";
import { Quicksand, EB_Garamond, Caveat, Great_Vibes } from "next/font/google";
import { site } from "@/lib/config";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

// WORDMARK SCRIPT FONT ("Visuals")
// "Coldia" is a signature/calligraphy font, but it's personal-use only
// (this site is commercial), so we use Great Vibes — a free-for-commercial
// signature script — as a close stand-in. To use real Coldia, drop the
// file in /public/fonts and swap this for a next/font/local import using
// the same --font-coldia variable.
const coldia = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-coldia",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// GALLERY NAME-PLAQUE FONT
// "Kith" is a handmade script font, but its free version is personal-use
// only (this site is commercial), so we use Caveat — a free-for-commercial
// handmade script — as a close stand-in.
//
// To use the REAL Kith font: drop the file in /public/fonts (e.g.
// /public/fonts/Kith.woff2), then swap this for:
//   import localFont from "next/font/local";
//   const plaque = localFont({ src: "../public/fonts/Kith.woff2",
//     variable: "--font-plaque", display: "swap" });
const plaque = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plaque",
  display: "swap",
});

// DISPLAY / HEADING FONT
// Advercase is a retro serif built on Apple's 80s Garamond. EB Garamond is a
// free-for-commercial Garamond that captures the same look.
//
// To use the REAL Advercase font instead:
//   1. Download it (from indieground.net) and drop the file in /public/fonts,
//      e.g. /public/fonts/Advercase.woff2
//   2. Comment out the EB_Garamond block below, and uncomment this one:
//
//   import localFont from "next/font/local";
//   const display = localFont({
//     src: "../public/fonts/Advercase.woff2",
//     variable: "--font-display",
//     display: "swap",
//   });
//
const display = EB_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: {
    default: `${site.brand} · Art & Commissions`,
    template: `%s · ${site.brand}`,
  },
  description: site.tagline,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${display.variable} ${plaque.variable} ${coldia.variable}`}
    >
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
