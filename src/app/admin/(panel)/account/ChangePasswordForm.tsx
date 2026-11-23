"use client";

import { useActionState } from "react";
import { Check, KeyRound } from "lucide-react";
import { changePasswordAction, type PwState } from "./actions";

const ctl =
  "mt-1 h-11 w-full rounded-2xl border-2 border-grape-ink bg-white px-3.5 text-sm outline-none focus:ring-4 focus:ring-lemon";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<PwState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Password saat ini</span>
        <input name="current" type="password" autoComplete="current-password" required className={ctl} />
      </label>
      <label className="block">
        <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Password baru (min. 8 karakter)</span>
        <input name="next" type="password" autoComplete="new-password" required minLength={8} className={ctl} />
      </label>
      <label className="block">
        <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Ulangi password baru</span>
        <input name="confirm" type="password" autoComplete="new-password" required minLength={8} className={ctl} />
      </label>
      {state.error && <p className="text-sm font-semibold text-chili">{state.error}</p>}
      {state.ok && (
        <p className="inline-flex items-center gap-1 text-sm font-semibold text-grape">
          <Check className="size-4" /> Password berhasil diganti.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-grape-ink bg-grape px-5 text-sm font-bold text-white shadow-pop-sm disabled:opacity-60"
      >
        <KeyRound className="size-4" /> {pending ? "Menyimpan…" : "Ganti password"}
      </button>
    </form>
  );
}
