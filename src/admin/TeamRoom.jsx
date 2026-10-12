import React, { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { useCommand } from "./store";
import { REPO } from "./config";

const TOKEN_HELP = "https://github.com/settings/personal-access-tokens/new";

// Officers: invite other admins. An invited GitHub user gets write access to the
// site repository, which is full access to the Command Center with their own key.
export default function TeamRoom() {
  const { github, demo } = useCommand();
  const [team, setTeam] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = () =>
    github
      .team()
      .then(setTeam)
      .catch((e) => setError(e.status === 403 ? "Your key can't manage people. Edit it on GitHub and add the permission Administration: Read and write." : e.message));

  useEffect(() => {
    if (github && !demo) load();
  }, [github, demo]);

  const invite = async (e) => {
    e.preventDefault();
    const user = name.trim().replace(/^@/, "");
    if (!user) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await github.invite(user);
      setNotice(`Invitation sent to @${user}. GitHub emails them; once they accept, they can sign in here with their own key.`);
      setName("");
      await load();
    } catch (err) {
      setError(err.status === 404 ? `No GitHub account named “${user}”.` : err.status === 403 ? "Your key can't invite people. Add Administration: Read and write to it on GitHub." : err.message);
    } finally {
      setBusy(false);
    }
  };

  const act = async (label, fn) => {
    if (!window.confirm(label)) return;
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="cc-paper px-5 sm:px-8 py-6">
      <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b]">ՍՊԱՅԱԿՈՅՏ · OFFICERS</p>
      <h1 className="font-heading font-bold text-2xl sm:text-3xl mt-1">Ընկերներ · Admins</h1>
      <p className="mt-2 text-sm text-[#3d3227] max-w-2xl">
        Invite someone by their GitHub username. They get full access: every room, publishing and dispatching. Anyone you invite can change or hide anything on the site, so only invite people you trust.
      </p>

      {demo ? (
        <p className="mt-6 text-sm text-[#5b4b3b]">Sign in with your key to manage admins (the demo is read-only).</p>
      ) : (
        <>
          <form onSubmit={invite} className="mt-6 flex flex-wrap gap-3 items-end max-w-xl">
            <div className="flex-1 min-w-[220px]">
              <label htmlFor="tm-user" className="cc-label">
                GitHub username
              </label>
              <input id="tm-user" className="cc-input cc-type" placeholder="their-username" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <button type="submit" className="cc-btn cc-btn-red" disabled={busy || !name.trim()}>
              <UserPlus className="w-4 h-4" aria-hidden="true" /> {busy ? "Sending…" : "Invite admin"}
            </button>
          </form>
          {notice && (
            <p className="mt-4 text-sm text-[#2f5a32]" role="status">
              {notice}
            </p>
          )}
          {error && (
            <p className="mt-4 text-sm text-[#a3161f]" role="alert">
              {error}
            </p>
          )}

          <h2 className="cc-label mt-8">On duty</h2>
          {!team && !error && <p className="cc-type text-sm">Calling the roll…</p>}
          {team && (
            <ul className="divide-y cc-rule border-y cc-rule">
              {team.people.map((p) => (
                <li key={p.id} className="py-3 flex items-center gap-3">
                  <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full border cc-rule" />
                  <span className="font-bold flex-1">@{p.login}</span>
                  {p.login === REPO.owner ? (
                    <span className="cc-stamp cc-stamp-ink">Owner</span>
                  ) : (
                    <button type="button" className="cc-btn px-3" onClick={() => act(`Remove @${p.login}'s access?`, () => github.removeMember(p.login))} aria-label={`Remove ${p.login}`}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
              {team.invites.map((i) => (
                <li key={i.id} className="py-3 flex items-center gap-3">
                  <img src={i.invitee?.avatar_url} alt="" className="w-9 h-9 rounded-full border cc-rule opacity-60" />
                  <span className="flex-1">@{i.invitee?.login}</span>
                  <span className="cc-stamp">Invited</span>
                  <button type="button" className="cc-btn px-3" onClick={() => act(`Cancel the invitation to @${i.invitee?.login}?`, () => github.cancelInvite(i.id))} aria-label="Cancel invitation">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="cc-label mt-8">What the new admin does</h2>
          <ol className="list-decimal pl-5 text-sm text-[#3d3227] space-y-1 max-w-2xl">
            <li>Accept the invitation from GitHub's email (or github.com/notifications).</li>
            <li>
              Create a key at{" "}
              <a className="cc-link" href={TOKEN_HELP} target="_blank" rel="noreferrer">
                GitHub → Fine-grained tokens
              </a>
              : resource owner <b>{REPO.owner}</b>, repository <b>{REPO.name}</b>, permission Contents: Read and write.
            </li>
            <li>Open potoreek.com/admin and sign in with that key.</li>
          </ol>
        </>
      )}
    </div>
  );
}
