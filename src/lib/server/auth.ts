import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { execute, query, queryOne, type Row } from "./db";

export const SESSION_COOKIE = "koncoan_admin";
const SESSION_DAYS = 7;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export type Role = "admin" | "kasir";
export type AdminUser = { id: number; username: string; name: string; role: Role };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function clientInfo() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
  const ua = (h.get("user-agent") || "").slice(0, 255);
  return { ip, ua };
}

/* ——— Rate limit login ——— */

export async function isLockedOut(username: string) {
  const { ip } = await clientInfo();
  const r = await queryOne<Row & { by_user: number; by_ip: number }>(
    `SELECT
       SUM(username = ?) AS by_user,
       SUM(ip = ?) AS by_ip
     FROM login_attempts
     WHERE success = 0 AND created_at > UTC_TIMESTAMP() - INTERVAL ? MINUTE`,
    [username, ip, LOCK_MINUTES],
  );
  // per username 5x gagal; per IP 20x (banyak kasir bisa berbagi wifi yang sama)
  return Number(r?.by_user ?? 0) >= MAX_FAILED || Number(r?.by_ip ?? 0) >= MAX_FAILED * 4;
}

export async function recordLoginAttempt(username: string, success: boolean) {
  const { ip } = await clientInfo();
  await execute(
    "INSERT INTO login_attempts (username, ip, success, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP())",
    [username.slice(0, 50), ip, success ? 1 : 0],
  );
  // bersihkan catatan lama
  await execute("DELETE FROM login_attempts WHERE created_at < UTC_TIMESTAMP() - INTERVAL 30 DAY");
}

/* ——— Sesi ——— */

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const { ip, ua } = await clientInfo();
  await execute(
    `INSERT INTO admin_sessions (id, user_id, expires_at, created_at, ip, user_agent)
     VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL ? DAY, UTC_TIMESTAMP(), ?, ?)`,
    [sha256(token), userId, SESSION_DAYS, ip, ua],
  );
  await execute("UPDATE admin_users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [userId]);
  await execute("DELETE FROM admin_sessions WHERE expires_at < UTC_TIMESTAMP()");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await execute("DELETE FROM admin_sessions WHERE id = ?", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

/** Hapus semua sesi milik user (mis. setelah ganti password / dinonaktifkan). */
export async function destroyUserSessions(userId: number, exceptCurrent = false) {
  if (exceptCurrent) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) {
      await execute("DELETE FROM admin_sessions WHERE user_id = ? AND id <> ?", [userId, sha256(token)]);
      return;
    }
  }
  await execute("DELETE FROM admin_sessions WHERE user_id = ?", [userId]);
}

/** User yang sedang login, atau null. Di-dedupe per request. */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await queryOne<Row & AdminUser & { active: number }>(
    `SELECT u.id, u.username, u.name, u.role, u.active
     FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > UTC_TIMESTAMP()`,
    [sha256(token)],
  );
  if (!row || !row.active) return null;
  return { id: Number(row.id), username: row.username, name: row.name, role: row.role };
});

/** Wajib login (dan opsional role tertentu); jika tidak, redirect. */
export async function requireUser(role?: Role): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (role === "admin" && user.role !== "admin") redirect("/admin?denied=1");
  return user;
}

export async function listActiveSessions(userId: number) {
  return query<Row & { created_at: string; ip: string | null; user_agent: string | null }>(
    "SELECT created_at, ip, user_agent FROM admin_sessions WHERE user_id = ? AND expires_at > UTC_TIMESTAMP() ORDER BY created_at DESC",
    [userId],
  );
}
