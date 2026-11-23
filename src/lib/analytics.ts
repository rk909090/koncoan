/**
 * Event analytics → window.dataLayer (dibaca Google Tag Manager GTM-T6QB83QZ,
 * lalu diteruskan ke GA4 G-8L6QGYPMS6 oleh tag di GTM).
 *
 * Nama event & parameter mengikuti event yang direkomendasikan GA4:
 * view_item_list, view_item, add_to_cart, remove_from_cart, view_cart,
 * begin_checkout, generate_lead, search — plus event kustom `contact` dan
 * `get_directions`. Untuk event e-commerce, objek `ecommerce` di-reset dulu
 * (sesuai panduan GA4) agar data item dari event sebelumnya tidak terbawa.
 */
import type { MenuItem } from "@/data/menu";
import type { CartLine } from "@/store/cart";

const CURRENCY = "IDR";
const BRAND = "Mie Koncoan";

type DataLayerObject = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerObject[];
  }
}

function push(obj: DataLayerObject) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(obj);
}

export type GaItem = {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category: string;
  price: number;
  quantity: number;
  index?: number;
  item_list_name?: string;
};

const CATEGORY_NAME: Record<MenuItem["category"], string> = {
  mie: "Mie",
  pendamping: "Pendamping",
  minuman: "Minuman",
};

export function toGaItem(item: MenuItem, quantity = 1, extra?: Partial<GaItem>): GaItem {
  return {
    item_id: item.id,
    item_name: item.name,
    item_brand: BRAND,
    item_category: CATEGORY_NAME[item.category],
    price: item.price,
    quantity,
    ...extra,
  };
}

type MenuById = Record<string, MenuItem>;

function linesToItems(lines: CartLine[], menu: MenuById) {
  const items: GaItem[] = [];
  let value = 0;
  for (const l of lines) {
    const item = menu[l.id];
    if (!item) continue;
    items.push(toGaItem(item, l.qty));
    value += item.price * l.qty;
  }
  return { items, value };
}

function ecommerce(event: string, data: DataLayerObject) {
  push({ ecommerce: null });
  push({ event, ecommerce: { currency: CURRENCY, ...data } });
}

export const track = {
  viewItemList(listId: string, listName: string, items: MenuItem[]) {
    ecommerce("view_item_list", {
      item_list_id: listId,
      item_list_name: listName,
      items: items.map((it, i) => toGaItem(it, 1, { index: i, item_list_name: listName })),
    });
  },

  viewItem(item: MenuItem) {
    ecommerce("view_item", { value: item.price, items: [toGaItem(item)] });
  },

  addToCart(item: MenuItem, quantity: number) {
    if (quantity <= 0) return;
    ecommerce("add_to_cart", { value: item.price * quantity, items: [toGaItem(item, quantity)] });
  },

  removeFromCart(item: MenuItem, quantity: number) {
    if (quantity <= 0) return;
    ecommerce("remove_from_cart", {
      value: item.price * quantity,
      items: [toGaItem(item, quantity)],
    });
  },

  viewCart(lines: CartLine[], menu: MenuById) {
    const { items, value } = linesToItems(lines, menu);
    if (items.length === 0) return;
    ecommerce("view_cart", { value, items });
  },

  beginCheckout(lines: CartLine[], menu: MenuById) {
    const { items, value } = linesToItems(lines, menu);
    if (items.length === 0) return;
    ecommerce("begin_checkout", { value, items });
  },

  /** Konversi utama: pesanan tersusun & WhatsApp dibuka. */
  generateLead(lines: CartLine[], menu: MenuById, orderType: string) {
    const { items, value } = linesToItems(lines, menu);
    push({
      event: "generate_lead",
      value,
      currency: CURRENCY,
      lead_source: "whatsapp_order",
      order_type: orderType,
      item_count: items.reduce((a, b) => a + b.quantity, 0),
    });
  },

  /** Klik chat WhatsApp langsung (bukan lewat keranjang). */
  contact(location: string) {
    push({ event: "contact", method: "whatsapp", link_location: location });
  },

  getDirections(location: string) {
    push({ event: "get_directions", method: "google_maps", link_location: location });
  },

  search(term: string) {
    push({ event: "search", search_term: term });
  },
};
