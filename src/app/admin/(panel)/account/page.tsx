import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { Card, CardTitle, PageHeader } from "@/components/admin/ui";
import { ChangePasswordForm } from "./ChangePasswordForm";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Akun saya" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Akun saya" subtitle={`${user.name} · @${user.username} · ${user.role === "admin" ? "Administrator" : "Kasir"}`} />
      <Card className="max-w-md">
        <CardTitle>Ganti password</CardTitle>
        <p className="mb-4 text-sm text-grape-ink/65">
          Setelah diganti, sesi login di perangkat lain akan otomatis keluar.
        </p>
        <ChangePasswordForm />
      </Card>
    </>
  );
}
