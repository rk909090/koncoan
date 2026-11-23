"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { cartTotals, useCart } from "@/store/cart";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/#menu", label: "Menu" },
  { href: "/#kenapa", label: "Kenapa Koncoan" },
  { href: "/#cara-pesan", label: "Cara Pesan" },
  { href: "/#lokasi", label: "Lokasi" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 400 && y > prev + 4);
    if (y < prev - 4) setHidden(false);
  });

  const lines = useCart((s) => s.lines);
  const open = useCart((s) => s.open);
  const { count } = cartTotals(lines);

  return (
    <motion.header
      animate={{ y: hidden ? -110 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="fixed inset-x-0 top-0 z-40 px-3 pt-[max(0.6rem,env(safe-area-inset-top))]"
    >
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border-2 py-1.5 pr-1.5 pl-3 transition-all duration-300",
          scrolled
            ? "border-grape-ink bg-cream/85 shadow-pop backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <Link href="/" aria-label="Beranda Mie Koncoan" className="shrink-0">
          <Logo priority className="h-11 w-auto sm:h-12" />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-full px-4 py-2 text-sm font-bold transition hover:bg-lemon"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={open}
            aria-label={`Buka keranjang (${count} item)`}
            className="relative grid size-11 place-items-center rounded-full border-2 border-grape-ink bg-white shadow-pop-sm transition active:translate-x-px active:translate-y-px active:shadow-none"
          >
            <ShoppingBag className="size-5" strokeWidth={2.4} />
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 grid min-w-5.5 place-items-center rounded-full border-2 border-grape-ink bg-chili px-1 text-[11px] font-extrabold text-white"
              >
                {count}
              </motion.span>
            )}
          </button>
          <Link
            href="/order"
            className="hidden h-11 items-center rounded-full border-2 border-grape-ink bg-grape px-5 text-sm font-bold text-white shadow-pop-sm transition hover:-translate-y-0.5 hover:shadow-pop sm:inline-flex"
          >
            Pesan Sekarang
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
