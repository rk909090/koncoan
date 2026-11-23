/** Daftar batang horizontal (rincian per kategori / metode / produk). Server-friendly. */
const BAR = "#a406b4";

export function HBarList({
  rows,
  emptyText = "Belum ada data",
}: {
  rows: { label: string; value: number; display: string; sub?: string }[];
  emptyText?: string;
}) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (!rows.length || total === 0) return <p className="py-6 text-center text-sm text-grape-ink/50">{emptyText}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold">{r.label}</span>
            <span className="shrink-0 tabular-nums">
              <b>{r.display}</b>
              <span className="ml-1.5 text-xs text-grape-ink/55">
                {Math.round((r.value / total) * 100)}%{r.sub ? ` · ${r.sub}` : ""}
              </span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-lavender/60" aria-hidden>
            <div className="h-full rounded-full" style={{ width: `${max ? (r.value / max) * 100 : 0}%`, background: BAR }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
