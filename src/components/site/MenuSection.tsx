"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, type CategoryId } from "@/data/menu";
import { MenuCard } from "@/components/menu/MenuCard";
import { useMenu } from "@/components/menu/MenuProvider";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";

export function MenuSection() {
  const [selected, setActive] = useState<CategoryId>("mie");
  const { items: menu } = useMenu();
  // hanya kategori yang punya produk aktif; bila kategori terpilih kosong, pindah ke yang pertama
  const cats = CATEGORIES.filter((c) => menu.some((m) => m.category === c.id));
  const active = cats.some((c) => c.id === selected) ? selected : (cats[0]?.id ?? selected);
  const cat = CATEGORIES.find((c) => c.id === active)!;
  const items = menu.filter((m) => m.category === active);

  // Analytics: kirim view_item_list saat grid benar-benar terlihat, sekali per kategori
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { amount: 0.25 });
  const tracked = useRef(new Set<CategoryId>());
  useEffect(() => {
    if (!gridInView || tracked.current.has(active)) return;
    tracked.current.add(active);
    track.viewItemList(
      `home_${active}`,
      `Beranda - ${CATEGORIES.find((c) => c.id === active)!.label}`,
      menu.filter((m) => m.category === active),
    );
  }, [active, gridInView, menu]);

  return (
    <section id="menu" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block -rotate-2 rounded-full border-2 border-grape-ink bg-sky px-4 py-1 text-sm font-extrabold shadow-pop-sm"
            >
              Daftar Menu
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 font-display text-5xl leading-none sm:text-6xl"
            >
              Menu <span className="text-grape">KonCOan</span>
            </motion.h2>
            <AnimatePresence mode="wait">
              <motion.p
                key={cat.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 text-grape-ink/70"
              >
                {cat.tagline}
              </motion.p>
            </AnimatePresence>
          </div>

          <LayoutGroup id="menu-tabs">
            <div
              role="tablist"
              aria-label="Kategori menu"
              className="no-scrollbar -mx-5 flex max-w-[100vw] gap-1 overflow-x-auto px-5 md:mx-0 md:px-0"
            >
              <div className="flex gap-1 rounded-full border-2 border-grape-ink bg-white p-1 shadow-pop-sm">
                {cats.map((c) => (
                  <button
                    key={c.id}
                    role="tab"
                    aria-selected={active === c.id}
                    onClick={() => setActive(c.id)}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors sm:px-5",
                      active === c.id ? "text-white" : "text-grape-ink hover:bg-lavender",
                    )}
                  >
                    {active === c.id && (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-full bg-grape"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">
                      {c.emoji} {c.short}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </LayoutGroup>
        </div>

        <motion.div ref={gridRef} layout className="mt-10 grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <Link
            href="/order"
            className="group inline-flex h-14 items-center gap-2 rounded-full border-2 border-grape-ink bg-lemon pr-2 pl-6 text-lg font-bold shadow-pop transition hover:-translate-y-1 hover:shadow-pop-lg"
          >
            Buka halaman order
            <span className="grid size-10 place-items-center rounded-full bg-grape-ink text-lemon transition group-hover:translate-x-1">
              <ArrowRight className="size-5" strokeWidth={3} />
            </span>
          </Link>
          <p className="text-xs text-grape-ink/55">Foto menu adalah ilustrasi.</p>
        </div>
      </div>
    </section>
  );
}
