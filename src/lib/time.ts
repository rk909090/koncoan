/**
 * Helper waktu. Database menyimpan UTC; bisnis beroperasi di WIB (UTC+7,
 * Indonesia tidak memakai daylight saving), jadi konversi cukup ±7 jam.
 */
export const WIB_OFFSET_HOURS = 7;
const OFFSET_MS = WIB_OFFSET_HOURS * 3600 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD HH:MM:SS" (UTC dari DB) → Date */
export function parseUtc(s: string): Date {
  return new Date(s.replace(" ", "T") + "Z");
}

/** Komponen tanggal WIB dari sebuah Date */
function wibParts(d: Date) {
  const w = new Date(d.getTime() + OFFSET_MS);
  return {
    y: w.getUTCFullYear(),
    m: w.getUTCMonth() + 1,
    d: w.getUTCDate(),
    hh: w.getUTCHours(),
    mm: w.getUTCMinutes(),
  };
}

/** Tanggal hari ini (WIB) sebagai "YYYY-MM-DD" */
export function todayWib(now = new Date()) {
  const p = wibParts(now);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

/** Tambah n hari ke "YYYY-MM-DD" */
export function addDays(ymd: string, n: number) {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isYmd(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
}

/**
 * Rentang tanggal WIB inklusif [from, to] → batas UTC [start, end) untuk query.
 * Contoh: 2026-11-23 WIB → 2026-11-22 17:00:00 UTC s/d 2026-11-23 17:00:00 UTC.
 */
export function wibRangeToUtc(from: string, to: string) {
  const start = new Date(Date.parse(from + "T00:00:00Z") - OFFSET_MS);
  const end = new Date(Date.parse(addDays(to, 1) + "T00:00:00Z") - OFFSET_MS);
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
  return { start: fmt(start), end: fmt(end) };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/** UTC string dari DB → "23 Nov 2026, 14:05" (WIB) */
export function formatWib(utc: string, withTime = true) {
  const d = parseUtc(utc);
  const p = wibParts(d);
  const date = `${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
  return withTime ? `${date}, ${pad(p.hh)}:${pad(p.mm)}` : date;
}

/** "YYYY-MM-DD" → "Sen, 23 Nov" */
export function formatYmdShort(ymd: string, withDay = true) {
  const d = new Date(ymd + "T00:00:00Z");
  const s = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return withDay ? `${DAYS[d.getUTCDay()]}, ${s}` : s;
}

export function formatYmdLong(ymd: string) {
  const d = new Date(ymd + "T00:00:00Z");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Senin pertama minggu ini & tanggal 1 bulan ini (WIB) */
export function presetRange(preset: string, now = new Date()): { from: string; to: string } | null {
  const today = todayWib(now);
  const d = new Date(today + "T00:00:00Z");
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const y = addDays(today, -1);
      return { from: y, to: y };
    }
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "this_week": {
      const dow = (d.getUTCDay() + 6) % 7; // Senin = 0
      return { from: addDays(today, -dow), to: today };
    }
    case "this_month":
      return { from: today.slice(0, 8) + "01", to: today };
    case "last_month": {
      const firstThis = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
      const lastPrev = new Date(firstThis.getTime() - 86400000);
      const firstPrev = new Date(Date.UTC(lastPrev.getUTCFullYear(), lastPrev.getUTCMonth(), 1));
      return { from: firstPrev.toISOString().slice(0, 10), to: lastPrev.toISOString().slice(0, 10) };
    }
    case "this_year":
      return { from: today.slice(0, 4) + "-01-01", to: today };
    default:
      return null;
  }
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000) + 1;
}
