import React, { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp } from "lucide-react";
import { useCommand } from "./store";

const SITE = "src/config/site.json";
const TAX = "src/config/taxonomy.json";
const fmt = (obj) => `${JSON.stringify(obj, null, 2)}\n`;

export default function SettingsRoom() {
  const { readConfig, stageFile, orders } = useCommand();
  const [site, setSite] = useState(null);
  const [tax, setTax] = useState(null);
  const [saved, setSaved] = useState({ site: "", tax: "" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    Promise.all([readConfig(SITE), readConfig(TAX)]).then(([s, t]) => {
      setSite(s);
      setTax(t);
      setSaved({ site: fmt(s), tax: fmt(t) });
    });
    // reload when these files are staged or dispatched
  }, [orders.files[SITE], orders.files[TAX]]);

  if (!site || !tax) return <p className="cc-paper px-6 py-5 cc-type">Opening the settings ledger…</p>;

  const siteDirty = fmt(site) !== saved.site;
  const taxDirty = fmt(tax) !== saved.tax;

  const seal = () => {
    const notes = [];
    if (siteDirty) {
      const mode = site.underConstruction ? "coming-soon mode" : "full site open";
      stageFile(SITE, { content: fmt(site) }, `Site settings (${mode})`);
      notes.push("site settings");
    }
    if (taxDirty) {
      stageFile(TAX, { content: fmt(tax) }, "Category lists");
      notes.push("category lists");
    }
    setNotice(notes.length ? `Sealed ${notes.join(" and ")}. Dispatch from Orders to apply them.` : "Nothing changed.");
  };

  const setLinks = (links) => setSite({ ...site, socialLinks: links });
  const setList = (name, list) => setTax({ ...tax, [name]: list });

  return (
    <div className="space-y-5">
      <section className="cc-paper px-5 sm:px-8 py-6">
        <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b]">ԿԱՆՈՆԱԴՐՈՒԹԻՒՆ · STANDING ORDERS</p>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl mt-1">Կարգաւորումներ · Settings</h1>

        <fieldset className="mt-6">
          <legend className="cc-label">Site mode</legend>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { value: true, title: "Coming soon", text: "Visitors see the landing page with the film and the launch sign-up." },
              { value: false, title: "Open", text: "The full archive is public, starting with the intro." },
            ].map((o) => (
              <label key={String(o.value)} className={`cc-paper-2 border px-4 py-3 flex gap-3 cursor-pointer ${site.underConstruction === o.value ? "border-[#a3161f] border-2" : "cc-rule"}`}>
                <input type="radio" name="mode" className="mt-1 w-4 h-4 accent-[#a3161f]" checked={site.underConstruction === o.value} onChange={() => setSite({ ...site, underConstruction: o.value })} />
                <span>
                  <span className="block font-heading font-bold">{o.title}</span>
                  <span className="block text-sm text-[#3d3227]">{o.text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-5 flex items-center gap-3 min-h-[44px]">
          <input type="checkbox" className="w-5 h-5 accent-[#a3161f]" checked={site.introFilm} onChange={(e) => setSite({ ...site, introFilm: e.target.checked })} />
          <span>
            Play the opening film before the storm animation on the homepage
          </span>
        </label>

        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cs-am" className="cc-label">
              Coming-soon line (Armenian)
            </label>
            <input id="cs-am" className="cc-input" value={site.comingSoon.titleAm} onChange={(e) => setSite({ ...site, comingSoon: { ...site.comingSoon, titleAm: e.target.value } })} />
          </div>
          <div>
            <label htmlFor="cs-en" className="cc-label">
              Coming-soon line (English)
            </label>
            <input id="cs-en" className="cc-input" value={site.comingSoon.titleEn} onChange={(e) => setSite({ ...site, comingSoon: { ...site.comingSoon, titleEn: e.target.value } })} />
          </div>
        </div>

        <h2 className="mt-7 font-heading font-bold">Social links</h2>
        <ul className="mt-3 space-y-2">
          {site.socialLinks.map((l, i) => (
            <li key={i} className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 items-center">
              <input aria-label="Label" className="cc-input" value={l.label} onChange={(e) => setLinks(site.socialLinks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input aria-label="Link" type="url" className="cc-input" value={l.href} onChange={(e) => setLinks(site.socialLinks.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))} />
              <button type="button" className="cc-btn px-3" disabled={i === 0} aria-label="Move up" onClick={() => setLinks(swap(site.socialLinks, i, i - 1))}>
                <ArrowUp className="w-4 h-4" />
              </button>
              <button type="button" className="cc-btn px-3" aria-label="Remove link" onClick={() => setLinks(site.socialLinks.filter((_, j) => j !== i))}>
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="cc-btn mt-3" onClick={() => setLinks([...site.socialLinks, { label: "", href: "https://" }])}>
          <Plus className="w-4 h-4" aria-hidden="true" /> Add link
        </button>
      </section>

      <section className="cc-paper px-5 sm:px-8 py-6">
        <h2 className="font-heading font-bold text-xl">Բաժիններ · Category lists</h2>
        <p className="mt-2 text-sm text-[#3d3227] max-w-2xl">
          These feed the homepage category tiles, story filters and quote subjects. Renaming an English name does not rename it on
          existing records, so update those records too, for example by exporting, editing and importing.
        </p>
        <div className="mt-5 grid lg:grid-cols-2 gap-6">
          <PairList title="Archive categories" list={tax.archiveCategories} onChange={(l) => setList("archiveCategories", l)} />
          <PairList title="Quote subjects" list={tax.quoteSubjects} onChange={(l) => setList("quoteSubjects", l)} />
        </div>
      </section>

      <div className="cc-paper px-5 sm:px-8 py-5 flex flex-wrap items-center gap-4 sticky bottom-3">
        <button type="button" className="cc-btn cc-btn-red" onClick={seal} disabled={!siteDirty && !taxDirty}>
          Կնքել · Seal settings
        </button>
        <span className="text-sm text-[#3d3227]" role="status">
          {notice || (siteDirty || taxDirty ? "You have unsealed changes." : "Settings match what's on file.")}
        </span>
      </div>
    </div>
  );
}

function swap(list, a, b) {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

function PairList({ title, list, onChange }) {
  return (
    <div>
      <h3 className="cc-label">{title}</h3>
      <ul className="space-y-2">
        {list.map((item, i) => (
          <li key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input aria-label={`${title} ${i + 1}, Armenian`} className="cc-input" value={item.am} onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, am: e.target.value } : x)))} />
            <input aria-label={`${title} ${i + 1}, English`} className="cc-input" value={item.en} onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))} />
            <button type="button" className="cc-btn px-3" aria-label="Remove" onClick={() => onChange(list.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="cc-btn mt-3" onClick={() => onChange([...list, { am: "", en: "" }])}>
        <Plus className="w-4 h-4" aria-hidden="true" /> Add
      </button>
    </div>
  );
}
