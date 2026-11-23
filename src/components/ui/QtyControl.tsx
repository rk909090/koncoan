"use client";

import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/cn";

/**
 * Tombol "+" yang berubah jadi stepper (− qty +) setelah item masuk keranjang.
 */
export function QtyControl({
  id,
  name,
  size = "md",
  className,
}: {
  id: string;
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const qty = useCart((s) => s.lines.find((l) => l.id === id)?.qty ?? 0);
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);

  const h = size === "sm" ? "h-9" : "h-11";
  const w = size === "sm" ? "w-9" : "w-11";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 500, damping: 34 }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        "relative flex items-center overflow-hidden rounded-full border-2 border-grape-ink shadow-pop-sm",
        qty > 0 ? "bg-lemon" : "bg-grape text-white",
        h,
        className,
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {qty > 0 && (
          <motion.button
            key="minus"
            type="button"
            aria-label={`Kurangi ${name}`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            onClick={(e) => {
              e.stopPropagation();
              setQty(id, qty - 1);
            }}
            className={cn("grid shrink-0 place-items-center active:scale-90", h, w)}
          >
            <Minus className="size-4" strokeWidth={3} />
          </motion.button>
        )}
        {qty > 0 && (
          <motion.span
            key={`q-${qty}`}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            className="min-w-5 text-center font-display text-lg leading-none tabular-nums"
            aria-live="polite"
          >
            {qty}
          </motion.span>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-label={`Tambah ${name}`}
        onClick={(e) => {
          e.stopPropagation();
          add(id);
        }}
        className={cn("grid shrink-0 place-items-center active:scale-90", h, w)}
      >
        <Plus className="size-5" strokeWidth={3} />
      </button>
    </motion.div>
  );
}
