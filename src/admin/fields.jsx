import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useCommand } from "./store";

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
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      );
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
