import type { Metadata } from "next";
import Image from "next/image";
import { requireUser } from "@/lib/server/auth";
import { listProducts } from "@/lib/server/products";
import { PRODUCT_CATEGORIES } from "@/lib/admin/labels";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { formatRp } from "@/components/admin/format";
import { ProductEditor } from "./ProductEditor";
import { toggleProductAction } from "./actions";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

export const metadata: Metadata = { title: "Produk & harga" };

export default async function ProductsPage() {
  await requireUser("admin");
  const products = await listProducts();

  return (
    <>
      <PageHeader
        title="Produk & harga"
        subtitle="Menu yang tampil di halaman Kasir. Nonaktifkan produk yang sedang habis."
        actions={<ProductEditor />}
      />
      <p className="mb-6 rounded-2xl border-2 border-grape-ink bg-lemon/60 px-4 py-3 text-sm">
        <b>Catatan:</b> perubahan di sini berlaku untuk <b>Kasir (POS) & laporan</b>. Menu & harga di website publik
        (koncoan.my.id) masih diambil dari kode situs dan belum otomatis ikut berubah.
      </p>

      <div className="space-y-8">
        {PRODUCT_CATEGORIES.map((cat) => {
          const items = products.filter((p) => p.category === cat.id);
          if (!items.length) return null;
          return (
            <section key={cat.id}>
              <h2 className="mb-3 font-display text-2xl">
                {cat.label} <span className="text-base text-grape-ink/50">({items.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p) => (
                  <Card key={p.id} className={p.active ? "" : "opacity-60"}>
                    <div className="flex gap-3">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border-2 border-grape-ink bg-[#fff4dc]">
                        {p.image ? (
                          <Image src={String(p.image)} alt="" fill sizes="64px" className="object-cover" />
                        ) : (
                          <span className="absolute inset-0 grid place-items-center font-display text-2xl text-grape/40">{String(p.name)[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-bold">
                          {p.name}
                          {!p.active && <Badge tone="danger">Nonaktif</Badge>}
                        </p>
                        <p className="text-lg font-extrabold text-grape">{formatRp(Number(p.price))}</p>
                        {p.serving && <p className="text-xs text-grape-ink/55">{p.serving}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-grape-ink/10 pt-3">
                      <ProductEditor
                        product={{
                          id: String(p.id),
                          name: String(p.name),
                          category: String(p.category),
                          price: Number(p.price),
                          description: p.description,
                          serving: p.serving,
                        }}
                      />
                      <form action={toggleProductAction}>
                        <input type="hidden" name="id" value={String(p.id)} />
                        <input type="hidden" name="active" value={p.active ? "0" : "1"} />
                        <button
                          type="submit"
                          className={`rounded-full border-2 border-grape-ink px-3 py-1 text-xs font-bold ${
                            p.active ? "bg-white hover:bg-chili hover:text-white" : "bg-lime"
                          }`}
                        >
                          {p.active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </form>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
