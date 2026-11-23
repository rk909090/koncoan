import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getOrderingSettings } from "@/lib/server/settings";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "./SettingsForm";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  await requireUser("admin");
  const settings = await getOrderingSettings();
  return (
    <>
      <PageHeader
        title="Pengaturan pesanan online"
        subtitle="Atur jenis pesanan yang diterima dari website koncoan.my.id. Perubahan tampil di website dalam ±1 menit."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
