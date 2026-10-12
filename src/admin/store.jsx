// Command Center state: what is loaded from GitHub, the orders (edits) waiting
// to be dispatched, and the dispatch itself (one commit for everything).
//
// Edits are kept as record-level operations, not whole files:
//   upserts  — full records saved from the editor (or imported)
//   patches  — a few fields changed on records not opened (e.g. bulk publish)
//   deletes  — records to remove
// At dispatch the latest files are re-read from GitHub and the operations
// replayed on top, so changes made elsewhere in the meantime are kept.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import siteConfig from "@/config/site.json";
import taxonomyConfig from "@/config/taxonomy.json";
import { COLLECTIONS, collectionByKey, indexRow } from "./collections";
import { cleanRecord, newId, serializeRows } from "./format";
import { versionUrl } from "./config";

const ORDERS_KEY = "potoreek-cc-orders";
const Ctx = createContext(null);
export const useCommand = () => useContext(Ctx);

const emptyOp = () => ({ upserts: {}, patches: {}, deletes: [] });
const isEmptyOp = (op) => !Object.keys(op.upserts).length && !Object.keys(op.patches).length && !op.deletes.length;

// Read-only demo source: the published files the running site already serves.
const BUNDLED = { "src/config/site.json": siteConfig, "src/config/taxonomy.json": taxonomyConfig };
const demoSource = {
  async readJson(path) {
    if (BUNDLED[path]) return structuredClone(BUNDLED[path]);
    if (!path.startsWith("content/")) return null;
    const res = await fetch(`/data/${path.slice("content/".length)}?t=${Date.now()}`);
    if (!res.ok) return null;
    const data = await res.json();
    const mark = (r) => ({ ...r, published: true }); // the site only serves published records
    return Array.isArray(data) ? data.map(mark) : mark(data);
  },
  async recentCommits() {
    return [];
  },
  async listDir() {
    return null; // not available without GitHub
  },
};

function loadSavedOrders() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(ORDERS_KEY) || "null");
    if (!saved?.ops || !saved?.files) return { ops: {}, files: {} };
    for (const op of Object.values(saved.ops)) op.patches ||= {};
    return saved;
  } catch {
    return { ops: {}, files: {} };
  }
}

export function CommandProvider({ github, demo, children }) {
  const source = demo ? demoSource : github;
  const [bases, setBases] = useState({}); // collection key -> rows as on GitHub
  const [orders, setOrders] = useState(loadSavedOrders); // { ops: {key: op}, files: {path: {...}} }
  const [dispatch, setDispatch] = useState(null); // { sha, at, status }
  const [ordersSaveFailed, setOrdersSaveFailed] = useState(false);
  const detailCache = useRef({});
  const loading = useRef({});

  // Keep orders across reloads (best effort; very large uploads may not fit).
  useEffect(() => {
    try {
      window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      setOrdersSaveFailed(false);
    } catch {
      setOrdersSaveFailed(true);
    }
  }, [orders]);

  const loadCollection = useCallback(
    async (key, { force = false } = {}) => {
      if (bases[key] && !force) return bases[key];
      if (!loading.current[key] || force) {
        const col = collectionByKey(key);
        loading.current[key] = source.readJson(col.file).then((rows) => {
          const list = rows || [];
          setBases((b) => ({ ...b, [key]: list }));
          return list;
        });
      }
      return loading.current[key];
    },
    [bases, source]
  );

  // Rows as they will look after dispatch (base + pending operations).
  const rowsFor = useCallback(
    (key) => {
      const base = bases[key];
      if (!base) return null;
      const col = collectionByKey(key);
      const op = orders.ops[key];
      if (!op) return base;
      const toRow = (r) => (col.detailDir ? indexRow(col, r) : r);
      const seen = new Set();
      const rows = [];
      for (const r of base) {
        seen.add(r.id);
        if (op.deletes.includes(r.id)) continue;
        if (op.upserts[r.id]) rows.push(toRow(op.upserts[r.id]));
        else if (op.patches[r.id]) rows.push({ ...r, ...op.patches[r.id] });
        else rows.push(r);
      }
      for (const [id, rec] of Object.entries(op.upserts)) if (!seen.has(id)) rows.push(toRow(rec));
      return rows;
    },
    [bases, orders]
  );

  const readDetail = useCallback(
    (col, id) => {
      const path = `${col.detailDir}/${id}.json`;
      if (!detailCache.current[path]) detailCache.current[path] = source.readJson(path);
      return detailCache.current[path];
    },
    [source]
  );

  // Full record (with detail fields for long-form collections).
  const getRecord = useCallback(
    async (key, id) => {
      const col = collectionByKey(key);
      const op = orders.ops[key];
      if (op?.upserts[id]) return structuredClone(op.upserts[id]);
      let rec = null;
      const rows = bases[key] || (await loadCollection(key));
      const row = rows.find((r) => r.id === id);
      if (col.detailDir) {
        const detail = await readDetail(col, id);
        rec = detail ? { ...row, ...detail } : row;
      } else rec = row;
      if (!rec) return null;
      return structuredClone({ ...rec, ...(op?.patches[id] || {}) });
    },
    [bases, orders, loadCollection, readDetail]
  );

  const updateOps = (key, fn) =>
    setOrders((o) => {
      const current = o.ops[key] || emptyOp();
      const next = fn({ upserts: { ...current.upserts }, patches: { ...current.patches }, deletes: [...current.deletes] });
      const ops = { ...o.ops };
      if (isEmptyOp(next)) delete ops[key];
      else ops[key] = next;
      return { ...o, ops };
    });

  const saveRecord = useCallback((key, record) => {
    const now = new Date().toISOString();
    const rec = cleanRecord({ ...record, id: record.id || newId(), created_date: record.created_date || now, updated_date: now });
    updateOps(key, (op) => {
      op.upserts[rec.id] = rec;
      delete op.patches[rec.id];
      op.deletes = op.deletes.filter((id) => id !== rec.id);
      return op;
    });
    return rec.id;
  }, []);

  // Change a few fields on many records without opening them (bulk publish/hide).
  const patchRecords = useCallback((key, ids, patch) => {
    updateOps(key, (op) => {
      for (const id of ids) {
        if (op.upserts[id]) op.upserts[id] = { ...op.upserts[id], ...patch };
        else op.patches[id] = { ...(op.patches[id] || {}), ...patch };
      }
      return op;
    });
  }, []);

  const deleteRecord = useCallback(
    (key, id) => {
      const inBase = (bases[key] || []).some((r) => r.id === id);
      updateOps(key, (op) => {
        delete op.upserts[id];
        delete op.patches[id];
        if (inBase && !op.deletes.includes(id)) op.deletes.push(id);
        return op;
      });
    },
    [bases]
  );

  const revertRecord = useCallback((key, id) => {
    updateOps(key, (op) => {
      delete op.upserts[id];
      delete op.patches[id];
      op.deletes = op.deletes.filter((d) => d !== id);
      return op;
    });
  }, []);

  // Bulk import: records with a known id update it, the rest are added (hidden).
  const importRecords = useCallback(
    (key, records) => {
      const known = new Set((bases[key] || []).map((r) => r.id));
      let added = 0, updated = 0;
      const now = new Date().toISOString();
      updateOps(key, (op) => {
        for (const raw of records) {
          const isKnown = raw.id && known.has(raw.id);
          const published = raw.published === true || raw.published === "true";
          const rec = cleanRecord({ ...raw, published, id: isKnown ? raw.id : newId(), created_date: raw.created_date || now, updated_date: now });
          op.upserts[rec.id] = rec;
          delete op.patches[rec.id];
          isKnown ? updated++ : added++;
        }
        return op;
      });
      return { added, updated };
    },
    [bases]
  );

  // Whole-file orders: settings files and media uploads.
  const stageFile = useCallback((path, change, note) => {
    setOrders((o) => ({ ...o, files: { ...o.files, [path]: { ...change, note } } }));
  }, []);
  const unstageFile = useCallback((path) => {
    setOrders((o) => {
      const files = { ...o.files };
      delete files[path];
      return { ...o, files };
    });
  }, []);

  const readConfig = useCallback(
    async (path) => {
      const staged = orders.files[path];
      if (staged?.content != null) return JSON.parse(staged.content);
      return source.readJson(path);
    },
    [orders, source]
  );

  // Human-readable list of pending orders.
  const pending = useMemo(() => {
    const lines = [];
    for (const [key, op] of Object.entries(orders.ops)) {
      const col = collectionByKey(key);
      const base = bases[key] || [];
      const baseIds = new Set(base.map((r) => r.id));
      const titleOf = (id, rec) => col.title(rec || base.find((r) => r.id === id) || {}) || id;
      for (const rec of Object.values(op.upserts)) {
        lines.push({ kind: baseIds.has(rec.id) ? "edit" : "add", key, id: rec.id, label: `${col.en}: ${titleOf(rec.id, rec)}` });
      }
      for (const [id, patch] of Object.entries(op.patches)) {
        const what = "published" in patch ? (patch.published ? "put online" : "hidden") : "updated";
        lines.push({ kind: patch.published === false ? "hide" : patch.published ? "publish" : "edit", key, id, label: `${col.en}: ${titleOf(id)} — ${what}` });
      }
      for (const id of op.deletes) lines.push({ kind: "delete", key, id, label: `${col.en}: ${titleOf(id)}` });
    }
    for (const [path, f] of Object.entries(orders.files)) lines.push({ kind: f.base64 != null ? "upload" : "settings", path, label: f.note || path });
    return lines;
  }, [orders, bases]);

  const discardAll = useCallback(() => setOrders({ ops: {}, files: {} }), []);

  // Watch the live site until it serves the dispatched commit.
  const watchDeploy = useCallback((sha) => {
    const url = versionUrl();
    if (!url) return; // running off-site: can't see the live build stamp
    const started = Date.now();
    const tick = async () => {
      try {
        const v = await fetch(`${url}?t=${Date.now()}`).then((r) => r.json());
        if (v.commit === sha) {
          setDispatch((d) => (d?.sha === sha ? { ...d, status: "live", liveAt: new Date().toISOString() } : d));
          return;
        }
      } catch {
        // keep waiting
      }
      if (Date.now() - started > 8 * 60 * 1000) {
        setDispatch((d) => (d?.sha === sha ? { ...d, status: "slow" } : d));
        return;
      }
      setTimeout(tick, 10000);
    };
    setTimeout(tick, 15000);
  }, []);

  const publish = useCallback(
    async (note) => {
      if (demo) throw new Error("Demo mode is read-only. Sign in with your GitHub key to dispatch.");
      const changes = [];
      const summary = [];
      for (const [key, op] of Object.entries(orders.ops)) {
        const col = collectionByKey(key);
        const latest = (await github.readJson(col.file)) || [];
        const latestIds = new Set(latest.map((r) => r.id));
        const toRow = (r) => (col.detailDir ? indexRow(col, r) : r);
        const rows = latest
          .filter((r) => !op.deletes.includes(r.id))
          .map((r) => (op.upserts[r.id] ? toRow(op.upserts[r.id]) : op.patches[r.id] ? { ...r, ...op.patches[r.id] } : r));
        for (const [id, rec] of Object.entries(op.upserts)) if (!latestIds.has(id)) rows.push(toRow(rec));
        changes.push({ path: col.file, content: serializeRows(rows) });

        if (col.detailDir) {
          for (const rec of Object.values(op.upserts)) changes.push({ path: `${col.detailDir}/${rec.id}.json`, content: JSON.stringify(rec) });
          for (const [id, patch] of Object.entries(op.patches)) {
            if (!latestIds.has(id)) continue;
            const detail = await github.readJson(`${col.detailDir}/${id}.json`);
            if (detail) changes.push({ path: `${col.detailDir}/${id}.json`, content: JSON.stringify({ ...detail, ...patch }) });
          }
          for (const id of op.deletes) if (latestIds.has(id)) changes.push({ path: `${col.detailDir}/${id}.json`, delete: true });
        }

        const adds = Object.keys(op.upserts).filter((id) => !latestIds.has(id)).length;
        const edits = Object.keys(op.upserts).length - adds;
        const patched = Object.values(op.patches);
        const online = patched.filter((p) => p.published === true).length;
        const hidden = patched.filter((p) => p.published === false).length;
        summary.push(
          [adds && `${adds} added`, edits && `${edits} edited`, online && `${online} put online`, hidden && `${hidden} hidden`, op.deletes.length && `${op.deletes.length} removed`]
            .filter(Boolean)
            .map((s) => `${col.en}: ${s}`)
            .join(", ")
        );
      }
      for (const [path, f] of Object.entries(orders.files)) {
        changes.push(f.base64 != null ? { path, base64: f.base64 } : { path, content: f.content });
        summary.push(f.note || path);
      }
      if (!changes.length) return null;

      const title = note?.trim() || `Command Center dispatch: ${summary.length} order${summary.length === 1 ? "" : "s"}`;
      const message = `${title}\n\n${summary.map((s) => `- ${s}`).join("\n")}\n\nDispatched from the Potoreek Command Center.`;
      const sha = await github.commitFiles(changes, message);

      detailCache.current = {};
      loading.current = {};
      setBases({});
      setOrders({ ops: {}, files: {} });
      setDispatch({ sha, at: new Date().toISOString(), status: "publishing", title });
      watchDeploy(sha);
      return sha;
    },
    [demo, github, orders, watchDeploy]
  );

  const value = {
    demo,
    github,
    source,
    collections: COLLECTIONS,
    loadCollection,
    rowsFor,
    getRecord,
    saveRecord,
    patchRecords,
    deleteRecord,
    revertRecord,
    importRecords,
    stageFile,
    unstageFile,
    readConfig,
    orders,
    pending,
    ordersSaveFailed,
    discardAll,
    publish,
    dispatch,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
