import "./globals.css";
import { Quicksand, EB_Garamond } from "next/font/google";
import { site } from "@/lib/config";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// DISPLAY / HEADING FONT
// Advercase is a retro serif built on Apple's 80s Garamond. EB Garamond is a
// free-for-commercial Garamond that captures the same look.
//
// 👉 To use the REAL Advercase font instead:
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
  title: `${site.artistName} · Art & Commissions`,
  description: site.tagline,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${quicksand.variable} ${display.variable}`}>
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
