import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { listProducts } from "@/lib/server/products";
import { PosApp } from "./PosApp";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Kasir (POS)" };

export default async function PosPage() {
  const user = await requireUser();
  const products = await listProducts({ activeOnly: true });
  return (
    <PosApp
      cashierName={user.name}
      products={products.map((p) => ({
        id: String(p.id),
        name: String(p.name),
        category: String(p.category),
        price: Number(p.price),
        image: p.image ? String(p.image) : null,
        serving: p.serving ? String(p.serving) : null,
      }))}
    />
  );
}
