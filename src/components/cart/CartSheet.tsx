"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bike, CheckCircle2, ShoppingBag, Store, Trash2, UtensilsCrossed } from "lucide-react";
import { useRef, useState } from "react";
import { buildOrderMessage } from "@/lib/order";
import { track } from "@/lib/analytics";
import { formatRp, waLink, SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import { cartTotals, useCart, type OrderType } from "@/store/cart";
import { Sheet } from "@/components/ui/Sheet";
import { MenuImage } from "@/components/menu/MenuImage";
import { useMenu } from "@/components/menu/MenuProvider";
import { QtyControl } from "@/components/ui/QtyControl";
import { WhatsAppIcon } from "@/components/ui/icons";

const ORDER_TYPES: { id: OrderType; label: string; icon: typeof Store }[] = [
  { id: "dine-in", label: "Makan di sini", icon: UtensilsCrossed },
  { id: "take-away", label: "Ambil sendiri", icon: Store },
  { id: "delivery", label: "Diantar", icon: Bike },
];

export function CartSheet() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const lines = useCart((s) => s.lines);
  const customer = useCart((s) => s.customer);
  const setCustomer = useCart((s) => s.setCustomer);
  const clear = useCart((s) => s.clear);
  const openDetail = useCart((s) => s.openDetail);
  const { items: menuItems, byId } = useMenu();
  const { count, total } = cartTotals(lines, byId);

  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  // begin_checkout cukup sekali per sesi buka keranjang (hindari dobel saat validasi gagal)
  const checkoutTracked = useRef(false);

  const nameError = !customer.name.trim();
  const addressError = customer.orderType === "delivery" && !customer.address.trim();
  const invalid = nameError || addressError;

  const hasDrink = lines.some((l) => byId[l.id]?.category === "minuman");
  const drinkSuggestions = menuItems.filter((m) => m.category === "minuman").slice(0, 6);

  const handleClose = () => {
    close();
    setSent(false);
    setTouched(false);
    checkoutTracked.current = false;
  };

  const submit = () => {
    setTouched(true);
    if (count > 0 && !checkoutTracked.current) {
      checkoutTracked.current = true;
      track.beginCheckout(lines, byId);
    }
    if (invalid || count === 0) {
      document.getElementById("cart-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const url = waLink(buildOrderMessage(lines, customer, byId));
    track.generateLead(lines, byId, customer.orderType);
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  };

  return (
    <Sheet
      open={isOpen}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          Keranjang
          {count > 0 && (
            <span className="rounded-full border-2 border-grape-ink bg-lemon px-2.5 font-sans text-sm font-extrabold">
              {count}
            </span>
          )}
        </span>
      }
      footer={
        count > 0 && !sent ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-grape-ink/60">Total</p>
              <p className="font-display text-2xl leading-none text-grape">{formatRp(total)}</p>
            </div>
            <button
              type="button"
              onClick={submit}
              className="flex h-13 flex-1 items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-[#25d366] px-4 font-bold text-grape-ink shadow-pop transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <WhatsAppIcon className="size-5 shrink-0" />
              <span className="whitespace-nowrap">Pesan via WA</span>
            </button>
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
            <h3 className="mt-5 font-display text-2xl">WhatsApp sudah dibuka!</h3>
            <p className="mt-2 max-w-xs text-sm text-grape-ink/70">
              Tinggal tekan <b>kirim</b> di WhatsApp ya. Pesanan, ongkir (jika diantar) & pembayaran
              akan dikonfirmasi langsung oleh Mie Koncoan.
            </p>
            <p className="mt-3 text-xs text-grape-ink/60">
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
            </p>
            <div className="mt-6 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  clear();
                  handleClose();
                }}
                className="h-12 rounded-full border-2 border-grape-ink bg-grape font-bold text-white shadow-pop-sm"
              >
                Selesai & kosongkan keranjang
              </button>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="h-12 rounded-full border-2 border-grape-ink bg-white font-bold"
              >
                Kembali ke keranjang
              </button>
            </div>
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
                        <button
                          type="button"
                          onClick={() => openDetail(item.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate font-bold leading-tight">{item.name}</p>
                          <p className="text-sm font-semibold text-grape">{formatRp(item.price * l.qty)}</p>
                          <p className="truncate text-xs text-grape-ink/55">
                            {l.note ? `“${l.note}”` : "+ tambah catatan"}
                          </p>
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
                    <div
                      key={d.id}
                      className="flex w-36 shrink-0 flex-col rounded-2xl border-2 border-grape-ink bg-white p-2"
                    >
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

            <div id="cart-form" className="mt-6 scroll-mt-4 space-y-4">
              <p className="font-display text-lg">Data pemesan</p>
              <label className="block">
                <span className="text-xs font-bold tracking-wide text-grape-ink/60 uppercase">Nama</span>
                <input
                  value={customer.name}
                  onChange={(e) => setCustomer({ name: e.target.value })}
                  autoComplete="name"
                  maxLength={60}
                  placeholder="Nama kamu"
                  aria-invalid={touched && nameError}
                  className={cn(
                    "mt-1 h-12 w-full rounded-2xl border-2 bg-white px-4 text-base outline-none placeholder:text-grape-ink/35 focus:ring-4 focus:ring-lemon",
                    touched && nameError ? "border-chili" : "border-grape-ink",
                  )}
                />
                {touched && nameError && (
                  <span className="mt-1 block text-xs font-semibold text-chili">Nama wajib diisi.</span>
                )}
              </label>

              <fieldset>
                <legend className="text-xs font-bold tracking-wide text-grape-ink/60 uppercase">
                  Cara pesan
                </legend>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {ORDER_TYPES.map((t) => {
                    const active = customer.orderType === t.id;
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
              </fieldset>

              <AnimatePresence initial={false}>
                {customer.orderType === "delivery" && (
                  <motion.label
                    className="block overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <span className="text-xs font-bold tracking-wide text-grape-ink/60 uppercase">Alamat antar</span>
                    <textarea
                      value={customer.address}
                      onChange={(e) => setCustomer({ address: e.target.value })}
                      autoComplete="street-address"
                      rows={2}
                      maxLength={200}
                      placeholder="Nama jalan, patokan, dsb."
                      aria-invalid={touched && addressError}
                      className={cn(
                        "mt-1 w-full resize-none rounded-2xl border-2 bg-white px-4 py-3 text-base outline-none placeholder:text-grape-ink/35 focus:ring-4 focus:ring-lemon",
                        touched && addressError ? "border-chili" : "border-grape-ink",
                      )}
                    />
                    {touched && addressError && (
                      <span className="block text-xs font-semibold text-chili">Alamat wajib diisi untuk pesanan antar.</span>
                    )}
                    <span className="mt-1 block text-xs text-grape-ink/60">
                      Ketersediaan antar & ongkir dikonfirmasi penjual lewat WhatsApp.
                    </span>
                  </motion.label>
                )}
              </AnimatePresence>

              <label className="block">
                <span className="text-xs font-bold tracking-wide text-grape-ink/60 uppercase">
                  Catatan pesanan (opsional)
                </span>
                <input
                  value={customer.note}
                  onChange={(e) => setCustomer({ note: e.target.value })}
                  maxLength={160}
                  placeholder="Mis. jam ambil 12.30"
                  className="mt-1 h-12 w-full rounded-2xl border-2 border-grape-ink bg-white px-4 text-base outline-none placeholder:text-grape-ink/35 focus:ring-4 focus:ring-lemon"
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
