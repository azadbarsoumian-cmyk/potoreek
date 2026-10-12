import React, { useState } from "react";
import { GITHUB_TOKEN_URL, REPO } from "./config";

export default function Login({ onSignIn, onDemo }) {
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState({ busy: false, error: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    setStatus({ busy: true, error: "" });
    try {
      await onSignIn(token.trim(), remember);
    } catch (err) {
      const message =
        err.status === 401
          ? "GitHub did not accept this key. Check that it was copied in full and hasn't expired."
          : err.status === 404
            ? `This key can't see ${REPO.owner}/${REPO.name}. Give it access to that repository.`
            : err.message;
      setStatus({ busy: false, error: message });
    }
  };

  return (
    <div className="cc-root flex items-center justify-center px-4 py-12">
      <div className="cc-paper relative w-full max-w-lg px-7 sm:px-10 pt-14 pb-10">
        <div className="cc-seal absolute -top-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] text-3xl" aria-hidden="true">
          Փ
        </div>
        <p className="cc-type text-center text-xs tracking-[0.35em] text-[#5b4b3b]">ՀԱՒԱՏԱՐՄԱԳԻՐ · CREDENTIALS</p>
        <h1 className="mt-3 text-center font-heading font-bold text-2xl sm:text-3xl">Հրամանատարական Կեդրոն</h1>
        <p className="mt-1 text-center cc-type text-sm tracking-widest">POTOREEK COMMAND CENTER</p>
        <div className="mt-4 flex justify-center">
          <span className="cc-stamp">Գաղտնի · Restricted</span>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="cc-token" className="cc-label">
              GitHub access key
            </label>
            <input
              id="cc-token"
              type="password"
              autoComplete="off"
              spellCheck={false}
              className="cc-input cc-type"
              placeholder="github_pat_…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-3 text-sm min-h-[44px]">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 accent-[#a3161f]" />
            Remember me on this device
          </label>
          {status.error && (
            <p className="text-sm text-[#a3161f]" role="alert">
              {status.error}
            </p>
          )}
          <button type="submit" disabled={status.busy || !token.trim()} className="cc-btn cc-btn-red w-full">
            {status.busy ? "Checking credentials…" : "Մուտք · Enter headquarters"}
          </button>
        </form>

        <details className="mt-6 text-sm text-[#3d3227]">
          <summary className="cursor-pointer cc-type text-xs uppercase tracking-widest min-h-[44px] flex items-center">How to get a key</summary>
          <ol className="mt-2 list-decimal pl-5 space-y-1.5">
            <li>
              Open{" "}
              <a className="cc-link" href={GITHUB_TOKEN_URL} target="_blank" rel="noreferrer">
                GitHub → New fine-grained token
              </a>
              .
            </li>
            <li>Name it "Potoreek Command Center" and pick an expiry.</li>
            <li>
              Repository access: <b>Only select repositories</b> → <b>{REPO.name}</b>.
            </li>
            <li>
              Permissions → Repository → <b>Contents: Read and write</b>.
            </li>
            <li>Generate, copy the key and paste it above. It stays in this browser only.</li>
          </ol>
        </details>

        <div className="mt-6 pt-5 border-t cc-rule text-center">
          <button type="button" onClick={onDemo} className="cc-link text-sm min-h-[44px]">
            Look around without a key (read-only)
          </button>
        </div>
      </div>
    </div>
  );
}
