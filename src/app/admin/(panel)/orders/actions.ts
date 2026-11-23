"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth";
import { OrderError, voidOrder } from "@/lib/server/orders";

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
