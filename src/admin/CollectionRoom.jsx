import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Search, Download, Upload, Trash2, Undo2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { useCommand } from "./store";
import { collectionByKey } from "./collections";
import { downloadFile, parseCsv, toCsv } from "./format";
import { SITE_URL } from "./config";

const PAGE = 40;

export default function CollectionRoom() {
  const { key } = useParams();
  const col = collectionByKey(key);
  const { loadCollection, rowsFor, orders, pending, deleteRecord, revertRecord, importRecords, patchRecords } = useCommand();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [onlyPending, setOnlyPending] = useState(false);
  const [sort, setSort] = useState("newest");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState(() => new Set());
  const [importPreview, setImportPreview] = useState(null);
  const [notice, setNotice] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (col) loadCollection(key);
    setQuery("");
    setFilter("");
    setVisibility("all");
    setSelected(new Set());
    setLimit(PAGE);
  }, [key]);

  const rows = col ? rowsFor(key) : null;
  const op = orders.ops[key] || { upserts: {}, patches: {}, deletes: [] };
  const statusById = useMemo(() => Object.fromEntries(pending.filter((p) => p.key === key).map((p) => [p.id, p.kind])), [pending, key]);

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (filter && r[col.filters?.[0]?.field] !== filter) return false;
      if (visibility === "online" && !r.published) return false;
      if (visibility === "hidden" && r.published) return false;
      if (onlyPending && !statusById[r.id]) return false;
      if (!q) return true;
      return col.search.some((f) => String(Array.isArray(r[f]) ? r[f].join(" ") : r[f] ?? "").toLowerCase().includes(q));
    });
    list = [...list].sort((a, b) => {
      if (sort === "title") return String(col.title(a)).localeCompare(String(col.title(b)), "hy");
      const da = a.created_date || "", db = b.created_date || "";
      return sort === "oldest" ? da.localeCompare(db) : db.localeCompare(da);
    });
    return list;
  }, [rows, query, filter, visibility, onlyPending, sort, statusById, col]);

  if (!col) return <p className="cc-paper px-6 py-5">Unknown room.</p>;

  const removed = op.deletes.length;
  const onlineCount = rows ? rows.filter((r) => r.published).length : 0;

  const exportJson = () => downloadFile(`${key}.json`, JSON.stringify(rows, null, 2), "application/json");
  const exportCsv = () => {
    const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    downloadFile(`${key}.csv`, "﻿" + toCsv(rows, cols), "text/csv");
  };

  const toggle = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const shownIds = visible.slice(0, limit).map((r) => r.id);
  const allShownSelected = shownIds.length > 0 && shownIds.every((id) => selected.has(id));
  const selectShown = () => setSelected((s) => (allShownSelected ? new Set([...s].filter((id) => !shownIds.includes(id))) : new Set([...s, ...shownIds])));
  const selectAllMatching = () => setSelected(new Set(visible.map((r) => r.id)));

  const bulk = (published) => {
    patchRecords(key, [...selected], { published });
    setNotice(`${selected.size} record${selected.size === 1 ? "" : "s"} will be ${published ? "put online" : "hidden"} at the next dispatch.`);
    setSelected(new Set());
  };

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const records = file.name.toLowerCase().endsWith(".csv") ? parseCsv(text) : JSON.parse(text);
      if (!Array.isArray(records)) throw new Error("The file must contain a list of records.");
      const known = new Set((rows || []).map((r) => r.id));
      const updates = records.filter((r) => r.id && known.has(r.id)).length;
      setImportPreview({ name: file.name, records, updates, adds: records.length - updates });
    } catch (err) {
      setNotice(`Could not read ${file.name}: ${err.message}`);
    }
  };

  const confirmImport = () => {
    const { added, updated } = importRecords(key, importPreview.records);
    setNotice(`Queued ${added} new and ${updated} updated records. New records stay hidden unless the file marks them published. Dispatch them from Orders.`);
    setImportPreview(null);
  };

  return (
    <div className="cc-paper px-5 sm:px-7 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b]">ԹՂԹԱՊԱՆԱԿ · FILE DRAWER</p>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl mt-1">{col.am}</h1>
          <p className="cc-type text-sm text-[#5b4b3b]">
            {col.en} · {rows ? `${rows.length} records · ${onlineCount} online · ${rows.length - onlineCount} hidden` : "…"}
            {removed > 0 && <span className="text-[#a3161f]"> · {removed} marked for removal</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/admin/c/${key}/new`} className="cc-btn cc-btn-red">
            <Plus className="w-4 h-4" aria-hidden="true" /> New record
          </Link>
          <button type="button" className="cc-btn" onClick={() => fileRef.current?.click()} disabled={!rows}>
            <Upload className="w-4 h-4" aria-hidden="true" /> Import
          </button>
          <input ref={fileRef} type="file" accept=".json,.csv,application/json,text/csv" className="hidden" onChange={onImportFile} />
          <button type="button" className="cc-btn" onClick={exportCsv} disabled={!rows}>
            <Download className="w-4 h-4" aria-hidden="true" /> CSV
          </button>
          <button type="button" className="cc-btn" onClick={exportJson} disabled={!rows}>
            <Download className="w-4 h-4" aria-hidden="true" /> JSON
          </button>
        </div>
      </div>

      {notice && (
        <p className="mt-4 cc-paper-2 border cc-rule px-4 py-2 text-sm" role="status">
          {notice}
        </p>
      )}

      {importPreview && (
        <div className="mt-4 border-2 border-[#a3161f] px-4 py-3 bg-[#f7f0de]">
          <p className="text-sm">
            <b>{importPreview.name}</b>: {importPreview.adds} new records and {importPreview.updates} updates to existing ones (matched by id).
            {col.detailDir && " Include the full-text column to import body text."}
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="cc-btn cc-btn-red" onClick={confirmImport}>
              Queue import
            </button>
            <button type="button" className="cc-btn" onClick={() => setImportPreview(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label htmlFor="cc-search" className="cc-label">
            Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5b4b3b]" aria-hidden="true" />
            <input id="cc-search" className="cc-input cc-input-icon" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="Title, name, year…" />
          </div>
        </div>
        <div>
          <label htmlFor="cc-vis" className="cc-label">
            Visibility
          </label>
          <select id="cc-vis" className="cc-input" value={visibility} onChange={(e) => { setVisibility(e.target.value); setLimit(PAGE); }}>
            <option value="all">All</option>
            <option value="online">Online</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        {col.filters?.map((f) => (
          <div key={f.field}>
            <label htmlFor="cc-filter" className="cc-label">
              Filter
            </label>
            <select id="cc-filter" className="cc-input" value={filter} onChange={(e) => { setFilter(e.target.value); setLimit(PAGE); }}>
              <option value="">All</option>
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div>
          <label htmlFor="cc-sort" className="cc-label">
            Order
          </label>
          <select id="cc-sort" className="cc-input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">By title</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm min-h-[44px]">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} className="w-4 h-4 accent-[#a3161f]" />
          Changed only
        </label>
      </div>

      {!rows && <p className="mt-6 cc-type">Opening the drawer…</p>}
      {rows && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3 min-h-[44px]">
            <label className="flex items-center gap-2 text-sm min-h-[44px]">
              <input type="checkbox" checked={allShownSelected} onChange={selectShown} className="w-4 h-4 accent-[#a3161f]" />
              Select shown
            </label>
            <span className="cc-type text-xs text-[#5b4b3b]">
              {visible.length} shown{query || filter || onlyPending || visibility !== "all" ? ` of ${rows.length}` : ""}
            </span>
            {selected.size > 0 && (
              <>
                <span className="cc-type text-xs text-[#a3161f]">{selected.size} selected</span>
                {selected.size < visible.length && (
                  <button type="button" className="cc-link text-sm" onClick={selectAllMatching}>
                    Select all {visible.length}
                  </button>
                )}
                <span className="flex-1" />
                <button type="button" className="cc-btn" onClick={() => bulk(true)}>
                  <Eye className="w-4 h-4" aria-hidden="true" /> Put online
                </button>
                <button type="button" className="cc-btn" onClick={() => bulk(false)}>
                  <EyeOff className="w-4 h-4" aria-hidden="true" /> Hide
                </button>
                <button type="button" className="cc-link text-sm" onClick={() => setSelected(new Set())}>
                  Clear
                </button>
              </>
            )}
          </div>
          <ul className="mt-2 divide-y cc-rule border-y cc-rule">
            {visible.slice(0, limit).map((r) => {
              const status = statusById[r.id];
              const thumb = col.image?.(r);
              return (
                <li key={r.id} className="py-3 flex items-center gap-3">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="w-4 h-4 accent-[#a3161f] shrink-0" aria-label={`Select ${col.title(r)}`} />
                  {col.image && (
                    <span className="w-14 h-14 shrink-0 bg-[#1d1712]/10 overflow-hidden border cc-rule">
                      {thumb && <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover sepia-[.35]" />}
                    </span>
                  )}
                  <Link to={`/admin/c/${key}/${r.id}`} className="flex-1 min-w-0 group">
                    <span className={`block font-heading font-bold truncate group-hover:text-[#a3161f] ${r.published ? "" : "opacity-60"}`}>{col.title(r) || "(untitled)"}</span>
                    <span className="block cc-type text-xs text-[#5b4b3b] truncate">{col.meta(r) || r.id}</span>
                  </Link>
                  {status && <span className="cc-stamp cc-stamp-ink hidden sm:inline-block">{{ add: "New", edit: "Edited", publish: "Going online", hide: "Hiding" }[status] || "Changed"}</span>}
                  <span className={`cc-stamp hidden sm:inline-block ${r.published ? "cc-stamp-green" : ""}`}>{r.published ? "Online" : "Hidden"}</span>
                  {col.sitePath && r.published && (
                    <a href={`${SITE_URL}${col.sitePath(r)}`} target="_blank" rel="noreferrer" className="cc-btn px-3 hidden md:inline-flex" aria-label="View on the site">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {status ? (
                    <button type="button" className="cc-btn px-3" onClick={() => revertRecord(key, r.id)} aria-label="Undo changes to this record">
                      <Undo2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="cc-btn px-3"
                      aria-label="Remove this record"
                      onClick={() => window.confirm(`Delete "${col.title(r)}" permanently from the archive at the next dispatch? To take it off the site but keep it, use Hide instead.`) && deleteRecord(key, r.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {visible.length > limit && (
            <button type="button" className="cc-btn mt-4 w-full" onClick={() => setLimit((l) => l + PAGE)}>
              Show more ({visible.length - limit} left)
            </button>
          )}
          <DeletedList colKey={key} />
        </>
      )}
    </div>
  );
}

function DeletedList({ colKey }) {
  const { orders, revertRecord, source } = useCommand();
  const col = collectionByKey(colKey);
  const ids = orders.ops[colKey]?.deletes || [];
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!ids.length) return setRows([]);
    source.readJson(col.file).then((all) => setRows((all || []).filter((r) => ids.includes(r.id))));
  }, [ids.join(","), col.file, source]);
  if (!rows.length) return null;
  return (
    <div className="mt-6">
      <h2 className="font-heading font-bold">Marked for removal</h2>
      <ul className="mt-2 divide-y cc-rule border-y cc-rule">
        {rows.map((r) => (
          <li key={r.id} className="py-3 flex items-center gap-3">
            <span className="flex-1 min-w-0 truncate line-through decoration-[#a3161f]">{col.title(r)}</span>
            <span className="cc-stamp">To be removed</span>
            <button type="button" className="cc-btn px-3" onClick={() => revertRecord(colKey, r.id)} aria-label="Keep this record">
              <Undo2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
