"use server";

import { headers } from "next/headers";
import { createWebOrder, hashClientIp, OrderError, type WebOrderInput, type WebOrderResult } from "@/lib/server/orders";

export type PlaceOrderResult =
  | ({ ok: true } & WebOrderResult)
  /** `retryable`: gangguan server/database — pesanan tetap bisa dikirim lewat WhatsApp tanpa nomor pesanan */
  | { ok: false; error: string; retryable: boolean };

/**
 * Simpan pesanan dari website ke database (masuk ke panel admin sebagai "Menunggu").
 * Dipanggil dari keranjang sebelum WhatsApp dibuka.
 */
export async function placeWebOrder(input: WebOrderInput & { website?: string }): Promise<PlaceOrderResult> {
  // Honeypot: kolom tersembunyi yang hanya diisi bot
  if (input?.website) return { ok: false, error: "Pesanan tidak dapat diproses.", retryable: false };

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
  try {
    const r = await createWebOrder(input, hashClientIp(ip));
    return { ok: true, ...r };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message, retryable: false };
    console.error("placeWebOrder", e);
    return { ok: false, error: "Server sedang bermasalah.", retryable: true };
  }
}
