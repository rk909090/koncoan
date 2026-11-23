import { MENU_BY_ID } from "@/data/menu";
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

/** Susun pesan WhatsApp yang rapi dari isi keranjang. */
export function buildOrderMessage(lines: CartLine[], c: Customer) {
  const rows: string[] = [];
  let total = 0;
  let i = 1;
  for (const l of lines) {
    const item = MENU_BY_ID[l.id];
    if (!item) continue;
    const sub = item.price * l.qty;
    total += sub;
    rows.push(`${i++}. ${item.name}${item.portion ? ` (${item.portion})` : ""} x${l.qty} = ${formatRp(sub)}`);
    if (l.note?.trim()) rows.push(`    Catatan: ${l.note.trim()}`);
  }

  const out = [
    "Halo Mie Koncoan! Saya mau pesan:",
    "",
    ...rows,
    "",
    `*Total: ${formatRp(total)}*`,
    "",
    `Nama: ${c.name.trim() || "-"}`,
    `Pesanan: ${ORDER_TYPE_LABEL[c.orderType]}`,
  ];
  if (c.orderType === "delivery") out.push(`Alamat: ${c.address.trim() || "-"}`);
  if (c.note.trim()) out.push(`Catatan: ${c.note.trim()}`);
  out.push("", "Terima kasih 🙏");
  return out.join("\n");
}
