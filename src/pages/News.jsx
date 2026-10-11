import React, { useEffect, useState } from "react";
import { content } from "@/api/content";
import { useLanguage } from "@/lib/LanguageContext";

export default function News() {
  const { lang } = useLanguage();
  const [news, setNews] = useState(null);

  useEffect(() => {
    content.NewsItem.list("-created_date").then(setNews);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-heading text-5xl font-bold">Լուրեր</h1>
      {!news && <p className="mt-10 text-black/50">Loading...</p>}
      <div className="divide-y divide-black/10 mt-10">
        {news && news.map((n) => (
          <div key={n.id} className="py-6">
            <p className="text-xs uppercase tracking-widest text-[#C1272D]">{lang === "am" ? n.type_am : n.type_en} · {n.date}</p>
            <p className="mt-2 text-xl font-medium">{n.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}