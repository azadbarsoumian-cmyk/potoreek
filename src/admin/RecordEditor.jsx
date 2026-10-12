import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { useCommand } from "./store";
import { collectionByKey, missingFields, toSlug, transliterate, hasArmenian } from "./collections";
import { Field } from "./fields";
import { newId } from "./format";
import { SITE_URL } from "./config";
import { ArchiveCollector, StoryFidayiPanel } from "./FidayiTools";
import StudioPanel from "./studio/StudioPanel";

// A new fedayi recognized from a story starts with what the story knows.
async function fromStory(getRecord, storyId) {
  const s = await getRecord("stories", storyId);
  if (!s) return {};
  const strip = (t) => String(t || "").replace(/\s*[-–—:].*$/, "").trim();
  // Untranslated English titles are still in Armenian script: suggest a transliteration.
  const nameEn = hasArmenian(s.title_en) || !s.title_en ? transliterate(strip(s.title_am)) : strip(s.title_en);
  // The story's summary is a first draft of the biography (some summaries are still in Armenian).
  const excerpt = String(s.excerpt_en || "").trim().replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return {
    name_am: strip(s.title_am),
    name_en: nameEn,
    slug: toSlug(nameEn),
    portrait_url: s.image_url,
    region: s.region_en,
    ...(excerpt ? { [hasArmenian(excerpt) ? "bio_am" : "bio_en"]: `<p>${excerpt}</p>` } : {}),
    story_ids: [s.id],
    notes: `Recognized from the story "${s.title_am}" (${s.title_en}).`,
  };
}

export default function RecordEditor() {
  const { key, id } = useParams();
  const [params] = useSearchParams();
  const col = collectionByKey(key);
  const isNew = id === "new";
  const navigate = useNavigate();
  const { getRecord, saveRecord, deleteRecord, loadCollection, demo } = useCommand();
  const [record, setRecord] = useState(isNew ? { id: newId(), published: false } : null);
  const [original, setOriginal] = useState(null);
  const [errors, setErrors] = useState([]);
  const [missing, setMissing] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!col) return;
    loadCollection(key);
    if (isNew) {
      const blank = { id: newId(), published: false };
      setRecord(blank);
      const storyId = params.get("fromStory");
      if (key === "fidayis" && storyId) fromStory(getRecord, storyId).then((pre) => setRecord({ ...blank, ...pre }));
      return;
    }
    let alive = true;
    getRecord(key, id).then((rec) => {
      if (!alive) return;
      if (!rec) setMissing(true);
      else {
        setRecord(rec);
        setOriginal(JSON.stringify(rec));
      }
    });
    return () => {
      alive = false;
    };
  }, [key, id]);

  if (!col) return <p className="cc-paper px-6 py-5">Unknown room.</p>;
  if (missing) return <p className="cc-paper px-6 py-5">This record could not be found.</p>;

  const dirty = record && JSON.stringify(record) !== original;

  const seal = (e) => {
    e.preventDefault();
    const gaps = missingFields(col, record);
    setErrors(gaps);
    if (gaps.length) return;
    saveRecord(key, record);
    navigate(`/admin/c/${key}`);
  };

  // Studio results: merge into the record and seal it right away.
  const applyStudio = (patch) => {
    const next = { ...record, ...patch };
    setRecord(next);
    saveRecord(key, next);
    setOriginal(JSON.stringify(next));
    setNotice("Studio files are linked and this record is sealed. Dispatch from Orders to publish them.");
  };

  const remove = () => {
    if (window.confirm(`Mark "${col.title(record)}" for removal? It is removed from the site at the next dispatch.`)) {
      deleteRecord(key, id);
      navigate(`/admin/c/${key}`);
    }
  };

  return (
    <form onSubmit={seal} className="cc-paper px-5 sm:px-8 py-6 relative">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link to={`/admin/c/${key}`} className="cc-link text-sm inline-flex items-center gap-1 min-h-[44px]">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {col.am} · {col.en}
          </Link>
          <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b] mt-1">
            ԳՈՐԾ · DOSSIER {isNew ? "— NEW" : `№ ${id.slice(-6).toUpperCase()}`}
          </p>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl mt-1 break-words">
            {record ? col.title(record) || (isNew ? "Նոր գրառում · New record" : "(untitled)") : "Retrieving dossier…"}
          </h1>
        </div>
        <span className={`cc-stamp text-sm ${isNew ? "cc-stamp-ink" : ""}`}>{isNew ? "Draft" : dirty ? "Amended" : "On file"}</span>
      </div>

      {record && (
        <>
          <div className="mt-6 grid sm:grid-cols-2 gap-x-5 gap-y-4">
            {col.fields.map((f) => (
              <Field key={f.name || f.fields.en} field={f} record={record} onChange={setRecord} />
            ))}
            {key === "stories" && <StoryFidayiPanel storyId={id} record={record} />}
            {key === "fidayis" && <ArchiveCollector record={record} onChange={setRecord} />}
            {key === "fidayis" && <StudioPanel record={record} onApply={applyStudio} />}
          </div>

          {notice && (
            <p className="mt-5 text-sm text-[#2f5a32]" role="status">
              {notice}
            </p>
          )}

          {errors.length > 0 && (
            <p className="mt-5 text-sm text-[#a3161f]" role="alert">
              Fill in: {errors.join(", ")}.
            </p>
          )}

          <div className="mt-7 pt-5 border-t cc-rule flex flex-wrap items-center gap-3">
            <button type="submit" className="cc-btn cc-btn-red" disabled={!isNew && !dirty}>
              Կնքել · Seal order
            </button>
            <Link to={`/admin/c/${key}`} className="cc-btn">
              Cancel
            </Link>
            <span className="text-xs text-[#5b4b3b] cc-type">
              Sealed orders wait in Orders until you dispatch them{demo ? " (demo: dispatch is disabled)" : ""}.
            </span>
            <span className="flex-1" />
            {!isNew && col.sitePath && (
              <a href={`${SITE_URL}${col.sitePath(record)}`} target="_blank" rel="noreferrer" className="cc-btn">
                <ExternalLink className="w-4 h-4" aria-hidden="true" /> On site
              </a>
            )}
            {!isNew && (
              <button type="button" className="cc-btn" onClick={remove}>
                <Trash2 className="w-4 h-4" aria-hidden="true" /> Remove
              </button>
            )}
          </div>
        </>
      )}
    </form>
  );
}
