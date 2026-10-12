import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useCommand } from "./store";
import { fmtDate } from "./format";
import { versionUrl } from "./config";

export default function Situation() {
  const { collections, loadCollection, rowsFor, readConfig, source, pending, demo } = useCommand();
  const [site, setSite] = useState(null);
  const [commits, setCommits] = useState(null);
  const [live, setLive] = useState(null);

  useEffect(() => {
    collections.forEach((c) => loadCollection(c.key));
    readConfig("src/config/site.json").then(setSite);
    source.recentCommits(10).then(setCommits).catch(() => setCommits([]));
    const url = versionUrl();
    if (!url) {
      setLive(false);
      return;
    }
    fetch(`${url}?t=${Date.now()}`)
      .then((r) => r.json())
      .then(setLive)
      .catch(() => setLive(false));
  }, []);

  const latest = commits?.[0];
  const inSync = live && latest && live.commit === latest.sha;

  return (
    <div className="space-y-5">
      <section className="cc-paper px-5 sm:px-7 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b]">ՏԵՂԵԿԱԳԻՐ · SITUATION REPORT</p>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl mt-1">Իրադրութիւն</h1>
            <p className="cc-type text-sm text-[#5b4b3b] mt-1">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          {site && (
            <div className="text-right">
              <span className={`cc-stamp text-sm ${site.underConstruction ? "" : "cc-stamp-green"}`}>
                {site.underConstruction ? "Coming soon mode" : "Site is open"}
              </span>
              <p className="mt-2 text-sm">
                <Link to="/admin/settings" className="cc-link">
                  Change site mode
                </Link>
              </p>
            </div>
          )}
        </div>

        <ul className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Pending orders" value={pending.length} to="/admin/orders" warn={pending.length > 0} />
          <Stat
            label="Live site"
            value={live === null ? "…" : live === false ? "unknown" : inSync ? "up to date" : "rebuilding"}
            hint={live?.builtAt ? `built ${fmtDate(live.builtAt)}` : undefined}
          />
          <Stat label="Last dispatch" value={latest ? fmtDate(latest.date) : demo ? "demo" : "…"} />
          <Stat label="Collections" value={collections.length} />
        </ul>
      </section>

      <section className="cc-paper px-5 sm:px-7 py-6">
        <h2 className="font-heading font-bold text-xl">Արխիւի ամփոփում · Archive inventory</h2>
        <ul className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {collections.map((c) => {
            const rows = rowsFor(c.key);
            return (
              <li key={c.key} className="cc-paper-2 border cc-rule px-4 py-3 flex items-center justify-between gap-3">
                <Link to={`/admin/c/${c.key}`} className="min-w-0">
                  <span className="block font-heading font-bold truncate">{c.am}</span>
                  <span className="block cc-type text-[11px] uppercase tracking-widest text-[#5b4b3b]">{c.en}</span>
                </Link>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="cc-type text-2xl text-[#a3161f]">{rows ? rows.length : "…"}</span>
                  <Link to={`/admin/c/${c.key}/new`} className="cc-btn px-2" aria-label={`Add to ${c.en}`}>
                    <Plus className="w-4 h-4" />
                  </Link>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="cc-paper px-5 sm:px-7 py-6">
        <h2 className="font-heading font-bold text-xl">Վերջին առաքումներ · Recent dispatches</h2>
        {commits === null && <p className="mt-3 cc-type text-sm">Loading…</p>}
        {commits?.length === 0 && <p className="mt-3 text-sm text-[#5b4b3b]">{demo ? "Sign in to see the dispatch log." : "No dispatches found."}</p>}
        <ol className="mt-3 divide-y cc-rule">
          {commits?.map((c, i) => (
            <li key={c.sha} className="py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="cc-type text-xs text-[#5b4b3b] w-36 shrink-0">{fmtDate(c.date)}</span>
              <a href={c.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 hover:text-[#a3161f]">
                {c.message.split("\n")[0]}
              </a>
              {i === 0 && live && <span className={`cc-stamp ${inSync ? "cc-stamp-green" : ""}`}>{inSync ? "Live" : "Rebuilding"}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value, hint, to, warn }) {
  const body = (
    <>
      <span className="block cc-type text-[11px] uppercase tracking-widest text-[#5b4b3b]">{label}</span>
      <span className={`block mt-1 font-heading font-bold text-xl ${warn ? "text-[#a3161f]" : ""}`}>{value}</span>
      {hint && <span className="block cc-type text-[11px] text-[#5b4b3b] mt-0.5">{hint}</span>}
    </>
  );
  return (
    <li>
      {to ? (
        <Link to={to} className="cc-paper-2 border cc-rule px-4 py-3 block h-full hover:border-[#a3161f]">
          {body}
        </Link>
      ) : (
        <div className="cc-paper-2 border cc-rule px-4 py-3 h-full">{body}</div>
      )}
    </li>
  );
}
