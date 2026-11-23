import "server-only";
import { createHash } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { execute, query, queryOne, transaction, type Row } from "./db";
import {
  isOrderSource,
  isOrderStatus,
  isOrderType,
  isPaymentMethod,
  normalizePhone,
  type OrderTypeId,
  type PaymentMethodId,
} from "@/lib/admin/labels";
import { allowedOrderTypes, WEB_ORDER_LIMITS, type WebOrderType } from "@/lib/ordering";
import { getOrderingSettings } from "./settings";
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

/** No. pesanan harian: KC… (kasir) / KW… (website), urutan dibagi bersama per hari WIB. */
async function nextOrderNo(conn: PoolConnection, prefix: "KC" | "KW" = "KC") {
  const day = todayWib();
  await conn.query(
    `INSERT INTO daily_counters (counter_date, seq) VALUES (?, LAST_INSERT_ID(1))
     ON DUPLICATE KEY UPDATE seq = LAST_INSERT_ID(seq + 1)`,
    [day],
  );
  const [rows] = await conn.query<RowDataPacket[]>("SELECT LAST_INSERT_ID() AS seq");
  const seq = Number(rows[0].seq);
  return `${prefix}${day.slice(2).replace(/-/g, "")}-${String(seq).padStart(3, "0")}`;
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

/* ——————————————— Pesanan dari website ——————————————— */

export type WebOrderInput = {
  lines: { id: string; qty: number; note?: string }[];
  name: string;
  phone: string;
  orderType: string;
  address: string;
  area: string;
  landmark: string;
  /** "lat,lng" dari tombol "pakai lokasi saya" (opsional) */
  location: string;
  note: string;
};

export type WebOrderResult = {
  orderNo: string;
  total: number;
  items: { id: string; name: string; qty: number; unitPrice: number; lineTotal: number; note: string }[];
};

/** Batas anti-spam pesanan website. */
const WEB_LIMIT_PER_IP = 5; // per 10 menit per perangkat/IP
const WEB_LIMIT_GLOBAL = 40; // per 10 menit untuk semua pemesan

/** IP tidak disimpan mentah — hanya hash (dengan "garam" rahasia server) untuk batas anti-spam. */
export function hashClientIp(ip: string) {
  return createHash("sha256")
    .update(`koncoan-web-order:${process.env.DB_PASSWORD ?? ""}:${ip}`)
    .digest("hex");
}

const oneLine = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export function mapsLink(location: string | null | undefined) {
  return location ? `https://www.google.com/maps?q=${location}` : null;
}

/**
 * Simpan pesanan dari website (status 'pending' = menunggu konfirmasi & pembayaran di warung).
 * Harga & ketersediaan selalu diambil dari database, bukan dari browser.
 */
export async function createWebOrder(input: WebOrderInput, ipHash: string): Promise<WebOrderResult> {
  const L = WEB_ORDER_LIMITS;
  const settings = await getOrderingSettings();
  const orderType = input.orderType as WebOrderType;
  if (!allowedOrderTypes(settings).includes(orderType)) {
    throw new OrderError(
      orderType === "delivery"
        ? "Maaf, saat ini Mie Koncoan belum menerima pesanan antar."
        : "Jenis pesanan ini sedang tidak tersedia.",
    );
  }

  const name = oneLine(input.name, L.name);
  if (name.length < 2) throw new OrderError("Nama wajib diisi.");
  const phoneRaw = oneLine(input.phone, L.phone);
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) throw new OrderError("Nomor WhatsApp tidak valid. Contoh: 0812-3456-7890.");

  let address: string | null = null;
  let area: string | null = null;
  let landmark: string | null = null;
  let location: string | null = null;
  if (orderType === "delivery") {
    if (!phone) throw new OrderError("Nomor WhatsApp wajib diisi untuk pesanan antar.");
    address = oneLine(input.address, L.address);
    area = oneLine(input.area, L.area);
    landmark = oneLine(input.landmark, L.landmark) || null;
    if (address.length < 5) throw new OrderError("Alamat lengkap wajib diisi untuk pesanan antar.");
    if (area.length < 2) throw new OrderError("Desa/kelurahan wajib diisi untuk pesanan antar.");
    const loc = oneLine(input.location, 40);
    const m = loc.match(/^(-?\d{1,2}(?:\.\d{1,7})?),(-?\d{1,3}(?:\.\d{1,7})?)$/);
    if (m && Math.abs(Number(m[1])) <= 90 && Math.abs(Number(m[2])) <= 180) location = `${m[1]},${m[2]}`;
  }
  const note = oneLine(input.note, L.note) || null;

  const lines = (Array.isArray(input.lines) ? input.lines : [])
    .map((l) => ({ id: String(l?.id ?? "").slice(0, 64), qty: clampInt(l?.qty, 0, L.qty), note: oneLine(l?.note, L.itemNote) }))
    .filter((l) => l.id && l.qty > 0);
  if (lines.length === 0) throw new OrderError("Keranjang masih kosong.");
  if (lines.length > L.lines || new Set(lines.map((l) => l.id)).size !== lines.length) {
    throw new OrderError("Isi keranjang tidak valid. Muat ulang halaman lalu coba lagi.");
  }

  // Anti-spam
  const recent = await queryOne<Row & { mine: number; all_web: number }>(
    `SELECT COALESCE(SUM(client_ip_hash = ?), 0) AS mine, COUNT(*) AS all_web
     FROM orders WHERE source = 'web' AND created_at >= UTC_TIMESTAMP() - INTERVAL 10 MINUTE`,
    [ipHash],
  );
  if (Number(recent?.mine ?? 0) >= WEB_LIMIT_PER_IP || Number(recent?.all_web ?? 0) >= WEB_LIMIT_GLOBAL) {
    throw new OrderError("Terlalu banyak pesanan dalam waktu singkat. Coba lagi beberapa menit lagi atau chat WhatsApp langsung.");
  }

  return transaction(async (conn) => {
    const ids = lines.map((l) => l.id);
    const [prodRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, name, category, price, active FROM products WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids,
    );
    const products = new Map(prodRows.map((p) => [String(p.id), p]));
    let total = 0;
    const items = lines.map((l) => {
      const p = products.get(l.id);
      if (!p || !p.active) throw new OrderError(`Ada menu yang sudah tidak tersedia${p ? ` (${p.name})` : ""}. Hapus dari keranjang lalu coba lagi.`);
      const unitPrice = Number(p.price);
      const lineTotal = unitPrice * l.qty;
      total += lineTotal;
      return { id: l.id, name: String(p.name), category: String(p.category), qty: l.qty, unitPrice, lineTotal, note: l.note };
    });
    if (orderType === "delivery" && settings.deliveryMinOrder > 0 && total < settings.deliveryMinOrder) {
      throw new OrderError(`Minimal belanja untuk diantar Rp${settings.deliveryMinOrder.toLocaleString("id-ID")}.`);
    }

    // Konsumen dicatat bila ada nomor WhatsApp (dicocokkan dengan data yang sudah ada)
    let customerId: number | null = null;
    if (phone) {
      const [found] = await conn.query<RowDataPacket[]>("SELECT id, address FROM customers WHERE phone = ?", [phone]);
      if (found[0]) {
        customerId = Number(found[0].id);
        // Hanya melengkapi alamat yang masih kosong — data konsumen yang sudah ada tidak ditimpa dari website
        // (siapa pun bisa mengetik nomor orang lain). Alamat antar tetap tersimpan di pesanannya.
        if (address && !found[0].address) {
          const full = [address, area].filter(Boolean).join(", ").slice(0, 255);
          await conn.query("UPDATE customers SET address = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [full, customerId]);
        }
      } else {
        const [res] = await conn.query<ResultSetHeader>(
          "INSERT INTO customers (name, phone, address, created_at, updated_at) VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())",
          [name, phone, address ? [address, area].filter(Boolean).join(", ").slice(0, 255) : null],
        );
        customerId = res.insertId;
      }
    }

    const orderNo = await nextOrderNo(conn, "KW");
    const [res] = await conn.query<ResultSetHeader>(
      `INSERT INTO orders (order_no, source, customer_id, cashier_id, order_type, status, subtotal, discount, total,
         payment_method, amount_paid, change_amount, note, contact_name, contact_phone,
         delivery_address, delivery_area, delivery_landmark, delivery_maps, client_ip_hash, created_at)
       VALUES (?, 'web', ?, NULL, ?, 'pending', ?, 0, ?, NULL, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [orderNo, customerId, orderType, total, total, note, name, phone, address, area, landmark, location, ipHash],
    );
    for (const it of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, category, unit_price, qty, line_total, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [res.insertId, it.id, it.name, it.category, it.unitPrice, it.qty, it.lineTotal, it.note || null],
      );
    }
    return {
      orderNo,
      total,
      items: items.map(({ id, name, qty, unitPrice, lineTotal, note }) => ({ id, name, qty, unitPrice, lineTotal, note })),
    };
  });
}

/** Pesanan website diselesaikan di warung: dibayar → masuk laporan pendapatan. */
export async function completeWebOrder(id: number, paymentMethod: string, amountPaidInput: number, userId: number) {
  if (!isPaymentMethod(paymentMethod)) throw new OrderError("Pilih metode pembayaran.");
  const o = await queryOne<Row & { total: number }>(
    "SELECT total FROM orders WHERE id = ? AND source = 'web' AND status = 'pending'",
    [id],
  );
  if (!o) throw new OrderError("Pesanan tidak ditemukan atau sudah diproses.");
  const total = Number(o.total);
  let amountPaid = total;
  let change = 0;
  if (paymentMethod === "cash") {
    amountPaid = clampInt(amountPaidInput || total, 0, 100_000_000);
    if (amountPaid < total) throw new OrderError("Uang yang diterima kurang dari total.");
    change = amountPaid - total;
  }
  const res = await execute(
    `UPDATE orders SET status = 'paid', payment_method = ?, amount_paid = ?, change_amount = ?,
       cashier_id = ?, completed_at = UTC_TIMESTAMP(), completed_by = ?
     WHERE id = ? AND source = 'web' AND status = 'pending'`,
    [paymentMethod, amountPaid, change, userId, userId, id],
  );
  if (res.affectedRows === 0) throw new OrderError("Pesanan tidak ditemukan atau sudah diproses.");
  return { change };
}

export async function countPendingWebOrders() {
  const r = await queryOne<Row & { n: number }>("SELECT COUNT(*) AS n FROM orders WHERE source = 'web' AND status = 'pending'");
  return Number(r?.n ?? 0);
}

export type WebOrderRow = Row & {
  id: number;
  order_no: string;
  created_at: string;
  order_type: string;
  total: number;
  note: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  delivery_address: string | null;
  delivery_area: string | null;
  delivery_landmark: string | null;
  delivery_maps: string | null;
  customer_id: number | null;
};

/** Pesanan website yang menunggu diproses (semua tanggal), terlama dulu. */
export async function listPendingWebOrders() {
  const orders = await query<WebOrderRow>(
    `SELECT id, order_no, created_at, order_type, total, note, contact_name, contact_phone,
       delivery_address, delivery_area, delivery_landmark, delivery_maps, customer_id
     FROM orders WHERE source = 'web' AND status = 'pending' ORDER BY created_at, id LIMIT 100`,
  );
  if (!orders.length) return [];
  const ids = orders.map((o) => o.id);
  const items = await query<OrderItemRow & { order_id: number }>(
    `SELECT id, order_id, product_id, product_name, category, unit_price, qty, line_total, note
     FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")}) ORDER BY id`,
    ids,
  );
  return orders.map((o) => ({ ...o, items: items.filter((i) => Number(i.order_id) === o.id) }));
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
  source?: string;
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
  if (f.source && isOrderSource(f.source)) {
    where.push(`${alias}.source = ?`);
    params.push(f.source);
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
    where.push(
      `(${alias}.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR ${alias}.contact_name LIKE ? OR ${alias}.contact_phone LIKE ?)`,
    );
    const like = `%${escapeLike(f.q)}%`;
    const phoneLike = `%${escapeLike(phoneSearchTerm(f.q))}%`;
    params.push(like, like, phoneLike, like, phoneLike);
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
  payment_method: string | null;
  source: string;
  customer_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  contact_name: string | null;
  contact_phone: string | null;
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
       o.source, o.contact_name, o.contact_phone, o.customer_id, c.name AS customer_name, c.phone AS customer_phone, u.name AS cashier_name,
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
  payment_method: string | null;
  source: string;
  contact_name: string | null;
  contact_phone: string | null;
  delivery_address: string | null;
  delivery_area: string | null;
  delivery_landmark: string | null;
  delivery_maps: string | null;
  completed_at: string | null;
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

/** Batalkan pesanan. `pendingOnly`: hanya pesanan website yang belum diproses (boleh oleh kasir). */
export async function voidOrder(id: number, reason: string, userId: number, opts: { pendingOnly?: boolean } = {}) {
  const r = reason.trim().slice(0, 255);
  if (r.length < 3) throw new OrderError("Alasan pembatalan wajib diisi.");
  const res = await execute(
    `UPDATE orders SET status = 'void', void_reason = ?, voided_at = UTC_TIMESTAMP(), voided_by = ?
     WHERE id = ? AND status IN (${opts.pendingOnly ? "'pending'" : "'paid','pending'"})`,
    [r, userId, id],
  );
  if (res.affectedRows === 0) throw new OrderError("Pesanan tidak ditemukan atau sudah dibatalkan.");
}

export async function listCashiers() {
  return query<Row & { id: number; name: string }>("SELECT id, name FROM admin_users ORDER BY name");
}
