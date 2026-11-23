"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MENU_BY_ID } from "@/data/menu";
import { track } from "@/lib/analytics";

export type CartLine = { id: string; qty: number; note?: string };

export type OrderType = "dine-in" | "take-away" | "delivery";

export type Customer = {
  name: string;
  orderType: OrderType;
  address: string;
  note: string;
};

type CartState = {
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
      lines: [],
      customer: { name: "", orderType: "dine-in", address: "", note: "" },
      isOpen: false,
      detailId: null,
      add: (id, qty = 1, note) => {
        const item = MENU_BY_ID[id];
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
        const item = MENU_BY_ID[id];
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
        const item = MENU_BY_ID[id];
        const before = get().lines.find((l) => l.id === id)?.qty ?? 0;
        if (item) track.removeFromCart(item, before);
        set((s) => ({ lines: s.lines.filter((l) => l.id !== id) }));
      },
      clear: () => set({ lines: [] }),
      setCustomer: (patch) => set((s) => ({ customer: { ...s.customer, ...patch } })),
      open: () => {
        track.viewCart(get().lines);
        set({ isOpen: true, detailId: null });
      },
      close: () => set({ isOpen: false }),
      openDetail: (id) => {
        const item = MENU_BY_ID[id];
        if (item) track.viewItem(item);
        set({ detailId: id });
      },
      closeDetail: () => set({ detailId: null }),
    }),
    {
      name: "koncoan-cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines, customer: s.customer }),
      // Buang item yang sudah tidak ada di menu (mis. setelah menu diperbarui)
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>;
        return {
          ...current,
          ...p,
          lines: (p.lines ?? []).filter((l) => MENU_BY_ID[l.id] && l.qty > 0),
          customer: { ...current.customer, ...(p.customer ?? {}) },
        };
      },
      skipHydration: true,
    },
  ),
);

export function cartTotals(lines: CartLine[]) {
  let count = 0;
  let total = 0;
  for (const l of lines) {
    const item = MENU_BY_ID[l.id];
    if (!item) continue;
    count += l.qty;
    total += item.price * l.qty;
  }
  return { count, total };
}
