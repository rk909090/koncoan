"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Bunyi "ting" singkat lewat Web Audio (tanpa file). Diam saja bila browser memblokir audio. */
function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.65);
    o.onended = () => void ctx.close();
  } catch {
    /* abaikan */
  }
}

/**
 * Muat ulang data halaman secara berkala (router.refresh — state di browser tetap).
 * Bila `count` bertambah → bunyi & judul tab diberi tanda.
 */
export function AutoRefresh({ seconds = 20, count }: { seconds?: number; count?: number }) {
  const router = useRouter();
  const prev = useRef(count);

  useEffect(() => {
    // Tetap jalan saat tab di belakang, supaya judul tab & bunyi memberi tahu pesanan baru
    const t = window.setInterval(() => router.refresh(), seconds * 1000);
    const onVisible = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, seconds]);

  useEffect(() => {
    if (count === undefined) return;
    if (prev.current !== undefined && count > prev.current) beep();
    prev.current = count;
    // Next.js menulis ulang <title> dari metadata setelah refresh → pasang lagi tanda "(n)" setiap judul berubah
    const apply = () => {
      const base = document.title.replace(/^\(\d+\)\s*/, "");
      const want = count > 0 ? `(${count}) ${base}` : base;
      if (document.title !== want) document.title = want;
    };
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      obs.disconnect();
      document.title = document.title.replace(/^\(\d+\)\s*/, "");
    };
  }, [count]);

  return null;
}
