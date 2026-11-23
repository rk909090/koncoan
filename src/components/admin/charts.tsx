"use client";

import { useId, useMemo, useState } from "react";
import { Table2, ChartColumn } from "lucide-react";

/**
 * Grafik ringan berbasis SVG (tanpa library), mengikuti spesifikasi:
 * satu seri per grafik (tanpa sumbu ganda), batang ≤ 24px dengan ujung membulat 4px
 * dan dasar persegi, gridline tipis solid, tooltip saat hover/fokus, dan tampilan tabel.
 */

const BAR = "#a406b4"; // grape — lolos validasi kontras vs putih
const BAR_ACTIVE = "#7b04be";
const GRID = "#ece6ef";
const AXIS_TEXT = "rgba(43,8,56,0.6)";

export type ColumnDatum = { label: string; value: number; tooltip?: string };
export type ValueFormat = "rp" | "num";

const fmtRp = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const fmtNum = new Intl.NumberFormat("id-ID");
const formatters: Record<ValueFormat, (v: number) => string> = {
  rp: (v) => fmtRp.format(v).replace(/\s/g, ""),
  num: (v) => fmtNum.format(v),
};

function niceMax(v: number) {
  if (v <= 4) return 4; // hindari tick pecahan (0,25) saat data kecil/kosong
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * exp;
}

export function compactNumber(v: number) {
  if (v >= 1_000_000) return `${+(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 10_000) return `${+(v / 1000).toFixed(0)}rb`;
  if (v >= 1000) return `${+(v / 1000).toFixed(1)}rb`;
  return String(v);
}

/** Path kolom: ujung atas membulat 4px, dasar persegi. */
function columnPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return "";
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

export function ColumnChart({
  data,
  format,
  height = 220,
  ariaLabel,
  labelEvery,
  tableHeaders = ["Periode", "Nilai"],
}: {
  data: ColumnDatum[];
  format: ValueFormat;
  height?: number;
  ariaLabel: string;
  /** tampilkan label sumbu-X setiap n batang (otomatis bila kosong) */
  labelEvery?: number;
  tableHeaders?: [string, string];
}) {
  const formatValue = formatters[format];
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const titleId = useId();

  const W = 720;
  const H = height;
  const padL = 44;
  const padR = 8;
  const padT = 12;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const band = plotW / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(24, band - 2)); // ≥2px celah antar batang
  const every = labelEvery ?? Math.max(1, Math.ceil(data.length / 12));
  const allZero = data.every((d) => d.value === 0);

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-grape-ink/70 hover:bg-lavender"
          aria-pressed={showTable}
        >
          {showTable ? <ChartColumn className="size-3.5" /> : <Table2 className="size-3.5" />}
          {showTable ? "Lihat grafik" : "Lihat tabel"}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-72 overflow-auto rounded-2xl border border-grape-ink/15">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-lavender/80">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-extrabold uppercase">{tableHeaders[0]}</th>
                <th className="px-3 py-2 text-right text-xs font-extrabold uppercase">{tableHeaders[1]}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-t border-grape-ink/10">
                  <td className="px-3 py-1.5">{d.tooltip ?? d.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatValue(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-labelledby={titleId}
            onMouseLeave={() => setActive(null)}
          >
            <title id={titleId}>{ariaLabel}</title>
            {ticks.map((t, i) => {
              const y = padT + plotH - (t / max) * plotH;
              return (
                <g key={i}>
                  <line x1={padL} x2={W - padR} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
                  <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT} className="tabular-nums">
                    {compactNumber(t)}
                  </text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const h = (d.value / max) * plotH;
              const x = padL + i * band + (band - barW) / 2;
              const y = padT + plotH - h;
              return (
                <g key={i}>
                  <path d={columnPath(x, y, barW, h)} fill={active === i ? BAR_ACTIVE : BAR} />
                  {/* area hit lebih besar dari batang */}
                  <rect
                    x={padL + i * band}
                    y={padT}
                    width={band}
                    height={plotH}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${d.tooltip ?? d.label}: ${formatValue(d.value)}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive(i)}
                    className="cursor-pointer outline-none"
                  />
                  {i % every === 0 && (
                    <text x={padL + i * band + band / 2} y={H - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                      {d.label}
                    </text>
                  )}
                </g>
              );
            })}
            {/* garis dasar */}
            <line x1={padL} x2={W - padR} y1={padT + plotH} y2={padT + plotH} stroke="rgba(43,8,56,0.35)" strokeWidth={1} />
          </svg>
          {allZero && (
            <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-semibold text-grape-ink/50">
              Belum ada data pada rentang ini
            </p>
          )}
          {active !== null && data[active] && (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border-2 border-grape-ink bg-white px-3 py-1.5 text-xs shadow-pop-sm"
              style={{ left: `${((padL + active * band + band / 2) / W) * 100}%` }}
            >
              <p className="font-bold whitespace-nowrap">{data[active].tooltip ?? data[active].label}</p>
              <p className="whitespace-nowrap tabular-nums">{formatValue(data[active].value)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

