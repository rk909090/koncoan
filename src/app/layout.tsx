import type { Metadata, Viewport } from "next";
import { Lilita_One, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartHydrator } from "@/components/cart/CartHydrator";
import { CartSheet } from "@/components/cart/CartSheet";
import { ItemSheet } from "@/components/cart/ItemSheet";
import { SITE } from "@/lib/site";

const lilita = Lilita_One({
  variable: "--font-lilita",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://koncoan.my.id"),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Warung Mie Koncoan — mie, wonton, dimsum & Konco Fresh Drink mulai 3 ribuan. Pesan langsung lewat WhatsApp. Jl. Raya Sebaung, Depan SMAN 1 Gending.",
  applicationName: SITE.name,
  keywords: ["Mie Koncoan", "mie", "wonton", "dimsum", "Gending", "Sebaung", "kuliner"],
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: "Mie, wonton, dimsum & minuman segar. Pesan via WhatsApp!",
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#a406b4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${lilita.variable} ${jakarta.variable} antialiased`}>
      <body className="min-h-dvh">
        {children}
        <CartHydrator />
        <ItemSheet />
        <CartSheet />
      </body>
    </html>
  );
}
