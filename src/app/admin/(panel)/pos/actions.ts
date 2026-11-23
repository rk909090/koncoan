"use server";

import { getCurrentUser } from "@/lib/server/auth";
import { createOrder, OrderError, type NewOrderInput } from "@/lib/server/orders";
import { searchCustomers } from "@/lib/server/customers";

export type CreateOrderResult =
  | { ok: true; id: number; orderNo: string; total: number; change: number }
  | { ok: false; error: string };

export async function createOrderAction(input: NewOrderInput): Promise<CreateOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan login ulang." };
  try {
    const r = await createOrder(input, user.id);
    return { ok: true, ...r };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error("createOrderAction", e);
    return { ok: false, error: "Gagal menyimpan pesanan. Coba lagi." };
  }
}

export async function searchCustomersAction(q: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  const rows = await searchCustomers(String(q).slice(0, 50));
  return rows.map((r) => ({ id: Number(r.id), name: String(r.name), phone: r.phone ? String(r.phone) : null }));
}
