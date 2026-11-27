/** Info kontak & lokasi — disalin dari brosur. */
export const SITE = {
  name: "Mie Koncoan",
  tagline: "Mie nya Anak Muda",
  phoneDisplay: "0858-1221-5099",
  /** Format internasional untuk wa.me (tanpa +, tanpa 0 di depan). */
  whatsapp: "6285812215099",
  address: "Jl. Raya Sebaung, Depan SMAN 1 Gending",
  mapsQuery: "Jl. Raya Sebaung, Depan SMAN 1 Gending",
} as const;

/**
 * Google Business Profile "Mie KonCOan" (terverifikasi, dikelola pemilik) — sumber resmi
 * titik peta, telepon & jam buka. Dicek langsung di profil pada 27 Nov 2026.
 * Ubah jam/telepon di sini DAN di Google Business Profile agar tetap sama.
 */
export const GBP = {
  /** Link permanen ke tempat di Google Maps (CID profil). */
  mapsUrl: "https://www.google.com/maps?cid=18366122231542692598",
  lat: -7.8140504,
  lng: 113.3175112,
  /** Nomor telepon utama di profil Google (WhatsApp pesanan tetap SITE.whatsapp). */
  phoneDisplay: "0823-2515-3161",
  phoneTel: "+6282325153161",
  phoneSchema: "+62-823-2515-3161",
} as const;

/** Jam buka (WIB) — sama dengan Google Business Profile. */
export const OPENING_HOURS = {
  /** Hari buka, format schema.org */
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  opens: "12:00",
  closes: "20:00",
  text: "Senin–Sabtu 12.00–20.00 WIB, Minggu libur",
} as const;

export const mapsUrl = GBP.mapsUrl;

export const mapsEmbedUrl = `https://maps.google.com/maps?q=${GBP.lat},${GBP.lng}&z=17&output=embed`;

export function waLink(text?: string) {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** 11000 -> "Rp11.000" */
export function formatRp(n: number) {
  return rupiah.format(n).replace(/\s/g, "");
}

/** 11000 -> "11K" (gaya brosur) */
export function formatK(n: number) {
  return `${Math.round(n / 1000)}K`;
}
