import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { getOrder, mapsLink } from "@/lib/server/orders";
import { categoryLabel, formatPhone, orderTypeLabel, paymentLabel } from "@/lib/admin/labels";
import { formatWib } from "@/lib/time";
import { Badge, Card, CardTitle, PageHeader } from "@/components/admin/ui";
import { formatRp } from "@/components/admin/format";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { PrintButton, VoidOrderForm } from "./OrderActions";
import { WebOrderActions } from "../WebOrderActions";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Detail pesanan" };

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const data = await getOrder(Number(id));
  if (!data) notFound();
  const { order: o, items } = data;

  return (
    <>
      <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-grape hover:underline">
        <ArrowLeft className="size-4" /> Kembali ke daftar pesanan
      </Link>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {o.order_no}
            <OrderStatusBadge status={o.status} />
            {o.source === "web" && <Badge tone="info">Dari website</Badge>}
          </span>
        }
        subtitle={`${formatWib(o.created_at)} WIB · ${
          o.source === "web"
            ? o.status === "pending"
              ? "menunggu diproses"
              : `diproses ${o.cashier_name ?? "-"}${o.completed_at ? ` (${formatWib(o.completed_at)} WIB)` : ""}`
            : `kasir ${o.cashier_name ?? "-"}`
        }`}
        actions={<PrintButton id={o.id} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Item pesanan</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">
                  <th className="py-2">Menu</th>
                  <th className="py-2 text-right">Harga</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-grape-ink/10">
                    <td className="py-2.5">
                      <p className="font-bold">{it.product_name}</p>
                      <p className="text-xs text-grape-ink/55">
                        {categoryLabel(it.category)}
                        {it.note ? ` · “${it.note}”` : ""}
                      </p>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{formatRp(it.unit_price)}</td>
                    <td className="py-2.5 text-right tabular-nums">{it.qty}</td>
                    <td className="py-2.5 text-right font-bold tabular-nums">{formatRp(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-grape-ink">
                <tr>
                  <td colSpan={3} className="pt-3 text-right">Subtotal</td>
                  <td className="pt-3 text-right tabular-nums">{formatRp(o.subtotal)}</td>
                </tr>
                {o.discount > 0 && (
                  <tr className="text-chili">
                    <td colSpan={3} className="text-right">Diskon</td>
                    <td className="text-right tabular-nums">−{formatRp(o.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="pt-1 text-right font-bold">Total</td>
                  <td className="pt-1 text-right text-xl font-extrabold text-grape tabular-nums">{formatRp(o.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {o.note && (
            <p className="mt-4 rounded-2xl bg-lavender/50 px-4 py-3 text-sm">
              <b>Catatan:</b> {o.note}
            </p>
          )}
        </Card>

        <div className="space-y-6">
          {o.status === "pending" && (
            <Card className="border-grape">
              <CardTitle>Proses pesanan web</CardTitle>
              <p className="mb-3 text-xs text-grape-ink/60">
                Selesaikan setelah pesanan dibayar (masuk laporan pendapatan), atau tolak bila batal.
              </p>
              <WebOrderActions id={o.id} total={o.total} />
            </Card>
          )}
          <Card>
            <CardTitle>Pembayaran</CardTitle>
            <dl className="space-y-2 text-sm">
              <Row k="Metode" v={o.status === "pending" ? "Belum dibayar" : paymentLabel(o.payment_method)} />
              {o.status !== "pending" && <Row k="Dibayar" v={formatRp(o.amount_paid)} />}
              {o.change_amount > 0 && <Row k="Kembalian" v={formatRp(o.change_amount)} />}
              <Row k="Jenis pesanan" v={orderTypeLabel(o.order_type)} />
            </dl>
          </Card>
          <Card>
            <CardTitle>Konsumen</CardTitle>
            {o.customer_id ? (
              <div className="text-sm">
                <Link href={`/admin/customers/${o.customer_id}`} className="font-bold text-grape hover:underline">
                  {o.customer_name}
                </Link>
                {o.customer_phone && <p className="text-grape-ink/65">{formatPhone(o.customer_phone)}</p>}
                {o.customer_address && <p className="mt-1 text-grape-ink/65">{o.customer_address}</p>}
              </div>
            ) : o.contact_name ? (
              <div className="text-sm">
                <p className="font-bold">{o.contact_name}</p>
                <p className="text-grape-ink/55">Tanpa nomor WhatsApp (tidak tercatat di data konsumen).</p>
              </div>
            ) : (
              <p className="text-sm text-grape-ink/55">Konsumen umum (tidak dicatat).</p>
            )}
          </Card>
          {o.order_type === "delivery" && o.delivery_address && (
            <Card>
              <CardTitle>Alamat antar</CardTitle>
              <div className="space-y-1 text-sm">
                <p>{o.delivery_address}</p>
                {o.delivery_area && <p className="font-semibold">Desa/Kel.: {o.delivery_area}</p>}
                {o.delivery_landmark && <p className="text-grape-ink/70">Patokan: {o.delivery_landmark}</p>}
                {(o.contact_phone ?? o.customer_phone) && <p>WA: {formatPhone(o.contact_phone ?? o.customer_phone)}</p>}
                {o.delivery_maps && (
                  <a
                    href={mapsLink(o.delivery_maps)!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-grape hover:underline"
                  >
                    <MapPin className="size-4" /> Buka di Google Maps
                  </a>
                )}
              </div>
            </Card>
          )}
          {o.status === "void" ? (
            <Card className="border-chili">
              <CardTitle>Dibatalkan</CardTitle>
              <p className="text-sm">
                {o.voided_at ? `${formatWib(o.voided_at)} WIB` : ""} oleh {o.voided_by_name ?? "-"}
              </p>
              <p className="mt-2 rounded-2xl bg-chili/10 px-3 py-2 text-sm">
                <b>Alasan:</b> {o.void_reason}
              </p>
            </Card>
          ) : user.role === "admin" && o.status === "paid" ? (
            <Card>
              <CardTitle>Batalkan pesanan</CardTitle>
              <p className="mb-3 text-xs text-grape-ink/60">
                Pesanan yang dibatalkan tidak dihitung di laporan pendapatan, tapi tetap tersimpan sebagai riwayat.
              </p>
              <VoidOrderForm id={o.id} />
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-grape-ink/60">{k}</dt>
      <dd className="text-right font-bold">{v}</dd>
    </div>
  );
}
