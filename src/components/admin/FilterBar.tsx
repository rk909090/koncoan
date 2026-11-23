"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { CalendarDays, Filter, RotateCcw } from "lucide-react";
import { DATE_PRESETS } from "@/lib/admin/filters";
import { cn } from "@/lib/cn";

export type SelectFilter = {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  allLabel?: string;
};

const ctl =
  "h-10 w-full rounded-xl border-2 border-grape-ink bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-lemon";

/**
 * Bilah filter standar: preset rentang tanggal / tanggal custom + filter dropdown
 * + pencarian. Semua nilai disimpan di URL (bisa di-bookmark & dibagikan).
 */
export function FilterBar({
  preset,
  from,
  to,
  selects = [],
  search,
  extra,
}: {
  preset: string;
  from: string;
  to: string;
  selects?: SelectFilter[];
  search?: { name: string; value?: string; placeholder: string };
  extra?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [range, setRange] = useState(preset);
  const [dFrom, setFrom] = useState(from);
  const [dTo, setTo] = useState(to);

  const apply = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const params = new URLSearchParams();
    const r = String(fd.get("range") || "today");
    if (r === "custom") {
      params.set("from", String(fd.get("from") || from));
      params.set("to", String(fd.get("to") || to));
    } else params.set("range", r);
    for (const s of selects) {
      const v = String(fd.get(s.name) || "");
      if (v) params.set(s.name, v);
    }
    if (search) {
      const v = String(fd.get(search.name) || "").trim();
      if (v) params.set(search.name, v);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      className={cn(
        "mb-6 rounded-3xl border-2 border-grape-ink bg-white p-3 shadow-pop-sm transition-opacity sm:p-4 print:hidden",
        pending && "opacity-60",
      )}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <label className="col-span-2 block md:col-span-1">
          <span className="mb-1 flex items-center gap-1 text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">
            <CalendarDays className="size-3.5" /> Periode
          </span>
          <select
            name="range"
            value={range}
            onChange={(e) => {
              setRange(e.target.value);
              if (e.target.value !== "custom") apply(e.currentTarget.form!);
            }}
            className={ctl}
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        {range === "custom" && (
          <>
            <label className="block">
              <span className="mb-1 block text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Dari</span>
              <input type="date" name="from" value={dFrom} max={dTo} onChange={(e) => setFrom(e.target.value)} className={ctl} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Sampai</span>
              <input type="date" name="to" value={dTo} min={dFrom} onChange={(e) => setTo(e.target.value)} className={ctl} />
            </label>
          </>
        )}
        {selects.map((s) => (
          <label key={s.name} className="block">
            <span className="mb-1 block text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">{s.label}</span>
            <select name={s.name} defaultValue={s.value ?? ""} className={ctl} onChange={(e) => apply(e.currentTarget.form!)}>
              <option value="">{s.allLabel ?? "Semua"}</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        {search && (
          <label className="col-span-2 block">
            <span className="mb-1 block text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Cari</span>
            <input type="search" name={search.name} defaultValue={search.value} placeholder={search.placeholder} className={ctl} />
          </label>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-grape-ink bg-grape px-4 text-sm font-bold text-white shadow-pop-sm"
        >
          <Filter className="size-4" /> Terapkan
        </button>
        <button
          type="button"
          onClick={() => startTransition(() => router.push(pathname))}
          className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-grape-ink/70 hover:bg-lavender"
        >
          <RotateCcw className="size-4" /> Reset
        </button>
        {extra}
      </div>
    </form>
  );
}
