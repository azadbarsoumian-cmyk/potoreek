import React, { useEffect, useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { createNetlify } from "./netlify";
import { NETLIFY_TOKEN_URL } from "./config";
import { downloadFile, fmtDate, toCsv } from "./format";

const KEY = "potoreek-cc-netlify";

const readKey = () => {
  try {
    return window.localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};

// Sign-ups from the site's forms (newsletter, pre-orders), via Netlify.
export default function DispatchesRoom() {
  const [token, setToken] = useState(readKey);
  const [input, setInput] = useState("");
  const [forms, setForms] = useState(null);
  const [active, setActive] = useState(null);
  const [subs, setSubs] = useState(null);
  const [error, setError] = useState("");
  const api = useMemo(() => (token ? createNetlify(token) : null), [token]);

  useEffect(() => {
    if (!api) return;
    setError("");
    api
      .forms()
      .then((list) => {
        setForms(list);
        setActive((a) => a || list[0]?.id || null);
      })
      .catch((err) => setError(`${err.message}. Check the Netlify key.`));
  }, [api]);

  useEffect(() => {
    if (!api || !active) return;
    setSubs(null);
    api.submissions(active).then(setSubs).catch((err) => setError(err.message));
  }, [api, active]);

  const connect = (e) => {
    e.preventDefault();
    try {
      window.localStorage.setItem(KEY, input.trim());
    } catch {
      // keep for this visit only
    }
    setToken(input.trim());
    setInput("");
  };

  const disconnect = () => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // nothing stored
    }
    setToken("");
    setForms(null);
    setSubs(null);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this submission permanently from Netlify? This can't be undone.")) return;
    await api.deleteSubmission(id);
    setSubs((list) => list.filter((s) => s.id !== id));
  };

  const exportCsv = () => {
    const rows = subs.map((s) => ({ date: s.created_at, ...s.data }));
    const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((c) => !["ip", "user_agent", "referrer", "bot-field", "form-name"].includes(c));
    const form = forms.find((f) => f.id === active);
    downloadFile(`${form?.name || "signups"}.csv`, "﻿" + toCsv(rows, cols), "text/csv");
  };

  return (
    <div className="cc-paper px-5 sm:px-8 py-6">
      <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b]">ՄՈՒՏՔԱՅԻՆ ՆԱՄԱԿՆԵՐ · INCOMING DISPATCHES</p>
      <h1 className="font-heading font-bold text-2xl sm:text-3xl mt-1">Նամակներ · Sign-ups</h1>
      <p className="mt-2 text-sm text-[#3d3227] max-w-2xl">Newsletter and pre-order sign-ups collected by the site's forms.</p>

      {!token ? (
        <form onSubmit={connect} className="mt-6 max-w-xl space-y-3">
          <label htmlFor="nf-key" className="cc-label">
            Netlify access key
          </label>
          <input id="nf-key" type="password" autoComplete="off" className="cc-input cc-type" value={input} onChange={(e) => setInput(e.target.value)} />
          <button type="submit" className="cc-btn cc-btn-red" disabled={!input.trim()}>
            Connect
          </button>
          <p className="text-sm text-[#3d3227]">
            Create one under{" "}
            <a className="cc-link" href={NETLIFY_TOKEN_URL} target="_blank" rel="noreferrer">
              Netlify → User settings → Personal access tokens
            </a>
            . It stays in this browser only.
          </p>
        </form>
      ) : (
        <>
          {error && (
            <p className="mt-4 text-sm text-[#a3161f]" role="alert">
              {error}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2 items-center">
            {forms?.map((f) => (
              <button key={f.id} type="button" onClick={() => setActive(f.id)} className={`cc-btn ${active === f.id ? "cc-btn-red" : ""}`}>
                {f.name} · {f.submission_count}
              </button>
            ))}
            <span className="flex-1" />
            {subs?.length > 0 && (
              <button type="button" className="cc-btn" onClick={exportCsv}>
                <Download className="w-4 h-4" aria-hidden="true" /> CSV
              </button>
            )}
            <button type="button" className="cc-link text-sm min-h-[44px]" onClick={disconnect}>
              Disconnect Netlify
            </button>
          </div>

          {forms && !subs && <p className="mt-5 cc-type text-sm">Opening the mailbag…</p>}
          {subs?.length === 0 && <p className="mt-5 text-sm text-[#5b4b3b]">No sign-ups yet.</p>}
          {subs?.length > 0 && (
            <ul className="mt-5 divide-y cc-rule border-y cc-rule">
              {subs.map((s) => (
                <li key={s.id} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="cc-type text-xs text-[#5b4b3b] w-36 shrink-0">{fmtDate(s.created_at)}</span>
                  <span className="font-bold break-all">{s.data?.email || s.email || "—"}</span>
                  {s.data?.product_title && <span className="text-sm text-[#3d3227]">for “{s.data.product_title}”</span>}
                  <span className="flex-1" />
                  <button type="button" className="cc-btn px-3" onClick={() => remove(s.id)} aria-label="Delete submission">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
