import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  /**
   * Ditambahkan sebagai `?dpl=…` ke semua URL aset statis (JS/CSS/gambar),
   * sehingga browser & CDN mengambil salinan baru. Ganti nilainya bila perlu
   * memaksa semua pengunjung memuat ulang aset (mis. setelah cache rusak).
   * Harus konstan: nilai yang sama dipakai saat build dan saat server berjalan.
   */
  deploymentId: "koncoan-2",
};

export default nextConfig;
