"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { formatRp } from "@/lib/site";
import { Burst, Sparkle } from "@/components/ui/icons";
import { useMenu } from "@/components/menu/MenuProvider";

/** Harga termurah di satu kategori; null bila kategori kosong. */
const minPrice = (items: { category: string; price: number }[], cat: string) => {
  const p = items.filter((m) => m.category === cat).map((m) => m.price);
  return p.length ? Math.min(...p) : null;
};

const WORDS = ["Mie", "nya", "Anak", "Muda"];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { items: menu } = useMenu();
  const minMie = minPrice(menu, "mie");
  const minDrink = minPrice(menu, "minuman");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yImg = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);
  const rotBadge = useTransform(scrollYProgress, [0, 1], [0, 160]);

  // efek parallax mengikuti pointer
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 18 });
  const sy = useSpring(my, { stiffness: 80, damping: 18 });

  const onMove = (e: PointerEvent) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section
      ref={ref}
      onPointerMove={onMove}
      className="grain relative isolate overflow-hidden pt-28 pb-16 sm:pt-32 lg:pb-24"
    >
      {/* Blob ungu seperti pojok brosur */}
      <motion.div
        aria-hidden
        className="absolute -top-56 -right-56 -z-10 size-[420px] rounded-full bg-gradient-to-br from-magenta to-grape-deep opacity-90 blur-[2px] sm:-top-40 sm:-right-40 sm:size-[720px]"
        animate={reduce ? undefined : { borderRadius: ["50% 40% 60% 50%", "40% 60% 45% 55%", "50% 40% 60% 50%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <div aria-hidden className="dots absolute inset-0 -z-20 opacity-70" />
      <div aria-hidden className="absolute -bottom-24 -left-24 -z-10 size-72 rounded-full bg-lemon/70 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-grape-ink bg-lemon px-4 py-1.5 font-display text-lg shadow-pop-sm"
          >
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-chili opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-chili" />
            </span>
            READY!
          </motion.div>

          <h1 className="font-display text-[clamp(3.2rem,13vw,6.6rem)] leading-[0.92] tracking-tight">
            {WORDS.map((w, i) => (
              <motion.span
                key={w}
                initial={{ y: 60, opacity: 0, rotate: 8 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.15 + i * 0.09 }}
                className={
                  "mr-[0.18em] inline-block " +
                  (w === "Anak" ? "relative text-grape" : w === "Muda" ? "relative" : "")
                }
              >
                {w === "Muda" ? (
                  <>
                    <span className="relative z-10">{w}</span>
                    <motion.span
                      aria-hidden
                      className="absolute inset-x-[-0.08em] bottom-[0.06em] -z-0 h-[0.42em] origin-left -rotate-2 rounded-md bg-lemon"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.75, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                    />
                  </>
                ) : (
                  w
                )}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-5 max-w-md text-base leading-relaxed text-grape-ink/75 sm:text-lg"
          >
            Mie, wonton, dimsum & <b className="text-grape-ink">Konco Fresh Drink</b>. Harga bersahabat,
            rasa bikin balik lagi. Pesan langsung dari HP, kirim via WhatsApp.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/order"
              className="group inline-flex h-14 items-center gap-2 rounded-full border-2 border-grape-ink bg-grape pr-2 pl-6 text-lg font-bold text-white shadow-pop transition hover:-translate-y-1 hover:shadow-pop-lg active:translate-y-0 active:shadow-pop-sm"
            >
              Pesan Sekarang
              <span className="grid size-10 place-items-center rounded-full bg-lemon text-grape-ink transition group-hover:rotate-[-45deg]">
                <ArrowRight className="size-5" strokeWidth={3} />
              </span>
            </Link>
            <Link
              href="#menu"
              className="inline-flex h-14 items-center gap-2 rounded-full border-2 border-grape-ink bg-white px-6 text-lg font-bold shadow-pop-sm transition hover:-translate-y-1 hover:shadow-pop"
            >
              Lihat Menu <ArrowDown className="size-5" strokeWidth={2.6} />
            </Link>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            {minMie !== null && <PriceChip label="Mie mulai" value={formatRp(minMie)} className="bg-sky" />}
            {minDrink !== null && <PriceChip label="Minum mulai" value={formatRp(minDrink)} className="bg-lime" />}
            <PriceChip label="Total menu" value={`${menu.length} pilihan`} className="bg-lavender" />
          </motion.dl>
        </div>

        {/* Visual */}
        <motion.div style={{ y: yImg }} className="relative mx-auto w-full max-w-[520px]">
          <Floating mx={sx} my={sy} depth={-18} className="relative z-10">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.2 }}
              className="relative aspect-square overflow-hidden border-[3px] border-grape-ink bg-[#fff4dc] shadow-pop-lg"
              style={{ borderRadius: "46% 54% 42% 58% / 52% 44% 56% 48%" }}
            >
              <Image
                src="/menu/hero.webp"
                alt="Semangkuk mie Koncoan dengan sumpit mengangkat mie"
                fill
                preload
                sizes="(max-width: 1024px) 90vw, 520px"
                className="object-cover"
              />
            </motion.div>
          </Floating>

          {/* Badge teks berputar */}
          <motion.div
            style={{ rotate: rotBadge }}
            className="absolute -top-4 -left-3 z-20 size-28 sm:-left-8 sm:size-32"
            aria-hidden
          >
            <div className="relative size-full animate-spin-slow rounded-full border-2 border-grape-ink bg-lemon shadow-pop">
              <svg viewBox="0 0 100 100" className="size-full">
                <defs>
                  <path id="circ" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
                </defs>
                <text className="fill-grape-ink font-display text-[10px]">
                  <textPath href="#circ" textLength="224" lengthAdjust="spacing">
                    MIE KONCOAN • MIE NYA ANAK MUDA •
                  </textPath>
                </text>
              </svg>
              <span className="absolute inset-0 grid place-items-center text-3xl">🍜</span>
            </div>
          </motion.div>

          {/* Kartu mengambang */}
          <Floating mx={sx} my={sy} depth={30} className="absolute -bottom-6 -left-2 z-20 w-36 sm:-left-10 sm:w-44">
            <FloatCard src="/menu/palm-sugar-coffee-milk.webp" name="Palm Sugar Coffee Milk" price={8000} rotate={-8} delay={0.7} />
          </Floating>
          <Floating mx={sx} my={sy} depth={40} className="absolute -right-2 bottom-10 z-20 w-36 sm:-right-8 sm:w-44">
            <FloatCard src="/menu/dimsum-mix.webp" name="Dimsum Mix" price={11000} rotate={7} delay={0.85} />
          </Floating>

          <Sparkle className="absolute top-6 right-2 size-10 animate-wiggle text-chili" />
          <Sparkle className="absolute top-20 -right-4 size-5 text-chili" />
          <Burst className="absolute -bottom-10 left-1/2 size-9 animate-spin-slow text-grape" />
        </motion.div>
      </div>
    </section>
  );
}

function PriceChip({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className={`rounded-2xl border-2 border-grape-ink px-4 py-2 shadow-pop-sm ${className}`}>
      <dt className="text-[11px] font-bold tracking-wide uppercase opacity-70">{label}</dt>
      <dd className="font-display text-xl leading-tight">{value}</dd>
    </div>
  );
}

function Floating({
  mx,
  my,
  depth,
  className,
  children,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  depth: number;
  className?: string;
  children: ReactNode;
}) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);
  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}

function FloatCard({
  src,
  name,
  price,
  rotate,
  delay,
}: {
  src: string;
  name: string;
  price: number;
  rotate: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ type: "spring", stiffness: 200, damping: 14, delay }}
    >
      <div
        className="animate-float rounded-2xl border-2 border-grape-ink bg-white p-1.5 shadow-pop"
        style={{ animationDelay: `${delay}s` }}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl bg-[#fff4dc]">
          <Image src={src} alt={name} fill sizes="176px" className="object-cover" />
        </div>
        <p className="mt-1 truncate px-1 text-[11px] font-bold sm:text-xs">{name}</p>
        <p className="px-1 font-display text-sm text-grape">{formatRp(price)}</p>
      </div>
    </motion.div>
  );
}
