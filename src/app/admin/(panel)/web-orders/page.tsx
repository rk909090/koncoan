import type { Metadata } from "next";
import Link from "next/link";
import { Bike, Clock, MapPin, MessageCircle, Phone, ShoppingBag, Store, UtensilsCrossed } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { listPendingWebOrders, mapsLink } from "@/lib/server/orders";
import { formatPhone, orderTypeLabel } from "@/lib/admin/labels";
import { formatWib, parseUtc } from "@/lib/time";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { formatRp } from "@/components/admin/format";
import { PrintButton } from "../orders/[id]/OrderActions";
import { WebOrderActions } from "../orders/WebOrderActions";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Pesanan Web" };

const TYPE_ICON = { "dine-in": UtensilsCrossed, "take-away": Store, delivery: Bike } as const;

function ago(utc: string) {
  const min = Math.max(0, Math.round((Date.now() - parseUtc(utc).getTime()) / 60000));
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h} jam lalu` : `${Math.floor(h / 24)} hari lalu`;
}

/** wa.me butuh format 62…; nomor tersimpan sudah dinormalisasi. */
const waChat = (phone: string, orderNo: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(`Halo, pesanan Mie Koncoan ${orderNo} sudah kami terima ya 🙏`)}`;

export default async function WebOrdersPage() {
  await requireUser();
  const orders = await listPendingWebOrders();

  return (
    <>
      <AutoRefresh count={orders.length} />
      <PageHeader
        title="Pesanan Web"
        subtitle="Pesanan dari koncoan.my.id yang menunggu diproses. Halaman ini diperbarui otomatis tiap 20 detik."
        actions={
          <ButtonLink href="/admin/orders?source=web&range=7d" tone="secondary">
            Riwayat pesanan web
          </ButtonLink>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Belum ada pesanan baru"
          description="Pesanan dari website akan muncul di sini, lengkap dengan alamat bila diantar."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {orders.map((o) => {
            const Icon = TYPE_ICON[o.order_type as keyof typeof TYPE_ICON] ?? ShoppingBag;
            return (
              <Card key={o.id} className={o.order_type === "delivery" ? "border-grape" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/admin/orders/${o.id}`} className="font-display text-2xl text-grape hover:underline">
                      {o.order_no}
                    </Link>
                    <p className="flex items-center gap-1 text-xs text-grape-ink/60">
                      <Clock className="size-3.5" /> {formatWib(o.created_at)} WIB · {ago(o.created_at)}
                    </p>
                  </div>
                  <Badge tone={o.order_type === "delivery" ? "grape" : "info"}>
                    <Icon className="size-3.5" /> {orderTypeLabel(o.order_type)}
                  </Badge>
                </div>

                <div className="mt-3 rounded-2xl bg-lavender/40 px-3 py-2.5 text-sm">
                  <p className="font-bold">
                    {o.customer_id ? (
                      <Link href={`/admin/customers/${o.customer_id}`} className="hover:underline">
                        {o.contact_name}
                      </Link>
                    ) : (
                      o.contact_name
                    )}
                  </p>
                  {o.contact_phone && (
                    <p className="mt-0.5 flex flex-wrap items-center gap-3">
                      <a href={`tel:+${o.contact_phone}`} className="inline-flex items-center gap-1 font-semibold text-grape hover:underline">
                        <Phone className="size-3.5" /> {formatPhone(o.contact_phone)}
                      </a>
                      <a
                        href={waChat(o.contact_phone, o.order_no)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-grape hover:underline"
                      >
                        <MessageCircle className="size-3.5" /> Chat WA
                      </a>
                    </p>
                  )}
                  {o.order_type === "delivery" && (
                    <div className="mt-2 border-t border-grape-ink/10 pt-2">
                      <p>{o.delivery_address}</p>
                      {o.delivery_area && <p className="font-semibold">Desa/Kel.: {o.delivery_area}</p>}
                      {o.delivery_landmark && <p className="text-grape-ink/70">Patokan: {o.delivery_landmark}</p>}
                      {o.delivery_maps && (
                        <a
                          href={mapsLink(o.delivery_maps)!}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 font-bold text-grape hover:underline"
                        >
                          <MapPin className="size-3.5" /> Buka lokasi di Google Maps
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <ul className="mt-3 divide-y divide-grape-ink/10 text-sm">
                  {o.items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-3 py-1.5">
                      <span>
                        <b>{it.qty}×</b> {it.product_name}
                        {it.note && <span className="block text-xs text-grape-ink/60">“{it.note}”</span>}
                      </span>
                      <span className="tabular-nums">{formatRp(it.line_total)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-between border-t-2 border-grape-ink pt-2">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-extrabold text-grape tabular-nums">{formatRp(o.total)}</span>
                </div>
                {o.note && (
                  <p className="mt-2 rounded-2xl bg-lemon/50 px-3 py-2 text-sm">
                    <b>Catatan:</b> {o.note}
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  <WebOrderActions id={o.id} total={o.total} />
                  <PrintButton id={o.id} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
