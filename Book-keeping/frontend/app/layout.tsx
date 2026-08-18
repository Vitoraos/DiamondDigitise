import type { Metadata } from "next";
import { Caveat, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { PageTransitionOverlay } from "@/components/PageTransitionOverlay";

// Handwritten display face — the personal, quirky-human greeting
const caveat = Caveat({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Clean functional face — buttons, labels, nav, forms
const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Tabular face for money — amounts should look counted, not decorated
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Diamond Residence",
  description: "Sales, purchases, and expense records for Diamond Residence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${caveat.variable} ${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-ivory font-body">
        {children}
        <PageTransitionOverlay />
      </body>
    </html>
  );
}
