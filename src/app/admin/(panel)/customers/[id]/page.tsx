import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MessageCircle, ReceiptText, ShoppingBag, Wallet } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { getCustomer } from "@/lib/server/customers";
import { formatPhone, orderTypeLabel, paymentLabel } from "@/lib/admin/labels";
import { formatWib } from "@/lib/time";
import { Badge, Card, CardTitle, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { formatRp, num } from "@/components/admin/format";
import { CustomerForm } from "../CustomerForm";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Detail konsumen" };

export default async function CustomerDetailPage({ params }: PageProps<"/admin/customers/[id]">) {
  await requireUser();
  const { id } = await params;
  const data = await getCustomer(Number(id));
  if (!data) notFound();
  const { customer: c, orders, favorites } = data;
  const orderCount = Number(c.order_count);
  const spent = Number(c.total_spent);

  return (
    <>
      <Link href="/admin/customers" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-grape hover:underline">
        <ArrowLeft className="size-4" /> Kembali ke daftar konsumen
      </Link>
      <PageHeader
        title={c.name}
        subtitle={`${formatPhone(c.phone) || "Tanpa no. HP"} · terdaftar ${formatWib(c.created_at, false)}`}
        actions={
          c.phone ? (
            <a
              href={`https://wa.me/${c.phone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-grape-ink bg-[#25d366] px-5 text-sm font-bold shadow-pop-sm"
            >
              <MessageCircle className="size-4" /> Chat WhatsApp
            </a>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total belanja" value={formatRp(spent)} icon={Wallet} tone="grape" />
        <StatCard label="Jumlah order" value={num(orderCount)} hint="pesanan lunas" icon={ReceiptText} tone="lemon" />
        <StatCard label="Rata-rata / order" value={formatRp(orderCount ? Math.round(spent / orderCount) : 0)} icon={ShoppingBag} tone="sky" />
        <StatCard label="Order terakhir" value={c.last_order_at ? formatWib(c.last_order_at, false) : "—"} icon={CalendarDays} tone="lime" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardTitle>Riwayat order ({num(orders.length)})</CardTitle>
            {orders.length === 0 ? (
              <EmptyState icon={ReceiptText} title="Belum ada order" />
            ) : (
              <ul className="divide-y divide-grape-ink/10">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="block rounded-2xl px-2 py-3 hover:bg-lavender/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 font-bold">
                            {o.order_no}
                            {o.status === "void" && <Badge tone="danger">Dibatalkan</Badge>}
                          </p>
                          <p className="text-xs text-grape-ink/60">
                            {formatWib(o.created_at)} · {orderTypeLabel(o.order_type)} · {paymentLabel(o.payment_method)}
                          </p>
                          {o.items_summary && <p className="mt-1 text-sm text-grape-ink/80">{o.items_summary}</p>}
                        </div>
                        <span className={`shrink-0 font-bold tabular-nums ${o.status === "void" ? "text-grape-ink/40 line-through" : ""}`}>
                          {formatRp(o.total)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardTitle>Menu favorit</CardTitle>
            {favorites.length === 0 ? (
              <p className="text-sm text-grape-ink/55">Belum ada data.</p>
            ) : (
              <ol className="space-y-2">
                {favorites.map((f, i) => (
                  <li key={f.product_name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full border-2 border-grape-ink bg-lemon text-xs font-extrabold">
                        {i + 1}
                      </span>
                      {f.product_name}
                    </span>
                    <span className="font-bold tabular-nums">{num(Number(f.qty))}×</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
          <Card>
            <CardTitle>Data konsumen</CardTitle>
            <CustomerForm
              customer={{
                id: Number(c.id),
                name: c.name,
                phone: c.phone,
                address: c.address,
                notes: c.notes,
              }}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
