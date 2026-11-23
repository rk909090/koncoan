import { getProductImage } from "@/lib/server/productImages";

/** Foto produk dari database. Nama file: <id produk>-<hash 16 hex>.webp */
export async function GET(_req: Request, ctx: RouteContext<"/media/products/[file]">) {
  const { file } = await ctx.params;
  const m = /^([a-z0-9-]{1,64})-([a-f0-9]{16})\.webp$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  let img;
  try {
    img = await getProductImage(m[1]);
  } catch (e) {
    console.error("[media] gagal membaca foto:", (e as Error).message);
    return new Response("Error", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  // hash harus cocok: URL lama (foto sudah diganti) tidak boleh menampilkan foto baru dengan cache permanen
  if (!img || img.hash !== m[2]) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  }
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
