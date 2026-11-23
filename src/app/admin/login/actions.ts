"use server";

import { redirect } from "next/navigation";
import { queryOne, type Row } from "@/lib/server/db";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { createSession, destroySession, isLockedOut, recordLoginAttempt } from "@/lib/server/auth";

// Hash palsu agar waktu respons sama walau username tidak ada (anti user-enumeration)
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword("dummy-password-koncoan"));

export type LoginState = { error?: string; username?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase().slice(0, 50);
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Username dan password wajib diisi.", username };

  if (await isLockedOut(username)) {
    return { error: "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.", username };
  }

  const user = await queryOne<Row & { id: number; password_hash: string; active: number }>(
    "SELECT id, password_hash, active FROM admin_users WHERE username = ?",
    [username],
  );
  const passwordOk = await verifyPassword(password, user ? user.password_hash : await getDummyHash());
  const ok = !!user && user.active === 1 && passwordOk;
  await recordLoginAttempt(username, ok);
  if (!ok || !user) return { error: "Username atau password salah.", username };

  await createSession(Number(user.id));
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
