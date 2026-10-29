import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw } from "lucide-react";
import { useCommand } from "./store";
import bundled from "@/config/design.json";
import { DRAFT_KEY, FONT_CHOICES } from "@/lib/design";

const FILE = "src/config/design.json";
const fmt = (obj) => `${JSON.stringify(obj, null, 2)}\n`;

const COLORS = [
  { key: "primary", label: "Brand red (buttons, links, highlights)" },
  { key: "background", label: "Page background" },
  { key: "foreground", label: "Text" },
  { key: "muted", label: "Soft panels & lines" },
  { key: "vitrine", label: "Header & dark sections" },
  { key: "brass", label: "Brass accents" },
];
const SECTIONS = {
  intro: "Opening film & storm intro",
  stories: "Featured stories",
  videosNews: "Videos & news",
  shop: "Shop preview",
  blogNewsletter: "Blog & newsletter sign-up",
};
const NAV = {
  "/stories": "Stories", "/fidayis": "Fedayi", "/map": "Map", "/poems": "Poems", "/quotes": "Quotes",
  "/videos": "Videos", "/news": "News", "/blog": "Blog", "/shop": "Shop",
};
const PRESETS = {
  "Potoreek (original)": bundled.colors,
  "Night archive": { primary: "#d33a3a", background: "#1b1816", foreground: "#efe6d8", muted: "#3a332d", vitrine: "#0e0c0b", brass: "#c4a46b" },
  Parchment: { primary: "#8c1c13", background: "#f4ead5", foreground: "#2b2118", muted: "#e2d3b5", vitrine: "#2b2118", brass: "#9a7b45" },
  Tricolour: { primary: "#d90012", background: "#f6f6f4", foreground: "#111111", muted: "#dfe3ea", vitrine: "#0033a0", brass: "#f2a800" },
};
const PAGES = { Homepage: "/", Stories: "/stories", Fedayi: "/fidayis", Shop: "/shop" };

function OrderList({ items, labels, idKey, onChange }) {
  const move = (i, step) => {
    const next = [...items];
    [next[i], next[i + step]] = [next[i + step], next[i]];
    onChange(next);
  };
  return (
    <ul className="divide-y cc-rule border-y cc-rule">
      {items.map((it, i) => (
        <li key={it[idKey]} className={`py-1.5 flex items-center gap-2 ${it.visible === false ? "opacity-50" : ""}`}>
          <span className="flex-1 text-sm">{labels[it[idKey]] || it[idKey]}</span>
          <button type="button" className="cc-btn px-2" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
            <ArrowUp className="w-4 h-4" />
          </button>
          <button type="button" className="cc-btn px-2" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="cc-btn px-2"
            onClick={() => onChange(items.map((x, k) => (k === i ? { ...x, visible: x.visible === false } : x)))}
            aria-label={it.visible === false ? "Show" : "Hide"}
          >
            {it.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

// Design room: colours, fonts, corners, homepage sections and the menu, with a live preview.
export default function DesignRoom() {
  const { readConfig, stageFile, orders } = useCommand();
  const [d, setD] = useState(null);
  const [saved, setSaved] = useState("");
  const [page, setPage] = useState("/");
  const [notice, setNotice] = useState("");
  const frame = useRef(null);

  useEffect(() => {
    readConfig(FILE)
      .catch(() => bundled)
      .then((x) => {
        const v = { ...bundled, ...(x || {}) };
        setD(v);
        setSaved(fmt(v));
      });
  }, [orders.files[FILE]]);

  // Hand the draft to the preview frame (same origin) and reload it.
  useEffect(() => {
    if (!d) return undefined;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      } catch {
        // the preview needs storage; saving still works
      }
      if (frame.current) frame.current.src = `${page}?preview=on&designPreview=1&t=${Date.now()}`;
    }, 400);
    return () => clearTimeout(t);
  }, [d, page]);

  if (!d) return <p className="cc-paper px-6 py-5 cc-type">Unrolling the drawings…</p>;
  const dirty = fmt(d) !== saved;
  const set = (patch) => setD({ ...d, ...patch });

  const seal = () => {
    stageFile(FILE, { content: fmt(d) }, "Site design");
    setSaved(fmt(d));
    setNotice("Design sealed. Dispatch from Orders to publish it.");
  };

  return (
    <div className="grid xl:grid-cols-[420px_1fr] gap-5 items-start">
      <section className="cc-paper px-5 sm:px-6 py-6 space-y-6">
        <div>
          <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b]">ՃԱՐՏԱՐԱՊԵՏՈՒԹԻՒՆ · DRAWING ROOM</p>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl mt-1">Ձեւաւորում · Design</h1>
          <p className="mt-2 text-sm text-[#3d3227]">Change the site's look and layout. The preview updates as you go; seal and dispatch to publish.</p>
        </div>

        <fieldset>
          <legend className="cc-label">Colour presets</legend>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([name, colors]) => (
              <button key={name} type="button" className="cc-btn text-xs" onClick={() => set({ colors: { ...colors } })}>
                <span className="inline-flex mr-1">
                  {["primary", "vitrine", "background"].map((k) => (
                    <span key={k} className="w-3 h-3 border border-black/30" style={{ background: colors[k] }} />
                  ))}
                </span>
                {name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="cc-label">Colours</legend>
          {COLORS.map((c) => (
            <label key={c.key} className="flex items-center gap-3 text-sm">
              <input
                type="color"
                value={d.colors[c.key]}
                onChange={(e) => set({ colors: { ...d.colors, [c.key]: e.target.value } })}
                className="w-10 h-8 border cc-rule bg-transparent cursor-pointer"
              />
              <span className="flex-1">{c.label}</span>
              <code className="cc-type text-xs">{d.colors[c.key]}</code>
            </label>
          ))}
        </fieldset>

        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="cc-label col-span-2">Fonts</legend>
          {[["heading", "Headings"], ["body", "Text"]].map(([k, label]) => (
            <label key={k} className="text-sm">
              {label}
              <select className="cc-input mt-1" value={d.fonts[k]} onChange={(e) => set({ fonts: { ...d.fonts, [k]: e.target.value } })}>
                {Object.keys(FONT_CHOICES).map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>

        <label className="block text-sm">
          <span className="cc-label">Corners · {d.radius}px</span>
          <input type="range" min="0" max="20" value={d.radius} onChange={(e) => set({ radius: Number(e.target.value) })} className="w-full accent-[#a3161f]" />
        </label>

        <fieldset>
          <legend className="cc-label">Homepage sections (order & visibility)</legend>
          <OrderList items={d.homeSections} labels={SECTIONS} idKey="key" onChange={(homeSections) => set({ homeSections })} />
        </fieldset>

        <fieldset>
          <legend className="cc-label">Top menu (order & visibility)</legend>
          <OrderList items={d.nav} labels={NAV} idKey="to" onChange={(nav) => set({ nav })} />
        </fieldset>

        {notice && (
          <p className="text-sm text-[#2f5a32]" role="status">
            {notice}
          </p>
        )}
        <div className="flex flex-wrap gap-3 pt-4 border-t cc-rule">
          <button type="button" className="cc-btn cc-btn-red" disabled={!dirty} onClick={seal}>
            Կնքել · Seal design
          </button>
          <button type="button" className="cc-btn" disabled={!dirty} onClick={() => setD(JSON.parse(saved))}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Undo changes
          </button>
          <button type="button" className="cc-btn" onClick={() => setD(JSON.parse(fmt(bundled)))}>
            Original design
          </button>
        </div>
      </section>

      <section className="cc-paper p-3 sm:p-4 xl:sticky xl:top-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="cc-label m-0">Live preview</span>
          <span className="flex-1" />
          {Object.entries(PAGES).map(([name, path]) => (
            <button key={path} type="button" className={`cc-btn text-xs ${page === path ? "cc-btn-red" : ""}`} onClick={() => setPage(path)}>
              {name}
            </button>
          ))}
        </div>
        <iframe ref={frame} title="Site preview" className="w-full h-[75vh] border cc-rule bg-white" />
      </section>
    </div>
  );
}
