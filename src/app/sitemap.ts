import type { MetadataRoute } from "next";
import { MENU } from "@/data/menu";
import { abs } from "@/lib/seo";

/** Tanggal konten terakhir diubah (perbarui saat menu/konten berubah). */
const LAST_MODIFIED = "2026-11-23";

export default function sitemap(): MetadataRoute.Sitemap {
  const menuImages = MENU.map((m) => abs(m.image));
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
