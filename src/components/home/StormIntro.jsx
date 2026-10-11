import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { content } from "@/api/content";
import { useLanguage } from "@/lib/LanguageContext";
import { ARCHIVE_CATEGORIES } from "@/lib/taxonomy";

// Homepage intro: the Փոթորիկ storm pulls the archive into a whirlwind,
// then lays every fragment down in its category.
//
// To use an AI-generated background clip, put it in public/video/ and set
// HERO_VIDEO (e.g. "/video/hero.mp4"). Until then the still photo is used.
const HERO_VIDEO = null;
const HERO_POSTER = "/images/9d85d5882_generated_7226d19c.jpg";

// Loose fragments that swirl in the storm and fade once order returns.
const DEBRIS = ["1890", "1895", "1897", "1904", "1905", "1915", "1918", "1920", "Սասուն", "Վան", "Զէյթուն", "Խանասոր", "Մուշ", "Կարս"];

// Timeline (ms from start)
const STORM_AT = 700;
const ORDER_AT = 4300;
const DONE_AT = 6400;
const SEEN_KEY = "potoreek-intro-seen";

function shouldSkipIntro() {
  if (typeof window === "undefined") return true;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // storage unavailable; the intro just plays again next time
  }
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Archive photos are full-size Blogger images; tiles only need a small crop.
const thumb = (url) =>
  /^https?:/.test(url) ? `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=480&h=280&fit=cover&output=webp` : url;

// Give the display fonts a moment so the logo appears in its real typeface,
// but never hold the intro back for long.
const fontsReady = () =>
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((resolve) => setTimeout(resolve, 600))]);

// Centre of an element's untransformed layout box, in the stage's coordinates.
function layoutCenter(el, stage) {
  let x = el.offsetWidth / 2;
  let y = el.offsetHeight / 2;
  for (let node = el; node && node !== stage; node = node.offsetParent) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  return { x, y };
}

// Centre of the part of the stage that is on screen, and the storm's radius.
function stageCenter(stage) {
  const rect = stage.getBoundingClientRect();
  const visibleTop = Math.max(0, -rect.top);
  const visibleHeight = Math.max(0, Math.min(stage.clientHeight - visibleTop, window.innerHeight - Math.max(rect.top, 0)));
  return {
    cx: stage.clientWidth / 2,
    cy: visibleTop + visibleHeight / 2,
    radius: Math.min(stage.clientWidth, visibleHeight) * 0.42,
  };
}

export default function StormIntro() {
  const { lang } = useLanguage();
  const [run, setRun] = useState(() => (shouldSkipIntro() ? 0 : 1));
  const [phase, setPhase] = useState(() => (run > 0 ? "calm" : "done"));
  const [tiles, setTiles] = useState(() => ARCHIVE_CATEGORIES.map((c) => ({ ...c, count: null, image: null })));

  const stageRef = useRef(null);
  const logoRef = useRef(null);
  const tileRefs = useRef([]);
  const debrisRefs = useRef([]);
  const rafRef = useRef(0);
  const timersRef = useRef([]);

  // Category counts and one archive photo per category.
  useEffect(() => {
    Promise.all([content.Story.list("-created_date"), content.Poem.list()]).then(([stories, poems]) => {
      const byCategory = {};
      for (const s of stories) {
        const entry = (byCategory[s.category_en] ||= { count: 0, image: null });
        entry.count += 1;
        if (!entry.image && s.image_url) entry.image = s.image_url;
      }
      setTiles(
        ARCHIVE_CATEGORIES.map((c) => {
          const entry = byCategory[c.en] || { count: 0, image: null };
          return c.en === "Poems" ? { ...c, count: poems.length + entry.count, image: entry.image } : { ...c, ...entry };
        })
      );
    });
  }, []);

  const clearTimers = () => {
    cancelAnimationFrame(rafRef.current);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const resetInlineStyles = () => {
    [logoRef.current, ...tileRefs.current].forEach((el) => {
      if (!el) return;
      el.style.transition = "";
      el.style.transform = "";
    });
  };

  const finish = () => {
    clearTimers();
    resetInlineStyles();
    setPhase("done");
    markSeen();
  };

  // The storm: everything orbits the logo, then settles into the grid.
  useEffect(() => {
    if (run === 0) return undefined;
    let cancelled = false;
    fontsReady().then(() => {
      if (!cancelled) startStorm();
    });
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [run]);

  const startStorm = () => {
    const stage = stageRef.current;
    const logo = logoRef.current;
    if (!stage || !logo) return;

    const rand = (min, max) => min + Math.random() * (max - min);
    const orbiters = [
      ...tileRefs.current.map((el) => ({ el, scale: 0.5, ring: [0.55, 1.0] })),
      ...debrisRefs.current.map((el) => ({ el, scale: 1, ring: [0.35, 1.15] })),
    ]
      .filter((o) => o.el)
      .map((o) => ({
        ...o,
        angle: rand(0, Math.PI * 2),
        ring: rand(o.ring[0], o.ring[1]),
        speed: rand(0.7, 1.5) * (Math.random() < 0.8 ? 1 : -1),
        spin: rand(-40, 40),
        spinSpeed: rand(-90, 90),
      }));
    logo.style.transition = "none";

    // Layout is read every frame (offsets ignore transforms), so late-loading
    // styles or fonts can't leave the storm off-centre.
    const start = performance.now();
    const frame = (now) => {
      const t = (now - start) / 1000;
      const { cx, cy, radius } = stageCenter(stage);
      const inflow = easeOut(Math.min(1, t / 1.8));

      const l = layoutCenter(logo, stage);
      logo.style.transform = `translate(${cx - l.x}px, ${cy - l.y}px) scale(1.5)`;

      for (const o of orbiters) {
        const p = layoutCenter(o.el, stage);
        const a = o.angle + o.speed * t;
        const r = radius * o.ring * (1 + (1 - inflow) * 1.8);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.6;
        o.el.style.transform = `translate(${x - p.x}px, ${y - p.y}px) rotate(${o.spin + o.spinSpeed * t}deg) scale(${o.scale})`;
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    timersRef.current = [
      setTimeout(() => setPhase("storm"), STORM_AT),
      setTimeout(() => {
        cancelAnimationFrame(rafRef.current);
        tileRefs.current.forEach((el, i) => {
          if (!el) return;
          el.style.transition = `transform 1.2s cubic-bezier(0.2, 0.9, 0.25, 1) ${i * 70}ms`;
          el.style.transform = "";
        });
        logo.style.transition = "transform 1.3s cubic-bezier(0.2, 0.9, 0.25, 1)";
        logo.style.transform = "";
        setPhase("order");
      }, ORDER_AT),
      setTimeout(finish, DONE_AT),
    ];
  };

  const replay = () => {
    resetInlineStyles();
    setPhase("calm");
    setRun((r) => r + 1);
  };

  const animating = phase !== "done";
  const L = (am, en) => (lang === "am" ? am : en);

  return (
    <section
      ref={stageRef}
      className="relative overflow-hidden bg-vitrine text-white min-h-[calc(100svh-4.5rem)] flex flex-col"
      onClick={animating ? finish : undefined}
    >
      {/* Backdrop: AI clip if provided, otherwise the still photo, plus mountain ridges and fog */}
      {HERO_VIDEO ? (
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-45"
          src={HERO_VIDEO}
          poster={HERO_POSTER}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : (
        <img src={HERO_POSTER} alt="" aria-hidden="true" className="storm-kenburns absolute inset-0 w-full h-full object-cover opacity-30" />
      )}
      <svg className="storm-ridges absolute bottom-0 left-0 h-[45%] w-[200%]" viewBox="0 0 2400 400" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 260 L120 190 L230 240 L380 120 L520 230 L640 170 L780 250 L900 140 L1060 230 L1200 260 L1320 190 L1430 240 L1580 120 L1720 230 L1840 170 L1980 250 L2100 140 L2260 230 L2400 260 L2400 400 L0 400 Z" fill="#2a2321" opacity="0.55" />
        <path d="M0 310 L160 250 L300 300 L420 230 L600 310 L760 260 L900 320 L1040 250 L1200 310 L1360 250 L1500 300 L1620 230 L1800 310 L1960 260 L2100 320 L2240 250 L2400 310 L2400 400 L0 400 Z" fill="#1c1716" opacity="0.8" />
        <path d="M0 350 L200 320 L380 355 L560 315 L760 360 L980 325 L1200 350 L1400 320 L1580 355 L1760 315 L1960 360 L2180 325 L2400 350 L2400 400 L0 400 Z" fill="#141110" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-vitrine via-vitrine/40 to-vitrine/70" aria-hidden="true" />
      <div className="storm-fog absolute inset-0" aria-hidden="true" />
      {phase === "storm" && <div className="storm-flash absolute inset-0 pointer-events-none" aria-hidden="true" />}

      {/* Storm debris */}
      {animating &&
        DEBRIS.map((word, i) => (
          <span
            key={word}
            ref={(el) => (debrisRefs.current[i] = el)}
            aria-hidden="true"
            className={`absolute left-1/2 top-1/2 font-mono text-xs md:text-sm tracking-widest pointer-events-none transition-opacity duration-700 ${
              i % 3 === 0 ? "text-[#C1272D]" : "text-brass"
            } ${phase === "storm" ? "opacity-80" : "opacity-0"}`}
          >
            {word}
          </span>
        ))}

      <div className="relative z-10 max-w-6xl w-full mx-auto px-6 pt-14 pb-10 md:pt-20 flex-1 flex flex-col items-center text-center">
        <h1
          ref={logoRef}
          className={`font-black text-[#C1272D] text-5xl sm:text-6xl md:text-8xl leading-none [font-family:'Braind_Street',_sans-serif] ${
            phase === "storm" ? "storm-logo" : ""
          }`}
        >
          Փոթորիկ
        </h1>
        <div className={`transition-opacity duration-700 ${animating && phase !== "order" ? "opacity-0" : "opacity-100"}`}>
          <p className="mt-5 text-xl md:text-3xl text-white [font-family:'GHEA_Dvin',_sans-serif]">Հայ Ազատագրական Պայքարի Կենդանի Արխիւը</p>
          <p className="mt-3 text-white/60 text-xs md:text-sm tracking-[0.3em]">ԱՆՈՆՑ ԿԵԱՆՔԸ . ԵՐԳԸ . ԿՌԻՒԸ . ԵՐԿԻՐԸ</p>
        </div>

        <nav aria-label={L("Արխիւի բաժիններ", "Archive sections")} className="mt-10 w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {tiles.map((c, i) => (
            <Link
              key={c.en}
              ref={(el) => (tileRefs.current[i] = el)}
              to={c.en === "Poems" ? "/poems" : `/stories?category=${encodeURIComponent(c.en)}`}
              className={`group relative h-24 md:h-28 overflow-hidden border border-white/15 bg-black/50 text-left transition-[opacity,border-color] duration-700 hover:border-[#C1272D] focus-visible:border-[#C1272D] ${
                phase === "calm" ? "opacity-0" : "opacity-100"
              }`}
            >
              {c.image && (
                <img
                  src={thumb(c.image)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-35 grayscale group-hover:opacity-55 group-hover:grayscale-0 transition duration-500"
                />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <span className="relative h-full flex flex-col justify-end p-3">
                <span className="font-heading font-bold text-[13px] sm:text-sm md:text-base leading-tight [overflow-wrap:anywhere] group-hover:text-[#C1272D] transition-colors">
                  {lang === "am" ? c.am : c.en}
                </span>
                <span className="mt-1 flex items-baseline justify-between gap-2 text-[10px] md:text-xs uppercase tracking-widest text-white/50">
                  <span>{lang === "am" ? c.en : c.am}</span>
                  {c.count > 0 && <span className="font-mono text-brass">{c.count}</span>}
                </span>
              </span>
            </Link>
          ))}
        </nav>

        <div className={`mt-8 flex flex-wrap justify-center gap-3 transition-opacity duration-700 ${animating && phase !== "order" ? "opacity-0" : "opacity-100"}`}>
          <Link to="/stories" className="bg-[#C1272D] text-white px-6 py-3 text-sm uppercase tracking-widest hover:bg-brass hover:text-black transition-colors">
            Կարդալ պատմութիւնները
          </Link>
          <Link to="/map" className="border border-white/30 text-white px-6 py-3 text-sm uppercase tracking-widest hover:border-brass hover:text-brass transition-colors">
            {L("Քարտէս", "Map")}
          </Link>
          <Link to="/shop" className="border border-white/30 text-white px-6 py-3 text-sm uppercase tracking-widest hover:border-brass hover:text-brass transition-colors">
            {L("Խանութ", "Visit the shop")}
          </Link>
        </div>
      </div>

      {animating ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            finish();
          }}
          className="absolute z-20 bottom-4 right-4 min-h-[44px] px-4 font-mono text-[11px] uppercase tracking-widest text-white/70 border border-white/20 bg-black/40 hover:text-white hover:border-white/50"
        >
          {L("Բաց թողնել", "Skip intro")}
        </button>
      ) : (
        <button
          type="button"
          onClick={replay}
          aria-label={L("Կրկնել ներածութիւնը", "Replay intro")}
          className="absolute z-20 bottom-4 right-4 w-11 h-11 flex items-center justify-center text-white/50 border border-white/15 bg-black/30 hover:text-white hover:border-white/50"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}
    </section>
  );
}
