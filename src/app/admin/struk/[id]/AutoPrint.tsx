"use client";

import { useEffect } from "react";

/** Membuka dialog cetak otomatis + tombol cetak manual (tidak ikut tercetak). */
export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="no-print mt-4 flex gap-2 font-sans">
      <button
        type="button"
        onClick={() => window.print()}
        className="flex-1 rounded-full border-2 border-black bg-yellow-300 px-3 py-2 text-xs font-bold"
      >
        Cetak lagi
      </button>
      <button
        type="button"
        onClick={() => window.close()}
        className="flex-1 rounded-full border-2 border-black px-3 py-2 text-xs font-bold"
      >
        Tutup
      </button>
    </div>
  );
}
