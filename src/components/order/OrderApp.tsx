"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowLeft, Flame, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, illustrationNote, type CategoryId, type MenuItem } from "@/data/menu";
import { formatRp, SITE } from "@/lib/site";
import { cartTotals, useCart } from "@/store/cart";
import { QtyControl } from "@/components/ui/QtyControl";
import { MenuImage } from "@/components/menu/MenuImage";
import { useMenu } from "@/components/menu/MenuProvider";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";

/** Normalisasi untuk pencarian: huruf kecil, tanpa aksen. */
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function OrderApp() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<CategoryId>("mie");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipsRef = useRef<HTMLDivElement>(null);
  const lockSpy = useRef(false);

  const lines = useCart((s) => s.lines);
  const openCart = useCart((s) => s.open);
  const { items: menuItems, byId } = useMenu();
  const { count } = cartTotals(lines, byId);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return menuItems;
    return menuItems.filter((m) => norm(`${m.name} ${m.description} ${m.keywords ?? ""}`).includes(q));
  }, [query, menuItems]);

  const groups = CATEGORIES.map((c) => ({
    ...c,
    items: filtered.filter((m) => m.category === c.id),
  })).filter((g) => g.items.length > 0);

  // Analytics: daftar menu dilihat (sekali saat halaman dibuka)
  useEffect(() => {
    track.viewItemList("order_page", "Halaman Order", menuItems);
  }, [menuItems]);

  // Analytics: pencarian (debounce agar tidak terkirim per huruf)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = window.setTimeout(() => track.search(q), 900);
    return () => window.clearTimeout(t);
  }, [query]);

  // Scroll-spy: tandai kategori yang sedang terlihat
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (lockSpy.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.getAttribute("data-cat") as CategoryId);
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [query]);

  // Pastikan chip aktif terlihat di bar horizontal
  useEffect(() => {
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    chip?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const jumpTo = (id: CategoryId) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    setActive(id);
    lockSpy.current = true;
    const top = el.getBoundingClientRect().top + window.scrollY - 128;
    window.scrollTo({ top, behavior: "smooth" });
    window.setTimeout(() => (lockSpy.current = false), 700);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-3xl pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b-2 border-grape-ink bg-cream/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-2">
          <Link
            href="/"
            aria-label="Kembali ke beranda"
            className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-grape-ink bg-white shadow-pop-sm active:translate-x-px active:translate-y-px active:shadow-none"
          >
            <ArrowLeft className="size-5" strokeWidth={2.6} />
          </Link>
          <Logo className="h-9 w-auto" />
          <div className="ml-auto">
            <button
              type="button"
              onClick={openCart}
              aria-label={`Buka keranjang (${count} item)`}
              className="relative grid size-10 place-items-center rounded-full border-2 border-grape-ink bg-lemon shadow-pop-sm active:translate-x-px active:translate-y-px active:shadow-none"
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
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <label className="relative block">
            <span className="sr-only">Cari menu</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-grape-ink/50" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari mie, wonton, kopi…"
              enterKeyHint="search"
              className="h-12 w-full rounded-full border-2 border-grape-ink bg-white pr-11 pl-12 text-base outline-none placeholder:text-grape-ink/40 focus:ring-4 focus:ring-lemon [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Hapus pencarian"
                className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-grape-ink/10"
              >
                <X className="size-4" strokeWidth={3} />
              </button>
            )}
          </label>
        </div>

        {/* Category chips */}
        <LayoutGroup id="order-chips">
          <div ref={chipsRef} className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2.5" role="tablist" aria-label="Kategori">
            {CATEGORIES.map((c) => {
              const disabled = !groups.some((g) => g.id === c.id);
              const isActive = active === c.id && !disabled;
              return (
                <button
                  key={c.id}
                  data-chip={c.id}
                  role="tab"
                  aria-selected={isActive}
                  disabled={disabled}
                  onClick={() => jumpTo(c.id)}
                  className={cn(
                    "relative shrink-0 rounded-full border-2 border-grape-ink px-4 py-1.5 text-sm font-bold whitespace-nowrap transition-colors disabled:opacity-35",
                    isActive ? "text-white" : "bg-white",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="order-chip"
                      className="absolute inset-0 rounded-full bg-grape"
                      transition={{ type: "spring", stiffness: 450, damping: 34 }}
                    />
                  )}
                  <span className="relative">
                    {c.emoji} {c.short}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </header>

      {/* Banner */}
      {!query && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-3 mt-4 overflow-hidden rounded-[26px] border-2 border-grape-ink bg-grape p-5 text-white shadow-pop"
        >
          <div aria-hidden className="absolute -top-16 -right-10 size-48 rounded-full bg-magenta" />
          <div aria-hidden className="absolute -right-6 -bottom-20 size-40 rounded-full bg-sky/40" />
          <div className="relative max-w-[62%]">
            <p className="font-display text-sm text-lemon">Halo, konco! 👋</p>
            <h1 className="mt-1 font-display text-3xl leading-[1.05]">Mau makan apa hari ini?</h1>
            <p className="mt-2 text-xs text-white/75">Tap + untuk tambah. Pesanan dikirim lewat WhatsApp.</p>
          </div>
          <motion.div
            initial={{ rotate: 20, scale: 0.6, opacity: 0 }}
            animate={{ rotate: -8, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 12, delay: 0.15 }}
            className="absolute top-1/2 -right-4 size-36 -translate-y-1/2 overflow-hidden rounded-full border-2 border-grape-ink bg-[#fff4dc] shadow-pop sm:right-4 sm:size-40"
          >
            <Image src="/menu/konco-spesial.webp" alt="" fill sizes="160px" className="object-cover" preload />
          </motion.div>
        </motion.div>
      )}

      {/* Menu list */}
      <div className="px-3">
        <AnimatePresence initial={false}>
          {groups.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center"
            >
              <p className="text-5xl">🍜❓</p>
              <p className="mt-3 font-display text-xl">Menu “{query}” belum ada</p>
              <p className="text-sm text-grape-ink/60">Coba kata lain, mis. “wonton” atau “milk”.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {groups.map((g) => (
          <section
            key={g.id}
            ref={(el) => {
              sectionRefs.current[g.id] = el;
            }}
            data-cat={g.id}
            className="pt-6"
            aria-labelledby={`h-${g.id}`}
          >
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id={`h-${g.id}`} className="font-display text-2xl">
                {g.emoji} {g.label}
              </h2>
              <span className="text-xs font-bold text-grape-ink/50">{g.items.length} menu</span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {g.items.map((item, i) => (
                <OrderRow key={item.id} item={item} index={i} />
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-10 text-center text-xs text-grape-ink/50">
          {illustrationNote(menuItems) ? `${illustrationNote(menuItems)} ` : ""}Pertanyaan? WA {SITE.phoneDisplay}
        </p>
      </div>
    </div>
  );
}

function OrderRow({ item, index }: { item: MenuItem; index: number }) {
  const openDetail = useCart((s) => s.openDetail);
  const inCart = useCart((s) => s.lines.some((l) => l.id === item.id));

  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35, delay: Math.min(index, 4) * 0.04 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => openDetail(item.id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openDetail(item.id))}
        className={cn(
          "flex h-full cursor-pointer gap-3 rounded-[22px] border-2 border-grape-ink bg-white p-2.5 transition-shadow active:scale-[0.99]",
          inCart ? "shadow-[4px_4px_0_0_var(--color-grape)]" : "shadow-pop-sm",
        )}
      >
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-[#fff4dc] sm:size-28">
          <MenuImage item={item} sizes="112px" />
          {item.portion && (
            <span className="absolute bottom-1 left-1 rounded-full border border-grape-ink bg-sky px-1.5 text-[10px] font-extrabold">
              {item.portion}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <div className="flex items-start gap-1.5">
            <h3 className="font-bold leading-tight">{item.name}</h3>
            {item.spicy && <Flame className="mt-0.5 size-4 shrink-0 text-chili" aria-label="Pedas" />}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-grape-ink/60">{item.description}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className="font-display text-lg text-grape">{formatRp(item.price)}</span>
            <QtyControl id={item.id} name={item.name} size="sm" />
          </div>
        </div>
      </div>
    </motion.li>
  );
}
