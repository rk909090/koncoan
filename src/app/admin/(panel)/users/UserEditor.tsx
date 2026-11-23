"use client";

import { useActionState, useState } from "react";
import { Check, Pencil, UserPlus, X } from "lucide-react";
import { saveUserAction, type UserFormState } from "./actions";

const ctl =
  "mt-1 h-10 w-full rounded-xl border-2 border-grape-ink bg-white px-3 text-sm outline-none placeholder:text-grape-ink/40 focus:ring-4 focus:ring-lemon";

type U = { id: number; username: string; name: string; role: string; active: boolean };

export function UserEditor({ user, isSelf }: { user?: U; isSelf?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<UserFormState, FormData>(async (prev, fd) => {
    const r = await saveUserAction(prev, fd);
    if (r.ok) setOpen(false);
    return r;
  }, {});

  if (!open)
    return user ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border-2 border-grape-ink bg-white px-3 py-1 text-xs font-bold hover:bg-lemon"
      >
        <Pencil className="size-3.5" /> Ubah
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-grape-ink bg-grape px-5 text-sm font-bold text-white shadow-pop-sm"
      >
        <UserPlus className="size-4" /> Tambah pengguna
      </button>
    );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-grape-ink/50 p-4" onClick={() => setOpen(false)}>
      <form
        action={action}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-[28px] border-2 border-grape-ink bg-white p-5 shadow-pop-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{user ? `Ubah ${user.username}` : "Pengguna baru"}</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="grid size-9 place-items-center rounded-full border-2 border-grape-ink">
            <X className="size-4" />
          </button>
        </div>
        {user && <input type="hidden" name="id" value={user.id} />}
        {!user && (
          <label className="block">
            <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Username *</span>
            <input name="username" required minLength={3} maxLength={50} autoCapitalize="none" placeholder="mis. kasir1" defaultValue={state.values?.username} className={ctl} />
          </label>
        )}
        <label className="block">
          <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Nama *</span>
          <input name="name" required maxLength={100} defaultValue={state.values?.name ?? user?.name} className={ctl} />
        </label>
        <label className="block">
          <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Peran *</span>
          <select name="role" defaultValue={state.values?.role || user?.role || "kasir"} className={`${ctl} font-semibold`}>
            <option value="kasir">Kasir — POS, pesanan, konsumen</option>
            <option value="admin">Administrator — semua menu termasuk laporan</option>
          </select>
        </label>
        {user && (
          <label className="block">
            <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Status</span>
            <select name="active" defaultValue={user.active ? "1" : "0"} disabled={isSelf} className={`${ctl} font-semibold`}>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif (tidak bisa login)</option>
            </select>
            {isSelf && <input type="hidden" name="active" value="1" />}
          </label>
        )}
        <label className="block">
          <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">
            {user ? "Reset password (opsional)" : "Password * (min. 8 karakter)"}
          </span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required={!user}
            minLength={user ? undefined : 8}
            placeholder={user ? "Kosongkan bila tidak diubah" : ""}
            className={ctl}
          />
        </label>
        {state.error && <p className="text-sm font-semibold text-chili">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-grape text-sm font-bold text-white shadow-pop-sm disabled:opacity-60"
        >
          <Check className="size-4" /> {pending ? "Menyimpan…" : "Simpan"}
        </button>
      </form>
    </div>
  );
}
