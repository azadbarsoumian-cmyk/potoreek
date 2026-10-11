import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-vitrine text-center">
      <Image
        src="/images/9d85d5882_generated_7226d19c.jpg"
        alt="Fedayi fighters silhouetted on a mountain ridge"
        fittingType="fill"
        className="absolute inset-0 w-full h-full opacity-30" />
      
      <div className="absolute inset-0 bg-gradient-to-t from-vitrine via-vitrine/50 to-vitrine/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(176,141,87,0.16),transparent_65%)]" />
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-24 w-full">
        <h1 className="font-black text-[#C1272D] text-5xl sm:text-6xl md:text-8xl leading-none [font-family:'Braind_Street',_sans-serif]">Փոթորիկ</h1>
        <p className="mt-6 text-2xl md:text-3xl text-white [font-family:'GHEA_Dvin',_sans-serif] font-normal">Հայ Ազատագրական Պայքարի Կենդանի Արխիւը

        </p>
        <p className="mt-4 text-white/70 max-w-xl mx-auto leading-relaxed text-sm md:text-base">ԱՆՈՆՑ ԿԵԱՆՔԸ . ԵՐԳԸ . ԿՌԻՒԸ . ԵՐԿԻՐԸ

        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/stories" className="bg-[#C1272D] text-white px-6 py-3 text-sm uppercase tracking-widest hover:bg-brass hover:text-black transition-colors">
            Կարդալ պատմութիւնները
          </Link>
          <Link to="/shop" className="border border-white/30 text-white px-6 py-3 text-sm uppercase tracking-widest hover:border-brass hover:text-brass transition-colors">
            Visit the shop
          </Link>
        </div>
      </div>
    </section>);

}