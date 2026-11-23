import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/* Komponen UI admin bersama — gaya "stiker" yang sama dengan situs publik. */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
      <div className="min-w-0">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-grape-ink/65">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-3xl border-2 border-grape-ink bg-white p-4 shadow-pop-sm sm:p-5", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="font-display text-xl">{children}</h2>
      {right}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "white",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: "white" | "lemon" | "sky" | "lime" | "lavender" | "grape";
}) {
  const tones = {
    white: "bg-white",
    lemon: "bg-lemon",
    sky: "bg-sky",
    lime: "bg-lime",
    lavender: "bg-lavender",
    grape: "bg-grape text-white",
  } as const;
  return (
    <div className={cn("rounded-3xl border-2 border-grape-ink p-4 shadow-pop-sm", tones[tone])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-extrabold tracking-wide uppercase opacity-70">{label}</p>
        {Icon && <Icon className="size-5 opacity-70" />}
      </div>
      <p className="mt-2 text-2xl leading-tight font-extrabold tracking-tight sm:text-[1.7rem]">{value}</p>
      {hint && <p className="mt-1 text-xs opacity-75">{hint}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "danger" | "info" | "warning" | "grape";
}) {
  const tones = {
    neutral: "bg-white",
    success: "bg-lime",
    danger: "bg-chili text-white",
    info: "bg-sky",
    warning: "bg-lemon",
    grape: "bg-grape text-white",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 border-grape-ink px-2.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-grape-ink font-bold transition active:translate-x-px active:translate-y-px active:shadow-none disabled:pointer-events-none disabled:opacity-50";
const btnTones = {
  primary: "bg-grape text-white shadow-pop-sm hover:-translate-y-0.5 hover:shadow-pop",
  secondary: "bg-white shadow-pop-sm hover:-translate-y-0.5 hover:shadow-pop",
  accent: "bg-lemon shadow-pop-sm hover:-translate-y-0.5 hover:shadow-pop",
  danger: "bg-chili text-white shadow-pop-sm hover:-translate-y-0.5 hover:shadow-pop",
  ghost: "border-transparent hover:bg-lavender",
} as const;
const btnSizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-sm", lg: "h-13 px-6 text-base" } as const;

export function buttonClass(tone: keyof typeof btnTones = "primary", size: keyof typeof btnSizes = "md") {
  return cn(btnBase, btnTones[tone], btnSizes[size]);
}

export function ButtonLink({
  href,
  tone = "primary",
  size = "md",
  children,
  className,
  prefetch,
}: {
  href: string;
  tone?: keyof typeof btnTones;
  size?: keyof typeof btnSizes;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
}) {
  return (
    <Link href={href} prefetch={prefetch} className={cn(buttonClass(tone, size), className)}>
      {children}
    </Link>
  );
}

export const inputClass =
  "h-11 w-full rounded-2xl border-2 border-grape-ink bg-white px-3.5 text-sm outline-none placeholder:text-grape-ink/40 focus:ring-4 focus:ring-lemon disabled:opacity-60";

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-grape-ink/55">{hint}</span>}
    </label>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-grape-ink/30 px-6 py-12 text-center">
      {Icon && (
        <span className="grid size-16 place-items-center rounded-full border-2 border-grape-ink bg-lemon shadow-pop-sm">
          <Icon className="size-7" />
        </span>
      )}
      <p className="mt-4 font-display text-xl">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-grape-ink/65">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-3xl border-2 border-grape-ink bg-white shadow-pop-sm">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export const thClass = "border-b-2 border-grape-ink bg-lavender/60 px-4 py-3 text-[11px] font-extrabold tracking-wide uppercase";
export const tdClass = "border-b border-grape-ink/10 px-4 py-3 align-middle";

/** Skeleton sederhana untuk loading.tsx */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Memuat">
      <div className="mb-6 h-10 w-64 rounded-2xl bg-grape-ink/10" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-grape-ink/10" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 rounded-2xl bg-grape-ink/10" />
        ))}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-2" aria-label="Halaman">
      <span className="text-sm text-grape-ink/60">
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <ButtonLink href={makeHref(page - 1)} tone="secondary" size="sm">
            ← Sebelumnya
          </ButtonLink>
        ) : null}
        {page < totalPages ? (
          <ButtonLink href={makeHref(page + 1)} tone="secondary" size="sm">
            Berikutnya →
          </ButtonLink>
        ) : null}
      </div>
    </nav>
  );
}
