import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { MENU, MENU_BY_ID, type CategoryId, type MenuItem } from "@/data/menu";
import { isCategory } from "@/lib/admin/labels";
import { listProducts } from "./products";

/** Tag cache menu publik — di-invalidate saat produk diubah di panel admin. */
export const PUBLIC_MENU_TAG = "public-menu";

/** Menu terakhir yang berhasil dibaca dari database di proses ini (cadangan saat DB sesaat tidak bisa diakses). */
let lastGood: MenuItem[] | null = null;

/**
 * Menu untuk website publik, diambil dari tabel `products` (yang dikelola lewat
 * /admin/products). Hanya produk AKTIF yang tampil.
 *
 * - Di-cache ("use cache") supaya halaman publik tetap ter-prerender & cepat;
 *   revalidasi tiap ±1 menit dan langsung di-invalidate saat admin menyimpan produk.
 * - Bila database tidak bisa diakses: pakai menu terakhir yang berhasil dibaca;
 *   bila belum pernah (mis. saat build tanpa DB), pakai menu bawaan
 *   src/data/menu.ts agar situs tidak pernah kosong/rusak.
 */
export async function getPublicMenu(): Promise<MenuItem[]> {
  "use cache";
  cacheTag(PUBLIC_MENU_TAG);
  cacheLife("minutes");

  try {
    const rows = await listProducts({ activeOnly: true });
    const items: MenuItem[] = [];
    for (const r of rows) {
      const category = String(r.category);
      if (!isCategory(category)) continue;
      const base = MENU_BY_ID[String(r.id)];
      items.push({
        id: String(r.id),
        name: String(r.name),
        price: Number(r.price),
        category: category as CategoryId,
        description: r.description ? String(r.description) : (base?.description ?? ""),
        // hanya path lokal (/menu/...) yang dipakai; selain itu dianggap tanpa foto
        image: r.image && String(r.image).startsWith("/") ? String(r.image) : null,
        portion: r.serving ? String(r.serving) : undefined,
        // atribut tambahan yang belum ada di database diambil dari menu bawaan (id sama)
        tag: base?.tag,
        spicy: base?.spicy,
        keywords: base?.keywords,
      });
    }
    lastGood = items;
    return items;
  } catch (e) {
    console.warn(
      `[menu] database tidak bisa diakses, memakai menu ${lastGood ? "terakhir" : "bawaan"}:`,
      (e as Error).message,
    );
    return lastGood ?? MENU;
  }
}
