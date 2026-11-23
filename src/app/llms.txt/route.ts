import { CATEGORIES } from "@/data/menu";
import { getFaqs, priceRangeText, priceStats, SITE_URL } from "@/lib/seo";
import { getPublicMenu } from "@/lib/server/menu";
import { formatRp, mapsUrl, SITE } from "@/lib/site";

/**
 * /llms.txt — ringkasan situs dalam Markdown untuk asisten AI / LLM
 * (konvensi llmstxt.org). Dibangkitkan dari menu aktif (database) agar selalu sinkron.
 */
export async function GET() {
  const menu = await getPublicMenu();
  const all = priceStats(menu).all;
  const sections = CATEGORIES.filter((c) => menu.some((m) => m.category === c.id)).map((c) => {
    const rows = menu.filter((m) => m.category === c.id)
      .map(
        (m) =>
          `- ${m.name}${m.portion ? ` (${m.portion})` : ""}: ${formatRp(m.price)} — ${m.description}`,
      )
      .join("\n");
    return `### ${c.label}\n${rows}`;
  }).join("\n\n");

  const faq = getFaqs(menu).map((f) => `### ${f.q}\n${f.a}`).join("\n\n");

  const body = `# ${SITE.name}

> ${SITE.name} ("${SITE.tagline}") adalah warung mie di ${SITE.address} (Gending, Probolinggo, Jawa Timur, Indonesia). Menjual mie, wonton, dimsum, gohyong, dan minuman "Konco Fresh Drink"${all ? ` dengan harga ${priceRangeText(all)}` : ""}. Pemesanan lewat WhatsApp ${SITE.phoneDisplay}.

## Info utama
- Nama: ${SITE.name}
- Alamat: ${SITE.address}
- WhatsApp: ${SITE.phoneDisplay} (https://wa.me/${SITE.whatsapp})
- Peta: ${mapsUrl}
- Situs: ${SITE_URL}
- Halaman order: ${SITE_URL}/order
- Cara pesan: pilih menu di ${SITE_URL}/order, isi nama & cara pesan (makan di tempat / ambil sendiri / diantar), lalu pesanan terkirim ke WhatsApp. Ongkir & ketersediaan antar dikonfirmasi penjual.
- Harga dalam Rupiah (IDR), sesuai daftar menu terbaru Mie Koncoan.

## Menu & harga
${sections}

## FAQ
${faq}

## Halaman
- [Beranda](${SITE_URL}/): profil, menu, cara pesan, FAQ, lokasi
- [Order](${SITE_URL}/order): daftar menu lengkap dengan harga & keranjang pesanan
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
