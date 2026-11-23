"use client";

import { Flame, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { CATEGORIES, type MenuItem } from "@/data/menu";
import { formatRp } from "@/lib/site";
import { useCart } from "@/store/cart";
import { Sheet } from "@/components/ui/Sheet";
import { MenuImage } from "@/components/menu/MenuImage";
import { useMenu } from "@/components/menu/MenuProvider";

export function ItemSheet() {
  const detailId = useCart((s) => s.detailId);
  const closeDetail = useCart((s) => s.closeDetail);
  const { byId } = useMenu();
  const item = detailId ? byId[detailId] : undefined;

  return (
    <Sheet
      open={!!item}
      onClose={closeDetail}
      title={item ? <span className="block truncate">{item.name}</span> : ""}
      footer={item ? <ItemSheetFooter key={item.id} item={item} /> : null}
    >
      {item && (
        <div>
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border-2 border-grape-ink bg-[#fff4dc]">
            <MenuImage item={item} sizes="(max-width: 640px) 90vw, 384px" />
            {item.image && (
              <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-grape-ink/70">
                Foto ilustrasi
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border-2 border-grape-ink bg-lavender px-3 py-0.5 text-xs font-bold">
              {CATEGORIES.find((c) => c.id === item.category)?.short}
            </span>
            {item.portion && (
              <span className="rounded-full border-2 border-grape-ink bg-sky px-3 py-0.5 text-xs font-bold">
                {item.portion}
              </span>
            )}
            {item.spicy && (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-grape-ink bg-chili px-3 py-0.5 text-xs font-bold text-white">
                <Flame className="size-3.5" /> Pedas
              </span>
            )}
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-grape-ink/80">{item.description}</p>
          <p className="mt-2 font-display text-3xl text-grape">{formatRp(item.price)}</p>
        </div>
      )}
    </Sheet>
  );
}

function ItemSheetFooter({ item }: { item: MenuItem }) {
  const id = item.id;
  const line = useCart((s) => s.lines.find((l) => l.id === id));
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const setNote = useCart((s) => s.setNote);
  const closeDetail = useCart((s) => s.closeDetail);

  const [qty, setLocalQty] = useState(line?.qty ?? 1);
  const [note, setLocalNote] = useState(line?.note ?? "");

  const submit = () => {
    if (line) {
      setQty(id, qty);
      if (qty > 0) setNote(id, note.trim());
    } else if (qty > 0) {
      add(id, qty, note.trim() || undefined);
    }
    closeDetail();
  };

  const minQty = line ? 0 : 1;

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-bold tracking-wide text-grape-ink/60 uppercase">Catatan (opsional)</span>
        <input
          value={note}
          onChange={(e) => setLocalNote(e.target.value)}
          maxLength={120}
          placeholder="Mis. tidak pakai sayur, extra pedas…"
          className="mt-1 h-11 w-full rounded-2xl border-2 border-grape-ink bg-white px-4 text-[15px] outline-none placeholder:text-grape-ink/35 focus:ring-4 focus:ring-lemon"
        />
      </label>
      <div className="flex items-center gap-3">
        <div className="flex h-13 items-center rounded-full border-2 border-grape-ink bg-white shadow-pop-sm">
          <button
            type="button"
            aria-label="Kurangi jumlah"
            disabled={qty <= minQty}
            onClick={() => setLocalQty((q) => Math.max(minQty, q - 1))}
            className="grid size-12 place-items-center disabled:opacity-30"
          >
            <Minus className="size-5" strokeWidth={3} />
          </button>
          <span className="w-8 text-center font-display text-xl tabular-nums">{qty}</span>
          <button
            type="button"
            aria-label="Tambah jumlah"
            disabled={qty >= 99}
            onClick={() => setLocalQty((q) => Math.min(99, q + 1))}
            className="grid size-12 place-items-center disabled:opacity-30"
          >
            <Plus className="size-5" strokeWidth={3} />
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          className={
            "flex h-13 flex-1 items-center justify-between gap-2 rounded-full border-2 border-grape-ink px-5 font-bold shadow-pop transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none " +
            (line && qty === 0 ? "bg-chili text-white" : "bg-grape text-white")
          }
        >
          <span>{line ? (qty === 0 ? "Hapus" : "Simpan") : "Tambah"}</span>
          <span className="font-display text-lg">{formatRp(item.price * qty)}</span>
        </button>
      </div>
    </div>
  );
}
