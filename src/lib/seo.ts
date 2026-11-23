/**
 * Data terstruktur (JSON-LD, schema.org) untuk SEO, AEO & GEO.
 * Semua angka/menu dibangkitkan dari menu aktif (database, lihat
 * src/lib/server/menu.ts) agar selalu sama dengan yang tampil di situs. Tidak ada data yang tidak diketahui
 * (jam buka, rating, metode pembayaran, koordinat) — sengaja dikosongkan.
 */
import { CATEGORIES, type MenuItem } from "@/data/menu";
import { formatRp, mapsUrl, SITE } from "@/lib/site";

export const SITE_URL = "https://koncoan.my.id";
export const abs = (path: string) => new URL(path, SITE_URL).toString();

type Menu = MenuItem[];

const range = (items: Menu) => {
  const p = items.map((m) => m.price);
  return p.length ? { min: Math.min(...p), max: Math.max(...p) } : null;
};

/** Rentang harga seluruh menu & per kategori (null bila kategori kosong). */
export function priceStats(menu: Menu) {
  return {
    all: range(menu),
    mie: range(menu.filter((m) => m.category === "mie")),
    pendamping: range(menu.filter((m) => m.category === "pendamping")),
    minuman: range(menu.filter((m) => m.category === "minuman")),
  };
}

const rangeText = (r: { min: number; max: number } | null) =>
  !r ? "" : r.min === r.max ? formatRp(r.min) : `${formatRp(r.min)}–${formatRp(r.max)}`;
export { rangeText as priceRangeText };

/**
 * Alamat: jalan & patokan dari brosur. Desa/kecamatan/kabupaten/kode pos
 * mengikuti data Google Maps untuk SMAN 1 Gending (patokan "depan SMAN 1 Gending").
 */
const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Jl. Raya Sebaung (depan SMAN 1 Gending)",
  addressLocality: "Sebaung, Gending, Kabupaten Probolinggo",
  addressRegion: "Jawa Timur",
  postalCode: "67272",
  addressCountry: "ID",
} as const;

const menuItemLd = (m: MenuItem) => ({
  "@type": "MenuItem",
  "@id": abs(`/order#${m.id}`),
  name: m.name,
  description: m.portion ? `${m.description} Isi ${m.portion}.` : m.description,
  ...(m.image ? { image: abs(m.image) } : {}),
  offers: {
    "@type": "Offer",
    price: m.price,
    priceCurrency: "IDR",
    availability: "https://schema.org/InStock",
    url: abs("/order"),
  },
});

export function restaurantLd(menu: Menu) {
  const all = priceStats(menu).all;
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": abs("/#restaurant"),
    name: SITE.name,
    alternateName: "Warung Mie Koncoan",
    slogan: SITE.tagline,
    description:
      "Warung mie anak muda di Jl. Raya Sebaung, depan SMAN 1 Gending. Menu mie, wonton, dimsum, gohyong dan Konco Fresh Drink" +
      (all ? `, harga ${rangeText(all)}` : "") +
      `. Pesan lewat WhatsApp ${SITE.phoneDisplay}.`,
    url: SITE_URL,
    logo: abs("/brand/logo-koncoan.png"),
    image: [abs("/opengraph-image.png"), abs("/menu/hero.webp")],
    telephone: "+62-858-1221-5099",
    address: ADDRESS,
    hasMap: mapsUrl,
    servesCuisine: ["Mie", "Wonton", "Dimsum", "Indonesian"],
    ...(all ? { priceRange: `${formatRp(all.min)} - ${formatRp(all.max)}` } : {}),
    currenciesAccepted: "IDR",
    hasMenu: { "@id": abs("/order#menu") },
    potentialAction: {
      "@type": "OrderAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: abs("/order"),
        inLanguage: "id-ID",
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
    },
  };
}

export function menuLd(menu: Menu) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": abs("/order#menu"),
    name: "Menu Mie Koncoan",
    inLanguage: "id-ID",
    url: abs("/order"),
    hasMenuSection: CATEGORIES.filter((c) => menu.some((m) => m.category === c.id)).map((c) => ({
      "@type": "MenuSection",
      name: c.label,
      description: c.tagline,
      hasMenuItem: menu.filter((m) => m.category === c.id).map(menuItemLd),
    })),
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": abs("/#website"),
    url: SITE_URL,
    name: SITE.name,
    alternateName: `${SITE.name} — ${SITE.tagline}`,
    inLanguage: "id-ID",
    publisher: { "@id": abs("/#restaurant") },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

/* ——— FAQ: dipakai di halaman (terlihat) & JSON-LD (harus identik) ——— */

export type Faq = { q: string; a: string };

/** FAQ dibangkitkan dari menu aktif; pertanyaan yang tidak relevan (mis. tidak ada menu pedas) dilewati. */
export function getFaqs(menu: Menu): Faq[] {
  const st = priceStats(menu);
  const names = (cat: MenuItem["category"]) =>
    menu
      .filter((m) => m.category === cat)
      .map((m) => m.name)
      .join(", ");
  const cheapestDrink = [...menu.filter((m) => m.category === "minuman")].sort((a, b) => a.price - b.price)[0];
  const spicy = menu.filter((m) => m.spicy).map((m) => m.name);

  const priceParts = [
    st.mie && `menu mie ${rangeText(st.mie)}`,
    st.pendamping && `menu pendamping ${rangeText(st.pendamping)}`,
    st.minuman && `minuman ${rangeText(st.minuman)}`,
  ].filter(Boolean) as string[];
  const menuParts = [
    names("mie") && `Mie: ${names("mie")}.`,
    names("pendamping") && `Pendamping: ${names("pendamping")}.`,
    names("minuman") && `Minuman (Konco Fresh Drink): ${names("minuman")}.`,
  ].filter(Boolean) as string[];

  const faqs: (Faq | null)[] = [
    priceParts.length
      ? {
          q: "Berapa harga menu di Mie Koncoan?",
          a: `${priceParts.join(", ").replace(/^./, (c) => c.toUpperCase())}.`,
        }
      : null,
    {
      q: "Di mana lokasi Mie Koncoan?",
      a: `Mie Koncoan ada di ${SITE.address} (Gending, Probolinggo, Jawa Timur).`,
    },
    {
      q: "Bagaimana cara pesan Mie Koncoan?",
      a: `Buka halaman Order di ${SITE_URL}/order, pilih menu, isi nama dan cara pesan, lalu tekan "Pesan via WA". Pesanan tersusun otomatis dan dikirim ke WhatsApp ${SITE.phoneDisplay}. Bisa juga chat langsung ke nomor tersebut.`,
    },
    {
      q: "Apakah Mie Koncoan bisa diantar?",
      a: "Saat memesan kamu bisa memilih makan di tempat, ambil sendiri, atau diantar. Ketersediaan pengantaran dan ongkirnya dikonfirmasi langsung oleh penjual lewat WhatsApp.",
    },
    menuParts.length ? { q: "Menu apa saja yang ada di Mie Koncoan?", a: menuParts.join(" ") } : null,
    spicy.length ? { q: "Menu apa yang pedas?", a: `Menu dengan cabai/pedas: ${spicy.join(" dan ")}.` } : null,
    cheapestDrink
      ? {
          q: "Apa minuman paling murah di Mie Koncoan?",
          a: `${cheapestDrink.name}, harganya ${formatRp(cheapestDrink.price)}.`,
        }
      : null,
  ];
  return faqs.filter((f): f is Faq => f !== null);
}

export function faqLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Serialisasi aman untuk <script type="application/ld+json"> (lihat docs Next.js JSON-LD). */
export function ldJson(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
