import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, UserPlus, Link2, Unlink } from "lucide-react";
import { useCommand } from "./store";
import { collectionByKey } from "./collections";

const norm = (s) => String(s || "").toLowerCase().normalize("NFC");
const namesOf = (f) =>
  [f.name_am, f.name_en, ...(f.aliases_am || []), ...(f.aliases_en || [])]
    .map((n) => norm(n).trim())
    .filter((n) => n.length >= 3);
const textOf = (row, fields) => norm(fields.map((f) => row[f] || "").join(" \n "));

// Fedayi editor: find stories, quotes and poems that mention this person.
export function ArchiveCollector({ record, onChange }) {
  const { loadCollection, rowsFor } = useCommand();
  const [results, setResults] = useState(null);
  const [chosen, setChosen] = useState({});

  const search = async () => {
    await Promise.all(["stories", "quotes", "poems"].map((k) => loadCollection(k)));
    const names = namesOf(record);
    const scan = (key, fields, strongFields) =>
      (rowsFor(key) || [])
        .map((r) => {
          const text = textOf(r, fields);
          const hit = names.find((n) => text.includes(n));
          if (!hit) return null;
          return { row: r, strong: names.some((n) => textOf(r, strongFields).includes(n)) };
        })
        .filter(Boolean)
        .sort((a, b) => Number(b.strong) - Number(a.strong));
    const found = {
      stories: scan("stories", ["title_am", "title_en", "excerpt_en"], ["title_am", "title_en"]),
      quotes: scan("quotes", ["author_am", "author_en", "text_am", "text_en"], ["author_am", "author_en"]),
      poems: scan("poems", ["title_am", "title_en", "author_am", "author_en", "excerpt_am", "excerpt_en"], ["title_am", "title_en"]),
    };
    setResults(found);
    const pre = {};
    for (const [k, list] of Object.entries(found)) for (const m of list) if (m.strong) pre[`${k}:${m.row.id}`] = true;
    setChosen(pre);
  };

  const field = { stories: "story_ids", quotes: "quote_ids", poems: "poem_ids" };
  const link = () => {
    const next = { ...record };
    for (const [k, f] of Object.entries(field)) {
      const add = Object.keys(chosen).filter((c) => chosen[c] && c.startsWith(`${k}:`)).map((c) => c.split(":")[1]);
      next[f] = [...new Set([...(record[f] || []), ...add])];
    }
    onChange(next);
    setResults(null);
  };

  const names = namesOf(record);
  return (
    <section className="sm:col-span-2 mt-4 border-2 border-dashed border-[#5b4b3b]/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b]">ՀԱՒԱՔԻՉ · ARCHIVE COLLECTOR</p>
          <h2 className="font-heading font-bold text-xl mt-1">Gather this fedayi's file</h2>
          <p className="text-sm text-[#3d3227] mt-1 max-w-xl">
            Searches every story, quote and poem for {names.length ? "the names and aliases above" : "the names you enter above"}, so you can link them to this page.
          </p>
        </div>
        <button type="button" className="cc-btn" onClick={search} disabled={!names.length}>
          <Search className="w-4 h-4" aria-hidden="true" /> Search the archive
        </button>
      </div>
      {results && (
        <div className="mt-4 space-y-4">
          {Object.entries(results).map(([k, list]) => {
            const col = collectionByKey(k);
            const linked = new Set(record[field[k]] || []);
            return (
              <div key={k}>
                <h3 className="cc-label">
                  {col.en} · {list.length} found
                </h3>
                {list.length === 0 && <p className="text-sm text-[#5b4b3b]">Nothing found.</p>}
                <ul className="divide-y cc-rule border-y cc-rule">
                  {list.slice(0, 60).map(({ row, strong }) => {
                    const id = `${k}:${row.id}`;
                    return (
                      <li key={id} className="py-2 flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-[#a3161f]"
                          disabled={linked.has(row.id)}
                          checked={linked.has(row.id) || Boolean(chosen[id])}
                          onChange={(e) => setChosen((c) => ({ ...c, [id]: e.target.checked }))}
                          aria-label={`Link ${col.title(row)}`}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block truncate">{col.title(row)}</span>
                          <span className="block cc-type text-[11px] text-[#5b4b3b] truncate">{col.meta(row)}</span>
                        </span>
                        {linked.has(row.id) ? <span className="cc-stamp cc-stamp-green">Linked</span> : strong && <span className="cc-stamp cc-stamp-ink">Strong</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          <div className="flex gap-3">
            <button type="button" className="cc-btn cc-btn-red" onClick={link}>
              <Link2 className="w-4 h-4" aria-hidden="true" /> Link selected
            </button>
            <button type="button" className="cc-btn" onClick={() => setResults(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// Story editor: who is this story about? Link existing fedayi or recognize a new one.
export function StoryFidayiPanel({ storyId, record }) {
  const { loadCollection, rowsFor, getRecord, saveRecord } = useCommand();
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");
  useEffect(() => {
    loadCollection("fidayis");
  }, []);
  const fidayis = rowsFor("fidayis") || [];
  const text = useMemo(() => norm([record.title_am, record.title_en, record.excerpt_en, String(record.content_en || "").slice(0, 6000)].join(" ")), [record]);
  const linked = fidayis.filter((f) => (f.story_ids || []).includes(storyId));
  const suggested = fidayis.filter((f) => !linked.includes(f) && namesOf(f).some((n) => text.includes(n)));

  const toggle = async (f, on) => {
    setBusy(f.id);
    const full = await getRecord("fidayis", f.id);
    const ids = new Set(full.story_ids || []);
    on ? ids.add(storyId) : ids.delete(storyId);
    saveRecord("fidayis", { ...full, story_ids: [...ids] });
    setBusy("");
  };

  return (
    <section className={`sm:col-span-2 mt-2 p-5 border-2 ${record.published ? "border-[#a3161f]" : "border-dashed border-[#5b4b3b]/50"}`}>
      <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b]">ԱՆՁԵՐ · PEOPLE IN THIS STORY</p>
      <h2 className="font-heading font-bold text-xl mt-1">Which fedayi is this story about?</h2>
      {record.published && <p className="text-sm text-[#a3161f] mt-1">This story is going online — link the fedayi it belongs to, or recognize a new one.</p>}
      {storyId === "new" && <p className="text-sm text-[#5b4b3b] mt-2">Seal the story first, then reopen it to link people.</p>}

      {storyId !== "new" && (
        <>
          {linked.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {linked.map((f) => (
                <li key={f.id} className="cc-paper-2 border cc-rule pl-3 pr-1 py-1 flex items-center gap-2">
                  <Link to={`/admin/c/fidayis/${f.id}`} className="font-bold hover:text-[#a3161f]">
                    {f.name_am || f.name_en}
                  </Link>
                  <button type="button" className="w-9 h-9 flex items-center justify-center hover:text-[#a3161f]" disabled={busy === f.id} onClick={() => toggle(f, false)} aria-label={`Unlink ${f.name_en}`}>
                    <Unlink className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {suggested.length > 0 && (
            <>
              <h3 className="cc-label mt-4">Mentioned in the text</h3>
              <ul className="flex flex-wrap gap-2">
                {suggested.map((f) => (
                  <li key={f.id}>
                    <button type="button" className="cc-btn" disabled={busy === f.id} onClick={() => toggle(f, true)}>
                      <Link2 className="w-4 h-4" aria-hidden="true" /> {f.name_am || f.name_en}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {linked.length === 0 && suggested.length === 0 && <p className="text-sm text-[#5b4b3b] mt-3">No fedayi from the registry are mentioned yet.</p>}
          <button type="button" className="cc-btn cc-btn-red mt-4" onClick={() => navigate(`/admin/c/fidayis/new?fromStory=${storyId}`)}>
            <UserPlus className="w-4 h-4" aria-hidden="true" /> Recognize a new fedayi from this story
          </button>
        </>
      )}
    </section>
  );
}
