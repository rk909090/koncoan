import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { MenuSection } from "@/components/site/MenuSection";
import { Highlights } from "@/components/site/Highlights";
import { HowToOrder } from "@/components/site/HowToOrder";
import { Visit } from "@/components/site/Visit";
import { Footer } from "@/components/site/Footer";
import { CartBar } from "@/components/cart/CartBar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <div className="relative z-10 -rotate-2 scale-105">
          <Marquee
            className="bg-lemon"
            items={["Konco Biasa", "Konco Akrab", "Konco Spesial", "Cwiee Mie", "Wonton Chili Oil", "Wonton Kuah Pedas"]}
          />
        </div>
        <div className="relative z-0 mt-[-6px] rotate-1 scale-105">
          <Marquee
            reverse
            className="bg-grape text-white"
            items={["Konco Fresh Drink", "Soda Gembira", "Palm Sugar Coffee Milk", "Choco Freeze", "Dimsum Mix", "Gohyong"]}
          />
        </div>
        <MenuSection />
        <Highlights />
        <HowToOrder />
        <Visit />
      </main>
      <Footer />
      <CartBar />
    </>
  );
}
