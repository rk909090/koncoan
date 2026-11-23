import type { Metadata, Viewport } from "next";
import { Lilita_One, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { CartHydrator } from "@/components/cart/CartHydrator";
import { CartSheet } from "@/components/cart/CartSheet";
import { ItemSheet } from "@/components/cart/ItemSheet";
import { JsonLd } from "@/components/seo/JsonLd";
import { MenuProvider } from "@/components/menu/MenuProvider";
import { getPublicMenu } from "@/lib/server/menu";
import { getPublicOrdering } from "@/lib/server/settings";
import { SITE } from "@/lib/site";
import { priceStats, restaurantLd, SITE_URL, websiteLd } from "@/lib/seo";
import { formatRp } from "@/lib/site";

/** Google Tag Manager container (snippet resmi dari container GTM-T6QB83QZ). */
const GTM_ID = "GTM-T6QB83QZ";
/** GTM hanya dimuat di build produksi, supaya `next dev` lokal tidak mengirim data uji ke GA4. */
const LOAD_GTM = process.env.NODE_ENV === "production";

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

/** Metadata memakai harga termurah dari menu aktif (database). */
export async function generateMetadata(): Promise<Metadata> {
  const min = priceStats(await getPublicMenu()).all?.min;
  const DESCRIPTION = `Mie Koncoan — warung mie anak muda di Jl. Raya Sebaung, depan SMAN 1 Gending (Probolinggo). Mie, wonton, dimsum, gohyong & Konco Fresh Drink${
    min ? ` mulai ${formatRp(min)}` : ""
  }. Pesan online, kirim lewat WhatsApp.`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE.name} — ${SITE.tagline} | Mie & Wonton di Gending`,
      template: `%s · ${SITE.name}`,
    },
    description: DESCRIPTION,
    applicationName: SITE.name,
    authors: [{ name: SITE.name, url: SITE_URL }],
    creator: SITE.name,
    publisher: SITE.name,
    category: "food",
    keywords: [
      "Mie Koncoan",
      "mie Gending",
      "mie Sebaung",
      "kuliner Gending Probolinggo",
      "wonton chili oil",
      "dimsum",
      "cwie mie",
      "mie dekat SMAN 1 Gending",
    ],
    alternates: { canonical: "/" },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: SITE_URL,
      siteName: SITE.name,
      title: `${SITE.name} — ${SITE.tagline}`,
      description: DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE.name} — ${SITE.tagline}`,
      description: DESCRIPTION,
    },
    verification: {
      google: "hKij6d1gMZeEQw64zJ0VRLiGpP15HM4VRSeEfVAYXjE",
      other: { "msvalidate.01": "562657F865C47C6F67C9A5FFBB31D2B4" },
    },
    formatDetection: { telephone: true, address: false, email: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#a406b4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [menu, ordering] = await Promise.all([getPublicMenu(), getPublicOrdering()]);
  return (
    <html lang="id" className={`${lilita.variable} ${jakarta.variable} antialiased`}>
      <head>
        {/* Google tag (GTM) — sesuai instruksi instalasi container */}
        {LOAD_GTM && <script async src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`,
          }}
        />
        <JsonLd data={[restaurantLd(menu), websiteLd()]} />
      </head>
      <body className="min-h-dvh">
        <MenuProvider items={menu} ordering={ordering}>
          {children}
          <CartHydrator />
          <ItemSheet />
          <CartSheet />
        </MenuProvider>
      </body>
    </html>
  );
}
