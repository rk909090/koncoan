import { getCurrentUser } from "@/lib/server/auth";
import { exportItems, exportOrders } from "@/lib/server/reports";
import { parseDateRange, parseIntParam, str, type SP } from "@/lib/admin/filters";
import { categoryLabel, formatPhone, isCategory, orderTypeLabel, paymentLabel, sourceLabel, statusLabel } from "@/lib/admin/labels";
import { formatWib } from "@/lib/time";

/** Export CSV (dibuka Excel/Google Sheets). Wajib login sebagai admin. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "admin") return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const sp: SP = Object.fromEntries(url.searchParams.entries());
  const { from, to } = parseDateRange(sp, "today");
  const cat = str(sp.category);
  const f = {
    from,
    to,
    payment: str(sp.payment),
    type: str(sp.type),
    source: str(sp.source),
    cashier: parseIntParam(sp.cashier),
    category: isCategory(cat) ? cat : undefined,
    product: str(sp.product)?.slice(0, 64),
    status: str(sp.status),
  };
  const kind = str(sp.kind) === "items" ? "items" : "orders";

  let header: string[];
  let rows: (string | number)[][];
  if (kind === "items") {
    const data = await exportItems(f);
    header = ["No. pesanan", "Waktu (WIB)", "Produk", "Kategori", "Harga", "Qty", "Subtotal", "Catatan", "Pembayaran", "Jenis", "Kasir"];
    rows = data.map((r) => [
      r.order_no,
      formatWib(r.created_at),
      r.product_name,
      categoryLabel(r.category),
      r.unit_price,
      r.qty,
      r.line_total,
      r.note ?? "",
      paymentLabel(r.payment_method),
      orderTypeLabel(r.order_type),
      r.cashier_name ?? "",
    ]);
  } else {
    const data = await exportOrders(f);
    header = [
      "No. pesanan",
      "Waktu (WIB)",
      "Sumber",
      "Status",
      "Jenis",
      "Pembayaran",
      "Subtotal",
      "Diskon",
      "Total",
      "Dibayar",
      "Kembalian",
      "Konsumen",
      "No. HP",
      "Kasir",
      "Catatan",
      "Alasan batal",
    ];
    rows = data.map((r) => [
      r.order_no,
      formatWib(r.created_at),
      sourceLabel(r.source),
      statusLabel(r.status),
      orderTypeLabel(r.order_type),
      paymentLabel(r.payment_method),
      r.subtotal,
      r.discount,
      r.total,
      r.amount_paid,
      r.change_amount,
      r.customer_name ?? r.contact_name ?? "",
      formatPhone(r.customer_phone ?? r.contact_phone),
      r.cashier_name ?? "",
      r.note ?? "",
      r.void_reason ?? "",
    ]);
  }

  const esc = (v: string | number) => {
    let s = String(v);
    // cegah CSV/formula injection di Excel
    if (/^[=+\-@\t\r]/.test(s) && typeof v === "string") s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Pemisah ";" agar langsung terbuka benar di Excel berlokal Indonesia; BOM untuk UTF-8.
  const csv = "﻿" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const filename = `koncoan-${kind === "items" ? "item" : "transaksi"}-${from}_sd_${to}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
