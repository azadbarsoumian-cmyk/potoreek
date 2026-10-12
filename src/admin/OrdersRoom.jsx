import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { useCommand } from "./store";

const KIND = {
  add: { label: "New", cls: "cc-stamp-ink" },
  edit: { label: "Amend", cls: "cc-stamp-ink" },
  delete: { label: "Remove", cls: "" },
  upload: { label: "Upload", cls: "cc-stamp-green" },
  settings: { label: "Settings", cls: "cc-stamp-green" },
};

export default function OrdersRoom() {
  const { pending, publish, discardAll, revertRecord, unstageFile, demo, dispatch, ordersSaveFailed } = useCommand();
  const [note, setNote] = useState("");
  const [state, setState] = useState({ busy: false, error: "" });

  const send = async () => {
    setState({ busy: true, error: "" });
    try {
      await publish(note);
      setNote("");
      setState({ busy: false, error: "" });
    } catch (err) {
      setState({ busy: false, error: err.message });
    }
  };

  const undo = (p) => (p.path ? unstageFile(p.path) : revertRecord(p.key, p.id));

  return (
    <div className="cc-paper px-5 sm:px-8 py-6">
      <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b]">ՀՐԱՄԱՆՆԵՐ · ORDERS AWAITING DISPATCH</p>
      <h1 className="font-heading font-bold text-2xl sm:text-3xl mt-1">Առաքում · Dispatch desk</h1>
      <p className="mt-2 text-sm text-[#3d3227] max-w-2xl">
        Everything you seal waits here. One dispatch publishes all of it in a single update, and the site rebuilds in about
        1–2 minutes. Each dispatch uses Netlify build credits, so it's best to collect several orders before sending.
      </p>
      {ordersSaveFailed && (
        <p className="mt-3 text-sm text-[#a3161f]">These orders are too large to keep if you close this tab. Dispatch them before leaving.</p>
      )}

      {pending.length === 0 ? (
        <div className="mt-8 text-center py-10">
          <span className="cc-stamp text-base cc-stamp-green">Desk is clear</span>
          <p className="mt-4 text-sm text-[#5b4b3b]">
            {dispatch?.status === "publishing" ? "Your last dispatch is on its way to the site." : "No orders waiting."}{" "}
            <Link to="/admin" className="cc-link">
              Back to the situation room
            </Link>
          </p>
        </div>
      ) : (
        <>
          <ol className="mt-6 divide-y cc-rule border-y cc-rule">
            {pending.map((p, i) => (
              <li key={`${p.path || p.key}-${p.id || i}`} className="py-3 flex items-center gap-3">
                <span className="cc-type text-xs text-[#5b4b3b] w-8">{String(i + 1).padStart(2, "0")}</span>
                <span className={`cc-stamp ${KIND[p.kind].cls}`}>{KIND[p.kind].label}</span>
                {p.key && p.kind !== "delete" ? (
                  <Link to={`/admin/c/${p.key}/${p.id}`} className="flex-1 min-w-0 truncate hover:text-[#a3161f]">
                    {p.label}
                  </Link>
                ) : (
                  <span className="flex-1 min-w-0 truncate">{p.label}</span>
                )}
                <button type="button" className="cc-btn px-3" onClick={() => undo(p)} aria-label={`Withdraw order: ${p.label}`}>
                  <Undo2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid md:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <label htmlFor="cc-note" className="cc-label">
                Dispatch note (optional)
              </label>
              <input id="cc-note" className="cc-input" placeholder="e.g. Added the Sasun letters series" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="cc-btn"
                onClick={() => window.confirm("Withdraw every pending order? Nothing will be published.") && discardAll()}
                disabled={state.busy}
              >
                Withdraw all
              </button>
              <button type="button" className="cc-btn cc-btn-red" onClick={send} disabled={state.busy || demo}>
                <span className="cc-seal w-7 h-7 text-sm" aria-hidden="true">
                  Փ
                </span>
                {state.busy ? "Sending…" : `Dispatch ${pending.length} order${pending.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
          {demo && <p className="mt-3 text-sm text-[#5b4b3b]">Demo mode is read-only. Sign in with your GitHub key to dispatch.</p>}
          {state.error && (
            <p className="mt-3 text-sm text-[#a3161f]" role="alert">
              Dispatch failed: {state.error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
