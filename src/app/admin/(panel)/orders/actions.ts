"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth";
import { completeWebOrder, OrderError, voidOrder } from "@/lib/server/orders";

export type VoidState = { error?: string; ok?: boolean; reason?: string };

export async function voidOrderAction(_prev: VoidState, formData: FormData): Promise<VoidState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan login ulang." };
  if (user.role !== "admin") return { error: "Hanya Administrator yang boleh membatalkan pesanan." };
  const id = Number(formData.get("id"));
  const reason = String(formData.get("reason") ?? "");
  try {
    await voidOrder(id, reason, user.id);
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message, reason };
    console.error("voidOrderAction", e);
    return { error: "Gagal membatalkan pesanan.", reason };
  }
  refresh();
  return { ok: true };
}

/* ——— Pesanan dari website (boleh diproses kasir maupun admin) ——— */

export type WebOrderState = { error?: string; ok?: boolean; change?: number; reason?: string };

export async function completeWebOrderAction(_prev: WebOrderState, formData: FormData): Promise<WebOrderState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan login ulang." };
  const id = Number(formData.get("id"));
  const method = String(formData.get("payment") ?? "");
  const amount = Number(String(formData.get("amount") ?? "").replace(/\D/g, "")) || 0;
  try {
    const r = await completeWebOrder(id, method, amount, user.id);
    refresh();
    return { ok: true, change: r.change };
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    console.error("completeWebOrderAction", e);
    return { error: "Gagal menyimpan pembayaran." };
  }
}

export async function rejectWebOrderAction(_prev: WebOrderState, formData: FormData): Promise<WebOrderState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan login ulang." };
  const id = Number(formData.get("id"));
  const reason = String(formData.get("reason") ?? "");
  try {
    await voidOrder(id, reason, user.id, { pendingOnly: true });
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message, reason };
    console.error("rejectWebOrderAction", e);
    return { error: "Gagal menolak pesanan.", reason };
  }
  refresh();
  return { ok: true };
}
