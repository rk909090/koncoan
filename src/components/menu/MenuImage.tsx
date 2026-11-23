import Image from "next/image";
import { CupSoda, Soup, UtensilsCrossed } from "lucide-react";
import type { MenuItem } from "@/data/menu";
import { cn } from "@/lib/cn";

const PLACEHOLDER: Record<MenuItem["category"], { icon: typeof Soup; bg: string }> = {
  mie: { icon: Soup, bg: "bg-lemon" },
  pendamping: { icon: UtensilsCrossed, bg: "bg-sky" },
  minuman: { icon: CupSoda, bg: "bg-lavender" },
};

/**
 * Foto menu (mengisi parent yang `relative`). Produk baru dari panel admin
 * belum punya foto → tampilkan ubin ikon kategori, bukan gambar rusak.
 */
export function MenuImage({
  item,
  sizes,
  alt = item.name,
  className,
}: {
  item: Pick<MenuItem, "name" | "image" | "category">;
  sizes: string;
  alt?: string;
  className?: string;
}) {
  if (item.image) {
    return <Image src={item.image} alt={alt} fill sizes={sizes} className={cn("object-cover", className)} />;
  }
  const { icon: Icon, bg } = PLACEHOLDER[item.category];
  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn("absolute inset-0 grid place-items-center text-grape-ink/70", bg)}
    >
      <Icon className="size-1/3 max-h-24 max-w-24" strokeWidth={1.8} />
    </div>
  );
}
