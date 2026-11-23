import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";
import { getPublicMenu } from "@/lib/server/menu";

/** Tanggal konten terakhir diubah (perbarui saat menu/konten berubah). */
const LAST_MODIFIED = "2026-11-23";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const menuImages = (await getPublicMenu()).flatMap((m) => (m.image ? [abs(m.image)] : []));
  return [
    {
      url: abs("/"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 1,
      images: [abs("/menu/hero.webp"), abs("/brand/logo-koncoan.png"), ...menuImages],
    },
    {
      url: abs("/order"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
      images: menuImages,
    },
  ];
}
