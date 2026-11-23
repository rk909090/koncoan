"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";
import type { MenuItem } from "@/data/menu";
import { formatRp } from "@/lib/site";
import { useCart } from "@/store/cart";
import { QtyControl } from "@/components/ui/QtyControl";
import { MenuImage } from "./MenuImage";
import { cn } from "@/lib/cn";

const TILTS = ["-rotate-1", "rotate-1", "-rotate-[0.5deg]", "rotate-[0.5deg]"];

/** Kartu menu gaya "stiker" untuk grid di landing page. */
export function MenuCard({ item, index = 0 }: { item: MenuItem; index?: number }) {
  const openDetail = useCart((s) => s.openDetail);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: (index % 4) * 0.05 }}
      whileHover={{ y: -6, rotate: 0 }}
      className={cn(
        "group relative flex cursor-pointer flex-col rounded-[26px] border-2 border-grape-ink bg-white p-2.5 shadow-pop transition-shadow hover:shadow-pop-lg",
        TILTS[index % TILTS.length],
      )}
      onClick={() => openDetail(item.id)}
    >
      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-[#fff4dc]">
        <MenuImage
          item={item}
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 280px"
          className="transition-transform duration-500 ease-out group-hover:scale-110"
        />
        {(item.tag || item.portion) && (
          <span
            className={cn(
              "absolute top-2 left-2 rotate-[-4deg] rounded-full border-2 border-grape-ink px-2.5 py-0.5 text-[11px] font-extrabold shadow-pop-sm",
              item.tag === "Pedas" ? "bg-chili text-white" : item.tag ? "bg-lime" : "bg-sky",
            )}
          >
            {item.tag ?? item.portion}
          </span>
        )}
        {item.spicy && item.tag !== "Pedas" && (
          <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full border-2 border-grape-ink bg-chili text-white">
            <Flame className="size-4" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1">
        <h3 className="font-display text-lg leading-tight sm:text-xl">{item.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-grape-ink/65 sm:text-sm">{item.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <span className="font-display text-xl text-grape sm:text-2xl">{formatRp(item.price)}</span>
          <QtyControl id={item.id} name={item.name} size="sm" />
        </div>
      </div>
    </motion.article>
  );
}
