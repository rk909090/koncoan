"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";

/** Memuat keranjang dari localStorage setelah mount (menghindari hydration mismatch). */
export function CartHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  return null;
}
