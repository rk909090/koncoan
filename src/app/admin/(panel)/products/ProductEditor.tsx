"use client";

import Image from "next/image";
import { useActionState, useRef, useState, type ChangeEvent } from "react";
import { Camera, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/admin/labels";
import { saveProductAction, type ProductFormState } from "./actions";

const ctl =
  "h-10 w-full rounded-xl border-2 border-grape-ink bg-white px-3 text-sm outline-none placeholder:text-grape-ink/40 focus:ring-4 focus:ring-lemon";

type P = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  serving: string | null;
  image: string | null;
};

const MAX_SIDE = 1600;

/**
 * Foto dari HP biasanya 3–8 MB: diperkecil di browser (maks. 1600 px, JPEG) agar upload cepat.
 * Bila gagal (format tak didukung browser), file asli yang dikirim — server tetap memvalidasi.
 */
async function shrinkPhoto(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 600 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function PhotoField({ image }: { image: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setNote(null);
    if (!f) return setPreview(null);
    if (!f.type.startsWith("image/")) {
      setNote("Pilih file foto (JPG, PNG, atau WebP).");
      e.target.value = "";
      return;
    }
    setBusy(true);
    const small = await shrinkPhoto(f);
    setBusy(false);
    if (small !== f) {
      try {
        const dt = new DataTransfer();
        dt.items.add(small);
        e.target.files = dt.files;
      } catch {
        /* browser lama: kirim file asli */
      }
    }
    if (small.size > 8 * 1024 * 1024) setNote("Foto terlalu besar (maks. 8 MB).");
    setRemove(false);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(small);
    });
  };

  const shown = preview ?? (remove ? null : image);
  return (
    <div>
      <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Foto</span>
      <div className="mt-1 flex items-center gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-grape-ink bg-[#fff4dc]">
          {shown ? (
            preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- pratinjau lokal (blob:)
              <img src={preview} alt="" className="size-full object-cover" />
            ) : (
              <Image src={shown} alt="" fill sizes="80px" className="object-cover" />
            )
          ) : (
            <span className="absolute inset-0 grid place-items-center text-grape-ink/40">
              <Camera className="size-7" />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <input ref={input} type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/*" onChange={onChange} className="sr-only" id="photo-input" />
          <label
            htmlFor="photo-input"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-grape-ink bg-white px-3 py-1.5 text-xs font-bold hover:bg-lemon"
          >
            <Camera className="size-3.5" /> {busy ? "Memproses…" : shown ? "Ganti foto" : "Pilih foto"}
          </label>
          {(preview || (image && !remove)) && (
            <button
              type="button"
              onClick={() => {
                if (input.current) input.current.value = "";
                setPreview(null);
                setRemove(!!image);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-grape-ink/60 hover:text-chili"
            >
              <Trash2 className="size-3.5" /> {preview ? "Batal ganti" : "Hapus foto"}
            </button>
          )}
          <span className="text-[11px] text-grape-ink/55">JPG/PNG/WebP, maks. 8 MB. Tampil di website & kasir.</span>
        </div>
      </div>
      {remove && !preview && <input type="hidden" name="removePhoto" value="1" />}
      {note && <p className="mt-1 text-xs font-semibold text-chili">{note}</p>}
    </div>
  );
}

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
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-3 overflow-y-auto rounded-[28px] border-2 border-grape-ink bg-white p-5 shadow-pop-lg"
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
        <PhotoField image={product?.image ?? null} />
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
