/** Pengaturan & tipe pemesanan dari website (aman dipakai di client maupun server). */

export type WebOrderType = "dine-in" | "take-away" | "delivery";

export type OrderingSettings = {
  /** Terima pesanan "ambil sendiri / bungkus" */
  takeAway: boolean;
  /** Terima pesanan "diantar" */
  delivery: boolean;
  /** Info untuk pemesan, mis. area & ongkir */
  deliveryNote: string;
  /** Minimal belanja untuk diantar (Rp); 0 = tanpa minimal */
  deliveryMinOrder: number;
};

export const DEFAULT_ORDERING: OrderingSettings = {
  takeAway: true,
  delivery: true,
  deliveryNote: "Ketersediaan antar & ongkir dikonfirmasi penjual lewat WhatsApp.",
  deliveryMinOrder: 0,
};

/** Jenis pesanan yang sedang diterima (makan di tempat selalu tersedia). */
export function allowedOrderTypes(s: OrderingSettings): WebOrderType[] {
  return ["dine-in", ...(s.takeAway ? (["take-away"] as const) : []), ...(s.delivery ? (["delivery"] as const) : [])];
}

/** Batas panjang kolom formulir pemesanan (sama di browser & server). */
export const WEB_ORDER_LIMITS = {
  name: 60,
  phone: 20,
  address: 200,
  area: 80,
  landmark: 160,
  note: 160,
  itemNote: 120,
  lines: 30,
  qty: 99,
} as const;
