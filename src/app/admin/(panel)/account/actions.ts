"use server";

import { getCurrentUser } from "@/lib/server/auth";
import { changeOwnPassword, UserError } from "@/lib/server/users";

export type PwState = { error?: string; ok?: boolean };

export async function changePasswordAction(_p: PwState, fd: FormData): Promise<PwState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan login ulang." };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next !== String(fd.get("confirm") ?? "")) return { error: "Konfirmasi password baru tidak sama." };
  try {
    await changeOwnPassword(user.id, current, next);
  } catch (e) {
    if (e instanceof UserError) return { error: e.message };
    console.error("changePasswordAction", e);
    return { error: "Gagal mengganti password." };
  }
  return { ok: true };
}
