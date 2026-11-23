import type { Metadata } from "next";
import Link from "next/link";
import { Lilita_One, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * Halaman 404 global. Diperlukan karena aplikasi memakai beberapa root layout
 * (situs publik & admin), sehingga tidak ada satu layout untuk menyusun 404.
 */
const lilita = Lilita_One({ variable: "--font-lilita", weight: "400", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://koncoan.my.id"),
  title: "Halaman tidak ditemukan · Mie Koncoan",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="id" className={`${lilita.variable} ${jakarta.variable} antialiased`}>
      <body className="grid min-h-dvh place-items-center bg-cream px-4 text-grape-ink">
        <main className="max-w-md text-center">
          <p className="font-display text-8xl text-grape">404</p>
          <h1 className="mt-2 font-display text-3xl">Waduh, halamannya nggak ada, konco!</h1>
          <p className="mt-2 text-grape-ink/70">Mungkin alamatnya salah ketik atau halamannya sudah dipindah.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/" className="inline-flex h-12 items-center rounded-full border-2 border-grape-ink bg-grape px-6 font-bold text-white shadow-pop">
              Ke beranda
            </Link>
            <Link href="/order" className="inline-flex h-12 items-center rounded-full border-2 border-grape-ink bg-lemon px-6 font-bold shadow-pop">
              Lihat menu
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
