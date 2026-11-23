import type { Metadata, Viewport } from "next";
import { Lilita_One, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";

/**
 * Root layout khusus admin: TANPA Google Tag Manager, keranjang belanja,
 * maupun JSON-LD situs publik. Tidak diindeks mesin pencari.
 */
const lilita = Lilita_One({ variable: "--font-lilita", weight: "400", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://koncoan.my.id"),
  title: { default: "Admin · Mie Koncoan", template: "%s · Admin Mie Koncoan" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  themeColor: "#7b04be",
  width: "device-width",
  initialScale: 1,
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="id" className={`${lilita.variable} ${jakarta.variable} antialiased`}>
      <body className="min-h-dvh bg-cream">{children}</body>
    </html>
  );
}
