import { Sparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** Pita teks berjalan (marquee) — murni CSS, ringan di mobile. */
export function Marquee({
  items,
  className,
  reverse = false,
}: {
  items: string[];
  className?: string;
  reverse?: boolean;
}) {
  const row = (
    <div className="flex shrink-0 items-center gap-6 pr-6" aria-hidden>
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-6 whitespace-nowrap">
          <span>{t}</span>
          <Sparkle className="size-5 shrink-0" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn("overflow-hidden border-y-2 border-grape-ink py-3", className)}>
      <span className="sr-only">{items.join(", ")}</span>
      <div className={cn("flex w-max font-display text-2xl sm:text-3xl", reverse ? "animate-marquee-rev" : "animate-marquee")}>
        {row}
        {row}
      </div>
    </div>
  );
}
