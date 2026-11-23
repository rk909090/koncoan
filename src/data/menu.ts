/**
 * Data menu BAWAAN Warung Mie Koncoan.
 * Sejak panel admin aktif, menu publik diambil dari tabel `products` (lihat
 * src/lib/server/menu.ts). File ini dipakai sebagai: (1) data awal (seed) tabel
 * products, (2) cadangan bila database tidak bisa diakses, dan (3) sumber atribut
 * tambahan (tag, pedas, kata kunci) untuk produk dengan id yang sama.
 * Nama & harga disalin dari brosur resmi (menu mie + "Konco Fresh Drink").
 * Deskripsi singkat ditulis berdasarkan isi yang terlihat di foto brosur —
 * silakan sesuaikan bila ada detail resep yang berbeda.
 */

export type CategoryId = "mie" | "pendamping" | "minuman";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: CategoryId;
  description: string;
  /** null untuk produk baru dari admin yang belum punya foto */
  image: string | null;
  /** Keterangan porsi, mis. "6 pcs" */
  portion?: string;
  tag?: "Pedas" | "Paling Hemat";
  spicy?: boolean;
  /** Kata kunci tambahan untuk pencarian (sinonim). */
  keywords?: string;
};

export type Category = {
  id: CategoryId;
  label: string;
  short: string;
  emoji: string;
  tagline: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "mie",
    label: "Menu KonCOan",
    short: "Mie",
    emoji: "🍜",
    tagline: "Mie andalan, porsi pas buat nongkrong.",
  },
  {
    id: "pendamping",
    label: "Menu Pendamping",
    short: "Pendamping",
    emoji: "🥟",
    tagline: "Teman makan mie biar makin lengkap.",
  },
  {
    id: "minuman",
    label: "Konco Fresh Drink",
    short: "Minuman",
    emoji: "🧋",
    tagline: "Seger-seger, mulai 3 ribuan aja.",
  },
];

export const MENU: MenuItem[] = [
  // ——— Mie ———
  {
    id: "konco-biasa",
    name: "Konco Biasa",
    price: 11000,
    category: "mie",
    description: "Mie khas Koncoan dengan topping andalan — pilihan paling simpel & hemat.",
    image: "/menu/konco-biasa.webp",
  },
  {
    id: "konco-akrab",
    name: "Konco Akrab",
    price: 13000,
    category: "mie",
    description: "Naik level dari Konco Biasa, toppingnya lebih rame.",
    image: "/menu/konco-akrab.webp",
  },
  {
    id: "konco-spesial",
    name: "Konco Spesial",
    price: 14000,
    category: "mie",
    description: "Mie dengan topping paling komplit: tahu, pangsit goreng renyah & lainnya.",
    image: "/menu/konco-spesial.webp",
  },
  {
    id: "cwiee-mie",
    name: "Cwiee Mie",
    price: 11000,
    category: "mie",
    description: "Mie ayam cincang ala Malang dengan bakso, kerupuk pangsit & sayur.",
    image: "/menu/cwiee-mie.webp",
    keywords: "mie ayam",
  },
  {
    id: "wonton-chili-oil",
    name: "Wonton Chili Oil",
    price: 12000,
    category: "mie",
    description: "Wonton lembut disiram minyak cabai yang wangi & nendang.",
    image: "/menu/wonton-chili-oil.webp",
    keywords: "pangsit",
    tag: "Pedas",
    spicy: true,
  },
  {
    id: "wonton-kuah-pedas",
    name: "Wonton Kuah Pedas",
    price: 12000,
    category: "mie",
    description: "Wonton dalam kuah merah pedas gurih, hangat sampai suapan terakhir.",
    image: "/menu/wonton-kuah-pedas.webp",
    keywords: "pangsit kuah",
    tag: "Pedas",
    spicy: true,
  },

  // ——— Pendamping ———
  {
    id: "konco-gohyong",
    name: "Konco Gohyong",
    price: 12000,
    category: "pendamping",
    description: "Gohyong goreng siram saus, disajikan hangat.",
    image: "/menu/konco-gohyong.webp",
  },
  {
    id: "rolade-ayam",
    name: "Rolade Ayam",
    price: 12000,
    category: "pendamping",
    description: "Rolade ayam gulung dengan sosis di tengahnya.",
    image: "/menu/rolade-ayam.webp",
  },
  {
    id: "tahu-bakso-mix",
    name: "Tahu Bakso Mix",
    price: 11000,
    category: "pendamping",
    description: "Aneka tahu bakso & isian mix dengan topping sosis dan keju.",
    image: "/menu/tahu-bakso-mix.webp",
    portion: "6 pcs",
  },
  {
    id: "dimsum-mix",
    name: "Dimsum Mix",
    price: 11000,
    category: "pendamping",
    description: "Dimsum campur disiram saus.",
    image: "/menu/dimsum-mix.webp",
    keywords: "siomay",
    portion: "6 pcs",
  },

  // ——— Minuman ———
  {
    id: "konco-ice-tea",
    name: "Konco Ice Tea",
    price: 3000,
    category: "minuman",
    description: "Es teh segar, teman wajib makan mie.",
    image: "/menu/konco-ice-tea.webp",
    keywords: "es teh",
    tag: "Paling Hemat",
  },
  {
    id: "konco-lemon-tea",
    name: "Konco Lemon Tea",
    price: 4000,
    category: "minuman",
    description: "Es teh lemon, asem-manis yang nyegerin.",
    image: "/menu/konco-lemon-tea.webp",
    keywords: "es teh lemon",
  },
  {
    id: "choco-freeze",
    name: "Choco Freeze",
    price: 7000,
    category: "minuman",
    description: "Cokelat dingin kental yang bikin nagih.",
    image: "/menu/choco-freeze.webp",
    keywords: "coklat",
  },
  {
    id: "palm-sugar-coffee-milk",
    name: "Palm Sugar Coffee Milk",
    price: 8000,
    category: "minuman",
    description: "Kopi susu gula aren — manis legit, kopinya kerasa.",
    image: "/menu/palm-sugar-coffee-milk.webp",
    keywords: "kopi susu gula aren",
  },
  {
    id: "sweet-orange-fresh-milk",
    name: "Sweet Orange Fresh Milk",
    price: 7000,
    category: "minuman",
    description: "Susu segar dengan sirup jeruk manis.",
    image: "/menu/sweet-orange-fresh-milk.webp",
    keywords: "susu jeruk",
  },
  {
    id: "creamy-coffee-latte",
    name: "Creamy Coffee Latte",
    price: 7000,
    category: "minuman",
    description: "Latte dingin yang creamy dan lembut.",
    image: "/menu/creamy-coffee-latte.webp",
    keywords: "kopi susu",
  },
  {
    id: "strawberry-fresh-milk",
    name: "Strawberry Fresh Milk",
    price: 7000,
    category: "minuman",
    description: "Susu segar dengan stroberi di dasar gelas.",
    image: "/menu/strawberry-fresh-milk.webp",
    keywords: "susu stroberi",
  },
  {
    id: "avocado-choco-milk",
    name: "Avocado Choco Milk",
    price: 8000,
    category: "minuman",
    description: "Alpukat, susu & cokelat dalam satu gelas.",
    image: "/menu/avocado-choco-milk.webp",
    keywords: "alpukat susu coklat",
  },
  {
    id: "matcha-choco-milk",
    name: "Matcha Choco Milk",
    price: 8000,
    category: "minuman",
    description: "Perpaduan matcha, susu & cokelat yang berlapis.",
    image: "/menu/matcha-choco-milk.webp",
    keywords: "susu greentea coklat",
  },
  {
    id: "soda-gembira",
    name: "Soda Gembira",
    price: 10000,
    category: "minuman",
    description: "Soda, sirup merah & susu kental manis. Klasik!",
    image: "/menu/soda-gembira.webp",
    keywords: "es soda susu",
  },
];

/** Foto bawaan (/menu/…) adalah ilustrasi AI dari brosur; foto unggahan admin (/media/…) adalah foto asli. */
export const isIllustration = (image: string | null | undefined) => !!image?.startsWith("/menu/");

/** Catatan kaki sesuai jenis foto yang tampil; null bila semua foto asli / tanpa foto. */
export function illustrationNote(items: { image: string | null }[]) {
  const n = items.filter((m) => isIllustration(m.image)).length;
  if (n === 0) return null;
  return n === items.filter((m) => m.image).length ? "Foto menu adalah ilustrasi." : "Sebagian foto menu adalah ilustrasi.";
}

export const MENU_BY_ID: Record<string, MenuItem> = Object.fromEntries(
  MENU.map((m) => [m.id, m]),
);
