import "server-only";
import { execute, query, queryOne, type Row } from "./db";
import { isCategory } from "@/lib/admin/labels";

export type ProductRow = Row & {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  image: string | null;
  serving: string | null;
  active: number;
  sort_order: number;
};

export class ProductError extends Error {}

export async function listProducts(opts: { activeOnly?: boolean } = {}) {
  return query<ProductRow>(
    `SELECT id, name, category, price, description, image, serving, active, sort_order
     FROM products ${opts.activeOnly ? "WHERE active = 1" : ""}
     ORDER BY FIELD(category, 'mie', 'pendamping', 'minuman'), sort_order, name`,
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type ProductInput = { name: string; category: string; price: number; description?: string; serving?: string };

function clean(input: ProductInput) {
  const name = input.name.trim().slice(0, 120);
  if (!name) throw new ProductError("Nama produk wajib diisi.");
  if (!isCategory(input.category)) throw new ProductError("Kategori tidak valid.");
  const price = Math.trunc(Number(input.price));
  if (!Number.isFinite(price) || price < 0 || price > 10_000_000) throw new ProductError("Harga tidak valid.");
  return {
    name,
    category: input.category,
    price,
    description: (input.description ?? "").trim().slice(0, 255) || null,
    serving: (input.serving ?? "").trim().slice(0, 32) || null,
  };
}

export async function createProduct(input: ProductInput) {
  const p = clean(input);
  let id = slugify(p.name) || "produk";
  let n = 2;
  while (await queryOne("SELECT id FROM products WHERE id = ?", [id])) id = `${slugify(p.name)}-${n++}`;
  const max = await queryOne<Row & { m: number }>("SELECT COALESCE(MAX(sort_order), 0) AS m FROM products");
  await execute(
    `INSERT INTO products (id, name, category, price, description, serving, active, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
    [id, p.name, p.category, p.price, p.description, p.serving, Number(max?.m ?? 0) + 1],
  );
  return id;
}

export async function updateProduct(id: string, input: ProductInput) {
  const p = clean(input);
  const res = await execute(
    `UPDATE products SET name = ?, category = ?, price = ?, description = ?, serving = ?, updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [p.name, p.category, p.price, p.description, p.serving, id],
  );
  if (res.affectedRows === 0) throw new ProductError("Produk tidak ditemukan.");
}

export async function setProductActive(id: string, active: boolean) {
  await execute("UPDATE products SET active = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [active ? 1 : 0, id]);
}
