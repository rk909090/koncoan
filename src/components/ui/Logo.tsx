import Image from "next/image";
import logo from "../../../public/brand/logo-koncoan.png";

export function Logo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={logo}
      alt="Mie Koncoan — Mie nya Anak Muda"
      className={className}
      preload={priority}
      sizes="(max-width: 768px) 160px, 240px"
    />
  );
}
