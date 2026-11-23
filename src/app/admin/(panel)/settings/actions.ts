"use server";

import { refresh, updateTag } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth";
import { PUBLIC_SETTINGS_TAG, saveOrderingSettings } from "@/lib/server/settings";

export type SettingsState = { error?: string; ok?: boolean };

export async function saveSettingsAction(_p: SettingsState, fd: FormData): Promise<SettingsState> {
  const u = await getCurrentUser();
  if (!u) return { error: "Sesi berakhir. Silakan login ulang." };
  if (u.role !== "admin") return { error: "Hanya Administrator yang boleh mengubah pengaturan." };
  try {
    await saveOrderingSettings({
      takeAway: fd.get("takeAway") === "1",
      delivery: fd.get("delivery") === "1",
      deliveryNote: String(fd.get("deliveryNote") ?? ""),
      deliveryMinOrder: Number(String(fd.get("deliveryMinOrder") ?? "").replace(/\D/g, "")) || 0,
    });
  } catch (e) {
    console.error("saveSettingsAction", e);
    return { error: "Gagal menyimpan pengaturan." };
  }
  updateTag(PUBLIC_SETTINGS_TAG); // website ikut diperbarui
  refresh();
  return { ok: true };
}
