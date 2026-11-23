"use client";

import { useActionState } from "react";
import { Check, Save } from "lucide-react";
import { formatPhone } from "@/lib/admin/labels";
import { createCustomerAction, updateCustomerAction, type CustomerFormState } from "./actions";

const ctl =
  "mt-1 h-11 w-full rounded-2xl border-2 border-grape-ink bg-white px-3.5 text-sm outline-none placeholder:text-grape-ink/40 focus:ring-4 focus:ring-lemon";

export function CustomerForm({
  customer,
}: {
  customer?: { id: number; name: string; phone: string | null; address: string | null; notes: string | null };
}) {
  const [state, action, pending] = useActionState<CustomerFormState, FormData>(
    customer ? updateCustomerAction : createCustomerAction,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      {customer && <input type="hidden" name="id" value={customer.id} />}
      <label className="block">
        <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Nama *</span>
        <input name="name" required maxLength={100} defaultValue={state.values?.name ?? customer?.name} className={ctl} />
      </label>
      <label className="block">
        <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">No. HP / WhatsApp</span>
        <input
          name="phone"
          inputMode="tel"
          maxLength={20}
          placeholder="0812-…"
          defaultValue={state.values?.phone ?? formatPhone(customer?.phone)}
          className={ctl}
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Alamat</span>
        <input name="address" maxLength={255} defaultValue={state.values?.address ?? customer?.address ?? ""} className={ctl} />
      </label>
      <label className="block">
        <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Catatan</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={state.values?.notes ?? customer?.notes ?? ""}
          placeholder="Mis. suka pedas, langganan tiap Jumat"
          className="mt-1 w-full resize-none rounded-2xl border-2 border-grape-ink bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-4 focus:ring-lemon"
        />
      </label>
      {state.error && <p className="text-sm font-semibold text-chili">{state.error}</p>}
      {state.ok && (
        <p className="inline-flex items-center gap-1 text-sm font-semibold text-grape">
          <Check className="size-4" /> Tersimpan
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-grape-ink bg-grape px-5 text-sm font-bold text-white shadow-pop-sm disabled:opacity-60"
      >
        <Save className="size-4" /> {pending ? "Menyimpan…" : customer ? "Simpan perubahan" : "Tambah konsumen"}
      </button>
    </form>
  );
}
