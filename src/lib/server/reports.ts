import "server-only";
import { query, queryOne, type Row } from "./db";
import { buildOrderWhere, type OrderFilters } from "./orders";
import { addDays, daysBetween } from "@/lib/time";

/**
 * Laporan penjualan. Pendapatan hanya dari pesanan berstatus 'paid'.
 * Pengelompokan waktu memakai WIB (created_at UTC + 7 jam).
 */

export type ReportFilters = Omit<OrderFilters, "status" | "q" | "customer"> & {
  category?: string;
  product?: string;
};

const WIB = "(o.created_at + INTERVAL 7 HOUR)";

function paidWhere(f: ReportFilters) {
  const w = buildOrderWhere({ ...f, status: "paid" });
  return w;
}

/** Filter level-item (kategori / produk). */
function itemWhere(f: ReportFilters) {
  const parts: string[] = [];
  const params: string[] = [];
  if (f.category) {
    parts.push("oi.category = ?");
    params.push(f.category);
  }
  if (f.product) {
    parts.push("oi.product_id = ?");
    params.push(f.product);
  }
  return { sql: parts.length ? " AND " + parts.join(" AND ") : "", params, active: parts.length > 0 };
}

// buildOrderWhere memakai alias c untuk pencarian; kita tidak pakai q di laporan, jadi join customers tidak wajib.

export async function getSummary(f: ReportFilters) {
  const w = paidWhere(f);
  const it = itemWhere(f);

  if (it.active) {
    const r = await queryOne<Row & { orders: number; qty: number; revenue: number; customers: number }>(
      `SELECT COUNT(DISTINCT o.id) AS orders, COALESCE(SUM(oi.qty),0) AS qty, COALESCE(SUM(oi.line_total),0) AS revenue,
         COUNT(DISTINCT o.customer_id) AS customers
       FROM orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE ${w.sql}${it.sql}`,
      [...w.params, ...it.params],
    );
    return {
      itemMode: true as const,
      orders: Number(r?.orders ?? 0),
      itemsSold: Number(r?.qty ?? 0),
      revenue: Number(r?.revenue ?? 0),
      customers: Number(r?.customers ?? 0),
      gross: Number(r?.revenue ?? 0),
      discount: 0,
      avgOrder: r && Number(r.orders) ? Math.round(Number(r.revenue) / Number(r.orders)) : 0,
    };
  }

  const r = await queryOne<Row & { orders: number; gross: number; discount: number; revenue: number; customers: number }>(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(o.subtotal),0) AS gross, COALESCE(SUM(o.discount),0) AS discount,
       COALESCE(SUM(o.total),0) AS revenue, COUNT(DISTINCT o.customer_id) AS customers
     FROM orders o WHERE ${w.sql}`,
    w.params,
  );
  const items = await queryOne<Row & { qty: number }>(
    `SELECT COALESCE(SUM(oi.qty),0) AS qty FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE ${w.sql}`,
    w.params,
  );
  const orders = Number(r?.orders ?? 0);
  const revenue = Number(r?.revenue ?? 0);
  return {
    itemMode: false as const,
    orders,
    itemsSold: Number(items?.qty ?? 0),
    revenue,
    customers: Number(r?.customers ?? 0),
    gross: Number(r?.gross ?? 0),
    discount: Number(r?.discount ?? 0),
    avgOrder: orders ? Math.round(revenue / orders) : 0,
  };
}

export async function getVoidSummary(f: ReportFilters) {
  const w = buildOrderWhere({ ...f, status: "void" });
  const it = itemWhere(f);
  // Dengan filter kategori/produk: hanya pesanan batal yang memuat item terpilih
  const exists = it.active ? ` AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id${it.sql})` : "";
  const r = await queryOne<Row & { n: number; value: number }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(o.total),0) AS value FROM orders o WHERE ${w.sql}${exists}`,
    [...w.params, ...it.params],
  );
  return { count: Number(r?.n ?? 0), value: Number(r?.value ?? 0) };
}

/** Deret waktu harian (atau bulanan bila rentang > 92 hari), lengkap dengan hari kosong. */
export async function getTrend(f: ReportFilters) {
  const w = paidWhere(f);
  const it = itemWhere(f);
  const monthly = daysBetween(f.from, f.to) > 92;
  const bucket = monthly ? `DATE_FORMAT(${WIB}, '%Y-%m')` : `DATE_FORMAT(${WIB}, '%Y-%m-%d')`;
  const rows = it.active
    ? await query<Row & { b: string; revenue: number; orders: number }>(
        `SELECT ${bucket} AS b, SUM(oi.line_total) AS revenue, COUNT(DISTINCT o.id) AS orders
         FROM orders o JOIN order_items oi ON oi.order_id = o.id
         WHERE ${w.sql}${it.sql} GROUP BY b ORDER BY b`,
        [...w.params, ...it.params],
      )
    : await query<Row & { b: string; revenue: number; orders: number }>(
        `SELECT ${bucket} AS b, SUM(o.total) AS revenue, COUNT(*) AS orders
         FROM orders o WHERE ${w.sql} GROUP BY b ORDER BY b`,
        w.params,
      );
  const map = new Map(rows.map((r) => [r.b, { revenue: Number(r.revenue), orders: Number(r.orders) }]));
  const points: { key: string; revenue: number; orders: number }[] = [];
  if (monthly) {
    let y = Number(f.from.slice(0, 4));
    let m = Number(f.from.slice(5, 7));
    const endKey = f.to.slice(0, 7);
    for (let guard = 0; guard < 240; guard++) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      points.push({ key, ...(map.get(key) ?? { revenue: 0, orders: 0 }) });
      if (key === endKey) break;
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
  } else {
    for (let d = f.from; d <= f.to; d = addDays(d, 1)) {
      points.push({ key: d, ...(map.get(d) ?? { revenue: 0, orders: 0 }) });
    }
  }
  return { granularity: monthly ? ("month" as const) : ("day" as const), points };
}

export async function getHourly(f: ReportFilters) {
  const w = paidWhere(f);
  const it = itemWhere(f);
  const rows = await query<Row & { h: number; orders: number; revenue: number }>(
    it.active
      ? `SELECT HOUR(${WIB}) AS h, COUNT(DISTINCT o.id) AS orders, SUM(oi.line_total) AS revenue
         FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE ${w.sql}${it.sql} GROUP BY h`
      : `SELECT HOUR(${WIB}) AS h, COUNT(*) AS orders, SUM(o.total) AS revenue FROM orders o WHERE ${w.sql} GROUP BY h`,
    it.active ? [...w.params, ...it.params] : w.params,
  );
  const map = new Map(rows.map((r) => [Number(r.h), r]));
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    orders: Number(map.get(h)?.orders ?? 0),
    revenue: Number(map.get(h)?.revenue ?? 0),
  }));
}

export async function getWeekday(f: ReportFilters) {
  const w = paidWhere(f);
  const it = itemWhere(f);
  // DAYOFWEEK: 1 = Minggu … 7 = Sabtu
  const rows = await query<Row & { d: number; orders: number; revenue: number }>(
    it.active
      ? `SELECT DAYOFWEEK(${WIB}) AS d, COUNT(DISTINCT o.id) AS orders, SUM(oi.line_total) AS revenue
         FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE ${w.sql}${it.sql} GROUP BY d`
      : `SELECT DAYOFWEEK(${WIB}) AS d, COUNT(*) AS orders, SUM(o.total) AS revenue FROM orders o WHERE ${w.sql} GROUP BY d`,
    it.active ? [...w.params, ...it.params] : w.params,
  );
  const map = new Map(rows.map((r) => [Number(r.d), r]));
  const order = [2, 3, 4, 5, 6, 7, 1]; // Senin → Minggu
  const names = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  return order.map((d, i) => ({
    label: names[i],
    orders: Number(map.get(d)?.orders ?? 0),
    revenue: Number(map.get(d)?.revenue ?? 0),
  }));
}

export async function getTopProducts(f: ReportFilters, limit = 20) {
  const w = paidWhere(f);
  const it = itemWhere(f);
  return query<Row & { product_id: string | null; product_name: string; category: string; qty: number; revenue: number; orders: number }>(
    `SELECT oi.product_id, oi.product_name, oi.category, SUM(oi.qty) AS qty, SUM(oi.line_total) AS revenue,
       COUNT(DISTINCT o.id) AS orders
     FROM orders o JOIN order_items oi ON oi.order_id = o.id
     WHERE ${w.sql}${it.sql}
     GROUP BY oi.product_id, oi.product_name, oi.category
     ORDER BY revenue DESC, qty DESC LIMIT ?`,
    [...w.params, ...it.params, limit],
  );
}

export async function getByCategory(f: ReportFilters) {
  const w = paidWhere(f);
  const it = itemWhere(f);
  return query<Row & { category: string; qty: number; revenue: number }>(
    `SELECT oi.category, SUM(oi.qty) AS qty, SUM(oi.line_total) AS revenue
     FROM orders o JOIN order_items oi ON oi.order_id = o.id
     WHERE ${w.sql}${it.sql} GROUP BY oi.category ORDER BY revenue DESC`,
    [...w.params, ...it.params],
  );
}

/** Rekap per dimensi pesanan (metode bayar / jenis pesanan / kasir) — level pesanan. */
export async function getByOrderDimension(f: ReportFilters, dim: "payment_method" | "order_type" | "cashier") {
  const w = paidWhere(f);
  const it = itemWhere(f);
  const col = dim === "cashier" ? "COALESCE(u.name, '(dihapus)')" : `o.${dim}`;
  const join = dim === "cashier" ? "LEFT JOIN admin_users u ON u.id = o.cashier_id" : "";
  if (it.active) {
    return query<Row & { k: string; orders: number; revenue: number }>(
      `SELECT ${col} AS k, COUNT(DISTINCT o.id) AS orders, SUM(oi.line_total) AS revenue
       FROM orders o JOIN order_items oi ON oi.order_id = o.id ${join}
       WHERE ${w.sql}${it.sql} GROUP BY k ORDER BY revenue DESC`,
      [...w.params, ...it.params],
    );
  }
  return query<Row & { k: string; orders: number; revenue: number }>(
    `SELECT ${col} AS k, COUNT(*) AS orders, SUM(o.total) AS revenue
     FROM orders o ${join} WHERE ${w.sql} GROUP BY k ORDER BY revenue DESC`,
    w.params,
  );
}

export async function getTopCustomers(f: ReportFilters, limit = 10) {
  const w = paidWhere(f);
  return query<Row & { id: number; name: string; phone: string | null; orders: number; revenue: number }>(
    `SELECT c.id, c.name, c.phone, COUNT(*) AS orders, SUM(o.total) AS revenue
     FROM orders o JOIN customers c ON c.id = o.customer_id
     WHERE ${w.sql} GROUP BY c.id ORDER BY revenue DESC LIMIT ?`,
    [...w.params, limit],
  );
}

/* ——— Export CSV ——— */

export async function exportOrders(f: ReportFilters & { status?: string }) {
  const w = buildOrderWhere({ ...f, status: f.status });
  return query<Row>(
    `SELECT o.order_no, o.created_at, o.status, o.order_type, o.payment_method, o.subtotal, o.discount, o.total,
       o.amount_paid, o.change_amount, c.name AS customer_name, c.phone AS customer_phone, u.name AS cashier_name,
       o.note, o.void_reason
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN admin_users u ON u.id = o.cashier_id
     WHERE ${w.sql} ORDER BY o.created_at`,
    w.params,
  );
}

export async function exportItems(f: ReportFilters) {
  const w = paidWhere(f);
  const it = itemWhere(f);
  return query<Row>(
    `SELECT o.order_no, o.created_at, oi.product_name, oi.category, oi.unit_price, oi.qty, oi.line_total, oi.note,
       o.payment_method, o.order_type, u.name AS cashier_name
     FROM orders o JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN admin_users u ON u.id = o.cashier_id
     WHERE ${w.sql}${it.sql} ORDER BY o.created_at, oi.id`,
    [...w.params, ...it.params],
  );
}
