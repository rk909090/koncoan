"use client";

import { useActionState, useState } from "react";
import { Ban, Printer } from "lucide-react";
import { voidOrderAction, type VoidState } from "../actions";

export function PrintButton({ id }: { id: number }) {
  return (
    <button
      type="button"
      onClick={() => window.open(`/admin/struk/${id}`, "_blank", "width=420,height=700")}
      className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-grape-ink bg-white px-5 text-sm font-bold shadow-pop-sm"
    >
      <Printer className="size-4" /> Cetak struk
    </button>
  );
}

export function VoidOrderForm({ id }: { id: number }) {
  const [state, action, pending] = useActionState<VoidState, FormData>(voidOrderAction, {});
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Alasan</span>
        <input
          name="reason"
          required
          minLength={3}
          maxLength={255}
          placeholder="Mis. salah input, konsumen batal"
          defaultValue={state.reason}
          className="mt-1 h-11 w-full rounded-2xl border-2 border-grape-ink bg-white px-3.5 text-sm outline-none focus:ring-4 focus:ring-lemon"
        />
      </label>
      {state.error && <p className="text-sm font-semibold text-chili">{state.error}</p>}
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-white text-sm font-bold text-chili hover:bg-chili hover:text-white"
        >
          <Ban className="size-4" /> Batalkan pesanan…
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-11 rounded-full border-2 border-grape-ink bg-white text-sm font-bold"
          >
            Tidak jadi
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-full border-2 border-grape-ink bg-chili text-sm font-bold text-white shadow-pop-sm disabled:opacity-60"
          >
            {pending ? "Memproses…" : "Ya, batalkan"}
          </button>
        </div>
      )}
    </form>
  );
}
