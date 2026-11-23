import "server-only";
import { execute, query, queryOne, type Row } from "./db";
import { hashPassword, validateNewPassword, verifyPassword } from "./password";
import { destroyUserSessions, type Role } from "./auth";

export class UserError extends Error {}

export type UserRow = Row & {
  id: number;
  username: string;
  name: string;
  role: Role;
  active: number;
  last_login_at: string | null;
  created_at: string;
};

export async function listUsers() {
  return query<UserRow>(
    "SELECT id, username, name, role, active, last_login_at, created_at FROM admin_users ORDER BY active DESC, role, name",
  );
}

const USERNAME_RE = /^[a-z0-9._-]{3,50}$/;

export async function createUser(input: { username: string; name: string; role: string; password: string }) {
  const username = input.username.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) throw new UserError("Username 3–50 karakter: huruf kecil, angka, titik, - atau _.");
  const name = input.name.trim().slice(0, 100);
  if (!name) throw new UserError("Nama wajib diisi.");
  if (input.role !== "admin" && input.role !== "kasir") throw new UserError("Peran tidak valid.");
  const pwErr = validateNewPassword(input.password);
  if (pwErr) throw new UserError(pwErr);
  if (await queryOne("SELECT id FROM admin_users WHERE username = ?", [username])) {
    throw new UserError("Username sudah dipakai.");
  }
  await execute(
    `INSERT INTO admin_users (username, name, password_hash, role, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
    [username, name, await hashPassword(input.password), input.role],
  );
}

async function activeAdminCount(exceptId: number) {
  const r = await queryOne<Row & { n: number }>(
    "SELECT COUNT(*) AS n FROM admin_users WHERE role = 'admin' AND active = 1 AND id <> ?",
    [exceptId],
  );
  return Number(r?.n ?? 0);
}

export async function updateUser(
  actingUserId: number,
  id: number,
  input: { name: string; role: string; active: boolean; newPassword?: string },
) {
  const name = input.name.trim().slice(0, 100);
  if (!name) throw new UserError("Nama wajib diisi.");
  if (input.role !== "admin" && input.role !== "kasir") throw new UserError("Peran tidak valid.");
  const target = await queryOne<UserRow>("SELECT id, role, active FROM admin_users WHERE id = ?", [id]);
  if (!target) throw new UserError("Pengguna tidak ditemukan.");
  const losingAdmin = target.role === "admin" && (input.role !== "admin" || !input.active);
  if (losingAdmin && (await activeAdminCount(id)) === 0) {
    throw new UserError("Harus ada minimal satu admin aktif.");
  }
  if (id === actingUserId && !input.active) throw new UserError("Anda tidak bisa menonaktifkan akun sendiri.");
  await execute("UPDATE admin_users SET name = ?, role = ?, active = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [
    name,
    input.role,
    input.active ? 1 : 0,
    id,
  ]);
  if (input.newPassword) {
    const pwErr = validateNewPassword(input.newPassword);
    if (pwErr) throw new UserError(pwErr);
    await execute("UPDATE admin_users SET password_hash = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [
      await hashPassword(input.newPassword),
      id,
    ]);
    await destroyUserSessions(id);
  }
  if (!input.active) await destroyUserSessions(id);
}

export async function changeOwnPassword(userId: number, current: string, next: string) {
  const row = await queryOne<Row & { password_hash: string }>("SELECT password_hash FROM admin_users WHERE id = ?", [userId]);
  if (!row || !(await verifyPassword(current, row.password_hash))) throw new UserError("Password saat ini salah.");
  const err = validateNewPassword(next);
  if (err) throw new UserError(err);
  if (current === next) throw new UserError("Password baru harus berbeda dari yang lama.");
  await execute("UPDATE admin_users SET password_hash = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [
    await hashPassword(next),
    userId,
  ]);
  await destroyUserSessions(userId, true);
}
