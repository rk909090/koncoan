import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, ReceiptText, ShoppingBag, TrendingUp, Users, Wallet } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { getSummary, getTopProducts, getTrend } from "@/lib/server/reports";
import { countPendingWebOrders, listOrders } from "@/lib/server/orders";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { addDays, formatWib, formatYmdLong, formatYmdShort, todayWib } from "@/lib/time";
import { orderTypeLabel, paymentLabel } from "@/lib/admin/labels";
import { Badge, ButtonLink, Card, CardTitle, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { ColumnChart } from "@/components/admin/charts";
import { HBarList } from "@/components/admin/bars";
import { deltaText, formatRp, num } from "@/components/admin/format";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayWib();
  const yesterday = addDays(today, -1);

  const [t, y, trend, top, recent, pendingWeb] = await Promise.all([
    getSummary({ from: today, to: today }),
    getSummary({ from: yesterday, to: yesterday }),
    getTrend({ from: addDays(today, -6), to: today }),
    getTopProducts({ from: today, to: today }, 5),
    listOrders({ from: addDays(today, -6), to: today }, 1, 8),
    countPendingWebOrders(),
  ]);

  return (
    <>
      <PageHeader
        title={`Halo, ${user.name.split(" ")[0]}! 👋`}
        subtitle={`${formatYmdLong(today)} · ringkasan penjualan hari ini (WIB)`}
        actions={
          <ButtonLink href="/admin/pos" size="lg">
            <Calculator className="size-5" /> Buka Kasir
          </ButtonLink>
        }
      />

      <AutoRefresh seconds={30} count={pendingWeb} />
      {pendingWeb > 0 && (
        <Link
          href="/admin/web-orders"
          className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-grape-ink bg-lemon px-4 py-3 font-bold shadow-pop-sm hover:-translate-y-0.5"
        >
          <span className="grid size-9 place-items-center rounded-full border-2 border-grape-ink bg-chili text-white">
            {pendingWeb}
          </span>
          Pesanan dari website menunggu diproses →
        </Link>
      )}

      {sp.denied && (
        <p className="mb-4 rounded-2xl border-2 border-chili bg-chili/10 px-4 py-3 text-sm font-semibold text-chili">
          Halaman tersebut hanya untuk Administrator.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pendapatan hari ini" value={formatRp(t.revenue)} hint={deltaText(t.revenue, y.revenue, "kemarin")} icon={Wallet} tone="grape" />
        <StatCard label="Transaksi" value={num(t.orders)} hint={deltaText(t.orders, y.orders, "kemarin")} icon={ReceiptText} tone="lemon" />
        <StatCard label="Rata-rata / transaksi" value={formatRp(t.avgOrder)} hint={`kemarin ${formatRp(y.avgOrder)}`} icon={TrendingUp} tone="sky" />
        <StatCard label="Item terjual" value={num(t.itemsSold)} hint={`${num(t.customers)} konsumen tercatat`} icon={ShoppingBag} tone="lime" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle right={<Link href="/admin/reports?range=7d" className="text-sm font-bold text-grape hover:underline">Laporan lengkap →</Link>}>
            Pendapatan 7 hari terakhir
          </CardTitle>
          <ColumnChart
            ariaLabel="Pendapatan per hari, 7 hari terakhir"
            data={trend.points.map((p) => ({
              label: formatYmdShort(p.key, false),
              tooltip: `${formatYmdShort(p.key)} · ${num(p.orders)} transaksi`,
              value: p.revenue,
            }))}
            format="rp"
            tableHeaders={["Tanggal", "Pendapatan"]}
          />
        </Card>
        <Card>
          <CardTitle>Terlaris hari ini</CardTitle>
          <HBarList
            rows={top.map((p) => ({
              label: p.product_name,
              value: Number(p.qty),
              display: `${num(Number(p.qty))} porsi`,
              sub: formatRp(Number(p.revenue)),
            }))}
            emptyText="Belum ada penjualan hari ini"
          />
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle right={<Link href="/admin/orders?range=7d" className="text-sm font-bold text-grape hover:underline">Semua pesanan →</Link>}>
          Pesanan terbaru
        </CardTitle>
        {recent.rows.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Belum ada pesanan"
            description="Transaksi dari halaman Kasir akan muncul di sini."
            action={<ButtonLink href="/admin/pos">Buka Kasir</ButtonLink>}
          />
        ) : (
          <ul className="divide-y divide-grape-ink/10">
            {recent.rows.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-lavender/50">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-grape-ink bg-lavender">
                    <ReceiptText className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {o.order_no}
                      {o.status === "void" && <Badge tone="danger">Dibatalkan</Badge>}
                      {o.status === "pending" && <Badge tone="warning">Menunggu</Badge>}
                      {o.source === "web" && <Badge tone="info">Web</Badge>}
                    </p>
                    <p className="truncate text-xs text-grape-ink/60">
                      {formatWib(o.created_at)} · {orderTypeLabel(o.order_type)} · {paymentLabel(o.payment_method)}
                      {o.customer_name || o.contact_name ? ` · ${o.customer_name ?? o.contact_name}` : ""}
                    </p>
                  </div>
                  <span className={o.status === "void" ? "font-bold text-grape-ink/40 line-through" : "font-bold"}>
                    {formatRp(o.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ButtonLink href="/admin/orders" tone="secondary">
          <ReceiptText className="size-4" /> Riwayat pesanan
        </ButtonLink>
        <ButtonLink href="/admin/customers" tone="secondary">
          <Users className="size-4" /> Data konsumen
        </ButtonLink>
        {user.role === "admin" ? (
          <ButtonLink href="/admin/reports" tone="accent">
            <TrendingUp className="size-4" /> Laporan penjualan
          </ButtonLink>
        ) : null}
      </div>
    </>
  );
}
