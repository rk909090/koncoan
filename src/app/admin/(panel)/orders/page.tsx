import type { Metadata } from "next";
import Link from "next/link";
import { Download, ReceiptText } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { listCashiers, listOrders } from "@/lib/server/orders";
import { parseDateRange, parseIntParam, parsePage, qs, str } from "@/lib/admin/filters";
import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_METHODS, formatPhone, orderTypeLabel, paymentLabel } from "@/lib/admin/labels";
import { formatWib, formatYmdLong } from "@/lib/time";
import { FilterBar } from "@/components/admin/FilterBar";
import { Badge, ButtonLink, EmptyState, PageHeader, Pagination, TableWrap, tdClass, thClass } from "@/components/admin/ui";
import { formatRp, num } from "@/components/admin/format";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Pesanan" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const user = await requireUser();
  const sp = await searchParams;
  const { preset, from, to } = parseDateRange(sp, "today");
  const filters = {
    from,
    to,
    status: str(sp.status),
    payment: str(sp.payment),
    type: str(sp.type),
    cashier: parseIntParam(sp.cashier),
    q: str(sp.q)?.slice(0, 50),
  };
  const page = parsePage(sp);
  const [data, cashiers] = await Promise.all([listOrders(filters, page), listCashiers()]);
  const baseParams = {
    ...(preset === "custom" ? { from, to } : { range: preset }),
    status: filters.status,
    payment: filters.payment,
    type: filters.type,
    cashier: filters.cashier,
    q: filters.q,
  };

  return (
    <>
      <PageHeader
        title="Pesanan"
        subtitle={`${from === to ? formatYmdLong(from) : `${formatYmdLong(from)} – ${formatYmdLong(to)}`} · ${num(data.total)} pesanan · pendapatan ${formatRp(data.revenue)}`}
        actions={
          <>
            {user.role === "admin" && (
              <a
                href={`/admin/reports/export${qs({ kind: "orders", ...baseParams })}`}
                className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-grape-ink bg-white px-5 text-sm font-bold shadow-pop-sm"
              >
                <Download className="size-4" /> Export CSV
              </a>
            )}
            <ButtonLink href="/admin/pos">+ Transaksi baru</ButtonLink>
          </>
        }
      />
      <FilterBar
        key={JSON.stringify(baseParams)}
        preset={preset}
        from={from}
        to={to}
        selects={[
          { name: "status", label: "Status", value: filters.status, options: ORDER_STATUSES.map((s) => ({ value: s.id, label: s.label })) },
          { name: "payment", label: "Pembayaran", value: filters.payment, options: PAYMENT_METHODS.map((s) => ({ value: s.id, label: s.label })) },
          { name: "type", label: "Jenis", value: filters.type, options: ORDER_TYPES.map((s) => ({ value: s.id, label: s.label })) },
          {
            name: "cashier",
            label: "Kasir",
            value: filters.cashier ? String(filters.cashier) : undefined,
            options: cashiers.map((c) => ({ value: String(c.id), label: c.name })),
          },
        ]}
        search={{ name: "q", value: filters.q, placeholder: "No. pesanan, nama, atau no. HP" }}
      />

      {data.rows.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Tidak ada pesanan" description="Coba ubah periode atau filter." />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>No. pesanan</th>
                <th className={thClass}>Waktu (WIB)</th>
                <th className={thClass}>Konsumen</th>
                <th className={thClass}>Jenis</th>
                <th className={thClass}>Bayar</th>
                <th className={`${thClass} text-right`}>Item</th>
                <th className={`${thClass} text-right`}>Total</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((o) => (
                <tr key={o.id} className="hover:bg-lavender/40">
                  <td className={tdClass}>
                    <Link href={`/admin/orders/${o.id}`} className="font-bold text-grape hover:underline">
                      {o.order_no}
                    </Link>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>{formatWib(o.created_at)}</td>
                  <td className={tdClass}>
                    {o.customer_id ? (
                      <Link href={`/admin/customers/${o.customer_id}`} className="hover:underline">
                        <span className="font-semibold">{o.customer_name}</span>
                        {o.customer_phone && <span className="block text-xs text-grape-ink/55">{formatPhone(o.customer_phone)}</span>}
                      </Link>
                    ) : (
                      <span className="text-grape-ink/45">Umum</span>
                    )}
                  </td>
                  <td className={tdClass}>{orderTypeLabel(o.order_type)}</td>
                  <td className={tdClass}>{paymentLabel(o.payment_method)}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{num(Number(o.item_count))}</td>
                  <td className={`${tdClass} text-right font-bold tabular-nums ${o.status === "void" ? "text-grape-ink/40 line-through" : ""}`}>
                    {formatRp(o.total)}
                  </td>
                  <td className={tdClass}>
                    {o.status === "void" ? <Badge tone="danger">Dibatalkan</Badge> : <Badge tone="success">Lunas</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={page} totalPages={data.totalPages} makeHref={(p) => `/admin/orders${qs({ ...baseParams, page: p })}`} />
        </>
      )}
    </>
  );
}
