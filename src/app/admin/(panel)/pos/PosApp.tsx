"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Banknote,
  CheckCircle2,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  StickyNote,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { formatRp } from "@/lib/site";
import {
  ORDER_TYPES,
  PAYMENT_METHODS,
  PRODUCT_CATEGORIES,
  formatPhone,
  type OrderTypeId,
  type PaymentMethodId,
} from "@/lib/admin/labels";
import { createOrderAction, searchCustomersAction, type CreateOrderResult } from "./actions";

export type PosProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  serving: string | null;
};

type Line = { qty: number; note: string };
type CustomerSel =
  | { mode: "none" }
  | { mode: "existing"; id: number; name: string; phone: string | null }
  | { mode: "new"; name: string; phone: string };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function quickCashOptions(total: number) {
  if (total <= 0) return [];
  const set = new Set<number>([total]);
  for (const step of [5000, 10000, 20000, 50000, 100000]) set.add(Math.ceil(total / step) * step);
  return [...set].filter((v) => v >= total).sort((a, b) => a - b).slice(0, 5);
}

const ctl =
  "h-11 w-full rounded-2xl border-2 border-grape-ink bg-white px-3.5 text-sm outline-none placeholder:text-grape-ink/40 focus:ring-4 focus:ring-lemon";

export function PosApp({ products, cashierName }: { products: PosProduct[]; cashierName: string }) {
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, Line>>({});
  const [orderType, setOrderType] = useState<OrderTypeId>("dine-in");
  const [payment, setPayment] = useState<PaymentMethodId>("cash");
  const [discMode, setDiscMode] = useState<"rp" | "pct">("rp");
  const [discValue, setDiscValue] = useState("");
  const [cash, setCash] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [customer, setCustomer] = useState<CustomerSel>({ mode: "none" });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<CreateOrderResult, { ok: true }> | null>(null);
  const [mobileCart, setMobileCart] = useState(false);
  const [pending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const visible = useMemo(() => {
    const nq = norm(q.trim());
    return products.filter((p) => (cat === "all" || p.category === cat) && (!nq || norm(p.name).includes(nq)));
  }, [products, cat, q]);

  const lines = Object.entries(cart).filter(([id]) => byId.has(id));
  const itemCount = lines.reduce((a, [, l]) => a + l.qty, 0);
  const subtotal = lines.reduce((a, [id, l]) => a + byId.get(id)!.price * l.qty, 0);
  const discRaw = Math.max(0, Number(discValue.replace(/\D/g, "")) || 0);
  const discount = Math.min(subtotal, discMode === "pct" ? Math.round((subtotal * Math.min(100, discRaw)) / 100) : discRaw);
  const total = subtotal - discount;
  const cashNum = Number(cash.replace(/\D/g, "")) || 0;
  const change = payment === "cash" ? cashNum - total : 0;
  const cashShort = payment === "cash" && cashNum < total;

  // Shortcut: "/" untuk fokus ke pencarian
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const add = (id: string, delta = 1) =>
    setCart((c) => {
      const cur = c[id]?.qty ?? 0;
      const next = Math.max(0, Math.min(999, cur + delta));
      const copy = { ...c };
      if (next === 0) delete copy[id];
      else copy[id] = { qty: next, note: c[id]?.note ?? "" };
      return copy;
    });
  const setNote = (id: string, note: string) => setCart((c) => (c[id] ? { ...c, [id]: { ...c[id], note } } : c));

  const reset = () => {
    setCart({});
    setDiscValue("");
    setCash("");
    setOrderNote("");
    setCustomer({ mode: "none" });
    setOrderType("dine-in");
    setPayment("cash");
    setError(null);
    setResult(null);
    setMobileCart(false);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const submit = () => {
    setError(null);
    if (!lines.length) return setError("Keranjang masih kosong.");
    if (cashShort) return setError("Uang yang diterima kurang dari total.");
    if (customer.mode === "new" && !customer.name.trim()) return setError("Isi nama konsumen baru (atau pilih Umum).");
    startTransition(async () => {
      const res = await createOrderAction({
        items: lines.map(([id, l]) => ({ productId: id, qty: l.qty, note: l.note })),
        orderType,
        paymentMethod: payment,
        amountPaid: payment === "cash" ? cashNum : total,
        discount,
        note: orderNote,
        customer:
          customer.mode === "existing"
            ? { id: customer.id }
            : customer.mode === "new"
              ? { name: customer.name, phone: customer.phone }
              : null,
      });
      if (res.ok) setResult(res);
      else setError(res.error);
    });
  };

  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100dvh-58px)] flex-col sm:-mx-6 lg:-mx-8 lg:-my-8 lg:h-dvh lg:min-h-0 lg:flex-row">
      {/* ——— Produk ——— */}
      <section className="flex min-w-0 flex-1 flex-col px-4 pt-5 pb-28 sm:px-6 lg:overflow-y-auto lg:px-8 lg:pb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">Kasir</h1>
            <p className="text-sm text-grape-ink/60">Kasir: {cashierName} · tekan “/” untuk mencari</p>
          </div>
        </div>
        <div className="sticky top-14 z-20 -mx-1 mb-4 space-y-3 bg-cream/95 px-1 pb-2 backdrop-blur lg:top-0 lg:pt-1">
          <label className="relative block">
            <span className="sr-only">Cari produk</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-grape-ink/45" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && visible[0]) {
                  add(visible[0].id);
                  setQ("");
                }
              }}
              placeholder="Cari menu… (Enter = tambah hasil pertama)"
              className={cn(ctl, "h-12 pl-11 text-base")}
            />
          </label>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {[{ id: "all", label: "Semua" }, ...PRODUCT_CATEGORIES].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={cn(
                  "shrink-0 rounded-full border-2 border-grape-ink px-4 py-1.5 text-sm font-bold",
                  cat === c.id ? "bg-grape text-white" : "bg-white hover:bg-lavender",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-grape-ink/60">Tidak ada produk yang cocok.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {visible.map((p) => {
              const qty = cart[p.id]?.qty ?? 0;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => add(p.id)}
                    className={cn(
                      "group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border-2 border-grape-ink bg-white text-left shadow-pop-sm transition active:translate-x-px active:translate-y-px active:shadow-none",
                      qty > 0 && "ring-4 ring-lemon",
                    )}
                  >
                    <div className="relative aspect-[4/3] w-full bg-[#fff4dc]">
                      {p.image ? (
                        <Image src={p.image} alt="" fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center font-display text-4xl text-grape/40">
                          {p.name[0]}
                        </span>
                      )}
                      {qty > 0 && (
                        <motion.span
                          key={qty}
                          initial={{ scale: 1.6 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 grid min-w-8 place-items-center rounded-full border-2 border-grape-ink bg-lemon px-2 font-display text-lg"
                        >
                          {qty}
                        </motion.span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col px-3 py-2.5">
                      <span className="text-sm leading-tight font-bold">{p.name}</span>
                      {p.serving && <span className="text-xs text-grape-ink/55">{p.serving}</span>}
                      <span className="mt-auto pt-1 font-extrabold text-grape">{formatRp(p.price)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ——— Bar keranjang (mobile) ——— */}
      <div className="fixed inset-x-0 bottom-0 z-30 p-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileCart(true)}
          className="flex h-16 w-full items-center gap-3 rounded-full border-2 border-grape-ink bg-grape pr-4 pl-2 text-white shadow-pop-lg"
        >
          <span className="relative grid size-12 place-items-center rounded-full border-2 border-grape-ink bg-lemon text-grape-ink">
            <ShoppingBag className="size-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid min-w-6 place-items-center rounded-full border-2 border-grape-ink bg-chili px-1 text-xs font-extrabold text-white">
                {itemCount}
              </span>
            )}
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-xs text-white/75">{itemCount} item</span>
            <span className="text-lg font-extrabold">{formatRp(total)}</span>
          </span>
          <span className="ml-auto rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Bayar →</span>
        </button>
      </div>

      {/* ——— Panel keranjang & pembayaran ——— */}
      <aside
        className={cn(
          "flex flex-col border-grape-ink bg-white lg:w-[400px] lg:shrink-0 lg:border-l-2 xl:w-[440px]",
          mobileCart ? "fixed inset-0 z-50" : "hidden lg:flex",
        )}
      >
        <div className="flex items-center justify-between border-b-2 border-grape-ink/10 px-4 py-3">
          <h2 className="font-display text-2xl">Pesanan</h2>
          <div className="flex items-center gap-1">
            {lines.length > 0 && (
              <button
                type="button"
                onClick={() => setCart({})}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-grape-ink/60 hover:bg-chili hover:text-white"
              >
                <Trash2 className="size-3.5" /> Kosongkan
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileCart(false)}
              aria-label="Tutup"
              className="grid size-9 place-items-center rounded-full border-2 border-grape-ink lg:hidden"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
          {/* Item */}
          {lines.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-grape-ink/25 py-10 text-center text-sm text-grape-ink/55">
              Tap menu di kiri untuk menambahkan.
            </div>
          ) : (
            <ul className="space-y-2">
              {lines.map(([id, l]) => (
                <CartLine key={id} product={byId.get(id)!} line={l} onAdd={(d) => add(id, d)} onNote={(n) => setNote(id, n)} />
              ))}
            </ul>
          )}

          {/* Konsumen */}
          <CustomerPicker value={customer} onChange={setCustomer} />

          {/* Jenis pesanan */}
          <div>
            <p className="mb-1 text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Jenis pesanan</p>
            <div className="grid grid-cols-3 gap-2">
              {ORDER_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOrderType(t.id)}
                  className={cn(
                    "rounded-2xl border-2 border-grape-ink px-2 py-2 text-xs font-bold",
                    orderType === t.id ? "bg-lemon shadow-pop-sm" : "bg-white",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Diskon & catatan */}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="block">
              <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Diskon</span>
              <input
                inputMode="numeric"
                value={discValue}
                onChange={(e) => setDiscValue(e.target.value.replace(/[^\d]/g, ""))}
                placeholder={discMode === "pct" ? "0–100" : "0"}
                className={cn(ctl, "mt-1")}
              />
            </label>
            <div className="mt-[18px] flex rounded-2xl border-2 border-grape-ink p-0.5">
              {(["rp", "pct"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDiscMode(m)}
                  className={cn("rounded-xl px-3 text-sm font-bold", discMode === m ? "bg-grape text-white" : "")}
                >
                  {m === "rp" ? "Rp" : "%"}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Catatan pesanan</span>
            <input
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              maxLength={500}
              placeholder="Mis. meja 3, tanpa sambal…"
              className={cn(ctl, "mt-1")}
            />
          </label>

          {/* Pembayaran */}
          <div>
            <p className="mb-1 text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Metode bayar</p>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayment(m.id)}
                  className={cn(
                    "rounded-2xl border-2 border-grape-ink px-1 py-2 text-xs font-bold",
                    payment === m.id ? "bg-sky shadow-pop-sm" : "bg-white",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {payment === "cash" && (
            <div>
              <label className="block">
                <span className="text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Uang diterima</span>
                <input
                  inputMode="numeric"
                  value={cash ? new Intl.NumberFormat("id-ID").format(cashNum) : ""}
                  onChange={(e) => setCash(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className={cn(ctl, "mt-1 text-lg font-bold")}
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {quickCashOptions(total).map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCash(String(v))}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-grape-ink bg-white px-3 py-1 text-xs font-bold hover:bg-lemon"
                  >
                    <Banknote className="size-3.5" />
                    {i === 0 ? "Uang pas" : formatRp(v)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ringkasan */}
        <div className="border-t-2 border-grape-ink bg-cream px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal ({itemCount} item)</dt>
              <dd className="tabular-nums">{formatRp(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-chili">
                <dt>Diskon</dt>
                <dd className="tabular-nums">−{formatRp(discount)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-1">
              <dt className="font-bold">Total</dt>
              <dd className="text-2xl font-extrabold text-grape tabular-nums">{formatRp(total)}</dd>
            </div>
            {payment === "cash" && cashNum > 0 && (
              <div className={cn("flex justify-between font-bold", cashShort ? "text-chili" : "")}>
                <dt>{cashShort ? "Kurang" : "Kembalian"}</dt>
                <dd className="tabular-nums">{formatRp(Math.abs(change))}</dd>
              </div>
            )}
          </dl>
          {error && (
            <p role="alert" className="mt-2 rounded-xl border-2 border-chili bg-chili/10 px-3 py-2 text-sm font-semibold text-chili">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={pending || lines.length === 0 || (payment === "cash" && (cashShort || cashNum === 0))}
            className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-grape text-lg font-bold text-white shadow-pop transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            <CheckCircle2 className="size-6" />
            {pending ? "Menyimpan…" : `Bayar ${formatRp(total)}`}
          </button>
          {payment === "cash" && lines.length > 0 && cashNum === 0 && (
            <p className="mt-1 text-center text-xs text-grape-ink/55">Isi uang diterima atau pilih “Uang pas”.</p>
          )}
        </div>
      </aside>

      {/* ——— Sukses ——— */}
      <AnimatePresence>
        {result && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-grape-ink/60 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-[28px] border-2 border-grape-ink bg-white p-6 text-center shadow-pop-lg"
            >
              <span className="mx-auto grid size-16 place-items-center rounded-full border-2 border-grape-ink bg-lime shadow-pop-sm">
                <CheckCircle2 className="size-8" />
              </span>
              <h2 className="mt-4 font-display text-2xl">Transaksi tersimpan</h2>
              <p className="text-sm text-grape-ink/60">No. {result.orderNo}</p>
              <p className="mt-3 text-sm">Total</p>
              <p className="text-2xl font-extrabold">{formatRp(result.total)}</p>
              {result.change > 0 && (
                <div className="mt-3 rounded-2xl border-2 border-grape-ink bg-lemon px-4 py-3">
                  <p className="text-xs font-bold uppercase">Kembalian</p>
                  <p className="text-3xl font-extrabold">{formatRp(result.change)}</p>
                </div>
              )}
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => window.open(`/admin/struk/${result.id}`, "_blank", "width=420,height=700")}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-white font-bold shadow-pop-sm"
                >
                  <Printer className="size-5" /> Cetak struk
                </button>
                <button
                  type="button"
                  onClick={reset}
                  autoFocus
                  className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-grape font-bold text-white shadow-pop-sm"
                >
                  Transaksi baru
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CartLine({
  product,
  line,
  onAdd,
  onNote,
}: {
  product: PosProduct;
  line: Line;
  onAdd: (delta: number) => void;
  onNote: (n: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="rounded-2xl border-2 border-grape-ink/15 p-2.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{product.name}</p>
          <p className="text-xs text-grape-ink/60 tabular-nums">
            {formatRp(product.price)} × {line.qty} = <b className="text-grape-ink">{formatRp(product.price * line.qty)}</b>
          </p>
        </div>
        <div className="flex items-center rounded-full border-2 border-grape-ink">
          <button type="button" onClick={() => onAdd(-1)} aria-label={`Kurangi ${product.name}`} className="grid size-8 place-items-center">
            <Minus className="size-4" />
          </button>
          <span className="w-7 text-center text-sm font-extrabold tabular-nums">{line.qty}</span>
          <button type="button" onClick={() => onAdd(1)} aria-label={`Tambah ${product.name}`} className="grid size-8 place-items-center">
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      {editing || line.note ? (
        <input
          autoFocus={editing}
          value={line.note}
          onChange={(e) => onNote(e.target.value)}
          onBlur={() => setEditing(false)}
          maxLength={255}
          placeholder="Catatan item (mis. tidak pedas)"
          className="mt-2 h-9 w-full rounded-xl border-2 border-grape-ink/30 px-3 text-xs outline-none focus:border-grape-ink"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-grape-ink/55 hover:text-grape"
        >
          <StickyNote className="size-3.5" /> Tambah catatan
        </button>
      )}
    </li>
  );
}

function CustomerPicker({ value, onChange }: { value: CustomerSel; onChange: (v: CustomerSel) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: number; name: string; phone: string | null }[]>([]);
  const [searching, startSearch] = useTransition();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(() => {
      startSearch(async () => setResults(await searchCustomersAction(term)));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const shownResults = q.trim().length >= 2 ? results : [];

  return (
    <div>
      <p className="mb-1 text-[11px] font-extrabold tracking-wide text-grape-ink/60 uppercase">Konsumen</p>
      <div className="mb-2 grid grid-cols-3 gap-2">
        {(
          [
            { mode: "none", label: "Umum", icon: Users },
            { mode: "existing", label: "Pilih", icon: Search },
            { mode: "new", label: "Baru", icon: UserPlus },
          ] as const
        ).map((m) => (
          <button
            key={m.mode}
            type="button"
            onClick={() =>
              onChange(
                m.mode === "none"
                  ? { mode: "none" }
                  : m.mode === "new"
                    ? { mode: "new", name: "", phone: "" }
                    : value.mode === "existing"
                      ? value
                      : { mode: "existing", id: 0, name: "", phone: null },
              )
            }
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-2xl border-2 border-grape-ink px-2 py-2 text-xs font-bold",
              value.mode === m.mode ? "bg-lavender shadow-pop-sm" : "bg-white",
            )}
          >
            <m.icon className="size-3.5" /> {m.label}
          </button>
        ))}
      </div>

      {value.mode === "existing" &&
        (value.id ? (
          <div className="flex items-center justify-between rounded-2xl border-2 border-grape-ink bg-lavender/50 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{value.name}</p>
              <p className="text-xs text-grape-ink/60">{formatPhone(value.phone) || "tanpa no. HP"}</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ mode: "existing", id: 0, name: "", phone: null })}
              className="text-xs font-bold text-grape hover:underline"
            >
              Ganti
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama / no. HP…"
              className={ctl}
            />
            {(shownResults.length > 0 || searching) && (
              <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-auto rounded-2xl border-2 border-grape-ink bg-white shadow-pop">
                {searching && <li className="px-3 py-2 text-xs text-grape-ink/50">Mencari…</li>}
                {shownResults.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ mode: "existing", id: r.id, name: r.name, phone: r.phone });
                        setQ("");
                      }}
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-lavender"
                    >
                      <span className="text-sm font-bold">{r.name}</span>
                      <span className="text-xs text-grape-ink/60">{formatPhone(r.phone) || "tanpa no. HP"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {q.trim().length >= 2 && !searching && shownResults.length === 0 && (
              <p className="mt-1 text-xs text-grape-ink/55">Tidak ditemukan — pilih “Baru” untuk menambahkan.</p>
            )}
          </div>
        ))}

      {value.mode === "new" && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Nama"
            maxLength={100}
            className={ctl}
          />
          <input
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="No. HP (opsional)"
            inputMode="tel"
            maxLength={20}
            className={ctl}
          />
        </div>
      )}
    </div>
  );
}
