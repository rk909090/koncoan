import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { GBP, mapsEmbedUrl, mapsUrl, OPENING_HOURS, SITE, waLink } from "@/lib/site";
import { WhatsAppIcon, Sparkle } from "@/components/ui/icons";
import { TrackedLink } from "@/components/ui/TrackedLink";

export function Visit() {
  return (
    <section id="lokasi" className="relative scroll-mt-20 overflow-hidden bg-grape-deep py-20 text-white sm:py-28">
      <div aria-hidden className="absolute -top-32 -left-32 size-96 rounded-full bg-magenta/60 blur-3xl" />
      <div aria-hidden className="absolute -right-24 -bottom-24 size-80 rounded-full bg-sky/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
        <div>
          <p className="inline-block -rotate-2 rounded-full border-2 border-grape-ink bg-lemon px-4 py-1 text-sm font-extrabold text-grape-ink shadow-pop-sm">
            Mampir yuk!
          </p>
          <h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl">
            Ketemu di <span className="text-lemon">Sebaung</span>
          </h2>
          <ul className="mt-8 space-y-4">
            <li className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-grape-ink bg-white text-grape">
                <MapPin className="size-6" strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-xs font-bold tracking-wide text-white/60 uppercase">Alamat</p>
                <p className="text-lg font-bold">{SITE.address}</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-grape-ink bg-white text-grape">
                <Clock className="size-6" strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-xs font-bold tracking-wide text-white/60 uppercase">Jam buka</p>
                <p className="text-lg font-bold">
                  Senin–Sabtu {OPENING_HOURS.opens.replace(":", ".")}–{OPENING_HOURS.closes.replace(":", ".")} WIB
                </p>
                <p className="text-sm text-white/70">Minggu libur</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-grape-ink bg-white text-grape">
                <Phone className="size-6" strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-xs font-bold tracking-wide text-white/60 uppercase">WhatsApp</p>
                <TrackedLink kind="whatsapp" location="visit_phone" href={waLink()} className="text-lg font-bold underline-offset-4 hover:underline">
                  {SITE.phoneDisplay}
                </TrackedLink>
                <p className="text-sm text-white/70">
                  Telepon:{" "}
                  <a href={`tel:${GBP.phoneTel}`} className="font-semibold underline-offset-4 hover:underline">
                    {GBP.phoneDisplay}
                  </a>
                </p>
              </div>
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink
              kind="maps"
              location="visit_button"
              href={mapsUrl}
              className="inline-flex h-13 items-center gap-2 rounded-full border-2 border-grape-ink bg-lemon px-6 font-bold text-grape-ink shadow-pop transition hover:-translate-y-0.5"
            >
              <Navigation className="size-5" strokeWidth={2.6} /> Buka di Google Maps
            </TrackedLink>
            <TrackedLink
              kind="whatsapp"
              location="visit_button"
              href={waLink("Halo Mie Koncoan! Mau tanya-tanya dulu 🙏")}
              className="inline-flex h-13 items-center gap-2 rounded-full border-2 border-grape-ink bg-[#25d366] px-6 font-bold text-grape-ink shadow-pop transition hover:-translate-y-0.5"
            >
              <WhatsAppIcon className="size-5" /> Chat WhatsApp
            </TrackedLink>
          </div>
        </div>

        <div className="relative">
          <Sparkle className="absolute -top-6 -right-2 z-10 size-12 animate-wiggle text-lemon" />
          <div className="overflow-hidden rounded-[28px] border-2 border-grape-ink bg-white shadow-[7px_7px_0_0_var(--color-lemon)]">
            <iframe
              title={`Peta lokasi: ${SITE.address}`}
              src={mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block aspect-[4/3] w-full"
            />
          </div>
          <p className="mt-3 text-xs text-white/60">
            Titik peta sesuai lokasi Mie KonCOan di Google Maps — patokan: depan SMAN 1 Gending.
          </p>
        </div>
      </div>
    </section>
  );
}
