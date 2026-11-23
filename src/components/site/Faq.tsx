import { Plus } from "lucide-react";
import type { Faq as FaqItem } from "@/lib/seo";

/**
 * FAQ yang terlihat di halaman. Isinya sama persis dengan JSON-LD FAQPage
 * (getFaqs di src/lib/seo.ts, dari menu aktif). Memakai <details>/<summary> sehingga jawaban
 * tetap ada di HTML untuk crawler & mesin AI, tanpa perlu JavaScript.
 */
export function Faq({ faqs }: { faqs: FaqItem[] }) {
  return (
    <section id="faq" className="relative scroll-mt-20 bg-lavender/60 py-20 sm:py-28" aria-labelledby="faq-title">
      <div className="mx-auto max-w-3xl px-5">
        <p className="inline-block rotate-2 rounded-full border-2 border-grape-ink bg-sky px-4 py-1 text-sm font-extrabold shadow-pop-sm">
          FAQ
        </p>
        <h2 id="faq-title" className="mt-4 font-display text-5xl leading-none sm:text-6xl">
          Pertanyaan yang <span className="text-grape">sering ditanya</span>
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <details
              key={f.q}
              open={i === 0}
              className="group rounded-3xl border-2 border-grape-ink bg-white shadow-pop-sm open:shadow-pop"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold [&::-webkit-details-marker]:hidden">
                <h3 className="text-base sm:text-lg">{f.q}</h3>
                <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-grape-ink bg-lemon transition-transform group-open:rotate-45">
                  <Plus className="size-4" strokeWidth={3} />
                </span>
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-grape-ink/75">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
