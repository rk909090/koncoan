"use client";

import { useActionState, useState } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { PAYMENT_METHODS, type PaymentMethodId } from "@/lib/admin/labels";
import { formatRp } from "@/components/admin/format";
import { cn } from "@/lib/cn";
import { completeWebOrderAction, rejectWebOrderAction, type WebOrderState } from "./actions";

const ctl =
  "h-11 w-full rounded-2xl border-2 border-grape-ink bg-white px-3.5 text-sm outline-none placeholder:text-grape-ink/40 focus:ring-4 focus:ring-lemon";

/** Tombol "Selesaikan" (catat pembayaran) & "Tolak" untuk pesanan website yang menunggu. */
export function WebOrderActions({ id, total }: { id: number; total: number }) {
  const [mode, setMode] = useState<"idle" | "pay" | "reject">("idle");
  const [method, setMethod] = useState<PaymentMethodId>("cash");
  const [amount, setAmount] = useState("");
  const [payState, payAction, paying] = useActionState<WebOrderState, FormData>(completeWebOrderAction, {});
  const [rejState, rejAction, rejecting] = useActionState<WebOrderState, FormData>(rejectWebOrderAction, {});

  const paid = Number(amount.replace(/\D/g, "")) || 0;
  const change = method === "cash" && paid > total ? paid - total : 0;

  if (payState.ok) {
    return (
      <p className="rounded-2xl bg-lime/60 px-3 py-2 text-sm font-bold">
        ✓ Lunas{payState.change ? ` · kembalian ${formatRp(payState.change)}` : ""}
      </p>
    );
  }

  if (mode === "pay") {
    return (
      <form action={payAction} className="space-y-3 rounded-2xl border-2 border-grape-ink bg-lime/20 p-3">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="payment" value={method} />
        <p className="text-sm font-bold">Pembayaran {formatRp(total)}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={method === m.id}
              onClick={() => setMethod(m.id)}
              className={cn(
                "h-10 rounded-xl border-2 border-grape-ink text-xs font-bold",
                method === m.id ? "bg-lemon shadow-pop-sm" : "bg-white",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        {method === "cash" && (
          <label className="block">
            <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">
              Uang diterima (kosongkan bila uang pas)
            </span>
            <input
              name="amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(total)}
              className={cn(ctl, "mt-1")}
            />
            {change > 0 && <span className="mt-1 block text-sm font-bold text-grape">Kembalian {formatRp(change)}</span>}
            {paid > 0 && paid < total && <span className="mt-1 block text-xs font-semibold text-chili">Kurang dari total.</span>}
          </label>
        )}
        {payState.error && <p className="text-sm font-semibold text-chili">{payState.error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setMode("idle")} className="h-11 rounded-full border-2 border-grape-ink bg-white text-sm font-bold">
            Batal
          </button>
          <button
            type="submit"
            disabled={paying}
            className="h-11 rounded-full border-2 border-grape-ink bg-grape text-sm font-bold text-white shadow-pop-sm disabled:opacity-60"
          >
            {paying ? "Menyimpan…" : "Simpan lunas"}
          </button>
        </div>
      </form>
    );
  }

  if (mode === "reject") {
    return (
      <form action={rejAction} className="space-y-3 rounded-2xl border-2 border-chili bg-chili/5 p-3">
        <input type="hidden" name="id" value={id} />
        <label className="block">
          <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Alasan menolak</span>
          <input
            name="reason"
            required
            minLength={3}
            maxLength={255}
            defaultValue={rejState.reason}
            placeholder="Mis. pemesan batal, di luar area antar, menu habis"
            className={cn(ctl, "mt-1")}
          />
        </label>
        {rejState.error && <p className="text-sm font-semibold text-chili">{rejState.error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setMode("idle")} className="h-11 rounded-full border-2 border-grape-ink bg-white text-sm font-bold">
            Batal
          </button>
          <button
            type="submit"
            disabled={rejecting}
            className="h-11 rounded-full border-2 border-grape-ink bg-chili text-sm font-bold text-white shadow-pop-sm disabled:opacity-60"
          >
            {rejecting ? "Memproses…" : "Tolak pesanan"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <button
        type="button"
        onClick={() => setMode("pay")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-grape text-sm font-bold text-white shadow-pop-sm"
      >
        <CheckCircle2 className="size-4" /> Selesaikan & bayar
      </button>
      <button
        type="button"
        onClick={() => setMode("reject")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-white px-4 text-sm font-bold text-chili hover:bg-chili hover:text-white"
      >
        <Ban className="size-4" /> Tolak
      </button>
    </div>
  );
}
