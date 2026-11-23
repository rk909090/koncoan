"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { MapPin, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import { MENU, MENU_BY_ID } from "@/data/menu";
import { formatRp, SITE } from "@/lib/site";
import { useCart } from "@/store/cart";
import { Sparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const combo = [MENU_BY_ID["konco-biasa"], MENU_BY_ID["konco-ice-tea"]];
const comboTotal = combo.reduce((a, b) => a + b.price, 0);
const countMie = MENU.filter((m) => m.category === "mie").length;
const countSide = MENU.filter((m) => m.category === "pendamping").length;
const countDrink = MENU.filter((m) => m.category === "minuman").length;

function Tile({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: -1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 160, damping: 20, delay }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative overflow-hidden rounded-[28px] border-2 border-grape-ink p-6 shadow-pop",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function Highlights() {
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);

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
          {/* Paket hemat */}
          <Tile className="col-span-2 row-span-2 bg-grape text-white">
            <Sparkle className="absolute top-5 right-5 size-8 animate-wiggle text-lemon" />
            <p className="font-display text-lg text-lemon">Combo hemat ala Koncoan</p>
            <h3 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">
              Mie + Es Teh
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
                  <Image src={c.image} alt={c.name} fill sizes="160px" className="object-cover" />
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

          <Tile className="bg-sky" delay={0.05}>
            <p className="font-display text-6xl leading-none">{countMie}</p>
            <p className="mt-2 font-bold">Menu mie & wonton</p>
            <p className="text-sm opacity-70">Dari Konco Biasa sampai Wonton Kuah Pedas.</p>
          </Tile>

          <Tile className="bg-lemon" delay={0.1}>
            <p className="font-display text-6xl leading-none">{countDrink}</p>
            <p className="mt-2 font-bold">Konco Fresh Drink</p>
            <p className="text-sm opacity-70">Mulai {formatRp(MENU_BY_ID["konco-ice-tea"].price)} aja.</p>
          </Tile>

          <Tile className="bg-white" delay={0.15}>
            <Smartphone className="size-9" strokeWidth={2.2} />
            <p className="mt-3 font-bold">Order dari HP</p>
            <p className="text-sm opacity-70">Pilih menu di web, pesanan otomatis tersusun rapi di WhatsApp.</p>
          </Tile>

          <Tile className="bg-lime" delay={0.2}>
            <p className="font-display text-6xl leading-none">{countSide}</p>
            <p className="mt-2 font-bold">Menu pendamping</p>
            <p className="text-sm opacity-70">Gohyong, rolade, tahu bakso & dimsum.</p>
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
