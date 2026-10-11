import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { ARCHIVE_CATEGORIES as CATS } from "@/lib/taxonomy";

export default function ArchiveNav() {
  const { lang } = useLanguage();
  return (
    <section className="max-w-7xl mx-auto px-6 py-14 border-t border-b border-black/10">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-heading text-2xl font-bold">Բաժիններ</h2>
        <span className="text-sm text-black/50">Browse the archive</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATS.map((c) => (
          <Link
            key={c.en}
            to={c.en === "Poems" ? "/poems" : `/stories?category=${encodeURIComponent(c.en)}`}
            className="group flex flex-col gap-3 border border-black/15 bg-white/40 p-4 hover:border-[#C1272D] transition-colors"
          >
            <span className="font-heading font-bold group-hover:text-[#C1272D] transition-colors">
              {lang === "am" ? c.am : c.en}
            </span>
            <span className="text-xs uppercase tracking-widest text-black/40 border-t border-black/10 pt-2">
              {lang === "am" ? c.en : c.am}
            </span>
          </Link>
        ))}
        <Link
          to="/map"
          className="group flex flex-col gap-3 border border-black/15 bg-white/40 p-4 hover:border-[#C1272D] transition-colors md:col-start-1"
        >
          <span className="font-heading font-bold group-hover:text-[#C1272D] transition-colors">
            Քարտէս
          </span>
          <span className="text-xs uppercase tracking-widest text-black/40 border-t border-black/10 pt-2">
            MAP
          </span>
        </Link>
      </div>
    </section>
  );
}