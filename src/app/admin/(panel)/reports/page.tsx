import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Download, Percent, ReceiptText, ShoppingBag, TrendingUp, Users, Wallet } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { listCashiers } from "@/lib/server/orders";
import { listProducts } from "@/lib/server/products";
import {
  getByCategory,
  getByOrderDimension,
  getHourly,
  getSummary,
  getTopCustomers,
  getTopProducts,
  getTrend,
  getVoidSummary,
  type ReportFilters,
} from "@/lib/server/reports";
import { parseDateRange, parseIntParam, qs, str } from "@/lib/admin/filters";
import {
  ORDER_SOURCES,
  ORDER_TYPES,
  PAYMENT_METHODS,
  PRODUCT_CATEGORIES,
  categoryLabel,
  formatPhone,
  isCategory,
  orderTypeLabel,
  paymentLabel,
} from "@/lib/admin/labels";
import { addDays, daysBetween, formatYmdLong, formatYmdShort } from "@/lib/time";
import { FilterBar } from "@/components/admin/FilterBar";
import { Card, CardTitle, PageHeader, StatCard, TableWrap, tdClass, thClass } from "@/components/admin/ui";
import { ColumnChart } from "@/components/admin/charts";
import { HBarList } from "@/components/admin/bars";
import { deltaText, formatRp, num } from "@/components/admin/format";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Laporan penjualan" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireUser("admin");
  const sp = await searchParams;
  const { preset, from, to } = parseDateRange(sp, "7d");
  const cat = str(sp.category);
  const f: ReportFilters = {
    from,
    to,
    payment: str(sp.payment),
    type: str(sp.type),
    source: str(sp.source),
    cashier: parseIntParam(sp.cashier),
    category: isCategory(cat) ? cat : undefined,
    product: str(sp.product)?.slice(0, 64),
  };
  // Periode pembanding: rentang sama panjang tepat sebelum periode terpilih
  const len = daysBetween(from, to);
  const prev: ReportFilters = { ...f, from: addDays(from, -len), to: addDays(from, -1) };

  const [summary, prevSummary, voids, trend, hourly, topProducts, byCategory, byPayment, byType, byCashier, topCustomers, cashiers, products] =
    await Promise.all([
      getSummary(f),
      getSummary(prev),
      getVoidSummary(f),
      getTrend(f),
      getHourly(f),
      getTopProducts(f, 15),
      getByCategory(f),
      getByOrderDimension(f, "payment_method"),
      getByOrderDimension(f, "order_type"),
      getByOrderDimension(f, "cashier"),
      getTopCustomers(f, 10),
      listCashiers(),
      listProducts(),
    ]);

  const filterParams = {
    ...(preset === "custom" ? { from, to } : { range: preset }),
    payment: f.payment,
    type: f.type,
    source: f.source,
    cashier: f.cashier,
    category: f.category,
    product: f.product,
  };
  const prevLabel = `periode sebelumnya (${formatYmdShort(prev.from, false)}–${formatYmdShort(prev.to, false)})`;
  const trendLabel = (key: string) =>
    trend.granularity === "month" ? `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(2, 4)}` : formatYmdShort(key, false);
  const trendTooltip = (key: string) =>
    trend.granularity === "month" ? `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}` : formatYmdShort(key);

  return (
    <>
      <PageHeader
        title="Laporan penjualan"
        subtitle={`${from === to ? formatYmdLong(from) : `${formatYmdLong(from)} – ${formatYmdLong(to)}`} · waktu WIB · hanya pesanan lunas`}
        actions={
          <>
            <a
              href={`/admin/reports/export${qs({ kind: "orders", ...filterParams })}`}
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-grape-ink bg-white px-4 text-sm font-bold shadow-pop-sm"
            >
              <Download className="size-4" /> CSV transaksi
            </a>
            <a
              href={`/admin/reports/export${qs({ kind: "items", ...filterParams })}`}
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-grape-ink bg-white px-4 text-sm font-bold shadow-pop-sm"
            >
              <Download className="size-4" /> CSV item
            </a>
          </>
        }
      />

      <FilterBar
        key={JSON.stringify(filterParams)}
        preset={preset}
        from={from}
        to={to}
        selects={[
          { name: "payment", label: "Pembayaran", value: f.payment, options: PAYMENT_METHODS.map((s) => ({ value: s.id, label: s.label })) },
          { name: "type", label: "Jenis pesanan", value: f.type, options: ORDER_TYPES.map((s) => ({ value: s.id, label: s.label })) },
          { name: "source", label: "Sumber", value: f.source, options: ORDER_SOURCES.map((s) => ({ value: s.id, label: s.label })) },
          {
            name: "cashier",
            label: "Kasir",
            value: f.cashier ? String(f.cashier) : undefined,
            options: cashiers.map((c) => ({ value: String(c.id), label: c.name })),
          },
          { name: "category", label: "Kategori", value: f.category, options: PRODUCT_CATEGORIES.map((s) => ({ value: s.id, label: s.label })) },
          {
            name: "product",
            label: "Produk",
            value: f.product,
            options: products.map((p) => ({ value: String(p.id), label: String(p.name) })),
          },
        ]}
      />

      {summary.itemMode && (
        <p className="mb-4 rounded-2xl border-2 border-grape-ink bg-sky/40 px-4 py-3 text-sm">
          Filter <b>kategori/produk</b> aktif: angka di bawah adalah penjualan <b>item terpilih</b> (harga × qty, sebelum diskon
          pesanan), dan &ldquo;transaksi&rdquo; = jumlah pesanan yang memuat item tersebut.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={summary.itemMode ? "Penjualan item" : "Pendapatan bersih"}
          value={formatRp(summary.revenue)}
          hint={deltaText(summary.revenue, prevSummary.revenue, prevLabel)}
          icon={Wallet}
          tone="grape"
        />
        <StatCard label="Transaksi" value={num(summary.orders)} hint={deltaText(summary.orders, prevSummary.orders, "sebelumnya")} icon={ReceiptText} tone="lemon" />
        <StatCard label="Rata-rata / transaksi" value={formatRp(summary.avgOrder)} hint={`sebelumnya ${formatRp(prevSummary.avgOrder)}`} icon={TrendingUp} tone="sky" />
        <StatCard label="Item terjual" value={num(summary.itemsSold)} hint={deltaText(summary.itemsSold, prevSummary.itemsSold, "sebelumnya")} icon={ShoppingBag} tone="lime" />
        {!summary.itemMode && (
          <StatCard label="Penjualan kotor" value={formatRp(summary.gross)} hint="sebelum diskon" icon={Wallet} />
        )}
        {!summary.itemMode && <StatCard label="Total diskon" value={formatRp(summary.discount)} icon={Percent} />}
        <StatCard label="Konsumen tercatat" value={num(summary.customers)} hint="unik, tidak termasuk 'Umum'" icon={Users} />
        <StatCard label="Pesanan dibatalkan" value={num(voids.count)} hint={`senilai ${formatRp(voids.value)}`} icon={Ban} tone="lavender" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>{summary.itemMode ? "Penjualan item" : "Pendapatan"} per {trend.granularity === "month" ? "bulan" : "hari"}</CardTitle>
          <ColumnChart
            ariaLabel="Pendapatan per periode"
            data={trend.points.map((p) => ({ label: trendLabel(p.key), tooltip: trendTooltip(p.key), value: p.revenue }))}
            format="rp"
            tableHeaders={["Periode", "Pendapatan"]}
          />
        </Card>
        <Card>
          <CardTitle>Transaksi per {trend.granularity === "month" ? "bulan" : "hari"}</CardTitle>
          <ColumnChart
            ariaLabel="Jumlah transaksi per periode"
            data={trend.points.map((p) => ({ label: trendLabel(p.key), tooltip: trendTooltip(p.key), value: p.orders }))}
            format="num"
            tableHeaders={["Periode", "Transaksi"]}
          />
        </Card>
        <Card>
          <CardTitle>Jam tersibuk (transaksi per jam)</CardTitle>
          <ColumnChart
            ariaLabel="Jumlah transaksi per jam"
            data={hourly.map((h) => ({
              label: String(h.hour).padStart(2, "0"),
              tooltip: `${String(h.hour).padStart(2, "0")}:00–${String(h.hour).padStart(2, "0")}:59 · ${formatRp(h.revenue)}`,
              value: h.orders,
            }))}
            format="num"
            labelEvery={2}
            tableHeaders={["Jam", "Transaksi"]}
          />
        </Card>
        <Card>
          <CardTitle>Per kategori</CardTitle>
          <HBarList
            rows={byCategory.map((r) => ({
              label: categoryLabel(r.category),
              value: Number(r.revenue),
              display: formatRp(Number(r.revenue)),
              sub: `${num(Number(r.qty))} item`,
            }))}
          />
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 font-display text-lg">Metode bayar</h3>
              <HBarList
                rows={byPayment.map((r) => ({
                  label: paymentLabel(r.k),
                  value: Number(r.revenue),
                  display: formatRp(Number(r.revenue)),
                  sub: `${num(Number(r.orders))} trx`,
                }))}
              />
            </div>
            <div>
              <h3 className="mb-3 font-display text-lg">Jenis pesanan</h3>
              <HBarList
                rows={byType.map((r) => ({
                  label: orderTypeLabel(r.k),
                  value: Number(r.revenue),
                  display: formatRp(Number(r.revenue)),
                  sub: `${num(Number(r.orders))} trx`,
                }))}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <CardTitle>Produk terlaris</CardTitle>
        {topProducts.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-grape-ink/50">Belum ada data</p>
          </Card>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>#</th>
                <th className={thClass}>Produk</th>
                <th className={thClass}>Kategori</th>
                <th className={`${thClass} text-right`}>Qty</th>
                <th className={`${thClass} text-right`}>Transaksi</th>
                <th className={`${thClass} text-right`}>Penjualan</th>
                <th className={`${thClass} text-right`}>Porsi</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const totalRev = topProducts.reduce((a, r) => a + Number(r.revenue), 0);
                return topProducts.map((p, i) => (
                  <tr key={`${p.product_id}-${p.product_name}`}>
                    <td className={`${tdClass} font-bold`}>{i + 1}</td>
                    <td className={`${tdClass} font-bold`}>{p.product_name}</td>
                    <td className={tdClass}>{categoryLabel(p.category)}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{num(Number(p.qty))}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{num(Number(p.orders))}</td>
                    <td className={`${tdClass} text-right font-bold tabular-nums`}>{formatRp(Number(p.revenue))}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>
                      {totalRev ? Math.round((Number(p.revenue) / totalRev) * 100) : 0}%
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </TableWrap>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Kinerja kasir</CardTitle>
          <HBarList
            rows={byCashier.map((r) => ({
              label: String(r.k),
              value: Number(r.revenue),
              display: formatRp(Number(r.revenue)),
              sub: `${num(Number(r.orders))} trx`,
            }))}
          />
        </Card>
        <Card>
          <CardTitle>Konsumen teratas</CardTitle>
          {topCustomers.length === 0 ? (
            <p className="py-6 text-center text-sm text-grape-ink/50">Belum ada konsumen tercatat pada periode ini</p>
          ) : (
            <ol className="divide-y divide-grape-ink/10">
              {topCustomers.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/customers/${c.id}`} className="flex min-w-0 items-center gap-2 hover:underline">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-grape-ink bg-lemon text-xs font-extrabold">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{c.name}</span>
                      {c.phone && <span className="block text-xs text-grape-ink/55">{formatPhone(c.phone)}</span>}
                    </span>
                  </Link>
                  <span className="shrink-0 text-right">
                    <b className="tabular-nums">{formatRp(Number(c.revenue))}</b>
                    <span className="block text-xs text-grape-ink/55">{num(Number(c.orders))} order</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <p className="mt-6 text-center text-sm">
        <Link
          href={`/admin/orders${qs({ ...(preset === "custom" ? { from, to } : { range: preset }), payment: f.payment, type: f.type, source: f.source, cashier: f.cashier })}`}
          className="font-bold text-grape hover:underline"
        >
          Lihat daftar transaksi untuk periode ini →
        </Link>
      </p>
    </>
  );
}
