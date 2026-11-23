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

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  SITE.mapsQuery,
)}`;

export const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
  SITE.mapsQuery,
)}&z=16&output=embed`;

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
