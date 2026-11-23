import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/server/auth";
import { getOrder } from "@/lib/server/orders";
import { formatWib } from "@/lib/time";
import { formatPhone, orderTypeLabel, paymentLabel } from "@/lib/admin/labels";
import { formatRp, SITE } from "@/lib/site";
import { AutoPrint } from "./AutoPrint";

export const metadata: Metadata = { title: "Struk" };

/** Struk untuk printer thermal 58mm (juga bisa disimpan sebagai PDF dari dialog cetak). */
async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const data = await getOrder(Number(id));
  if (!data) notFound();
  const { order, items } = data;
  const line = "--------------------------------";

  return (
    <div className="receipt mx-auto w-[58mm] bg-white p-2 font-mono text-[11px] leading-snug text-black">
      <style>{`@page { size: 58mm auto; margin: 0 } @media print { body { background: #fff !important } .no-print { display: none !important } }`}</style>
      <div className="text-center">
        <p className="text-[14px] font-bold">MIE KONCOAN</p>
        <p>{SITE.tagline}</p>
        <p>{SITE.address}</p>
        <p>WA {SITE.phoneDisplay}</p>
      </div>
      <p className="my-1">{line}</p>
      <p>No   : {order.order_no}</p>
      <p>Tgl  : {formatWib(order.created_at)} WIB</p>
      <p>Kasir: {order.cashier_name ?? "-"}</p>
      <p>Jenis: {orderTypeLabel(order.order_type)}</p>
      {order.customer_name && (
        <p>
          Plg  : {order.customer_name}
          {order.customer_phone ? ` (${formatPhone(order.customer_phone)})` : ""}
        </p>
      )}
      {order.status === "void" && <p className="my-1 text-center font-bold">*** DIBATALKAN ***</p>}
      <p className="my-1">{line}</p>
      {items.map((it) => (
        <div key={it.id} className="mb-1">
          <p>{it.product_name}</p>
          <p className="flex justify-between">
            <span>
              {it.qty} x {formatRp(it.unit_price)}
            </span>
            <span>{formatRp(it.line_total)}</span>
          </p>
          {it.note && <p className="pl-2 italic">* {it.note}</p>}
        </div>
      ))}
      <p className="my-1">{line}</p>
      <p className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatRp(order.subtotal)}</span>
      </p>
      {order.discount > 0 && (
        <p className="flex justify-between">
          <span>Diskon</span>
          <span>-{formatRp(order.discount)}</span>
        </p>
      )}
      <p className="flex justify-between text-[13px] font-bold">
        <span>TOTAL</span>
        <span>{formatRp(order.total)}</span>
      </p>
      <p className="flex justify-between">
        <span>Bayar ({paymentLabel(order.payment_method)})</span>
        <span>{formatRp(order.amount_paid)}</span>
      </p>
      {order.change_amount > 0 && (
        <p className="flex justify-between">
          <span>Kembali</span>
          <span>{formatRp(order.change_amount)}</span>
        </p>
      )}
      {order.note && (
        <>
          <p className="my-1">{line}</p>
          <p>Catatan: {order.note}</p>
        </>
      )}
      <p className="my-1">{line}</p>
      <p className="text-center">Terima kasih, konco!</p>
      <p className="text-center">koncoan.my.id</p>
      <AutoPrint />
    </div>
  );
}

export default function StrukPage({ params }: PageProps<"/admin/struk/[id]">) {
  return (
    <Suspense fallback={<p className="p-4 text-sm">Memuat struk…</p>}>
      <Receipt params={params} />
    </Suspense>
  );
}
