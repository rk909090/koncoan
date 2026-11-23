import type { SVGProps } from "react";

/** Ikon WhatsApp (glyph sederhana, digambar ulang). */
export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.06a8.15 8.15 0 0 1-4.17-1.15l-.3-.18-3.06.89.9-2.98-.2-.31a8.16 8.16 0 1 1 6.83 3.73Zm4.48-6.1c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.31c-.23.25-.86.84-.86 2.04s.88 2.37 1 2.53c.13.17 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.6.19 1.13.16 1.56.1.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

/** Bintang empat sudut seperti ornamen di brosur. */
export function Sparkle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z" />
    </svg>
  );
}

/** Coretan bintang "asterisk" gaya brosur. */
export function Burst(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1" />
    </svg>
  );
}
