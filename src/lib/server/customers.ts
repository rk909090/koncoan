import "server-only";
import { execute, query, queryOne, type Row } from "./db";
import { escapeLike, phoneSearchTerm } from "./orders";
import { normalizePhone } from "@/lib/admin/labels";

export type CustomerRow = Row & {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
};

export class CustomerError extends Error {}

const SORTS: Record<string, string> = {
  recent: "last_order_at DESC, c.id DESC",
  spent: "total_spent DESC, c.id DESC",
  orders: "order_count DESC, c.id DESC",
  name: "c.name ASC",
  new: "c.created_at DESC",
};

export async function listCustomers(opts: { q?: string; sort?: string; page?: number; perPage?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = opts.perPage ?? 25;
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.q) {
    where.push("(c.name LIKE ? OR c.phone LIKE ?)");
    params.push(`%${escapeLike(opts.q)}%`, `%${escapeLike(phoneSearchTerm(opts.q))}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const totalRow = await queryOne<Row & { n: number }>(`SELECT COUNT(*) AS n FROM customers c ${whereSql}`, params);
  const rows = await query<CustomerRow>(
    `SELECT c.id, c.name, c.phone, c.address, c.notes, c.created_at,
       COUNT(o.id) AS order_count,
       COALESCE(SUM(o.total), 0) AS total_spent,
       MAX(o.created_at) AS last_order_at
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'
     ${whereSql}
     GROUP BY c.id
     ORDER BY ${SORTS[opts.sort ?? "recent"] ?? SORTS.recent}
     LIMIT ? OFFSET ?`,
    [...params, perPage, (page - 1) * perPage],
  );
  const total = Number(totalRow?.n ?? 0);
  return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function searchCustomers(q: string, limit = 8) {
  if (!q.trim()) return [];
  return query<Row & { id: number; name: string; phone: string | null }>(
    `SELECT id, name, phone FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY updated_at DESC LIMIT ?`,
    [`%${escapeLike(q)}%`, `%${escapeLike(phoneSearchTerm(q))}%`, limit],
  );
}

export async function getCustomer(id: number) {
  const customer = await queryOne<CustomerRow>(
    `SELECT c.id, c.name, c.phone, c.address, c.notes, c.created_at,
       COUNT(o.id) AS order_count,
       COALESCE(SUM(o.total), 0) AS total_spent,
       MAX(o.created_at) AS last_order_at
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'
     WHERE c.id = ?
     GROUP BY c.id`,
    [id],
  );
  if (!customer) return null;
  const orders = await query<
    Row & {
      id: number;
      order_no: string;
      created_at: string;
      status: string;
      total: number;
      payment_method: string;
      order_type: string;
      items_summary: string | null;
    }
  >(
    `SELECT o.id, o.order_no, o.created_at, o.status, o.total, o.payment_method, o.order_type,
       (SELECT GROUP_CONCAT(CONCAT(oi.qty, '× ', oi.product_name) ORDER BY oi.id SEPARATOR ', ')
          FROM order_items oi WHERE oi.order_id = o.id) AS items_summary
     FROM orders o WHERE o.customer_id = ?
     ORDER BY o.created_at DESC LIMIT 200`,
    [id],
  );
  const favorites = await query<Row & { product_name: string; qty: number }>(
    `SELECT oi.product_name, SUM(oi.qty) AS qty
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.customer_id = ? AND o.status = 'paid'
     GROUP BY oi.product_name ORDER BY qty DESC LIMIT 5`,
    [id],
  );
  return { customer, orders, favorites };
}

function cleanCustomer(input: { name: string; phone?: string; address?: string; notes?: string }) {
  const name = input.name.trim().slice(0, 100);
  if (!name) throw new CustomerError("Nama wajib diisi.");
  const phoneRaw = (input.phone ?? "").trim();
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) throw new CustomerError("Format nomor HP tidak valid (contoh: 0858-1221-5099).");
  return {
    name,
    phone,
    address: (input.address ?? "").trim().slice(0, 255) || null,
    notes: (input.notes ?? "").trim().slice(0, 500) || null,
  };
}

async function assertPhoneFree(phone: string | null, exceptId?: number) {
  if (!phone) return;
  const dup = await queryOne<Row & { id: number; name: string }>(
    "SELECT id, name FROM customers WHERE phone = ? AND id <> ?",
    [phone, exceptId ?? 0],
  );
  if (dup) throw new CustomerError(`Nomor HP sudah dipakai konsumen "${dup.name}".`);
}

export async function createCustomer(input: { name: string; phone?: string; address?: string; notes?: string }) {
  const c = cleanCustomer(input);
  await assertPhoneFree(c.phone);
  const res = await execute(
    "INSERT INTO customers (name, phone, address, notes, created_at, updated_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())",
    [c.name, c.phone, c.address, c.notes],
  );
  return res.insertId;
}

export async function updateCustomer(
  id: number,
  input: { name: string; phone?: string; address?: string; notes?: string },
) {
  const c = cleanCustomer(input);
  await assertPhoneFree(c.phone, id);
  const res = await execute(
    "UPDATE customers SET name = ?, phone = ?, address = ?, notes = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?",
    [c.name, c.phone, c.address, c.notes, id],
  );
  if (res.affectedRows === 0) throw new CustomerError("Konsumen tidak ditemukan.");
}
