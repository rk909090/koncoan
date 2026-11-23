"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { cartTotals, useCart } from "@/store/cart";
import { formatRp } from "@/lib/site";

/** Bar keranjang mengambang di bawah layar — muncul saat ada item. */
export function CartBar() {
  const lines = useCart((s) => s.lines);
  const isOpen = useCart((s) => s.isOpen);
  const detailId = useCart((s) => s.detailId);
  const open = useCart((s) => s.open);
  const { count, total } = cartTotals(lines);
  const visible = count > 0 && !isOpen && !detailId;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={open}
            className="pointer-events-auto flex h-16 w-full max-w-lg items-center gap-3 rounded-full border-2 border-grape-ink bg-grape pr-3 pl-2 text-white shadow-pop-lg transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-sm"
          >
            <span className="relative grid size-12 place-items-center rounded-full border-2 border-grape-ink bg-lemon text-grape-ink">
              <ShoppingBag className="size-6" strokeWidth={2.4} />
              <motion.span
                key={count}
                initial={{ scale: 1.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="absolute -top-1.5 -right-1.5 grid min-w-6 place-items-center rounded-full border-2 border-grape-ink bg-chili px-1 text-xs font-extrabold text-white"
              >
                {count}
              </motion.span>
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-white/75">{count} item</span>
              <motion.span key={total} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-xl">
                {formatRp(total)}
              </motion.span>
            </span>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-white/15 py-2 pr-2 pl-4 text-sm font-bold">
              Lihat keranjang <ChevronRight className="size-4" strokeWidth={3} />
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
