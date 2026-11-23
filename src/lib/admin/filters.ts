import { addDays, daysBetween, isYmd, presetRange, todayWib } from "@/lib/time";

export type SP = Record<string, string | string[] | undefined>;

export const DATE_PRESETS = [
  { id: "today", label: "Hari ini" },
  { id: "yesterday", label: "Kemarin" },
  { id: "7d", label: "7 hari terakhir" },
  { id: "30d", label: "30 hari terakhir" },
  { id: "this_week", label: "Minggu ini" },
  { id: "this_month", label: "Bulan ini" },
  { id: "last_month", label: "Bulan lalu" },
  { id: "this_year", label: "Tahun ini" },
  { id: "custom", label: "Pilih tanggal…" },
] as const;

export const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export const MAX_RANGE_DAYS = 366 * 3;

/** Baca rentang tanggal dari searchParams (preset atau from/to), dengan default. */
export function parseDateRange(sp: SP, defaultPreset = "today") {
  const preset = str(sp.range) ?? (str(sp.from) || str(sp.to) ? "custom" : defaultPreset);
  let from: string;
  let to: string;
  const p = preset !== "custom" ? presetRange(preset) : null;
  if (p) {
    ({ from, to } = p);
  } else {
    const today = todayWib();
    from = isYmd(str(sp.from)) ? str(sp.from)! : today;
    to = isYmd(str(sp.to)) ? str(sp.to)! : from;
    if (from > to) [from, to] = [to, from];
    if (daysBetween(from, to) > MAX_RANGE_DAYS) from = addDays(to, -(MAX_RANGE_DAYS - 1));
  }
  return { preset: p ? preset : "custom", from, to };
}

export function parsePage(sp: SP) {
  const n = Number(str(sp.page) ?? 1);
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 10_000) : 1;
}

export function parseIntParam(v: string | string[] | undefined) {
  const n = Number(str(v));
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** Bangun querystring dari objek (lewati nilai kosong). */
export function qs(params: Record<string, string | number | undefined | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
}
