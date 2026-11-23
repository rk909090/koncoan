"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MenuItem } from "@/data/menu";
import { track } from "@/lib/analytics";
import type { WebOrderType } from "@/lib/ordering";

export type CartLine = { id: string; qty: number; note?: string };

export type OrderType = WebOrderType;

export type Customer = {
  name: string;
  /** No. WhatsApp (wajib untuk diantar) */
  phone: string;
  orderType: OrderType;
  /** Alamat lengkap: jalan, no. rumah, RT/RW */
  address: string;
  /** Desa / kelurahan */
  area: string;
  /** Patokan (opsional) */
  landmark: string;
  /** "lat,lng" dari tombol bagikan lokasi (opsional) */
  location: string;
  note: string;
};

const EMPTY_CUSTOMER: Customer = {
  name: "",
  phone: "",
  orderType: "dine-in",
  address: "",
  area: "",
  landmark: "",
  location: "",
  note: "",
};

type CartState = {
  /** Menu aktif (diisi MenuProvider dari data database). Tidak disimpan ke localStorage. */
  menu: Record<string, MenuItem>;
  setMenu: (menu: Record<string, MenuItem>) => void;
  lines: CartLine[];
  customer: Customer;
  isOpen: boolean;
  /** Item yang sedang dibuka di sheet detail */
  detailId: string | null;
  add: (id: string, qty?: number, note?: string) => void;
  setQty: (id: string, qty: number) => void;
  setNote: (id: string, note: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  setCustomer: (patch: Partial<Customer>) => void;
  open: () => void;
  close: () => void;
  openDetail: (id: string) => void;
  closeDetail: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      menu: {},
      setMenu: (menu) =>
        // sekaligus buang item keranjang yang sudah tidak dijual / dinonaktifkan
        set((s) => ({ menu, lines: s.lines.filter((l) => menu[l.id] && l.qty > 0) })),
      lines: [],
      customer: EMPTY_CUSTOMER,
      isOpen: false,
      detailId: null,
      add: (id, qty = 1, note) => {
        const item = get().menu[id];
        const before = get().lines.find((l) => l.id === id)?.qty ?? 0;
        if (item) track.addToCart(item, Math.min(99, before + qty) - before);
        set((s) => {
          const existing = s.lines.find((l) => l.id === id);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.id === id
                  ? { ...l, qty: Math.min(99, l.qty + qty), note: note ?? l.note }
                  : l,
              ),
            };
          }
          return { lines: [...s.lines, { id, qty: Math.min(99, qty), note }] };
        });
      },
      setQty: (id, qty) => {
        const item = get().menu[id];
        const before = get().lines.find((l) => l.id === id)?.qty ?? 0;
        const after = Math.max(0, Math.min(99, qty));
        if (item && after > before) track.addToCart(item, after - before);
        if (item && after < before) track.removeFromCart(item, before - after);
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.id !== id)
              : s.lines.map((l) => (l.id === id ? { ...l, qty: Math.min(99, qty) } : l)),
        }));
      },
      setNote: (id, note) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.id === id ? { ...l, note } : l)),
        })),
      remove: (id) => {
        const item = get().menu[id];
        const before = get().lines.find((l) => l.id === id)?.qty ?? 0;
        if (item) track.removeFromCart(item, before);
        set((s) => ({ lines: s.lines.filter((l) => l.id !== id) }));
      },
      clear: () => set({ lines: [] }),
      setCustomer: (patch) => set((s) => ({ customer: { ...s.customer, ...patch } })),
      open: () => {
        track.viewCart(get().lines, get().menu);
        set({ isOpen: true, detailId: null });
      },
      close: () => set({ isOpen: false }),
      openDetail: (id) => {
        const item = get().menu[id];
        if (item) track.viewItem(item);
        set({ detailId: id });
      },
      closeDetail: () => set({ detailId: null }),
    }),
    {
      name: "koncoan-cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines, customer: s.customer }),
      // Item yang sudah tidak dijual dibuang oleh setMenu (menu baru tersedia setelah mount)
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>;
        const menu = current.menu;
        const hasMenu = Object.keys(menu).length > 0;
        return {
          ...current,
          ...p,
          menu,
          lines: (p.lines ?? []).filter((l) => l.qty > 0 && (!hasMenu || menu[l.id])),
          customer: { ...current.customer, ...(p.customer ?? {}) },
        };
      },
      skipHydration: true,
    },
  ),
);

export function cartTotals(lines: CartLine[], menu: Record<string, MenuItem>) {
  let count = 0;
  let total = 0;
  for (const l of lines) {
    const item = menu[l.id];
    if (!item) continue;
    count += l.qty;
    total += item.price * l.qty;
  }
  return { count, total };
}
