"use server";

import { refresh, updateTag } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth";
import { createProduct, ProductError, setProductActive, updateProduct } from "@/lib/server/products";
import { processProductImage, removeProductImage, storeProductImage } from "@/lib/server/productImages";
import { PUBLIC_MENU_TAG } from "@/lib/server/menu";

export type ProductFormState = { error?: string; ok?: boolean; values?: Record<string, string> };

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u) return "Sesi berakhir. Silakan login ulang.";
  if (u.role !== "admin") return "Hanya Administrator yang boleh mengubah produk.";
  return null;
}

function readForm(fd: FormData) {
  return {
    name: String(fd.get("name") ?? ""),
    category: String(fd.get("category") ?? ""),
    price: Number(String(fd.get("price") ?? "").replace(/\D/g, "")),
    description: String(fd.get("description") ?? ""),
    serving: String(fd.get("serving") ?? ""),
  };
}

export async function saveProductAction(_p: ProductFormState, fd: FormData): Promise<ProductFormState> {
  const err = await requireAdmin();
  if (err) return { error: err };
  const id = String(fd.get("id") ?? "");
  const photo = fd.get("photo");
  try {
    // Foto diproses lebih dulu: bila gagal, produk belum tersimpan (tidak ada produk dobel saat mencoba lagi)
    const image = photo instanceof File && photo.size > 0 ? await processProductImage(photo) : null;
    let productId = id;
    if (id) await updateProduct(id, readForm(fd));
    else productId = await createProduct(readForm(fd));
    if (image) await storeProductImage(productId, image);
    else if (id && fd.get("removePhoto") === "1") await removeProductImage(id);
  } catch (e) {
    const values = Object.fromEntries(["name", "category", "price", "description", "serving"].map((k) => [k, String(fd.get(k) ?? "")]));
    if (e instanceof ProductError) return { error: e.message, values };
    console.error("saveProductAction", e);
    return { error: "Gagal menyimpan produk.", values };
  }
  updateTag(PUBLIC_MENU_TAG); // menu website publik ikut diperbarui
  refresh();
  return { ok: true };
}

export async function toggleProductAction(fd: FormData) {
  if (await requireAdmin()) return;
  await setProductActive(String(fd.get("id")), fd.get("active") === "1");
  updateTag(PUBLIC_MENU_TAG);
  refresh();
}
