"use client";

import { createContext, use, useEffect, useMemo, type ReactNode } from "react";
import type { MenuItem } from "@/data/menu";
import { useCart } from "@/store/cart";

type MenuCtx = { items: MenuItem[]; byId: Record<string, MenuItem> };

const MenuContext = createContext<MenuCtx | null>(null);

/** Menyediakan menu (dari database, via server) untuk semua komponen klien situs publik. */
export function MenuProvider({ items, children }: { items: MenuItem[]; children: ReactNode }) {
  const value = useMemo<MenuCtx>(() => ({ items, byId: Object.fromEntries(items.map((m) => [m.id, m])) }), [items]);

  // Beri tahu store keranjang menu terbaru (untuk analytics & membuang item yang sudah tidak dijual)
  useEffect(() => {
    useCart.getState().setMenu(value.byId);
  }, [value.byId]);

  return <MenuContext value={value}>{children}</MenuContext>;
}

export function useMenu(): MenuCtx {
  const ctx = use(MenuContext);
  if (!ctx) throw new Error("useMenu harus dipakai di dalam <MenuProvider>");
  return ctx;
}
