import type { MenuItem } from "@/data/menu";
import type { CartLine, Customer } from "@/store/cart";
import { formatRp } from "@/lib/site";

const ORDER_TYPE_LABEL: Record<Customer["orderType"], string> = {
  "dine-in": "Makan di tempat",
  "take-away": "Bungkus / ambil sendiri",
  delivery: "Diantar",
};

export function orderTypeLabel(t: Customer["orderType"]) {
  return ORDER_TYPE_LABEL[t];
}

export type OrderMessageItem = { name: string; portion?: string; qty: number; lineTotal: number; note?: string };

/** Isi keranjang → baris pesan (harga dari menu di browser; dipakai bila pesanan gagal disimpan). */
export function cartToMessageItems(lines: CartLine[], menu: Record<string, MenuItem>): OrderMessageItem[] {
  return lines.flatMap((l) => {
    const item = menu[l.id];
    return item ? [{ name: item.name, portion: item.portion, qty: l.qty, lineTotal: item.price * l.qty, note: l.note }] : [];
  });
}

export const mapsLink = (location: string) => `https://www.google.com/maps?q=${location}`;

/** Susun pesan WhatsApp yang rapi. `orderNo` diisi bila pesanan sudah tersimpan di sistem. */
export function buildOrderMessage(items: OrderMessageItem[], total: number, c: Customer, orderNo?: string | null) {
  const rows: string[] = [];
  items.forEach((it, i) => {
    rows.push(`${i + 1}. ${it.name}${it.portion ? ` (${it.portion})` : ""} x${it.qty} = ${formatRp(it.lineTotal)}`);
    if (it.note?.trim()) rows.push(`    Catatan: ${it.note.trim()}`);
  });

  const out = ["Halo Mie Koncoan! Saya mau pesan:"];
  if (orderNo) out.push(`No. pesanan: *${orderNo}*`);
  out.push("", ...rows, "", `*Total: ${formatRp(total)}*`, "", `Nama: ${c.name.trim() || "-"}`);
  if (c.phone.trim()) out.push(`No. WA: ${c.phone.trim()}`);
  out.push(`Pesanan: ${ORDER_TYPE_LABEL[c.orderType]}`);
  if (c.orderType === "delivery") {
    out.push(`Alamat: ${c.address.trim() || "-"}`);
    if (c.area.trim()) out.push(`Desa/Kel.: ${c.area.trim()}`);
    if (c.landmark.trim()) out.push(`Patokan: ${c.landmark.trim()}`);
    if (c.location) out.push(`Lokasi: ${mapsLink(c.location)}`);
  }
  if (c.note.trim()) out.push(`Catatan: ${c.note.trim()}`);
  out.push("", "Terima kasih 🙏");
  return out.join("\n");
}
