"use client";

import { AnimatePresence, motion, useDragControls } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Bottom sheet yang dioptimalkan untuk mobile:
 * - geser handle ke bawah untuk menutup
 * - Esc / tap backdrop untuk menutup
 * - scroll body dikunci saat terbuka
 * Di layar lebar tampil sebagai panel di tengah bawah (max-w-lg).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const controls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => panelRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-grape-ink/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.9 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className={cn(
              "relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[28px] border-x-2 border-t-2 border-grape-ink bg-cream outline-none sm:mb-4 sm:rounded-[28px] sm:border-2 sm:shadow-pop-lg",
              className,
            )}
          >
            <div
              className="flex shrink-0 cursor-grab touch-none flex-col items-center px-5 pt-2.5 active:cursor-grabbing"
              onPointerDown={(e) => controls.start(e)}
            >
              <span className="h-1.5 w-12 rounded-full bg-grape-ink/25" />
              <div className="mt-2 flex w-full items-center justify-between gap-3 pb-3">
                <div className="min-w-0 font-display text-2xl leading-tight">{title}</div>
                <button
                  type="button"
                  onClick={onClose}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Tutup"
                  className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-grape-ink bg-white shadow-pop-sm active:translate-x-px active:translate-y-px active:shadow-none"
                >
                  <X className="size-5" strokeWidth={2.6} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
            {footer && (
              <div className="shrink-0 border-t-2 border-dashed border-grape-ink/20 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
