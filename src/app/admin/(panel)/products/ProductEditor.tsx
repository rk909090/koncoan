"use client";

import { useActionState, useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/admin/labels";
import { saveProductAction, type ProductFormState } from "./actions";

const ctl =
  "h-10 w-full rounded-xl border-2 border-grape-ink bg-white px-3 text-sm outline-none placeholder:text-grape-ink/40 focus:ring-4 focus:ring-lemon";

type P = { id: string; name: string; category: string; price: number; description: string | null; serving: string | null };

/** Form tambah/ubah produk (inline). */
export function ProductEditor({ product }: { product?: P }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ProductFormState, FormData>(async (prev, fd) => {
    const r = await saveProductAction(prev, fd);
    if (r.ok) setOpen(false);
    return r;
  }, {});

  if (!open) {
    return product ? (
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
        <Plus className="size-4" /> Tambah produk
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-grape-ink/50 p-4" onClick={() => setOpen(false)}>
      <form
        action={action}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-[28px] border-2 border-grape-ink bg-white p-5 shadow-pop-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{product ? "Ubah produk" : "Produk baru"}</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="grid size-9 place-items-center rounded-full border-2 border-grape-ink">
            <X className="size-4" />
          </button>
        </div>
        {product && <input type="hidden" name="id" value={product.id} />}
        <label className="block">
          <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Nama *</span>
          <input name="name" required maxLength={120} defaultValue={state.values?.name ?? product?.name} className={`${ctl} mt-1`} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Kategori *</span>
            <select name="category" defaultValue={state.values?.category || product?.category || "mie"} className={`${ctl} mt-1 font-semibold`}>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Harga (Rp) *</span>
            <input name="price" required inputMode="numeric" defaultValue={state.values?.price ?? product?.price} className={`${ctl} mt-1`} />
          </label>
        </div>
        <label className="block">
          <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Keterangan porsi</span>
          <input name="serving" maxLength={32} placeholder="Mis. 6 pcs" defaultValue={state.values?.serving ?? product?.serving ?? ""} className={`${ctl} mt-1`} />
        </label>
        <label className="block">
          <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Deskripsi</span>
          <input name="description" maxLength={255} defaultValue={state.values?.description ?? product?.description ?? ""} className={`${ctl} mt-1`} />
        </label>
        {state.error && <p className="text-sm font-semibold text-chili">{state.error}</p>}
        <p className="text-xs text-grape-ink/60">
          Harga baru berlaku untuk transaksi berikutnya. Transaksi lama tetap memakai harga saat itu.
        </p>
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
