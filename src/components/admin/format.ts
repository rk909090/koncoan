import { formatRp } from "@/lib/site";

export { formatRp };

/** Persentase perubahan vs periode pembanding (null bila pembanding 0). */
export function pctChange(curr: number, prev: number) {
  if (!prev) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

export function deltaText(curr: number, prev: number, label: string) {
  const p = pctChange(curr, prev);
  if (p === null) return prev === 0 && curr > 0 ? `baru ada penjualan (${label}: 0)` : `${label}: 0`;
  const sign = p > 0 ? "▲" : p < 0 ? "▼" : "＝";
  return `${sign} ${Math.abs(p)}% vs ${label}`;
}

export const num = (n: number) => new Intl.NumberFormat("id-ID").format(n);
