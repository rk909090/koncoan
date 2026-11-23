"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth";
import { createUser, updateUser, UserError } from "@/lib/server/users";

export type UserFormState = { error?: string; ok?: boolean; values?: { username?: string; name?: string; role?: string } };

export async function saveUserAction(_p: UserFormState, fd: FormData): Promise<UserFormState> {
  const me = await getCurrentUser();
  if (!me) return { error: "Sesi berakhir. Silakan login ulang." };
  if (me.role !== "admin") return { error: "Hanya Administrator yang boleh mengelola pengguna." };
  const id = Number(fd.get("id") || 0);
  const values = { username: String(fd.get("username") ?? ""), name: String(fd.get("name") ?? ""), role: String(fd.get("role") ?? "") };
  try {
    if (id) {
      await updateUser(me.id, id, {
        name: String(fd.get("name") ?? ""),
        role: String(fd.get("role") ?? ""),
        active: fd.get("active") === "1",
        newPassword: String(fd.get("password") ?? "") || undefined,
      });
    } else {
      await createUser({
        username: String(fd.get("username") ?? ""),
        name: String(fd.get("name") ?? ""),
        role: String(fd.get("role") ?? ""),
        password: String(fd.get("password") ?? ""),
      });
    }
  } catch (e) {
    if (e instanceof UserError) return { error: e.message, values };
    console.error("saveUserAction", e);
    return { error: "Gagal menyimpan pengguna.", values };
  }
  refresh();
  return { ok: true };
}
