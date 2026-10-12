import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import PreorderDialog from "./PreorderDialog";

const BADGE_BG = {
  red: "bg-[#C1272D] text-white",
  black: "bg-[#171717] text-white",
  cream: "bg-[#F4F1EC] text-black",
  grey: "bg-[#D9D7D2] text-black",
};

export default function ProductCard({ product }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col bg-vitrine border border-white/10">
      {product.image_url ? (
        <div className="aspect-[3/4] border-b border-white/10 bg-black overflow-hidden">
          <img src={product.image_url} alt={product.title} loading="lazy" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`aspect-[3/4] flex items-end p-5 border-b border-white/10 ${BADGE_BG[product.badge_color || "red"]}`}>
          <span className="font-heading text-xl font-bold leading-tight">{product.title}</span>
        </div>
      )}
      {product.image_url && <p className="px-5 pt-4 font-heading text-lg font-bold leading-tight text-white">{product.title}</p>}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs uppercase tracking-widest text-brass">
          {lang === "am" ? product.category_am : product.category_en}
        </p>
        <p className="mt-2 text-sm text-white/60 leading-relaxed flex-1">{product.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-white">{product.price_label}</span>
          <button
            onClick={() => setOpen(true)}
            className="text-xs uppercase tracking-widest bg-[#C1272D] text-white px-4 py-2 hover:bg-brass hover:text-black transition-colors"
          >
            Գնել
          </button>
        </div>
      </div>
      <PreorderDialog open={open} onOpenChange={setOpen} productTitle={product.title} />
    </div>
  );
}