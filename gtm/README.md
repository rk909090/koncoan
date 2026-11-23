# Konfigurasi Google Tag Manager — GTM-T6QB83QZ

`koncoan-ga4-events.json` adalah file import GTM (mode **Merge**) yang dipakai untuk
membuat tag GA4 event di container *Mie Koncoan*. Sudah diimpor & dipublikasikan
sebagai **Version 2** (23 Nov 2026).

| Tag | Trigger (Custom Event, regex) | Catatan |
|---|---|---|
| GA4 Event - Ecommerce | `view_item_list, view_item, add_to_cart, remove_from_cart, view_cart, begin_checkout` | Send Ecommerce data dari Data Layer |
| GA4 Event - Lead & engagement | `generate_lead, contact, get_directions, search` | Parameter dari Data Layer Variable |

Measurement ID: `G-8L6QGYPMS6` (properti GA4 "Mie Koncoan").
Event dikirim dari kode situs lewat `window.dataLayer` — lihat `src/lib/analytics.ts`.

Key events di GA4: `generate_lead` (konversi utama: pesanan WhatsApp), `contact`, `get_directions`.
Custom dimensions (event): `order_type`, `link_location`, `lead_source`.
