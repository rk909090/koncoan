"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bike, CheckCircle2, LoaderCircle, MapPin, ShoppingBag, Store, Trash2, UtensilsCrossed, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { buildOrderMessage, cartToMessageItems, mapsLink, type OrderMessageItem } from "@/lib/order";
import { track } from "@/lib/analytics";
import { formatRp, waLink, SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import { normalizePhone } from "@/lib/admin/labels";
import { allowedOrderTypes, WEB_ORDER_LIMITS as L } from "@/lib/ordering";
import { cartTotals, useCart, type OrderType } from "@/store/cart";
import { placeWebOrder, type PlaceOrderResult } from "@/app/(site)/actions";
import { Sheet } from "@/components/ui/Sheet";
import { QtyControl } from "@/components/ui/QtyControl";
import { WhatsAppIcon } from "@/components/ui/icons";
import { MenuImage } from "@/components/menu/MenuImage";
import { useMenu } from "@/components/menu/MenuProvider";

const ORDER_TYPES: { id: OrderType; label: string; icon: typeof Store }[] = [
  { id: "dine-in", label: "Makan di sini", icon: UtensilsCrossed },
  { id: "take-away", label: "Ambil sendiri", icon: Store },
  { id: "delivery", label: "Diantar", icon: Bike },
];

/** Hasil kirim pesanan yang ditampilkan di layar "terkirim". */
type Sent = { orderNo: string | null; waUrl: string; total: number; items: OrderMessageItem[]; delivery: boolean };

const inputCls = (error?: boolean) =>
  cn(
    "mt-1 w-full rounded-2xl border-2 bg-white px-4 text-base outline-none placeholder:text-grape-ink/35 focus:ring-4 focus:ring-lemon",
    error ? "border-chili" : "border-grape-ink",
  );

function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="text-xs font-bold tracking-wide text-grape-ink/60 uppercase">
      {children}
      {hint && <span className="ml-1 font-semibold tracking-normal normal-case">{hint}</span>}
    </span>
  );
}

function FieldError({ show, children }: { show: boolean; children: ReactNode }) {
  return show ? <span className="mt-1 block text-xs font-semibold text-chili">{children}</span> : null;
}

export function CartSheet() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const lines = useCart((s) => s.lines);
  const customer = useCart((s) => s.customer);
  const setCustomer = useCart((s) => s.setCustomer);
  const clear = useCart((s) => s.clear);
  const openDetail = useCart((s) => s.openDetail);
  const { items: menuItems, byId, ordering } = useMenu();
  const { count, total } = cartTotals(lines, byId);

  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  // begin_checkout cukup sekali per sesi buka keranjang (hindari dobel saat validasi gagal)
  const checkoutTracked = useRef(false);

  // Jenis pesanan yang tersedia diatur dari panel admin
  const allowed = allowedOrderTypes(ordering);
  const orderTypes = ORDER_TYPES.filter((t) => allowed.includes(t.id));
  const orderType: OrderType = allowed.includes(customer.orderType) ? customer.orderType : "dine-in";
  useEffect(() => {
    if (orderType !== customer.orderType) setCustomer({ orderType });
  }, [orderType, customer.orderType, setCustomer]);
  const isDelivery = orderType === "delivery";

  const phoneNorm = customer.phone.trim() ? normalizePhone(customer.phone) : null;
  const errors = {
    name: customer.name.trim().length < 2,
    phone: (isDelivery && !customer.phone.trim()) || (!!customer.phone.trim() && !phoneNorm),
    address: isDelivery && customer.address.trim().length < 5,
    area: isDelivery && customer.area.trim().length < 2,
    minOrder: isDelivery && ordering.deliveryMinOrder > 0 && total < ordering.deliveryMinOrder,
  };
  const invalid = Object.values(errors).some(Boolean);

  const hasDrink = lines.some((l) => byId[l.id]?.category === "minuman");
  const drinkSuggestions = menuItems.filter((m) => m.category === "minuman").slice(0, 6);

  const handleClose = () => {
    close();
    setSent(null);
    setTouched(false);
    setError(null);
    checkoutTracked.current = false;
  };

  const shareLocation = () => {
    setLocError(null);
    if (!("geolocation" in navigator)) {
      setLocError("Browser ini tidak mendukung berbagi lokasi.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCustomer({ location: `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}` });
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Tidak apa-apa, cukup isi alamat & patokan."
            : "Lokasi tidak bisa didapat. Cukup isi alamat & patokan.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const submit = async () => {
    if (submitting) return;
    setTouched(true);
    setError(null);
    if (count > 0 && !checkoutTracked.current) {
      checkoutTracked.current = true;
      track.beginCheckout(lines, byId);
    }
    if (invalid || count === 0) {
      document.getElementById("cart-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Tab WhatsApp dibuka SEKARANG (masih dalam klik) agar tidak diblokir popup blocker,
    // lalu diarahkan ke WhatsApp setelah pesanan tersimpan.
    const win = window.open("about:blank", "_blank");
    try {
      if (win) win.opener = null;
    } catch {
      /* abaikan */
    }

    setSubmitting(true);
    const c = { ...customer, orderType };
    let res: PlaceOrderResult;
    try {
      res = await placeWebOrder({
        lines: lines.map((l) => ({ id: l.id, qty: l.qty, note: l.note })),
        name: c.name,
        phone: c.phone,
        orderType,
        address: isDelivery ? c.address : "",
        area: isDelivery ? c.area : "",
        landmark: isDelivery ? c.landmark : "",
        location: isDelivery ? c.location : "",
        note: c.note,
        website: honeypot.current?.value ?? "",
      });
    } catch {
      res = { ok: false, error: "Koneksi bermasalah.", retryable: true };
    }
    setSubmitting(false);

    if (!res.ok && !res.retryable) {
      // Ditolak server (mis. menu habis, antar tidak tersedia) → tampilkan alasannya
      win?.close();
      setError(res.error);
      return;
    }

    // Tersimpan → pakai harga dari server. Gagal karena gangguan → tetap bisa pesan lewat WhatsApp.
    const items = res.ok
      ? res.items.map((it) => ({ name: it.name, portion: byId[it.id]?.portion, qty: it.qty, lineTotal: it.lineTotal, note: it.note }))
      : cartToMessageItems(lines, byId);
    const sum = res.ok ? res.total : total;
    const orderNo = res.ok ? res.orderNo : null;
    const url = waLink(buildOrderMessage(items, sum, c, orderNo));
    track.generateLead(lines, byId, orderType);

    if (win) win.location.href = url;
    else window.location.href = url;

    // Pesanan sudah tercatat → keranjang dikosongkan agar tidak terkirim dua kali
    if (orderNo) clear();
    setSent({ orderNo, waUrl: url, total: sum, items, delivery: isDelivery });
  };

  return (
    <Sheet
      open={isOpen}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          Keranjang
          {count > 0 && !sent && (
            <span className="rounded-full border-2 border-grape-ink bg-lemon px-2.5 font-sans text-sm font-extrabold">
              {count}
            </span>
          )}
        </span>
      }
      footer={
        count > 0 && !sent ? (
          <div>
            {error && (
              <p
                role="alert"
                className="mb-2 flex items-start gap-2 rounded-2xl border-2 border-chili bg-chili/10 px-3 py-2 text-sm font-semibold text-chili"
              >
                <X className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-grape-ink/60">Total</p>
                <p className="font-display text-2xl leading-none text-grape">{formatRp(total)}</p>
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex h-13 flex-1 items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-[#25d366] px-4 font-bold text-grape-ink shadow-pop transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-70"
              >
                {submitting ? (
                  <LoaderCircle className="size-5 shrink-0 animate-spin" />
                ) : (
                  <WhatsAppIcon className="size-5 shrink-0" />
                )}
                <span className="whitespace-nowrap">{submitting ? "Menyimpan…" : "Pesan via WA"}</span>
              </button>
            </div>
          </div>
        ) : null
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-6 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className="grid size-20 place-items-center rounded-full border-2 border-grape-ink bg-lime shadow-pop"
            >
              <CheckCircle2 className="size-10" strokeWidth={2.4} />
            </motion.div>
            {sent.orderNo ? (
              <>
                <h3 className="mt-5 font-display text-2xl">Pesanan tercatat!</h3>
                <p className="mt-2 rounded-full border-2 border-grape-ink bg-lemon px-4 py-1 font-display text-xl">
                  {sent.orderNo}
                </p>
              </>
            ) : (
              <h3 className="mt-5 font-display text-2xl">WhatsApp sudah dibuka!</h3>
            )}
            <p className="mt-3 max-w-xs text-sm text-grape-ink/70">
              Tinggal tekan <b>kirim</b> di WhatsApp ya. Pesanan{sent.delivery ? ", ongkir" : ""} & pembayaran akan
              dikonfirmasi langsung oleh Mie Koncoan.
            </p>
            <p className="mt-1 text-sm font-bold">Total {formatRp(sent.total)}</p>
            <div className="mt-6 flex w-full flex-col gap-2">
              <a
                href={sent.waUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-[#25d366] font-bold text-grape-ink shadow-pop-sm"
              >
                <WhatsAppIcon className="size-5" /> Buka WhatsApp lagi
              </a>
              <button
                type="button"
                onClick={() => {
                  if (!sent.orderNo) clear();
                  handleClose();
                }}
                className="h-12 rounded-full border-2 border-grape-ink bg-grape font-bold text-white shadow-pop-sm"
              >
                {sent.orderNo ? "Selesai" : "Selesai & kosongkan keranjang"}
              </button>
              {!sent.orderNo && (
                <button
                  type="button"
                  onClick={() => setSent(null)}
                  className="h-12 rounded-full border-2 border-grape-ink bg-white font-bold"
                >
                  Kembali ke keranjang
                </button>
              )}
            </div>
            <p className="mt-4 text-xs text-grape-ink/60">
              WhatsApp tidak terbuka? Chat manual ke{" "}
              <a
                className="font-bold underline"
                href={waLink()}
                target="_blank"
                rel="noreferrer"
                onClick={() => track.contact("cart_sent_fallback")}
              >
                {SITE.phoneDisplay}
              </a>
              {sent.orderNo ? ` dan sebutkan no. pesanan ${sent.orderNo}.` : "."}
            </p>
          </motion.div>
        ) : count === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8 text-center"
          >
            <div className="grid size-24 animate-wiggle place-items-center rounded-full border-2 border-grape-ink bg-lemon shadow-pop">
              <ShoppingBag className="size-11" strokeWidth={2.2} />
            </div>
            <h3 className="mt-5 font-display text-2xl">Keranjang masih kosong</h3>
            <p className="mt-1 text-sm text-grape-ink/70">Yuk pilih mie & minuman favoritmu dulu.</p>
            <Link
              href="/order"
              onClick={handleClose}
              className="mt-5 inline-flex h-12 items-center rounded-full border-2 border-grape-ink bg-grape px-6 font-bold text-white shadow-pop-sm"
            >
              Lihat menu
            </Link>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ul className="space-y-2.5">
              <AnimatePresence initial={false}>
                {lines.map((l) => {
                  const item = byId[l.id];
                  if (!item) return null;
                  return (
                    <motion.li
                      key={l.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                    >
                      <div className="flex items-center gap-3 rounded-2xl border-2 border-grape-ink bg-white p-2">
                        <button
                          type="button"
                          onClick={() => openDetail(item.id)}
                          className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#fff4dc]"
                          aria-label={`Ubah ${item.name}`}
                        >
                          <MenuImage item={item} alt="" sizes="64px" />
                        </button>
                        <button type="button" onClick={() => openDetail(item.id)} className="min-w-0 flex-1 text-left">
                          <p className="truncate font-bold leading-tight">{item.name}</p>
                          <p className="text-sm font-semibold text-grape">{formatRp(item.price * l.qty)}</p>
                          <p className="truncate text-xs text-grape-ink/55">{l.note ? `“${l.note}”` : "+ tambah catatan"}</p>
                        </button>
                        <QtyControl id={item.id} name={item.name} size="sm" />
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            {!hasDrink && drinkSuggestions.length > 0 && (
              <div className="mt-5">
                <p className="font-display text-lg">Kurang seger? Tambah minum 🧋</p>
                <div className="no-scrollbar -mx-5 mt-2 flex gap-2.5 overflow-x-auto px-5 pb-1">
                  {drinkSuggestions.map((d) => (
                    <div key={d.id} className="flex w-36 shrink-0 flex-col rounded-2xl border-2 border-grape-ink bg-white p-2">
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#fff4dc]">
                        <MenuImage item={d} sizes="144px" />
                      </div>
                      <p className="mt-1.5 line-clamp-1 text-xs font-bold">{d.name}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs font-bold text-grape">{formatRp(d.price)}</span>
                        <QtyControl id={d.id} name={d.name} size="sm" className="scale-90 origin-right" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div id="cart-form" className="relative mt-6 scroll-mt-4 space-y-4">
              <p className="font-display text-lg">Data pemesan</p>

              {/* Honeypot anti-bot: tidak terlihat & tidak diisi manusia */}
              <input
                ref={honeypot}
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 h-px w-px opacity-0"
              />

              <label className="block">
                <FieldLabel>Nama</FieldLabel>
                <input
                  value={customer.name}
                  onChange={(e) => setCustomer({ name: e.target.value })}
                  autoComplete="name"
                  maxLength={L.name}
                  placeholder="Nama kamu"
                  aria-invalid={touched && errors.name}
                  className={cn(inputCls(touched && errors.name), "h-12")}
                />
                <FieldError show={touched && errors.name}>Nama wajib diisi.</FieldError>
              </label>

              <fieldset>
                <legend className="text-xs font-bold tracking-wide text-grape-ink/60 uppercase">Cara pesan</legend>
                <div
                  className={cn(
                    "mt-1 grid gap-2",
                    orderTypes.length === 3 ? "grid-cols-3" : orderTypes.length === 2 ? "grid-cols-2" : "grid-cols-1",
                  )}
                >
                  {orderTypes.map((t) => {
                    const active = orderType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCustomer({ orderType: t.id })}
                        className={cn(
                          "relative flex flex-col items-center gap-1 rounded-2xl border-2 border-grape-ink px-1 py-2.5 text-xs font-bold transition",
                          active ? "bg-lemon shadow-pop-sm" : "bg-white",
                        )}
                      >
                        <t.icon className="size-5" strokeWidth={2.4} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                {!ordering.delivery && (
                  <p className="mt-1.5 text-xs text-grape-ink/60">Saat ini belum menerima pesanan antar.</p>
                )}
              </fieldset>

              <label className="block">
                <FieldLabel hint={isDelivery ? "(wajib)" : "(opsional)"}>No. WhatsApp</FieldLabel>
                <input
                  value={customer.phone}
                  onChange={(e) => setCustomer({ phone: e.target.value })}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={L.phone}
                  placeholder="08xx-xxxx-xxxx"
                  aria-invalid={touched && errors.phone}
                  className={cn(inputCls(touched && errors.phone), "h-12")}
                />
                <FieldError show={touched && errors.phone}>
                  {customer.phone.trim() ? "Nomor WhatsApp tidak valid." : "Nomor WhatsApp wajib diisi untuk pesanan antar."}
                </FieldError>
              </label>

              <AnimatePresence initial={false}>
                {isDelivery && (
                  <motion.div
                    className="space-y-4 overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {ordering.deliveryNote && (
                      <p className="flex gap-2 rounded-2xl border-2 border-grape-ink bg-sky/60 px-3 py-2 text-sm">
                        <Bike className="mt-0.5 size-4 shrink-0" /> {ordering.deliveryNote}
                      </p>
                    )}
                    {ordering.deliveryMinOrder > 0 && (
                      <p
                        className={cn(
                          "rounded-2xl px-3 py-2 text-sm font-semibold",
                          errors.minOrder ? "border-2 border-chili bg-chili/10 text-chili" : "bg-lime/50",
                        )}
                      >
                        Minimal belanja untuk diantar {formatRp(ordering.deliveryMinOrder)}
                        {errors.minOrder ? ` — kurang ${formatRp(ordering.deliveryMinOrder - total)} lagi.` : " ✓"}
                      </p>
                    )}

                    <label className="block">
                      <FieldLabel>Alamat lengkap</FieldLabel>
                      <textarea
                        value={customer.address}
                        onChange={(e) => setCustomer({ address: e.target.value })}
                        autoComplete="street-address"
                        rows={2}
                        maxLength={L.address}
                        placeholder="Nama jalan/gang, no. rumah, RT/RW, warna/ciri rumah"
                        aria-invalid={touched && errors.address}
                        className={cn(inputCls(touched && errors.address), "resize-none py-3")}
                      />
                      <FieldError show={touched && errors.address}>Alamat lengkap wajib diisi.</FieldError>
                    </label>

                    <label className="block">
                      <FieldLabel>Desa / Kelurahan</FieldLabel>
                      <input
                        value={customer.area}
                        onChange={(e) => setCustomer({ area: e.target.value })}
                        autoComplete="address-level3"
                        maxLength={L.area}
                        placeholder="Mis. Sebaung, Gending"
                        aria-invalid={touched && errors.area}
                        className={cn(inputCls(touched && errors.area), "h-12")}
                      />
                      <FieldError show={touched && errors.area}>Desa/kelurahan wajib diisi.</FieldError>
                    </label>

                    <label className="block">
                      <FieldLabel hint="(opsional)">Patokan</FieldLabel>
                      <input
                        value={customer.landmark}
                        onChange={(e) => setCustomer({ landmark: e.target.value })}
                        maxLength={L.landmark}
                        placeholder="Mis. sebelah masjid, depan toko …"
                        className={cn(inputCls(), "h-12")}
                      />
                    </label>

                    <div>
                      <FieldLabel hint="(opsional, memudahkan kurir)">Lokasi</FieldLabel>
                      {customer.location ? (
                        <div className="mt-1 flex items-center gap-2 rounded-2xl border-2 border-grape-ink bg-lime/50 px-3 py-2.5 text-sm">
                          <MapPin className="size-4 shrink-0" />
                          <a
                            href={mapsLink(customer.location)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 font-bold underline"
                          >
                            Lokasi tersimpan — lihat di peta
                          </a>
                          <button
                            type="button"
                            onClick={() => setCustomer({ location: "" })}
                            className="text-xs font-bold text-grape-ink/60 hover:text-chili"
                          >
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={shareLocation}
                          disabled={locating}
                          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-grape-ink bg-white text-sm font-bold disabled:opacity-60"
                        >
                          {locating ? <LoaderCircle className="size-4 animate-spin" /> : <MapPin className="size-4" />}
                          {locating ? "Mencari lokasi…" : "Bagikan lokasi saya sekarang"}
                        </button>
                      )}
                      {locError && <span className="mt-1 block text-xs font-semibold text-chili">{locError}</span>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <label className="block">
                <FieldLabel hint="(opsional)">Catatan pesanan</FieldLabel>
                <input
                  value={customer.note}
                  onChange={(e) => setCustomer({ note: e.target.value })}
                  maxLength={L.note}
                  placeholder={isDelivery ? "Mis. antar jam 12.30" : "Mis. jam ambil 12.30"}
                  className={cn(inputCls(), "h-12")}
                />
              </label>

              <button
                type="button"
                onClick={() => clear()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-grape-ink/60 hover:text-chili"
              >
                <Trash2 className="size-4" /> Kosongkan keranjang
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
