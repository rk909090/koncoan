import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { execute, query, type Row } from "./db";
import { DEFAULT_ORDERING, type OrderingSettings } from "@/lib/ordering";

/** Tag cache pengaturan pemesanan publik — di-invalidate saat admin menyimpan pengaturan. */
export const PUBLIC_SETTINGS_TAG = "public-settings";

const KEYS = {
  takeAway: "order_takeaway_enabled",
  delivery: "order_delivery_enabled",
  deliveryNote: "order_delivery_note",
  deliveryMinOrder: "order_delivery_min_order",
} as const;

/** Pengaturan pemesanan langsung dari database (tanpa cache) — untuk admin & validasi pesanan. */
export async function getOrderingSettings(): Promise<OrderingSettings> {
  const rows = await query<Row & { name: string; value: string }>(
    `SELECT name, value FROM settings WHERE name IN (${Object.values(KEYS).map(() => "?").join(",")})`,
    Object.values(KEYS),
  );
  const v = new Map(rows.map((r) => [String(r.name), String(r.value)]));
  const bool = (k: string, d: boolean) => (v.has(k) ? v.get(k) === "1" : d);
  const min = Number(v.get(KEYS.deliveryMinOrder));
  return {
    takeAway: bool(KEYS.takeAway, DEFAULT_ORDERING.takeAway),
    delivery: bool(KEYS.delivery, DEFAULT_ORDERING.delivery),
    deliveryNote: v.get(KEYS.deliveryNote) ?? DEFAULT_ORDERING.deliveryNote,
    deliveryMinOrder: Number.isFinite(min) && min > 0 ? Math.trunc(min) : 0,
  };
}

/**
 * Versi ter-cache untuk situs publik (halaman tetap ter-prerender).
 * Bila database tidak bisa diakses, memakai pengaturan bawaan.
 */
export async function getPublicOrdering(): Promise<OrderingSettings> {
  "use cache";
  cacheTag(PUBLIC_SETTINGS_TAG);
  cacheLife("minutes");
  try {
    return await getOrderingSettings();
  } catch (e) {
    console.warn("[settings] database tidak bisa diakses, memakai pengaturan bawaan:", (e as Error).message);
    return DEFAULT_ORDERING;
  }
}

export async function saveOrderingSettings(s: OrderingSettings) {
  const pairs: [string, string][] = [
    [KEYS.takeAway, s.takeAway ? "1" : "0"],
    [KEYS.delivery, s.delivery ? "1" : "0"],
    [KEYS.deliveryNote, s.deliveryNote.trim().slice(0, 300)],
    [KEYS.deliveryMinOrder, String(Math.max(0, Math.min(10_000_000, Math.trunc(s.deliveryMinOrder) || 0)))],
  ];
  for (const [name, value] of pairs) {
    await execute(
      `INSERT INTO settings (name, value, updated_at) VALUES (?, ?, UTC_TIMESTAMP())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = UTC_TIMESTAMP()`,
      [name, value],
    );
  }
}
