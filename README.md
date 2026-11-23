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

Semua data menu ada di [`src/data/menu.ts`](src/data/menu.ts); kontak & alamat di [`src/lib/site.ts`](src/lib/site.ts).
Nama dan harga disalin dari brosur. Deskripsi singkat ditulis berdasarkan apa yang terlihat di foto brosur — silakan disesuaikan.

## Aset grafis

- `public/brand/logo-dari-brosur.png` — logo yang di-crop langsung dari brosur (resolusi rendah, apa adanya).
- `public/brand/logo-koncoan.png` — versi tajam/HD dari logo yang sama, digambar ulang dengan model `openai/gpt-5.4-image-2`
  (via OpenRouter) menggunakan crop brosur sebagai referensi, lalu latar putih dibuat transparan.
- `public/menu/*.webp` — foto menu yang di-generate dengan model yang sama, **memakai foto masing-masing menu di brosur sebagai referensi**
  agar isi & plating tetap sama. Foto-foto ini adalah ilustrasi; situs menampilkan keterangan "Foto ilustrasi".
- Palet warna di [`src/app/globals.css`](src/app/globals.css) di-sampling langsung dari piksel brosur.
