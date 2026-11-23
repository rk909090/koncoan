import type { Metadata } from "next";
import { OrderApp } from "@/components/order/OrderApp";
import { CartBar } from "@/components/cart/CartBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd, menuLd, PRICE_MAX, PRICE_MIN } from "@/lib/seo";
import { formatRp, SITE } from "@/lib/site";

const DESCRIPTION = `Order online menu Mie Koncoan: mie, wonton, dimsum, gohyong & minuman (${formatRp(
  PRICE_MIN,
)}–${formatRp(PRICE_MAX)}). Pilih menu, pesanan otomatis terkirim ke WhatsApp ${SITE.phoneDisplay}.`;

export const metadata: Metadata = {
  title: "Order Online — Menu & Harga Lengkap",
  description: DESCRIPTION,
  alternates: { canonical: "/order" },
  // Objek openGraph/twitter di halaman menggantikan milik layout, jadi isi lengkap di sini.
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE.name,
    url: "/order",
    title: `Order Online — Menu & Harga Lengkap · ${SITE.name}`,
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Logo Mie Koncoan dengan semangkuk mie" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Order Online — Menu & Harga Lengkap · ${SITE.name}`,
    description: DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
};

export default function OrderPage() {
  return (
    <>
      <OrderApp />
      <CartBar />
      <JsonLd
        data={[
          menuLd(),
          breadcrumbLd([
            { name: "Beranda", path: "/" },
            { name: "Order", path: "/order" },
          ]),
        ]}
      />
    </>
  );
}
