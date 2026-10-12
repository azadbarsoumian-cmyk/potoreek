import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const NAV = [
{ am: "Պատմութիւններ", en: "Stories", to: "/stories" },
{ am: "Ֆէտայիներ", en: "Fedayi", to: "/fidayis" },
{ am: "Քարտէս", en: "Map", to: "/map" },
{ am: "Բանաստեղծութիւններ", en: "Poems", to: "/poems" },
{ am: "Քաղվածքներ", en: "Quotes", to: "/quotes" },
{ am: "Տեսանիւթեր", en: "Videos", to: "/videos" },
{ am: "Լուրեր", en: "News", to: "/news" },
{ am: "Բլոգ", en: "Blog", to: "/blog" },
{ am: "Խանութ", en: "Shop", to: "/shop" }];


export default function Header() {
  const { lang, setLang } = useLanguage();
  return (
    <header className="sticky top-0 z-40 bg-vitrine/95 backdrop-blur border-b border-brass/25">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-heading font-bold text-[#C1272D]">Փ</span>
          <span className="font-bold tracking-tight text-white [font-family:'Braind_Street',_sans-serif] text-xl">Փոթորիկ</span>
        </Link>
        <nav className="hidden md:flex items-center gap-2 xl:gap-8">
          {NAV.map((item) =>
          <Link
            key={item.to}
            to={item.to}
            className="text-sm uppercase tracking-wider text-white/70 hover:text-[#C1272D] transition-colors">
            
              {lang === "am" ? item.am : item.en}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-white/20 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setLang("am")}
              className={`px-3 py-1.5 transition-colors ${lang === "am" ? "bg-brass text-black" : "text-white/60"}`}>
              
              Հայ
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 transition-colors ${lang === "en" ? "bg-brass text-black" : "text-white/60"}`}>
              
              EN
            </button>
          </div>
          <Link to="/shop" aria-label="Shop" className="p-2 rounded-full border border-white/20 text-white/80 hover:border-[#C1272D] hover:text-[#C1272D] transition-colors">
            <ShoppingBag className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>);

}