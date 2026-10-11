import React, { useEffect, useState } from "react";
import { content } from "@/api/content";
import StoryCard from "@/components/shared/StoryCard";
import PulsingMap from "@/components/map/PulsingMap";
import SectorPanel from "@/components/map/SectorPanel";
import { useLanguage } from "@/lib/LanguageContext";
import { REGIONS } from "@/lib/regions";

const PAGE_SIZE = 12;

export default function ArchiveMap() {
  const { lang } = useLanguage();
  const [regionCounts, setRegionCounts] = useState(null);
  const [decades, setDecades] = useState([]);
  const [selected, setSelected] = useState(null);
  const [decade, setDecade] = useState(null);
  const [stories, setStories] = useState(null);
  const [cursor, setCursor] = useState(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toISOString().slice(11, 19) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([
      content.Story.aggregate({ groupBy: "region_en" }),
      content.Story.aggregate({ groupBy: "year" }),
    ]).then(([rc, yc]) => {
      const counts = {};
      rc.rows.forEach((r) => { counts[r.region_en] = r.count; });
      setRegionCounts(counts);
      const byDecade = {};
      yc.rows.forEach((r) => {
        const y = String(r.year || "");
        if (/^\d{4}$/.test(y)) {
          const d = y.slice(0, 3) + "0";
          byDecade[d] = (byDecade[d] || 0) + r.count;
        }
      });
      setDecades(Object.entries(byDecade).sort((a, b) => a[0].localeCompare(b[0])));
    });
  }, []);

  useEffect(() => {
    const q = {};
    if (selected) q.region_en = selected;
    if (decade) q.year = { $gte: decade, $lt: String(Number(decade) + 10) };
    content.Story.filter(q, { sort: "-created_date", limit: PAGE_SIZE }).then((p) => {
      setStories(p.items);
      setCursor(p.next_cursor);
      setHasMore(p.has_more);
    });
  }, [selected, decade]);

  const buildQuery = () => {
    const q = {};
    if (selected) q.region_en = selected;
    if (decade) q.year = { $gte: decade, $lt: String(Number(decade) + 10) };
    return q;
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const next = await content.Story.filter(buildQuery(), { sort: "-created_date", limit: PAGE_SIZE, cursor });
    setStories((prev) => [...prev, ...next.items]);
    setCursor(next.next_cursor);
    setHasMore(next.has_more);
    setLoadingMore(false);
  };

  const total = regionCounts ? Object.values(regionCounts).reduce((a, b) => a + b, 0) : 0;
  const online = regionCounts ? Object.values(regionCounts).filter((c) => c > 0).length : 0;
  const mapRegions = REGIONS.map((r) => ({
    ...r,
    label: lang === "am" ? r.am : r.en,
    count: regionCounts ? regionCounts[r.key] || 0 : 0,
  }));
  const activeRegion = mapRegions.find((r) => r.key === selected);
  const L = (am, en) => (lang === "am" ? am : en);

  return (
    <section className="bg-vitrine text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Status strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border border-white/15 bg-black/40 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#C1272D] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C1272D]" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-brass">
              ՖԷՏԱՒԱՅԻ ԱՐԽԻՒ · COMMAND
            </span>
          </div>
          <span className="font-mono text-[11px] text-white/40">
            {activeRegion
              ? `${(activeRegion.lat || 0).toFixed(2)}N / ${(activeRegion.lng || 0).toFixed(2)}E`
              : "39.60N / 43.20E"}
            {" · "}
            {clock}
          </span>
        </div>

        {/* Readouts */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { k: L("ԱՐՁԱՆԱԳՐՈՒԹԻՒՆ", "RECORDS"), v: total },
            { k: L("ԳՈՐԾԱՕՐԾ ՄԻՈՒԹԻՒՆՆԵՐ", "SECTORS ONLINE"), v: online },
            {
              k: L("ԹԻՐԱԽ", "TARGET"),
              v: activeRegion ? (lang === "am" ? activeRegion.am : activeRegion.en) : L("ԲՈԼՈՐԸ", "ALL"),
            },
          ].map((s) => (
            <div key={s.k} className="border border-white/15 bg-black/40 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">{s.k}</p>
              <p className="font-heading font-bold text-2xl text-brass mt-1 truncate">{s.v}</p>
            </div>
          ))}
        </div>

        {/* Map + sector panel */}
        <div className="grid lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2">
            <div className="scanlines border border-white/15">
              <span className="corner-bracket corner-tl" />
              <span className="corner-bracket corner-tr" />
              <span className="corner-bracket corner-bl" />
              <span className="corner-bracket corner-br" />
              <PulsingMap regions={mapRegions} selected={selected} onSelect={setSelected} dark className="h-[560px] w-full z-0" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 mt-2">
              {lang === "am"
                ? "Սեղմեք միութիւն մը՝ թիրախաւորելու համար։"
                : "Select a sector marker to target it. Filter by decade on the timeline."}
            </p>
          </div>
          <SectorPanel
            regions={mapRegions}
            selected={selected}
            onSelect={setSelected}
            labels={{ title: L("ՄԻՈՒԹԻՒՆՆԵՐ", "SECTORS") }}
          />
        </div>

        {/* Timeline */}
        {decades.length > 0 && (
          <div className="mt-4 border border-white/15 bg-black/40 px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-brass">
              {L("ԺԱՄԱՆԱԿԱԳԻՐ", "TIMELINE")}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setDecade(null)}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest border transition-colors ${
                  !decade
                    ? "bg-[#C1272D] text-white border-[#C1272D]"
                    : "border-white/20 text-white/60 hover:border-[#C1272D] hover:text-[#C1272D]"
                }`}
              >
                {L("ԲՈԼՈՐԸ", "ALL")}
              </button>
              {decades.map(([d, count]) => (
                <button
                  key={d}
                  onClick={() => setDecade(decade === d ? null : d)}
                  className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest border transition-colors ${
                    decade === d
                      ? "bg-[#C1272D] text-white border-[#C1272D]"
                      : "border-white/20 text-white/60 hover:border-[#C1272D] hover:text-[#C1272D]"
                  }`}
                >
                  {d}s · {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active files */}
        <div className="mt-10">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/15" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-brass">
              {L("ԲԱՑՈՒԱԾ ԹՂԹԱՅԹԻՒՆՆԵՐ", "ACTIVE FILES")}
            </span>
            <span className="h-px flex-1 bg-white/15" />
          </div>

          {!stories && <p className="mt-10 font-mono text-sm text-white/40">Loading…</p>}
          {stories && stories.length === 0 && (
            <p className="mt-10 font-mono text-sm text-white/40">
              {lang === "am"
                ? "Այս միութեան մէջ պատմութիւններ չկան։"
                : "No records match this sector and timeline."}
            </p>
          )}

          <div className="grid md:grid-cols-3 gap-8 mt-8">
            {stories && stories.map((s) => <StoryCard key={s.id} story={s} dark />)}
          </div>

          {stories && hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-10 w-full border border-white/20 py-3 font-mono text-xs uppercase tracking-widest text-white/70 hover:border-[#C1272D] hover:text-[#C1272D] transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : L("ԱՒԵԼԻՆ · LOAD MORE", "LOAD MORE")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}