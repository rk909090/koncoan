import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { Card, PageHeader } from "@/components/admin/ui";
import { CustomerForm } from "../CustomerForm";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Tambah konsumen" };

export default async function NewCustomerPage() {
  await requireUser();
  return (
    <>
      <Link href="/admin/customers" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-grape hover:underline">
        <ArrowLeft className="size-4" /> Kembali
      </Link>
      <PageHeader title="Tambah konsumen" />
      <Card className="max-w-xl">
        <CustomerForm />
      </Card>
    </>
  );
}
