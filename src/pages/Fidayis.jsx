import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { content } from "@/api/content";
import { useLanguage } from "@/lib/LanguageContext";
import { REGIONS } from "@/lib/regions";
import { Image } from "@/components/ui/image";

export const lifespan = (f) => (f.birth_year || f.death_year ? `${f.birth_year || "?"}–${f.death_year || "?"}` : "");
const regionLabel = (key, lang) => {
  const r = REGIONS.find((x) => x.key === key);
  return r ? (lang === "am" ? r.am : r.en) : key;
};

export default function Fidayis() {
  const { lang } = useLanguage();
  const [list, setList] = useState(null);
  const [region, setRegion] = useState("");
  const [query, setQuery] = useState("");
  const L = (am, en) => (lang === "am" ? am : en);

  useEffect(() => {
    content.Fidayi.list().then(setList).catch(() => setList([]));
  }, []);

  const shown = useMemo(() => {
    if (!list) return [];
    const q = query.trim().toLowerCase();
    return list
      .filter((f) => !region || f.region === region)
      .filter((f) => !q || [f.name_am, f.name_en, ...(f.aliases_am || []), ...(f.aliases_en || [])].some((n) => String(n || "").toLowerCase().includes(q)))
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || String(a.birth_year || 9999).localeCompare(String(b.birth_year || 9999)));
  }, [list, region, query]);

  const regions = useMemo(() => [...new Set((list || []).map((f) => f.region).filter(Boolean))], [list]);

  return (
    <div className="bg-vitrine text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-brass">{L("ԱՐԽԻՒ · ԱՆՁՆԱԿԱՆ ԹՂԹԱՊԱՆԱԿՆԵՐ", "ARCHIVE · PERSONAL FILES")}</p>
        <h1 className="font-heading text-5xl font-bold mt-2">Ֆէտայիներ</h1>
        <p className="text-white/60 mt-3 max-w-xl">
          {L("Ազատագրական պայքարի մարդիկ՝ իրենց պատմութիւններով։", "The people of the liberation struggle, each with their own file.")}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="fd-search">
            {L("Որոնել", "Search")}
          </label>
          <input
            id="fd-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={L("Որոնել անունով…", "Search by name…")}
            className="h-11 px-4 bg-black/40 border border-white/20 text-white placeholder:text-white/40 min-w-[240px]"
          />
          {regions.length > 1 && (
            <>
              <label className="sr-only" htmlFor="fd-region">
                {L("Շրջան", "Region")}
              </label>
              <select id="fd-region" value={region} onChange={(e) => setRegion(e.target.value)} className="h-11 px-3 bg-black/40 border border-white/20 text-white">
                <option value="">{L("Բոլոր շրջանները", "All regions")}</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {regionLabel(r, lang)}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {!list && <p className="mt-10 text-white/50">Loading…</p>}
        {list && shown.length === 0 && <p className="mt-10 text-white/50">{L("Դեռ ոչ մէկ անձնական թղթապանակ։", "No personal files yet.")}</p>}
        <ul className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {shown.map((f) => (
            <li key={f.id}>
              <Link to={`/fidayi/${f.slug}`} className="group block border border-white/10 bg-black/30 hover:border-[#C1272D] transition-colors">
                <div className="aspect-[3/4] bg-black overflow-hidden">
                  {f.portrait_url ? (
                    <Image src={f.portrait_url} alt={f.name_en} fittingType="fill" className="w-full h-full grayscale group-hover:grayscale-0 transition duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-heading text-6xl text-[#C1272D]/40">Փ</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-heading font-bold text-lg leading-tight group-hover:text-[#C1272D] transition-colors">{lang === "am" ? f.name_am : f.name_en}</p>
                  <p className="text-xs text-white/50 mt-1">{lang === "am" ? f.name_en : f.name_am}</p>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-brass mt-2">
                    {[lifespan(f), f.region && regionLabel(f.region, lang)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
