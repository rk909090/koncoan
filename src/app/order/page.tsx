import type { Metadata } from "next";
import { OrderApp } from "@/components/order/OrderApp";
import { CartBar } from "@/components/cart/CartBar";

export const metadata: Metadata = {
  title: "Order",
  description: "Pilih menu Mie Koncoan dan kirim pesanan langsung via WhatsApp.",
};

export default function OrderPage() {
  return (
    <>
      <OrderApp />
      <CartBar />
    </>
  );
}
