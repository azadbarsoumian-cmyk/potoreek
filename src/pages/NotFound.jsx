import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";

export default function NotFound() {
  const { lang } = useLanguage();
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <p className="font-heading text-7xl font-bold text-[#C1272D]">404</p>
      <h1 className="font-heading text-3xl font-bold mt-6">
        {lang === "am" ? "Էջը չգտնուեցաւ" : "Page not found"}
      </h1>
      <p className="text-black/60 mt-3">
        {lang === "am" ? "Այս հասցէով էջ չկայ։" : "There is no page at this address."}
      </p>
      <Link to="/" className="inline-block mt-8 bg-[#C1272D] text-white px-6 py-3 text-sm uppercase tracking-widest hover:bg-black transition-colors">
        {lang === "am" ? "Գլխաւոր էջ" : "Home"}
      </Link>
    </div>
  );
}
