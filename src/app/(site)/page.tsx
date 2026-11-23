import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { MenuSection } from "@/components/site/MenuSection";
import { Highlights } from "@/components/site/Highlights";
import { HowToOrder } from "@/components/site/HowToOrder";
import { Visit } from "@/components/site/Visit";
import { Footer } from "@/components/site/Footer";
import { CartBar } from "@/components/cart/CartBar";
import { Faq } from "@/components/site/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqLd, getFaqs, menuLd } from "@/lib/seo";
import { getPublicMenu } from "@/lib/server/menu";
import { getPublicOrdering } from "@/lib/server/settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [menu, ordering] = await Promise.all([getPublicMenu(), getPublicOrdering()]);
  const faqs = getFaqs(menu, ordering);
  const names = (cat: string) => menu.filter((m) => m.category === cat).map((m) => m.name);
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <div className="relative z-10 -rotate-2 scale-105">
          <Marquee
            className="bg-lemon"
            items={names("mie").slice(0, 6)}
          />
        </div>
        <div className="relative z-0 mt-[-6px] rotate-1 scale-105">
          <Marquee
            reverse
            className="bg-grape text-white"
            items={["Konco Fresh Drink", ...names("minuman").slice(-3).reverse(), ...names("pendamping").slice(-2).reverse()]}
          />
        </div>
        <MenuSection />
        <Highlights />
        <HowToOrder />
        <Faq faqs={faqs} />
        <Visit />
      </main>
      <Footer />
      <CartBar />
      <JsonLd data={[menuLd(menu), faqLd(faqs)]} />
    </>
  );
}
