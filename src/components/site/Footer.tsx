import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { SITE, waLink } from "@/lib/site";
import { TrackedLink } from "@/components/ui/TrackedLink";

export function Footer() {
  return (
    <footer className="relative bg-grape-ink pt-14 pb-28 text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-block rounded-2xl bg-cream p-2">
            <Logo className="h-14 w-auto" />
          </div>
          <p className="mt-3 max-w-xs text-sm">{SITE.tagline}.</p>
          <address className="mt-1 max-w-xs text-sm not-italic">{SITE.address}</address>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <Link href="/#menu" className="hover:text-lemon">Menu</Link>
          <Link href="/order" className="hover:text-lemon">Order</Link>
          <Link href="/#lokasi" className="hover:text-lemon">Lokasi</Link>
          <TrackedLink kind="whatsapp" location="footer" href={waLink()} className="hover:text-lemon">
            WA {SITE.phoneDisplay}
          </TrackedLink>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-5 text-xs text-white/45">
        © {SITE.name}. Foto ilustrasi hanya gambaran; penyajian asli dapat sedikit berbeda.
      </p>
    </footer>
  );
}
