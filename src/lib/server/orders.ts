import "server-only";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { execute, query, queryOne, transaction, type Row } from "./db";
import {
  isOrderStatus,
  isOrderType,
  isPaymentMethod,
  normalizePhone,
  type OrderTypeId,
  type PaymentMethodId,
} from "@/lib/admin/labels";
import { todayWib, wibRangeToUtc } from "@/lib/time";

/* ——————————————— Buat pesanan (POS) ——————————————— */

export type NewOrderInput = {
  items: { productId: string; qty: number; note?: string }[];
  orderType: string;
  paymentMethod: string;
  amountPaid: number;
  discount: number;
  note?: string;
  customer?: { id?: number; name?: string; phone?: string } | null;
};

export class OrderError extends Error {}

const clampInt = (n: unknown, min: number, max: number) => {
  const v = Math.trunc(Number(n));
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
};

async function resolveCustomer(conn: PoolConnection, c: NewOrderInput["customer"]): Promise<number | null> {
  if (!c) return null;
  if (c.id) {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT id FROM customers WHERE id = ?", [c.id]);
    if (!rows[0]) throw new OrderError("Konsumen tidak ditemukan.");
    return Number(rows[0].id);
  }
  const name = (c.name ?? "").trim().slice(0, 100);
  const phoneRaw = (c.phone ?? "").trim();
  if (!name && !phoneRaw) return null;
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) throw new OrderError("Format nomor HP konsumen tidak valid.");
  if (phone) {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT id FROM customers WHERE phone = ?", [phone]);
    if (rows[0]) return Number(rows[0].id);
  }
  if (!name) throw new OrderError("Nama konsumen wajib diisi untuk konsumen baru.");
  const [res] = await conn.query<ResultSetHeader>(
    "INSERT INTO customers (name, phone, created_at, updated_at) VALUES (?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())",
    [name, phone],
  );
  return res.insertId;
}

async function nextOrderNo(conn: PoolConnection) {
  const day = todayWib();
  await conn.query(
    `INSERT INTO daily_counters (counter_date, seq) VALUES (?, LAST_INSERT_ID(1))
     ON DUPLICATE KEY UPDATE seq = LAST_INSERT_ID(seq + 1)`,
    [day],
  );
  const [rows] = await conn.query<RowDataPacket[]>("SELECT LAST_INSERT_ID() AS seq");
  const seq = Number(rows[0].seq);
  return `KC${day.slice(2).replace(/-/g, "")}-${String(seq).padStart(3, "0")}`;
}

export async function createOrder(input: NewOrderInput, cashierId: number) {
  if (!isOrderType(input.orderType)) throw new OrderError("Jenis pesanan tidak valid.");
  if (!isPaymentMethod(input.paymentMethod)) throw new OrderError("Metode pembayaran tidak valid.");
  const lines = (input.items ?? [])
    .map((i) => ({ productId: String(i.productId), qty: clampInt(i.qty, 0, 999), note: (i.note ?? "").trim().slice(0, 255) }))
    .filter((i) => i.qty > 0);
  if (lines.length === 0) throw new OrderError("Keranjang masih kosong.");
  if (lines.length > 100) throw new OrderError("Terlalu banyak item.");

  return transaction(async (conn) => {
    // Harga SELALU diambil dari database, bukan dari browser
    const ids = [...new Set(lines.map((l) => l.productId))];
    const [prodRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, name, category, price, active FROM products WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids,
    );
    const products = new Map(prodRows.map((p) => [String(p.id), p]));
    let subtotal = 0;
    const items = lines.map((l) => {
      const p = products.get(l.productId);
      if (!p) throw new OrderError("Ada produk yang tidak ditemukan. Muat ulang halaman kasir.");
      if (!p.active) throw new OrderError(`"${p.name}" sedang tidak tersedia.`);
      const lineTotal = Number(p.price) * l.qty;
      subtotal += lineTotal;
      return { ...l, name: String(p.name), category: String(p.category), unitPrice: Number(p.price), lineTotal };
    });

    const discount = clampInt(input.discount, 0, subtotal);
    const total = subtotal - discount;
    const method = input.paymentMethod as PaymentMethodId;
    let amountPaid = total;
    let change = 0;
    if (method === "cash") {
      amountPaid = clampInt(input.amountPaid, 0, 100_000_000);
      if (amountPaid < total) throw new OrderError("Uang yang diterima kurang dari total.");
      change = amountPaid - total;
    }

    const customerId = await resolveCustomer(conn, input.customer);
    const orderNo = await nextOrderNo(conn);
    const [res] = await conn.query<ResultSetHeader>(
      `INSERT INTO orders (order_no, customer_id, cashier_id, order_type, status, subtotal, discount, total,
         payment_method, amount_paid, change_amount, note, created_at)
       VALUES (?, ?, ?, ?, 'paid', ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [
        orderNo,
        customerId,
        cashierId,
        input.orderType as OrderTypeId,
        subtotal,
        discount,
        total,
        method,
        amountPaid,
        change,
        (input.note ?? "").trim().slice(0, 500) || null,
      ],
    );
    const orderId = res.insertId;
    for (const it of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, category, unit_price, qty, line_total, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, it.productId, it.name, it.category, it.unitPrice, it.qty, it.lineTotal, it.note || null],
      );
    }
    return { id: orderId, orderNo, total, change };
  });
}

/* ——————————————— Daftar & detail ——————————————— */

export type OrderFilters = {
  from: string;
  to: string;
  status?: string;
  payment?: string;
  type?: string;
  cashier?: number;
  customer?: number;
  q?: string;
};

export const escapeLike = (s: string) => s.replace(/[%_\\]/g, "\\$&");

/** "0858 12" → "6285812" agar cocok dengan format nomor yang disimpan (62…). */
export function phoneSearchTerm(q: string) {
  const d = q.replace(/\D/g, "");
  if (!d) return q;
  return d.startsWith("0") ? "62" + d.slice(1) : d;
}

export function buildOrderWhere(f: OrderFilters, alias = "o") {
  const { start, end } = wibRangeToUtc(f.from, f.to);
  const where = [`${alias}.created_at >= ?`, `${alias}.created_at < ?`];
  const params: (string | number)[] = [start, end];
  if (f.status && isOrderStatus(f.status)) {
    where.push(`${alias}.status = ?`);
    params.push(f.status);
  }
  if (f.payment && isPaymentMethod(f.payment)) {
    where.push(`${alias}.payment_method = ?`);
    params.push(f.payment);
  }
  if (f.type && isOrderType(f.type)) {
    where.push(`${alias}.order_type = ?`);
    params.push(f.type);
  }
  if (f.cashier) {
    where.push(`${alias}.cashier_id = ?`);
    params.push(f.cashier);
  }
  if (f.customer) {
    where.push(`${alias}.customer_id = ?`);
    params.push(f.customer);
  }
  if (f.q) {
    where.push(`(${alias}.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)`);
    const like = `%${escapeLike(f.q)}%`;
    params.push(like, like, `%${escapeLike(phoneSearchTerm(f.q))}%`);
  }
  return { sql: where.join(" AND "), params };
}

export type OrderRow = Row & {
  id: number;
  order_no: string;
  created_at: string;
  order_type: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  customer_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  cashier_name: string | null;
  item_count: number;
};

export async function listOrders(f: OrderFilters, page = 1, perPage = 25) {
  const w = buildOrderWhere(f);
  const base = `FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    LEFT JOIN admin_users u ON u.id = o.cashier_id
    WHERE ${w.sql}`;
  const totals = await queryOne<Row & { n: number; revenue: number }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total ELSE 0 END), 0) AS revenue ${base}`,
    w.params,
  );
  const rows = await query<OrderRow>(
    `SELECT o.id, o.order_no, o.created_at, o.order_type, o.status, o.subtotal, o.discount, o.total, o.payment_method,
       o.customer_id, c.name AS customer_name, c.phone AS customer_phone, u.name AS cashier_name,
       (SELECT COALESCE(SUM(qty),0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
     ${base}
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ? OFFSET ?`,
    [...w.params, perPage, (page - 1) * perPage],
  );
  const total = Number(totals?.n ?? 0);
  return { rows, total, revenue: Number(totals?.revenue ?? 0), totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

export type OrderDetail = Row & {
  id: number;
  order_no: string;
  created_at: string;
  order_type: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  amount_paid: number;
  change_amount: number;
  note: string | null;
  void_reason: string | null;
  voided_at: string | null;
  customer_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  cashier_name: string | null;
  voided_by_name: string | null;
};

export type OrderItemRow = Row & {
  id: number;
  product_id: string | null;
  product_name: string;
  category: string;
  unit_price: number;
  qty: number;
  line_total: number;
  note: string | null;
};

export async function getOrder(id: number) {
  const order = await queryOne<OrderDetail>(
    `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, c.address AS customer_address,
       u.name AS cashier_name, v.name AS voided_by_name
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN admin_users u ON u.id = o.cashier_id
     LEFT JOIN admin_users v ON v.id = o.voided_by
     WHERE o.id = ?`,
    [id],
  );
  if (!order) return null;
  const items = await query<OrderItemRow>(
    "SELECT id, product_id, product_name, category, unit_price, qty, line_total, note FROM order_items WHERE order_id = ? ORDER BY id",
    [id],
  );
  return { order, items };
}

export async function voidOrder(id: number, reason: string, userId: number) {
  const r = reason.trim().slice(0, 255);
  if (r.length < 3) throw new OrderError("Alasan pembatalan wajib diisi.");
  const res = await execute(
    `UPDATE orders SET status = 'void', void_reason = ?, voided_at = UTC_TIMESTAMP(), voided_by = ?
     WHERE id = ? AND status = 'paid'`,
    [r, userId, id],
  );
  if (res.affectedRows === 0) throw new OrderError("Pesanan tidak ditemukan atau sudah dibatalkan.");
}

export async function listCashiers() {
  return query<Row & { id: number; name: string }>("SELECT id, name FROM admin_users ORDER BY name");
}
