import type { Metadata } from "next";
import { OrderApp } from "@/components/order/OrderApp";
import { CartBar } from "@/components/cart/CartBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd, menuLd, priceRangeText, priceStats } from "@/lib/seo";
import { getPublicMenu } from "@/lib/server/menu";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const all = priceStats(await getPublicMenu()).all;
  const DESCRIPTION = `Order online menu Mie Koncoan: mie, wonton, dimsum, gohyong & minuman${
    all ? ` (${priceRangeText(all)})` : ""
  }. Pilih menu, pesanan otomatis terkirim ke WhatsApp ${SITE.phoneDisplay}.`;

  return {
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
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "Logo Mie Koncoan dengan semangkuk mie",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Order Online — Menu & Harga Lengkap · ${SITE.name}`,
      description: DESCRIPTION,
      images: ["/opengraph-image.png"],
    },
  };
}

export default async function OrderPage() {
  const menu = await getPublicMenu();
  return (
    <>
      <OrderApp />
      <CartBar />
      <JsonLd
        data={[
          menuLd(menu),
          breadcrumbLd([
            { name: "Beranda", path: "/" },
            { name: "Order", path: "/order" },
          ]),
        ]}
      />
    </>
  );
}
