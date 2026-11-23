# Mie Koncoan — Mie nya Anak Muda 🍜

Website menu & order untuk **Warung Mie Koncoan** (Jl. Raya Sebaung, Depan SMAN 1 Gending).
Dibangun dengan **Next.js 16 (App Router)**, **Tailwind CSS v4**, **Motion** (animasi) dan **Zustand** (keranjang).

## Fitur

- **Landing page animatif** — hero dengan parallax (scroll & kursor), badge berputar, marquee, kartu menu gaya stiker,
  bento grid, ilustrasi langkah pesan, peta lokasi.
- **Halaman `/order` yang dioptimalkan untuk mobile** — header lengket dengan pencarian, chip kategori + scroll-spy,
  daftar menu dengan tombol `+` yang berubah jadi stepper, bottom sheet detail item (catatan per item), dan bar keranjang mengambang.
- **Checkout via WhatsApp** — keranjang + data pemesan (nama, makan di tempat / ambil sendiri / diantar, alamat, catatan)
  disusun otomatis menjadi pesan rapi ke `wa.me/6285812215099`. Tidak ada pembayaran online; konfirmasi, ongkir & pembayaran dilakukan oleh penjual via WhatsApp.
- Keranjang tersimpan di `localStorage`, jadi tidak hilang saat halaman di-refresh.
- Menghormati `prefers-reduced-motion`, ikon PWA/manifest, Open Graph image.

## Menjalankan

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Mengubah menu / harga

Menu & harga di website diambil dari tabel `products` di database — ubah lewat **/admin → Produk & harga**
(hanya produk aktif yang tampil; website ikut berubah dalam ±1 menit). Lihat [`src/lib/server/menu.ts`](src/lib/server/menu.ts).

[`src/data/menu.ts`](src/data/menu.ts) berisi menu awal dari brosur: dipakai untuk mengisi database pertama kali,
sebagai cadangan bila database tidak bisa diakses, dan untuk atribut yang belum ada di database (foto, label, pedas,
kata kunci pencarian; dicocokkan lewat id produk). Kontak & alamat ada di [`src/lib/site.ts`](src/lib/site.ts).

## Aset grafis

- `public/brand/logo-dari-brosur.png` — logo yang di-crop langsung dari brosur (resolusi rendah, apa adanya).
- `public/brand/logo-koncoan.png` — versi tajam/HD dari logo yang sama, digambar ulang dengan model `openai/gpt-5.4-image-2`
  (via OpenRouter) menggunakan crop brosur sebagai referensi, lalu latar putih dibuat transparan.
- `public/menu/*.webp` — foto menu yang di-generate dengan model yang sama, **memakai foto masing-masing menu di brosur sebagai referensi**
  agar isi & plating tetap sama. Foto-foto ini adalah ilustrasi; situs menampilkan keterangan "Foto ilustrasi".
- Palet warna di [`src/app/globals.css`](src/app/globals.css) di-sampling langsung dari piksel brosur.

## Panel admin & kasir (`/admin`)

Login di **`/admin/login`**. Semua data tersimpan di MySQL/MariaDB.

| Menu | Peran | Isi |
|---|---|---|
| Dashboard | admin, kasir | Ringkasan hari ini vs kemarin, tren 7 hari, terlaris hari ini, pesanan terbaru |
| Kasir (POS) | admin, kasir | Grid menu + kategori + pencarian (`/` untuk fokus, Enter = tambah), keranjang + catatan item, konsumen (umum / pilih / baru), jenis pesanan, diskon Rp/%, metode bayar (Tunai/QRIS/Transfer/Lainnya), uang diterima + kembalian, struk 58 mm |
| Pesanan | admin, kasir | Riwayat transaksi dengan filter periode, status, pembayaran, jenis, kasir, pencarian (no. pesanan/nama/no. HP); detail & cetak ulang struk; **pembatalan (admin) dengan alasan** |
| Konsumen | admin, kasir | Daftar + pencarian + urutan, total belanja, detail profil, menu favorit, **riwayat order lengkap** |
| Laporan penjualan | admin | Filter periode (preset & tanggal custom), pembayaran, jenis, kasir, kategori, produk; KPI + perbandingan periode sebelumnya; grafik harian/bulanan, per jam; per kategori/metode/jenis/kasir; produk terlaris; konsumen teratas; **export CSV** transaksi & item |
| Produk & harga | admin | Tambah/ubah produk & harga, aktif/nonaktif |
| Pengguna | admin | Tambah kasir/admin, reset password, nonaktifkan |
| Akun saya | semua | Ganti password |

Catatan penting:
- Waktu disimpan dalam **UTC** dan ditampilkan/dihitung dalam **WIB (UTC+7)**.
- Harga di transaksi selalu diambil dari database (bukan dari browser) dan disimpan per item, jadi laporan lama tetap akurat walau harga berubah.
- Laporan pendapatan hanya menghitung pesanan **lunas**; pesanan dibatalkan tampil terpisah.
- Produk di panel admin awalnya disalin dari `src/data/menu.ts`. Mengubah/menonaktifkan produk di admin juga mengubah menu website publik (cache ±1 menit). Produk baru belum punya foto.
- Keamanan: password di-hash (scrypt), sesi acak di cookie httpOnly (hanya hash-nya disimpan di DB), batas percobaan login, setiap Server Action memverifikasi sesi & peran, halaman admin `noindex` dan tanpa Google Tag Manager.

### Database & environment

Tabel dibuat otomatis (migrasi idempotent) saat aplikasi pertama kali mengakses database. Isi environment variable sesuai `.env.example`:
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, serta `ADMIN_BOOTSTRAP_USERNAME`/`ADMIN_BOOTSTRAP_PASSWORD` (hanya untuk membuat admin pertama ketika tabel pengguna masih kosong).

Di Hostinger, isi lewat hPanel → Website → Node.js → Environment variables (host `127.0.0.1`, port `3306`). Jangan pernah commit password ke repo.
