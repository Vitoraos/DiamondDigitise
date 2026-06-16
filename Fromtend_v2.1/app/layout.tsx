import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Diamond Residence — Luxury Hotel",
  description: "Experience quiet vintage luxury at Diamond Residence. Book your stay today.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${plusJakarta.variable} font-sans bg-void text-white`}>
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#111827",
              color: "#F5F3EE",
              border: "1px solid rgba(245,243,238,0.08)",
              borderRadius: "0px",
              fontSize: "0.85rem",
            },
          }}
        />
      </body>
    </html>
  );
}.
