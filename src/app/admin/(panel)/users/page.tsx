import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { listUsers } from "@/lib/server/users";
import { formatWib } from "@/lib/time";
import { Badge, PageHeader, TableWrap, tdClass, thClass } from "@/components/admin/ui";
import { UserEditor } from "./UserEditor";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const me = await requireUser("admin");
  const users = await listUsers();
  return (
    <>
      <PageHeader
        title="Pengguna"
        subtitle="Akun untuk login ke panel. Kasir hanya bisa mengakses Kasir, Pesanan, dan Konsumen."
        actions={<UserEditor />}
      />
      <TableWrap>
        <thead>
          <tr>
            <th className={thClass}>Nama</th>
            <th className={thClass}>Username</th>
            <th className={thClass}>Peran</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Login terakhir (WIB)</th>
            <th className={thClass} />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className={`${tdClass} font-bold`}>
                {u.name} {u.id === me.id && <span className="text-xs font-semibold text-grape">(Anda)</span>}
              </td>
              <td className={tdClass}>{u.username}</td>
              <td className={tdClass}>{u.role === "admin" ? <Badge tone="grape">Administrator</Badge> : <Badge tone="info">Kasir</Badge>}</td>
              <td className={tdClass}>{u.active ? <Badge tone="success">Aktif</Badge> : <Badge tone="danger">Nonaktif</Badge>}</td>
              <td className={`${tdClass} whitespace-nowrap`}>{u.last_login_at ? formatWib(u.last_login_at) : "—"}</td>
              <td className={`${tdClass} text-right`}>
                <UserEditor
                  isSelf={u.id === me.id}
                  user={{ id: Number(u.id), username: u.username, name: u.name, role: u.role, active: !!u.active }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </>
  );
}
