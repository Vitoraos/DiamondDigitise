import Link from "next/link";
import { Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-beige-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-beige-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Hotel className="h-8 w-8 text-gold-500" />
            <span className="text-xl font-serif font-bold text-navy-800">
              Vitora Luxury
            </span>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="border-gold-500 text-gold-700 hover:bg-gold-50"
            >
              Staff Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-navy-800 text-beige-200 py-8 text-center text-sm">
        © {new Date().getFullYear()} Vitora Luxury Hotel. All rights reserved.
      </footer>
    </div>
  );
}