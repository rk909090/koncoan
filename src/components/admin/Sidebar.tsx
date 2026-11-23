"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ChartColumn,
  Calculator,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/app/admin/login/actions";

type Role = "admin" | "kasir";
type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  /** tampilkan jumlah pesanan website yang menunggu */
  showPendingWeb?: boolean;
};

const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Operasional",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/pos", label: "Kasir (POS)", icon: Calculator },
      { href: "/admin/web-orders", label: "Pesanan Web", icon: ShoppingBag, showPendingWeb: true },
      { href: "/admin/orders", label: "Pesanan", icon: ReceiptText },
      { href: "/admin/customers", label: "Konsumen", icon: Users },
    ],
  },
  {
    title: "Manajemen",
    items: [
      { href: "/admin/reports", label: "Laporan Penjualan", icon: ChartColumn, adminOnly: true },
      { href: "/admin/products", label: "Produk & Harga", icon: UtensilsCrossed, adminOnly: true },
      { href: "/admin/users", label: "Pengguna", icon: UserCog, adminOnly: true },
      { href: "/admin/settings", label: "Pengaturan", icon: Settings, adminOnly: true },
    ],
  },
  {
    title: "Akun",
    items: [{ href: "/admin/account", label: "Akun Saya", icon: KeyRound }],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
}

export type SidebarUser = { name: string; username: string; role: Role } | null;

function NavList({ user, pendingWeb, onNavigate }: { user: SidebarUser; pendingWeb: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4" aria-label="Menu admin">
      {NAV.map((group) => {
        const items = group.items.filter((i) => !i.adminOnly || user?.role === "admin");
        if (!items.length) return null;
        return (
          <div key={group.title}>
            <p className="px-3 pb-1.5 text-[11px] font-extrabold tracking-wider text-white/45 uppercase">{group.title}</p>
            <ul className="space-y-1">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors",
                        active ? "text-grape-ink" : "text-white/85 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-nav-active"
                          className="absolute inset-0 rounded-2xl border-2 border-grape-ink bg-lemon shadow-pop-sm"
                          transition={{ type: "spring", stiffness: 450, damping: 36 }}
                        />
                      )}
                      <item.icon className="relative size-5 shrink-0" />
                      <span className="relative">{item.label}</span>
                      {item.showPendingWeb && pendingWeb > 0 && (
                        <span
                          className="relative ml-auto grid h-6 min-w-6 place-items-center rounded-full border-2 border-grape-ink bg-chili px-1.5 text-xs font-extrabold text-white"
                          aria-label={`${pendingWeb} pesanan menunggu`}
                        >
                          {pendingWeb > 99 ? "99+" : pendingWeb}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <div className="mt-auto space-y-1 border-t border-white/15 pt-4">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-white/85 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="size-5" /> Lihat situs
        </a>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-white/85 hover:bg-chili hover:text-white"
          >
            <LogOut className="size-5" /> Keluar
          </button>
        </form>
      </div>
    </nav>
  );
}

function UserCard({ user }: { user: SidebarUser }) {
  return (
    <div className="mx-3 mb-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-grape-ink bg-sky font-display text-lg text-grape-ink">
        {user?.name?.[0]?.toUpperCase() ?? "…"}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{user?.name ?? "Memuat…"}</p>
        <p className="text-xs text-white/60">{user ? (user.role === "admin" ? "Administrator" : "Kasir") : " "}</p>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="mx-3 mt-4 mb-5 flex items-center justify-center rounded-2xl bg-cream p-2">
      <Logo className="h-12 w-auto" />
    </Link>
  );
}

export function Sidebar({ user, pendingWeb = 0 }: { user: SidebarUser; pendingWeb?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r-2 border-grape-ink bg-grape-deep lg:flex print:hidden">
        <Brand />
        <UserCard user={user} />
        <NavList user={user} pendingWeb={pendingWeb} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b-2 border-grape-ink bg-grape-deep px-3 py-2 lg:hidden print:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={pendingWeb > 0 ? `Buka menu (${pendingWeb} pesanan web menunggu)` : "Buka menu"}
          className="relative grid size-10 place-items-center rounded-full border-2 border-grape-ink bg-lemon"
        >
          <Menu className="size-5" />
          {pendingWeb > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-grape-ink bg-chili px-1 text-[10px] font-extrabold text-white">
              {pendingWeb > 99 ? "99+" : pendingWeb}
            </span>
          )}
        </button>
        <Link href="/admin" className="rounded-xl bg-cream px-2 py-1">
          <Logo className="h-8 w-auto" />
        </Link>
        <span className="grid size-10 place-items-center rounded-full border-2 border-grape-ink bg-sky font-display text-grape-ink">
          {user?.name?.[0]?.toUpperCase() ?? "…"}
        </span>
      </header>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-grape-ink/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r-2 border-grape-ink bg-grape-deep"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/15 text-white"
              >
                <X className="size-5" />
              </button>
              <Brand />
              <UserCard user={user} />
              <NavList user={user} pendingWeb={pendingWeb} onNavigate={() => setOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Kerangka sidebar statis (tanpa hook) untuk fallback Suspense. */
export function SidebarSkeleton() {
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r-2 border-grape-ink bg-grape-deep lg:flex print:hidden">
        <div className="mx-3 mt-4 mb-5 h-16 rounded-2xl bg-cream/90" />
        <div className="mx-3 mb-4 h-16 rounded-2xl bg-white/10" />
        <div className="space-y-2 px-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-2xl bg-white/10" />
          ))}
        </div>
      </aside>
      <header className="sticky top-0 z-40 h-[58px] border-b-2 border-grape-ink bg-grape-deep lg:hidden print:hidden" />
    </>
  );
}
