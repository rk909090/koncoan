"use client";

import { motion } from "motion/react";
import { ClipboardList, Send, ShoppingBasket } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";

const STEPS = [
  {
    icon: ShoppingBasket,
    title: "Pilih menu",
    text: "Tap tombol + di menu favoritmu. Bisa tambah catatan per item.",
    color: "bg-lemon",
  },
  {
    icon: ClipboardList,
    title: "Isi data",
    text: "Nama & cara pesan: makan di tempat, ambil sendiri, atau diantar.",
    color: "bg-sky",
  },
  {
    icon: Send,
    title: "Kirim via WhatsApp",
    text: "Pesanan tersusun otomatis. Tinggal kirim, penjual akan konfirmasi.",
    color: "bg-lime",
  },
];

export function HowToOrder() {
  return (
    <section id="cara-pesan" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <p className="inline-block -rotate-2 rounded-full border-2 border-grape-ink bg-white px-4 py-1 text-sm font-extrabold shadow-pop-sm">
            <WhatsAppIcon className="mr-1 inline size-4 text-[#25d366]" /> Menerima Pesanan
          </p>
          <h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl">
            Pesan cuma <span className="text-grape">3 langkah</span>
          </h2>
        </div>

        <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
          <svg
            aria-hidden
            className="pointer-events-none absolute top-14 left-[16%] hidden h-10 w-[68%] md:block"
            viewBox="0 0 600 40"
            fill="none"
          >
            <motion.path
              d="M0 20 C 100 -10, 200 50, 300 20 S 500 -10, 600 20"
              stroke="var(--color-grape-ink)"
              strokeWidth="3"
              strokeDasharray="8 10"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </svg>
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring", stiffness: 180, damping: 20, delay: i * 0.12 }}
              className="relative flex flex-col items-center rounded-[28px] border-2 border-grape-ink bg-white p-6 text-center shadow-pop"
            >
              <span className="absolute -top-4 left-5 rounded-full border-2 border-grape-ink bg-grape px-3 font-display text-lg text-white">
                {i + 1}
              </span>
              <motion.span
                whileHover={{ rotate: [0, -12, 12, 0] }}
                className={`grid size-20 place-items-center rounded-3xl border-2 border-grape-ink ${s.color} shadow-pop-sm`}
              >
                <s.icon className="size-9" strokeWidth={2.2} />
              </motion.span>
              <h3 className="mt-5 font-display text-2xl">{s.title}</h3>
              <p className="mt-1 text-sm text-grape-ink/70">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
