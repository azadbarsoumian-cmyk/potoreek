// Command Center state: what is loaded from GitHub, the orders (edits) waiting
// to be dispatched, and the dispatch itself (one commit for everything).
//
// Edits are kept as record-level operations, not whole files. At dispatch the
// latest files are re-read from GitHub and the operations replayed on top, so
// changes made elsewhere in the meantime are not overwritten.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import siteConfig from "@/config/site.json";
import taxonomyConfig from "@/config/taxonomy.json";
import { COLLECTIONS, collectionByKey, indexRow } from "./collections";
import { cleanRecord, newId, serializeRows } from "./format";
import { versionUrl } from "./config";

const ORDERS_KEY = "potoreek-cc-orders";
const Ctx = createContext(null);
export const useCommand = () => useContext(Ctx);

// Read-only demo source: the files the running site already serves.
const BUNDLED = { "src/config/site.json": siteConfig, "src/config/taxonomy.json": taxonomyConfig };
const demoSource = {
  async readJson(path) {
    if (BUNDLED[path]) return structuredClone(BUNDLED[path]);
    if (!path.startsWith("public/")) return null;
    const res = await fetch(`/${path.slice("public/".length)}?t=${Date.now()}`);
    return res.ok ? res.json() : null;
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
    return saved && saved.ops && saved.files ? saved : { ops: {}, files: {} };
  } catch {
    return { ops: {}, files: {} };
  }
}

export function CommandProvider({ github, demo, children }) {
  const source = demo ? demoSource : github;
  const [bases, setBases] = useState({}); // collection key -> rows as on GitHub
  const [orders, setOrders] = useState(loadSavedOrders); // { ops: {key: {upserts, deletes}}, files: {path: {...}} }
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
        rows.push(op.upserts[r.id] ? toRow(op.upserts[r.id]) : r);
      }
      for (const [id, rec] of Object.entries(op.upserts)) if (!seen.has(id)) rows.push(toRow(rec));
      return rows;
    },
    [bases, orders]
  );

  // Full record (with body text for long-form collections).
  const getRecord = useCallback(
    async (key, id) => {
      const col = collectionByKey(key);
      const pending = orders.ops[key]?.upserts[id];
      if (pending) return structuredClone(pending);
      if (col.detailDir) {
        const path = `${col.detailDir}/${id}.json`;
        if (!detailCache.current[path]) detailCache.current[path] = source.readJson(path);
        const rec = await detailCache.current[path];
        if (rec) return structuredClone(rec);
      }
      const rows = bases[key] || (await loadCollection(key));
      const row = rows.find((r) => r.id === id);
      return row ? structuredClone(row) : null;
    },
    [bases, orders, source, loadCollection]
  );

  const updateOps = (key, fn) =>
    setOrders((o) => {
      const current = o.ops[key] || { upserts: {}, deletes: [] };
      const next = fn({ upserts: { ...current.upserts }, deletes: [...current.deletes] });
      const ops = { ...o.ops };
      if (!Object.keys(next.upserts).length && !next.deletes.length) delete ops[key];
      else ops[key] = next;
      return { ...o, ops };
    });

  const saveRecord = useCallback((key, record) => {
    const now = new Date().toISOString();
    const rec = cleanRecord({ ...record, id: record.id || newId(), created_date: record.created_date || now, updated_date: now });
    updateOps(key, (op) => {
      op.upserts[rec.id] = rec;
      op.deletes = op.deletes.filter((id) => id !== rec.id);
      return op;
    });
    return rec.id;
  }, []);

  const deleteRecord = useCallback(
    (key, id) => {
      const inBase = (bases[key] || []).some((r) => r.id === id);
      updateOps(key, (op) => {
        delete op.upserts[id];
        if (inBase && !op.deletes.includes(id)) op.deletes.push(id);
        return op;
      });
    },
    [bases]
  );

  const revertRecord = useCallback((key, id) => {
    updateOps(key, (op) => {
      delete op.upserts[id];
      op.deletes = op.deletes.filter((d) => d !== id);
      return op;
    });
  }, []);

  // Bulk import: records with a known id update it, the rest are added.
  const importRecords = useCallback(
    (key, records) => {
      const known = new Set((bases[key] || []).map((r) => r.id));
      let added = 0, updated = 0;
      const now = new Date().toISOString();
      updateOps(key, (op) => {
        for (const raw of records) {
          const isKnown = raw.id && known.has(raw.id);
          const rec = cleanRecord({ ...raw, id: isKnown ? raw.id : newId(), created_date: raw.created_date || now, updated_date: now });
          op.upserts[rec.id] = rec;
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
      const base = new Set((bases[key] || []).map((r) => r.id));
      for (const rec of Object.values(op.upserts)) {
        lines.push({ kind: base.has(rec.id) ? "edit" : "add", key, id: rec.id, label: `${col.en}: ${col.title(rec) || rec.id}` });
      }
      for (const id of op.deletes) {
        const row = (bases[key] || []).find((r) => r.id === id);
        lines.push({ kind: "delete", key, id, label: `${col.en}: ${row ? col.title(row) : id}` });
      }
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
        // not reachable from here (e.g. local preview) — keep waiting
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
          .map((r) => (op.upserts[r.id] ? toRow(op.upserts[r.id]) : r));
        for (const [id, rec] of Object.entries(op.upserts)) if (!latestIds.has(id)) rows.push(toRow(rec));
        changes.push({ path: col.file, content: serializeRows(rows) });
        if (col.detailDir) {
          for (const rec of Object.values(op.upserts)) changes.push({ path: `${col.detailDir}/${rec.id}.json`, content: JSON.stringify(rec) });
          for (const id of op.deletes) if (latestIds.has(id)) changes.push({ path: `${col.detailDir}/${id}.json`, delete: true });
        }
        const adds = Object.keys(op.upserts).filter((id) => !latestIds.has(id)).length;
        const edits = Object.keys(op.upserts).length - adds;
        summary.push(
          [adds && `${adds} added`, edits && `${edits} edited`, op.deletes.length && `${op.deletes.length} removed`]
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
