/** Label & konstanta admin (aman dipakai di client maupun server). */

export const ORDER_TYPES = [
  { id: "dine-in", label: "Makan di tempat" },
  { id: "take-away", label: "Bungkus" },
  { id: "delivery", label: "Diantar" },
] as const;
export type OrderTypeId = (typeof ORDER_TYPES)[number]["id"];

export const PAYMENT_METHODS = [
  { id: "cash", label: "Tunai" },
  { id: "qris", label: "QRIS" },
  { id: "transfer", label: "Transfer" },
  { id: "other", label: "Lainnya" },
] as const;
export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const ORDER_STATUSES = [
  { id: "pending", label: "Menunggu" },
  { id: "paid", label: "Lunas" },
  { id: "void", label: "Dibatalkan" },
] as const;

export const ORDER_SOURCES = [
  { id: "pos", label: "Kasir" },
  { id: "web", label: "Website" },
] as const;
export type OrderSourceId = (typeof ORDER_SOURCES)[number]["id"];
export type OrderStatusId = (typeof ORDER_STATUSES)[number]["id"];

export const PRODUCT_CATEGORIES = [
  { id: "mie", label: "Mie" },
  { id: "pendamping", label: "Pendamping" },
  { id: "minuman", label: "Minuman" },
] as const;
export type ProductCategoryId = (typeof PRODUCT_CATEGORIES)[number]["id"];

const lookup = <T extends readonly { id: string; label: string }[]>(list: T) => (id: string) =>
  list.find((x) => x.id === id)?.label ?? id;

export const orderTypeLabel = lookup(ORDER_TYPES);
const paymentLookup = lookup(PAYMENT_METHODS);
/** Pesanan website yang belum dibayar belum punya metode pembayaran. */
export const paymentLabel = (id: string | null | undefined) => (id ? paymentLookup(id) : "—");
export const statusLabel = lookup(ORDER_STATUSES);
export const categoryLabel = lookup(PRODUCT_CATEGORIES);
export const sourceLabel = lookup(ORDER_SOURCES);

export const isOrderType = (v: unknown): v is OrderTypeId => ORDER_TYPES.some((x) => x.id === v);
export const isPaymentMethod = (v: unknown): v is PaymentMethodId => PAYMENT_METHODS.some((x) => x.id === v);
export const isOrderStatus = (v: unknown): v is OrderStatusId => ORDER_STATUSES.some((x) => x.id === v);
export const isOrderSource = (v: unknown): v is OrderSourceId => ORDER_SOURCES.some((x) => x.id === v);
export const isCategory = (v: unknown): v is ProductCategoryId => PRODUCT_CATEGORIES.some((x) => x.id === v);

/**
 * Normalisasi nomor HP Indonesia ke format 62xxxxxxxxxx.
 * "0858-1221-5099" → "6285812215099". Mengembalikan null bila tidak valid.
 */
export function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  if (!d.startsWith("62")) return null;
  if (d.length < 10 || d.length > 15) return null;
  return d;
}

/** "6285812215099" → "0858-1221-5099" */
export function formatPhone(p: string | null | undefined) {
  if (!p) return "";
  const local = p.startsWith("62") ? "0" + p.slice(2) : p;
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}
