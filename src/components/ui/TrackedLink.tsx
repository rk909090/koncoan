"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { track } from "@/lib/analytics";

/**
 * Link eksternal yang mengirim event analytics saat diklik.
 * kind="whatsapp" → event `contact`; kind="maps" → event `get_directions`.
 */
export function TrackedLink({
  kind,
  location,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  kind: "whatsapp" | "maps";
  location: string;
  children: ReactNode;
}) {
  return (
    <a
      target="_blank"
      rel="noreferrer"
      {...rest}
      onClick={(e) => {
        if (kind === "whatsapp") track.contact(location);
        else track.getDirections(location);
        rest.onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
