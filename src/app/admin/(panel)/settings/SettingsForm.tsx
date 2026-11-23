"use client";

import { useActionState, useState } from "react";
import { Bike, Check, Store, UtensilsCrossed } from "lucide-react";
import type { OrderingSettings } from "@/lib/ordering";
import { Card, CardTitle, Field, inputClass } from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import { saveSettingsAction, type SettingsState } from "./actions";

function Toggle({
  name,
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon: typeof Bike;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-grape-ink bg-white p-4">
      <input type="hidden" name={name} value={checked ? "1" : "0"} />
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl border-2 border-grape-ink", checked ? "bg-lime" : "bg-white")}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        <span className="block text-sm text-grape-ink/60">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-1 h-7 w-12 shrink-0 rounded-full border-2 border-grape-ink transition-colors",
          checked ? "bg-grape" : "bg-grape-ink/15",
        )}
      >
        <span className={cn("absolute top-0.5 size-5 rounded-full border-2 border-grape-ink bg-white transition-all", checked ? "left-5.5" : "left-0.5")} />
      </button>
    </label>
  );
}

export function SettingsForm({ settings }: { settings: OrderingSettings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettingsAction, {});
  const [takeAway, setTakeAway] = useState(settings.takeAway);
  const [delivery, setDelivery] = useState(settings.delivery);

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <Card>
        <CardTitle>Jenis pesanan dari website</CardTitle>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-grape-ink/40 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-grape-ink bg-lime">
              <UtensilsCrossed className="size-5" />
            </span>
            <span>
              <span className="block font-bold">Makan di tempat</span>
              <span className="block text-sm text-grape-ink/60">Selalu tersedia.</span>
            </span>
          </div>
          <Toggle
            name="takeAway"
            checked={takeAway}
            onChange={setTakeAway}
            icon={Store}
            label="Ambil sendiri (bungkus)"
            description="Pemesan datang mengambil pesanannya."
          />
          <Toggle
            name="delivery"
            checked={delivery}
            onChange={setDelivery}
            icon={Bike}
            label="Diantar"
            description="Pemesan mengisi alamat lengkap, desa/kelurahan, patokan & nomor WhatsApp."
          />
        </div>
      </Card>

      <Card className={delivery ? "" : "opacity-60"}>
        <CardTitle>Pengantaran</CardTitle>
        <div className="space-y-4">
          <Field label="Info untuk pemesan" hint="Tampil di keranjang saat memilih “Diantar”, mis. area & ongkir. Maks. 300 karakter.">
            <textarea
              name="deliveryNote"
              rows={3}
              maxLength={300}
              defaultValue={settings.deliveryNote}
              className={cn(inputClass, "h-auto py-2.5")}
            />
          </Field>
          <Field label="Minimal belanja untuk diantar (Rp)" hint="Isi 0 bila tanpa minimal.">
            <input
              name="deliveryMinOrder"
              inputMode="numeric"
              defaultValue={settings.deliveryMinOrder || 0}
              className={cn(inputClass, "max-w-xs")}
            />
          </Field>
        </div>
      </Card>

      {state.error && <p className="text-sm font-semibold text-chili">{state.error}</p>}
      {state.ok && !pending && <p className="text-sm font-semibold text-grape">Tersimpan. Website ikut berubah dalam ±1 menit.</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-grape-ink bg-grape px-6 text-sm font-bold text-white shadow-pop-sm disabled:opacity-60"
      >
        <Check className="size-4" /> {pending ? "Menyimpan…" : "Simpan pengaturan"}
      </button>
    </form>
  );
}
