"use client";

import { motion } from "motion/react";
import { MapPin, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import type { MenuItem } from "@/data/menu";
import { formatRp, SITE } from "@/lib/site";
import { useCart } from "@/store/cart";
import { Sparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { MenuImage } from "@/components/menu/MenuImage";
import { useMenu } from "@/components/menu/MenuProvider";

/** Item pilihan (bila masih dijual), kalau tidak ada pakai yang termurah di kategorinya. */
function pick(items: MenuItem[], byId: Record<string, MenuItem>, preferId: string, cat: MenuItem["category"]) {
  const preferred = byId[preferId];
  if (preferred && preferred.category === cat) return preferred;
  return items.filter((m) => m.category === cat).sort((a, b) => a.price - b.price)[0];
}

/** "A, B & C" */
const joinNames = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;

function Tile({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: -1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 160, damping: 20, delay }}
      whileHover={{ y: -4 }}
      className={cn("relative overflow-hidden rounded-[28px] border-2 border-grape-ink p-6 shadow-pop", className)}
    >
      {children}
    </motion.div>
  );
}

export function Highlights() {
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);
  const { items, byId } = useMenu();
  const mies = items.filter((m) => m.category === "mie");
  const sides = items.filter((m) => m.category === "pendamping");
  const drinks = items.filter((m) => m.category === "minuman");
  const comboMie = pick(items, byId, "konco-biasa", "mie");
  const comboDrink = pick(items, byId, "konco-ice-tea", "minuman");
  const combo = comboMie && comboDrink ? [comboMie, comboDrink] : null;
  const comboTotal = combo ? combo.reduce((a, b) => a + b.price, 0) : 0;
  const cheapestDrink = drinks.length ? Math.min(...drinks.map((d) => d.price)) : null;

  return (
    <section id="kenapa" className="relative scroll-mt-20 bg-lavender py-20 sm:py-28">
      <div aria-hidden className="dots absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-5">
        <p className="inline-block rotate-2 rounded-full border-2 border-grape-ink bg-lemon px-4 py-1 text-sm font-extrabold shadow-pop-sm">
          Kenapa Koncoan?
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-5xl leading-none sm:text-6xl">
          Kenyang, hemat, <span className="text-grape">rame bareng konco.</span>
        </h2>

        <div className="mt-10 grid auto-rows-[minmax(170px,auto)] grid-cols-2 gap-4 md:grid-cols-4">
          {/* Paket hemat (hanya bila ada mie & minuman yang dijual) */}
          {combo && (
            <Tile className="col-span-2 row-span-2 bg-grape text-white">
              <Sparkle className="absolute top-5 right-5 size-8 animate-wiggle text-lemon" />
              <p className="font-display text-lg text-lemon">Combo hemat ala Koncoan</p>
              <h3 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">
                Mie + {comboDrink!.id === "konco-ice-tea" ? "Es Teh" : "Minum"}
                <br />
                cuma {formatRp(comboTotal)}
              </h3>
              <p className="mt-2 max-w-xs text-sm text-white/75">
                {combo.map((c) => `${c.name} (${formatRp(c.price)})`).join(" + ")}. Pas buat makan siang pulang sekolah.
              </p>
              <div className="mt-6 flex items-end gap-3">
                {combo.map((c, i) => (
                  <motion.div
                    key={c.id}
                    whileHover={{ rotate: i ? 6 : -6, scale: 1.05 }}
                    className={cn(
                      "relative aspect-square w-32 overflow-hidden rounded-3xl border-2 border-grape-ink bg-[#fff4dc] shadow-pop sm:w-40",
                      i ? "rotate-3" : "-rotate-3",
                    )}
                  >
                    <MenuImage item={c} sizes="160px" />
                  </motion.div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  combo.forEach((c) => add(c.id));
                  open();
                }}
                className="mt-6 inline-flex h-12 items-center rounded-full border-2 border-grape-ink bg-lemon px-5 font-bold text-grape-ink shadow-pop-sm transition hover:-translate-y-0.5 active:translate-y-0"
              >
                Tambah combo ke keranjang
              </button>
            </Tile>
          )}

          <Tile className="bg-sky" delay={0.05}>
            <p className="font-display text-6xl leading-none">{mies.length}</p>
            <p className="mt-2 font-bold">Menu mie & wonton</p>
            {mies.length > 1 && (
              <p className="text-sm opacity-70">
                Dari {mies[0].name} sampai {mies[mies.length - 1].name}.
              </p>
            )}
          </Tile>

          <Tile className="bg-lemon" delay={0.1}>
            <p className="font-display text-6xl leading-none">{drinks.length}</p>
            <p className="mt-2 font-bold">Konco Fresh Drink</p>
            {cheapestDrink !== null && <p className="text-sm opacity-70">Mulai {formatRp(cheapestDrink)} aja.</p>}
          </Tile>

          <Tile className="bg-white" delay={0.15}>
            <Smartphone className="size-9" strokeWidth={2.2} />
            <p className="mt-3 font-bold">Order dari HP</p>
            <p className="text-sm opacity-70">Pilih menu di web, pesanan otomatis tersusun rapi di WhatsApp.</p>
          </Tile>

          <Tile className="bg-lime" delay={0.2}>
            <p className="font-display text-6xl leading-none">{sides.length}</p>
            <p className="mt-2 font-bold">Menu pendamping</p>
            {sides.length > 0 && <p className="text-sm opacity-70">{joinNames(sides.map((s) => s.name))}.</p>}
          </Tile>

          <Tile className="col-span-2 bg-chili text-white md:col-span-4" delay={0.25}>
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 animate-float place-items-center rounded-2xl border-2 border-grape-ink bg-white text-chili">
                <MapPin className="size-7" strokeWidth={2.4} />
              </span>
              <div>
                <p className="font-display text-2xl leading-tight sm:text-3xl">Spot nongkrong anak muda</p>
                <p className="mt-1 text-sm text-white/85">{SITE.address}.</p>
              </div>
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}
