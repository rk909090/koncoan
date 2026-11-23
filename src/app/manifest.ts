import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mie Koncoan — Mie nya Anak Muda",
    short_name: "Mie Koncoan",
    description: "Menu & order Mie Koncoan via WhatsApp.",
    start_url: "/order",
    display: "standalone",
    background_color: "#fff8ea",
    theme_color: "#a406b4",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
