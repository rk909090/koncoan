import "server-only";
import { createHash } from "node:crypto";
import sharp, { type OutputInfo } from "sharp";
import { MENU_BY_ID } from "@/data/menu";
import { execute, queryOne, type Row } from "./db";
import { ProductError } from "./products";

/**
 * Foto produk diunggah dari panel admin → diperkecil & dikonversi ke WebP,
 * lalu disimpan di database (tabel product_images). Disajikan lewat
 * /media/products/<id>-<hash>.webp — URL berubah tiap foto diganti, jadi
 * bisa di-cache selamanya oleh browser/CDN.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 1000;
const ACCEPTED = new Set(["jpeg", "png", "webp", "heif", "avif", "gif", "tiff"]);

export const productImagePath = (id: string, hash: string) => `/media/products/${id}-${hash}.webp`;

export type ProcessedImage = { data: Buffer; hash: string; width: number; height: number };

/** Validasi & konversi foto (tanpa menyimpan) — dipanggil SEBELUM produk disimpan. */
export async function processProductImage(file: File): Promise<ProcessedImage> {
  if (file.size > MAX_UPLOAD_BYTES) throw new ProductError("Ukuran foto maksimal 8 MB.");
  const input = Buffer.from(await file.arrayBuffer());

  let out: { data: Buffer; info: OutputInfo };
  try {
    const meta = await sharp(input).metadata();
    if (!meta.format || !ACCEPTED.has(meta.format)) throw new Error(`format ${meta.format}`);
    out = await sharp(input, { failOn: "error" })
      .rotate() // ikuti orientasi EXIF dari kamera HP
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
  } catch (e) {
    console.warn("[foto produk] gagal diproses:", (e as Error).message);
    throw new ProductError("File tidak bisa dibaca sebagai foto. Gunakan JPG, PNG, atau WebP.");
  }

  const hash = createHash("sha256").update(out.data).digest("hex").slice(0, 16);
  return { data: out.data, hash, width: out.info.width, height: out.info.height };
}

export async function storeProductImage(productId: string, img: ProcessedImage) {
  await execute(
    `INSERT INTO product_images (product_id, data, mime, hash, width, height, updated_at)
     VALUES (?, ?, 'image/webp', ?, ?, ?, UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE data = VALUES(data), mime = VALUES(mime), hash = VALUES(hash),
       width = VALUES(width), height = VALUES(height), updated_at = UTC_TIMESTAMP()`,
    [productId, img.data, img.hash, img.width, img.height],
  );
  await execute("UPDATE products SET image = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [
    productImagePath(productId, img.hash),
    productId,
  ]);
}

/** Hapus foto unggahan → kembali ke foto bawaan (bila produk dari brosur) atau tanpa foto. */
export async function removeProductImage(productId: string) {
  await execute("DELETE FROM product_images WHERE product_id = ?", [productId]);
  await execute("UPDATE products SET image = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [
    MENU_BY_ID[productId]?.image ?? null,
    productId,
  ]);
}

export async function getProductImage(productId: string) {
  return queryOne<Row & { data: Buffer; mime: string; hash: string }>(
    "SELECT data, mime, hash FROM product_images WHERE product_id = ?",
    [productId],
  );
}
