import React, { useEffect, useState } from "react";
import { content } from "@/api/content";
import { useLanguage } from "@/lib/LanguageContext";

export default function Poems() {
  const { lang } = useLanguage();
  const [poems, setPoems] = useState(null);

  useEffect(() => {
    content.Poem.list("-created_date").then(setPoems);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="font-heading text-4xl md:text-5xl font-bold break-words">Բանաստեղծութիւններ</h1>
      <p className="text-black/60 mt-3">Poems and songs of the era — the verses the fighters carried with them.</p>
      {!poems && <p className="mt-10 text-black/50">Loading...</p>}
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 mt-12">
        {poems && poems.map((p) => (
          <article key={p.id} className="border-t-2 border-black/10 pt-6">
            <p className="text-xs uppercase tracking-widest text-[#C1272D]">{p.year}</p>
            <h2 className="font-heading text-2xl font-bold mt-1">{lang === "am" ? p.title_am : p.title_en}</h2>
            <p className="text-sm text-black/50 mt-1">{lang === "am" ? p.author_am : p.author_en}</p>
            <p className="mt-4 text-black/70 leading-relaxed">{lang === "am" ? (p.excerpt_am || p.excerpt_en) : p.excerpt_en}</p>
          </article>
        ))}
      </div>
    </div>
  );
}