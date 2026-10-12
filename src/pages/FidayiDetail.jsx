import React, { Suspense, lazy, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Box, ScanFace } from "lucide-react";
import { content } from "@/api/content";
import { useLanguage } from "@/lib/LanguageContext";
import { REGIONS } from "@/lib/regions";
import { Image } from "@/components/ui/image";
import StoryCard from "@/components/shared/StoryCard";
import ProductCard from "@/components/shared/ProductCard";
import { lifespan } from "@/pages/Fidayis";

// three.js only loads if the visitor opens the hologram or the 3D relief.
const HoloPortrait = lazy(() => import("@/components/shared/HoloPortrait"));
const ModelViewer = lazy(() => import("@/components/shared/ModelViewer"));

const hasHtml = (s) => /<[a-z][\s\S]*>/i.test(s || "");

export default function FidayiDetail() {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const L = (am, en) => (lang === "am" ? am : en);
  const [f, setF] = useState(undefined);
  const [stories, setStories] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [poems, setPoems] = useState([]);
  const [products, setProducts] = useState([]);
  const [view, setView] = useState("photo"); // photo | hologram | relief
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setF(undefined);
    setView("photo");
    content.Fidayi.findBy("slug", slug)
      .then(async (rec) => {
        setF(rec);
        if (!rec) return;
        const [allStories, allQuotes, allPoems, allProducts] = await Promise.all([
          content.Story.list(),
          content.Quote.list(),
          content.Poem.list(),
          content.Product.list(),
        ]);
        const pick = (rows, ids) => (ids || []).map((id) => rows.find((r) => r.id === id)).filter(Boolean);
        setStories(pick(allStories, rec.story_ids));
        setQuotes(pick(allQuotes, rec.quote_ids));
        setPoems(pick(allPoems, rec.poem_ids));
        setProducts(allProducts.filter((p) => p.fidayi_id === rec.id));
      })
      .catch(() => setF(null));
  }, [slug]);

  if (f === undefined) return <p className="max-w-5xl mx-auto px-6 py-20 text-black/50">Loading…</p>;
  if (f === null)
    return (
      <div className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-black/60">{L("Այս թղթապանակը չգտնուեցաւ։", "This file could not be found.")}</p>
        <Link to="/fidayis" className="underline mt-4 inline-block">
          {L("Բոլոր ֆէտայիները", "All fedayi")}
        </Link>
      </div>
    );

  const name = lang === "am" ? f.name_am : f.name_en;
  const otherName = lang === "am" ? f.name_en : f.name_am;
  const aliases = lang === "am" ? f.aliases_am : f.aliases_en;
  const region = REGIONS.find((r) => r.key === f.region);
  const bio = (lang === "am" ? f.bio_am : f.bio_en) || f.bio_en || f.bio_am;
  const birthPlace = lang === "am" ? f.birth_place_am || f.birth_place_en : f.birth_place_en || f.birth_place_am;
  const deathPlace = lang === "am" ? f.death_place_am || f.death_place_en : f.death_place_en || f.death_place_am;
  const merch = (f.merch || []).filter((m) => m.url);

  return (
    <article>
      {/* Personal file header */}
      <section className="bg-vitrine text-white border-b border-brass/20">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 items-start">
          <div>
            <div className="relative aspect-[3/4] bg-black border border-white/15 overflow-hidden scanlines">
              <span className="corner-bracket corner-tl" />
              <span className="corner-bracket corner-tr" />
              <span className="corner-bracket corner-bl" />
              <span className="corner-bracket corner-br" />
              {view === "photo" &&
                (f.portrait_url ? (
                  <Image src={f.portrait_url} alt={name} fittingType="fill" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-heading text-8xl text-[#C1272D]/40">Փ</div>
                ))}
              {view === "hologram" && (
                <Suspense fallback={null}>
                  <HoloPortrait imageUrl={f.portrait_url} name={name} year={lifespan(f)} />
                </Suspense>
              )}
              {view === "relief" && (
                <Suspense fallback={null}>
                  <ModelViewer url={f.model_url} />
                </Suspense>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={L("Դիտում", "View")}>
              {[
                { id: "photo", label: L("Լուսանկար", "Photo") },
                { id: "hologram", label: L("Հոլոգրամ", "Hologram"), icon: ScanFace },
                ...(f.model_url ? [{ id: "relief", label: L("3D քանդակ", "3D relief"), icon: Box }] : []),
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={view === v.id}
                  onClick={() => setView(v.id)}
                  className={`h-11 px-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest border transition-colors ${
                    view === v.id ? "bg-[#C1272D] border-[#C1272D] text-white" : "border-white/20 text-white/70 hover:border-[#C1272D]"
                  }`}
                >
                  {v.icon && <v.icon className="w-4 h-4" aria-hidden="true" />}
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Link to="/fidayis" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-white/60 hover:text-[#C1272D] min-h-[44px]">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {L("Բոլոր ֆէտայիները", "All fedayi")}
            </Link>
            <p className="font-mono text-[11px] uppercase tracking-widest text-brass mt-4">
              {L("ԱՆՁՆԱԿԱՆ ԹՂԹԱՊԱՆԱԿ", "PERSONAL FILE")} · {lifespan(f) || L("Տարեթուերը անյայտ", "Dates unknown")}
            </p>
            <h1 className="font-heading font-bold text-4xl md:text-6xl mt-2 leading-tight">{name}</h1>
            {otherName && <p className="text-white/60 text-lg mt-2">{otherName}</p>}
            {aliases?.length > 0 && (
              <p className="text-white/50 mt-2">
                {L("Յայտնի նաեւ որպէս", "Also known as")} {aliases.join(", ")}
              </p>
            )}
            <dl className="mt-6 grid grid-cols-2 gap-4 max-w-md">
              {birthPlace && <Fact label={L("Ծնած", "Born")} value={[f.birth_year, birthPlace].filter(Boolean).join(", ")} />}
              {deathPlace && <Fact label={L("Մահացած", "Died")} value={[f.death_year, deathPlace].filter(Boolean).join(", ")} />}
              {region && <Fact label={L("Շրջան", "Region")} value={lang === "am" ? region.am : region.en} />}
            </dl>
            {f.roles_en?.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {f.roles_en.map((r) => (
                  <li key={r} className="px-3 py-1 border border-brass/40 text-brass text-xs uppercase tracking-widest">
                    {r}
                  </li>
                ))}
              </ul>
            )}
            {bio &&
              (hasHtml(bio) ? (
                <div className="mt-8 text-white/80 leading-relaxed text-lg [&_p]:my-3 [&_a]:text-[#C1272D]" dangerouslySetInnerHTML={{ __html: bio }} />
              ) : (
                <p className="mt-8 text-white/80 leading-relaxed text-lg whitespace-pre-line">{bio}</p>
              ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-14 space-y-16">
        {f.timeline?.length > 0 && (
          <section>
            <h2 className="font-heading text-3xl font-bold">{L("Ժամանակագրութիւն", "Timeline")}</h2>
            <ol className="mt-6 border-l-2 border-[#C1272D] pl-6 space-y-5">
              {f.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-[#C1272D] border-4 border-[#F4F1EC]" aria-hidden="true" />
                  <p className="font-mono text-sm text-[#C1272D] font-bold">{t.year}</p>
                  <p className="text-black/80">{(lang === "am" ? t.text_am : t.text_en) || t.text_en || t.text_am}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {f.card_front_url && (
          <section>
            <h2 className="font-heading text-3xl font-bold">{L("Հաւաքական քարտ", "Trading card")}</h2>
            <p className="text-black/60 mt-2 text-sm">{L("Սեղմեք՝ շրջելու համար։", "Tap the card to turn it over.")}</p>
            <button type="button" onClick={() => setFlipped((v) => !v)} className="mt-5 block w-64 aspect-[5/7] [perspective:1200px]" aria-label={L("Շրջել քարտը", "Turn the card over")}>
              <span className={`relative block w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
                <img src={f.card_front_url} alt={`${name} — card front`} className="absolute inset-0 w-full h-full object-cover shadow-2xl [backface-visibility:hidden]" />
                {f.card_back_url && (
                  <img src={f.card_back_url} alt={`${name} — card back`} className="absolute inset-0 w-full h-full object-cover shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]" />
                )}
              </span>
            </button>
          </section>
        )}

        {f.gallery?.length > 0 && (
          <section>
            <h2 className="font-heading text-3xl font-bold">{L("Լուսանկարներ", "Photographs")}</h2>
            <ul className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {f.gallery.filter((g) => g.url).map((g, i) => (
                <li key={i}>
                  <figure>
                    <div className="aspect-[4/3] bg-black overflow-hidden">
                      <Image src={g.url} alt={g.caption || name} fittingType="fill" className="w-full h-full" />
                    </div>
                    {g.caption && <figcaption className="mt-2 text-sm text-black/60">{g.caption}</figcaption>}
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}

        {stories.length > 0 && (
          <section>
            <h2 className="font-heading text-3xl font-bold">{L("Պատմութիւններ", "Stories")}</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-10">
              {stories.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          </section>
        )}

        {quotes.length > 0 && (
          <section>
            <h2 className="font-heading text-3xl font-bold">{L("Խօսքեր", "In his own words")}</h2>
            <ul className="mt-6 grid md:grid-cols-2 gap-6">
              {quotes.map((q) => (
                <li key={q.id} className="border-l-4 border-[#C1272D] pl-5">
                  <p className="font-heading text-xl leading-snug">«{q.text_am}»</p>
                  {q.text_en && <p className="mt-2 text-black/60 italic">{q.text_en}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {poems.length > 0 && (
          <section>
            <h2 className="font-heading text-3xl font-bold">{L("Երգեր եւ բանաստեղծութիւններ", "Songs and poems")}</h2>
            <ul className="mt-6 space-y-4">
              {poems.map((p) => (
                <li key={p.id}>
                  <Link to="/poems" className="font-heading text-xl font-bold hover:text-[#C1272D]">
                    {lang === "am" ? p.title_am : p.title_en}
                  </Link>
                  <p className="text-sm text-black/50">{lang === "am" ? p.author_am : p.author_en}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(products.length > 0 || merch.length > 0) && (
          <section>
            <h2 className="font-heading text-3xl font-bold">{L("Յուշանուէրներ", "Merchandise")}</h2>
            {products.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            {products.length === 0 && (
              <ul className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {merch.map((m, i) => (
                  <li key={i}>
                    <img src={m.url} alt={m.title || m.kind} loading="lazy" className="w-full aspect-square object-cover bg-black" />
                    <p className="mt-2 text-sm text-black/60">{m.title || m.kind}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {f.sources?.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl font-bold">{L("Աղբիւրներ", "Sources")}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {f.sources.map((s, i) => (
                <li key={i}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer" className="underline hover:text-[#C1272D]">
                      {s.label || s.url}
                    </a>
                  ) : (
                    s.label
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-white/40">{label}</dt>
      <dd className="mt-1 text-white">{value}</dd>
    </div>
  );
}
