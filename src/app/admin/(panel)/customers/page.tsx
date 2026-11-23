import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { listCustomers } from "@/lib/server/customers";
import { parsePage, qs, str } from "@/lib/admin/filters";
import { formatPhone } from "@/lib/admin/labels";
import { formatWib } from "@/lib/time";
import { ButtonLink, EmptyState, PageHeader, Pagination, TableWrap, inputClass, tdClass, thClass } from "@/components/admin/ui";
import { formatRp, num } from "@/components/admin/format";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Konsumen" };

const SORTS = [
  { id: "recent", label: "Order terakhir" },
  { id: "spent", label: "Total belanja terbesar" },
  { id: "orders", label: "Order terbanyak" },
  { id: "name", label: "Nama (A–Z)" },
  { id: "new", label: "Baru ditambahkan" },
];

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireUser();
  const sp = await searchParams;
  const q = str(sp.q)?.slice(0, 50);
  const sort = SORTS.some((s) => s.id === str(sp.sort)) ? str(sp.sort)! : "recent";
  const page = parsePage(sp);
  const data = await listCustomers({ q, sort, page });

  return (
    <>
      <PageHeader
        title="Konsumen"
        subtitle={`${num(data.total)} konsumen tercatat`}
        actions={
          <ButtonLink href="/admin/customers/new">
            <UserPlus className="size-4" /> Tambah konsumen
          </ButtonLink>
        }
      />

      <form method="get" className="mb-6 flex flex-col gap-3 rounded-3xl border-2 border-grape-ink bg-white p-3 shadow-pop-sm sm:flex-row sm:items-end sm:p-4">
        <label className="block flex-1">
          <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Cari</span>
          <input name="q" type="search" defaultValue={q} placeholder="Nama atau no. HP" className={`${inputClass} mt-1`} />
        </label>
        <label className="block sm:w-60">
          <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Urutkan</span>
          <select name="sort" defaultValue={sort} className={`${inputClass} mt-1 font-semibold`}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-grape px-5 text-sm font-bold text-white shadow-pop-sm"
        >
          <Search className="size-4" /> Cari
        </button>
      </form>

      {data.rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "Konsumen tidak ditemukan" : "Belum ada konsumen"}
          description="Konsumen bisa ditambahkan dari sini atau langsung saat transaksi di Kasir."
        />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>Nama</th>
                <th className={thClass}>No. HP</th>
                <th className={`${thClass} text-right`}>Jumlah order</th>
                <th className={`${thClass} text-right`}>Total belanja</th>
                <th className={thClass}>Order terakhir (WIB)</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((c) => (
                <tr key={c.id} className="hover:bg-lavender/40">
                  <td className={tdClass}>
                    <Link href={`/admin/customers/${c.id}`} className="font-bold text-grape hover:underline">
                      {c.name}
                    </Link>
                    {c.notes && <p className="max-w-xs truncate text-xs text-grape-ink/55">{c.notes}</p>}
                  </td>
                  <td className={tdClass}>{formatPhone(c.phone) || <span className="text-grape-ink/40">—</span>}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{num(Number(c.order_count))}</td>
                  <td className={`${tdClass} text-right font-bold tabular-nums`}>{formatRp(Number(c.total_spent))}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    {c.last_order_at ? formatWib(c.last_order_at) : <span className="text-grape-ink/40">belum pernah</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={page} totalPages={data.totalPages} makeHref={(p) => `/admin/customers${qs({ q, sort, page: p })}`} />
        </>
      )}
    </>
  );
}
