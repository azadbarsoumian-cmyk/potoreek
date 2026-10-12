import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Plus, Trash2, ArrowUp, X } from "lucide-react";
import { useCommand } from "./store";
import { collectionByKey, toSlug } from "./collections";

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "image";

const MAX_UPLOAD_MB = 8;

// Reads a picked image and queues it as an upload under public/images/uploads/.
// Returns the public path the site will serve it from after dispatch.
export function useImageUpload() {
  const { stageFile } = useCommand();
  return async (file) => {
    if (!file.type.startsWith("image/")) throw new Error("Choose an image file (JPG, PNG, WebP, GIF or SVG).");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Images must be under ${MAX_UPLOAD_MB} MB.`);
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || file.type.split("/")[1] || "jpg").toLowerCase();
    const name = `${Date.now().toString(36)}-${slug(file.name)}.${ext}`;
    const path = `public/images/uploads/${name}`;
    stageFile(path, { base64: String(dataUrl).split(",")[1], mime: file.type }, `Upload image ${file.name}`);
    return `/images/uploads/${name}`;
  };
}

// Preview source for an image value, including uploads not dispatched yet.
export function usePreviewSrc() {
  const { orders } = useCommand();
  return (value) => {
    if (!value) return "";
    const staged = orders.files[`public${value}`];
    return staged?.base64 ? `data:${staged.mime || "image/jpeg"};base64,${staged.base64}` : value;
  };
}

export function Field({ field, record, onChange }) {
  const id = `f-${field.name || field.fields?.en}`;
  const set = (name, value) => onChange({ ...record, [name]: value });
  const label = (
    <label htmlFor={id} className="cc-label">
      {field.label}
      {field.required && <span className="text-[#a3161f]"> *</span>}
    </label>
  );

  switch (field.type) {
    case "textarea":
      return (
        <div className="sm:col-span-2">
          {label}
          <textarea id={id} className="cc-input" rows={field.rows || 4} value={record[field.name] ?? ""} onChange={(e) => set(field.name, e.target.value)} />
        </div>
      );
    case "html":
      return <HtmlField id={id} label={label} value={record[field.name] ?? ""} onChange={(v) => set(field.name, v)} />;
    case "image":
      return <ImageField id={id} label={label} value={record[field.name] ?? ""} onChange={(v) => set(field.name, v)} />;
    case "boolean":
      if (field.name === "published") {
        const on = Boolean(record.published);
        return (
          <label className={`sm:col-span-2 flex items-center gap-4 px-4 py-3 border-2 cursor-pointer ${on ? "border-[#2f5a32] bg-[#2f5a32]/10" : "border-dashed border-[#5b4b3b]/50"}`}>
            <input type="checkbox" className="w-5 h-5 accent-[#2f5a32]" checked={on} onChange={(e) => set("published", e.target.checked)} />
            <span className="flex-1">
              <span className="block font-heading font-bold">{on ? "Online — visible to the public" : "Hidden — only in the Command Center"}</span>
              <span className="block text-sm text-[#3d3227]">Takes effect at the next dispatch.</span>
            </span>
            <span className={`cc-stamp ${on ? "cc-stamp-green" : ""}`}>{on ? "Online" : "Hidden"}</span>
          </label>
        );
      }
      return (
        <label className="flex items-center gap-3 min-h-[44px] self-end">
          <input type="checkbox" className="w-5 h-5 accent-[#a3161f]" checked={Boolean(record[field.name])} onChange={(e) => set(field.name, e.target.checked)} />
          <span className="cc-label mb-0">{field.label}</span>
        </label>
      );
    case "select":
      return (
        <div>
          {label}
          <select id={id} className="cc-input" value={record[field.name] ?? ""} onChange={(e) => set(field.name, e.target.value)}>
            <option value="">—</option>
            {field.options.map((o) => {
              const opt = typeof o === "string" ? { value: o, label: o } : o;
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              );
            })}
          </select>
        </div>
      );
    case "slug":
      return (
        <div>
          {label}
          <div className="flex gap-2">
            <input
              id={id}
              className="cc-input cc-type"
              value={record[field.name] ?? ""}
              onChange={(e) => set(field.name, toSlug(e.target.value))}
              placeholder="aghbyur-serob"
            />
            <button type="button" className="cc-btn px-3 shrink-0" onClick={() => set(field.name, toSlug(record[field.from]))} title="Make from the English name">
              ↻
            </button>
          </div>
        </div>
      );
    case "list":
      return (
        <div>
          {label}
          <textarea
            id={id}
            className="cc-input"
            rows={3}
            value={(record[field.name] || []).join("\n")}
            onChange={(e) => set(field.name, e.target.value.split("\n").map((s) => s.trimStart()))}
            onBlur={(e) => set(field.name, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
          />
        </div>
      );
    case "repeater":
      return <RepeaterField field={field} value={record[field.name] || []} onChange={(v) => set(field.name, v)} />;
    case "relations":
      return <RelationsField field={field} value={record[field.name] || []} onChange={(v) => set(field.name, v)} />;
    case "relation":
      return <RelationsField field={field} single value={record[field.name] ? [record[field.name]] : []} onChange={(v) => set(field.name, v[0] || "")} />;
    case "pair": {
      const current = record[field.fields.en] ?? "";
      const known = field.options.some((o) => o.en === current);
      return (
        <div>
          {label}
          <select
            id={id}
            className="cc-input"
            value={current}
            onChange={(e) => {
              const opt = field.options.find((o) => o.en === e.target.value);
              onChange({ ...record, [field.fields.en]: opt?.en ?? "", [field.fields.am]: opt?.am ?? "" });
            }}
          >
            <option value="">—</option>
            {!known && current && <option value={current}>{current} (current)</option>}
            {field.options.map((o) => (
              <option key={o.en} value={o.en}>
                {o.am} · {o.en}
              </option>
            ))}
          </select>
        </div>
      );
    }
    default:
      return (
        <div className={field.type === "url" ? "sm:col-span-2" : ""}>
          {label}
          <input
            id={id}
            type={field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
            className="cc-input"
            placeholder={field.placeholder}
            value={record[field.name] ?? ""}
            onChange={(e) => set(field.name, e.target.value)}
          />
        </div>
      );
  }
}

function HtmlField({ id, label, value, onChange }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="sm:col-span-2">
      <div className="flex items-end justify-between gap-3">
        {label}
        <button type="button" className="cc-link text-sm min-h-[44px]" onClick={() => setPreview((p) => !p)}>
          {preview ? "Edit text" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="cc-preview bg-[#f7f0de] border cc-rule px-4 py-3 max-h-[520px] overflow-auto leading-relaxed" dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <textarea id={id} className="cc-input font-mono text-[13px]" rows={16} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function ImageField({ id, label, value, onChange }) {
  const upload = useImageUpload();
  const preview = usePreviewSrc();
  const fileRef = useRef(null);
  const [error, setError] = useState("");
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setError("");
      onChange(await upload(file));
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="sm:col-span-2">
      {label}
      <div className="flex gap-3 items-start">
        <div className="w-28 h-20 shrink-0 border cc-rule bg-[#1d1712]/10 overflow-hidden">
          {value && <img src={preview(value)} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 space-y-2">
          <input id={id} type="text" className="cc-input" placeholder="https://… or /images/…" value={value} onChange={(e) => onChange(e.target.value)} />
          <button type="button" className="cc-btn" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" aria-hidden="true" /> Upload image
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
          {error && <p className="text-sm text-[#a3161f]">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// Rows of small sub-fields (timeline entries, gallery photos, sources).
function RepeaterField({ field, value, onChange }) {
  const setItem = (i, item) => onChange(value.map((v, j) => (j === i ? item : v)));
  const move = (i) => {
    const next = [...value];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };
  return (
    <fieldset className="sm:col-span-2">
      <legend className="cc-label">{field.label}</legend>
      <ol className="space-y-3">
        {value.map((item, i) => (
          <li key={i} className="cc-paper-2 border cc-rule p-3">
            <div className="grid sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
              {field.item.map((sub) =>
                sub.type === "image" ? (
                  <div key={sub.name} className="sm:col-span-full">
                    <ImageField id={`${field.name}-${i}-${sub.name}`} label={<span className="cc-label">{sub.label}</span>} value={item[sub.name] || ""} onChange={(v) => setItem(i, { ...item, [sub.name]: v })} />
                  </div>
                ) : (
                  <div key={sub.name}>
                    <label className="cc-label" htmlFor={`${field.name}-${i}-${sub.name}`}>
                      {sub.label}
                    </label>
                    <input
                      id={`${field.name}-${i}-${sub.name}`}
                      type={sub.type === "url" ? "url" : "text"}
                      className="cc-input"
                      value={item[sub.name] || ""}
                      onChange={(e) => setItem(i, { ...item, [sub.name]: e.target.value })}
                    />
                  </div>
                )
              )}
            </div>
            <div className="mt-2 flex gap-2 justify-end">
              <button type="button" className="cc-btn px-3" disabled={i === 0} onClick={() => move(i)} aria-label="Move up">
                <ArrowUp className="w-4 h-4" />
              </button>
              <button type="button" className="cc-btn px-3" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove row">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="cc-btn mt-3" onClick={() => onChange([...value, {}])}>
        <Plus className="w-4 h-4" aria-hidden="true" /> Add {field.label.toLowerCase()} entry
      </button>
    </fieldset>
  );
}

// Links to records in another collection, with a search picker.
function RelationsField({ field, value, onChange, single = false }) {
  const { loadCollection, rowsFor } = useCommand();
  const target = collectionByKey(field.collection);
  const [query, setQuery] = useState("");
  useEffect(() => {
    loadCollection(field.collection);
  }, [field.collection]);
  const rows = rowsFor(field.collection) || [];
  const byId = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, r])), [rows]);
  const q = query.trim().toLowerCase();
  const matches = q
    ? rows.filter((r) => !value.includes(r.id) && target.search.some((f) => String(r[f] ?? "").toLowerCase().includes(q))).slice(0, 8)
    : [];
  const id = `rel-${field.name}`;
  return (
    <div className="sm:col-span-2">
      <label htmlFor={id} className="cc-label">
        {field.label}
      </label>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {value.map((rid) => (
            <li key={rid} className="cc-paper-2 border cc-rule pl-3 pr-1 py-1 flex items-center gap-2 max-w-full">
              <span className="truncate text-sm">{byId[rid] ? target.title(byId[rid]) : rid}</span>
              {byId[rid] && byId[rid].published === false && <span className="cc-type text-[10px] text-[#a3161f]">HIDDEN</span>}
              <button type="button" className="w-8 h-8 flex items-center justify-center hover:text-[#a3161f]" onClick={() => onChange(value.filter((v) => v !== rid))} aria-label="Unlink">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {(!single || value.length === 0) && (
        <div className="relative">
          <input id={id} className="cc-input" placeholder={`Search ${target.en.toLowerCase()} to link…`} value={query} onChange={(e) => setQuery(e.target.value)} />
          {matches.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 mt-1 bg-[#f7f0de] border cc-rule shadow-lg max-h-72 overflow-auto">
              {matches.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 min-h-[44px] hover:bg-[#ece2cc]"
                    onClick={() => {
                      onChange(single ? [r.id] : [...value, r.id]);
                      setQuery("");
                    }}
                  >
                    <span className="block truncate">{target.title(r)}</span>
                    <span className="block cc-type text-[11px] text-[#5b4b3b] truncate">{target.meta(r)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
