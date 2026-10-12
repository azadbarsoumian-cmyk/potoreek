import React, { useEffect, useState } from "react";
import { NavLink, Route, Routes, Link } from "react-router-dom";
import { UserPlus, Users, Archive, BookOpen, Feather, Quote, ShoppingBag, Film, Newspaper, Image as ImageIcon, Mail, Settings as Cog, Radar, ExternalLink, LogOut, Stamp } from "lucide-react";
import "./admin.css";
import { createGitHub } from "./github";
import { CommandProvider, useCommand } from "./store";
import Login from "./Login";
import Situation from "./Situation";
import CollectionRoom from "./CollectionRoom";
import RecordEditor from "./RecordEditor";
import MediaRoom from "./MediaRoom";
import DispatchesRoom from "./DispatchesRoom";
import SettingsRoom from "./SettingsRoom";
import OrdersRoom from "./OrdersRoom";
import TeamRoom from "./TeamRoom";
import { SITE_URL } from "./config";

const TOKEN_KEY = "potoreek-cc-github";

function readStoredToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) || window.localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export default function AdminApp() {
  const [session, setSession] = useState(null); // { github, user, demo }
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    document.title = "Command Center · Փոթորիկ";
    const meta = Object.assign(document.createElement("meta"), { name: "robots", content: "noindex, nofollow" });
    document.head.appendChild(meta);
    const token = readStoredToken();
    if (!token) {
      setChecking(false);
      return () => meta.remove();
    }
    const github = createGitHub(token);
    github
      .verify()
      .then((info) => info.canPush && setSession({ github, info }))
      .catch(() => {})
      .finally(() => setChecking(false));
    return () => meta.remove();
  }, []);

  const signIn = async (token, remember) => {
    const github = createGitHub(token);
    const info = await github.verify();
    if (!info.canPush) throw new Error("This key can read the repository but cannot write to it. Give it Contents: Read and write.");
    try {
      (remember ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token);
    } catch {
      // storage blocked: stay signed in for this page only
    }
    setSession({ github, info });
  };

  const signOut = () => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // nothing stored
    }
    setSession(null);
  };

  if (checking) return <div className="cc-root" />;
  if (!session) return <Login onSignIn={signIn} onDemo={() => setSession({ demo: true })} />;

  return (
    <CommandProvider github={session.github} demo={Boolean(session.demo)}>
      <Shell info={session.info} onSignOut={signOut} />
    </CommandProvider>
  );
}

const ROOMS = [
  { to: "/admin", end: true, icon: Radar, am: "Իրադրութիւն", en: "Situation room" },
  { to: "/admin/c/stories", icon: Archive, am: "Պատմութիւններ", en: "Archive stories" },
  { to: "/admin/c/fidayis", icon: Users, am: "Ֆէտայիներ", en: "Fedayi registry" },
  { to: "/admin/c/blog", icon: BookOpen, am: "Բլոգ", en: "Blog" },
  { to: "/admin/c/poems", icon: Feather, am: "Բանաստեղծութիւններ", en: "Poems" },
  { to: "/admin/c/quotes", icon: Quote, am: "Քաղուածքներ", en: "Quotes" },
  { to: "/admin/c/products", icon: ShoppingBag, am: "Խանութ", en: "Shop" },
  { to: "/admin/c/videos", icon: Film, am: "Տեսանիւթեր", en: "Videos" },
  { to: "/admin/c/news", icon: Newspaper, am: "Լուրեր", en: "News" },
  { to: "/admin/media", icon: ImageIcon, am: "Պատկերներ", en: "Media" },
  { to: "/admin/dispatches", icon: Mail, am: "Նամակներ", en: "Sign-ups" },
  { to: "/admin/team", icon: UserPlus, am: "Ընկերներ", en: "Admins" },
  { to: "/admin/settings", icon: Cog, am: "Կարգաւորումներ", en: "Settings" },
];

function YerevanClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString("en-GB", { timeZone: "Asia/Yerevan", hour12: false });
  return (
    <span className="cc-type text-xs text-[#dcc28c]" title="Yerevan time">
      ԵՐԵՒԱՆ {time}
    </span>
  );
}

function Shell({ info, onSignOut }) {
  const { pending, demo, dispatch } = useCommand();

  return (
    <div className="cc-root flex flex-col">
      <header className="sticky top-0 z-30 bg-[#0d0806]/95 backdrop-blur border-b border-[#b08d57]/30">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <Link to="/admin" className="cc-plate flex items-center gap-3 px-4 py-2">
            <span className="cc-rivet" aria-hidden="true" />
            <span className="leading-tight">
              <span className="block font-heading font-bold text-sm sm:text-base">Հրամանատարական Կեդրոն</span>
              <span className="block cc-type text-[11px] tracking-[0.25em] text-[#1f1408]">POTOREEK · COMMAND CENTER</span>
            </span>
            <span className="cc-rivet" aria-hidden="true" />
          </Link>
          <div className="flex-1" />
          <YerevanClock />
          {demo ? (
            <span className="cc-stamp" style={{ color: "#dcc28c" }}>Demo · read-only</span>
          ) : (
            <span className="cc-type text-xs text-[#e7dcc4]/70 hidden md:inline">{info?.fullName}</span>
          )}
          <Link to="/admin/orders" className="cc-btn cc-btn-dark" aria-label={`Pending orders: ${pending.length}`}>
            <Stamp className="w-4 h-4" aria-hidden="true" />
            Orders
            <span className={`ml-1 min-w-[22px] px-1.5 text-center ${pending.length ? "bg-[#c1272d] text-white" : "bg-white/10"}`}>{pending.length}</span>
          </Link>
          <a href={SITE_URL} target="_blank" rel="noreferrer" className="cc-btn cc-btn-dark" aria-label="Open the live site">
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Site</span>
          </a>
          <button type="button" onClick={onSignOut} className="cc-btn cc-btn-dark" aria-label="Sign out">
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {dispatch && <DispatchBanner dispatch={dispatch} />}
      </header>

      <div className="max-w-[1500px] w-full mx-auto px-4 py-5 flex-1 flex flex-col lg:flex-row gap-5">
        <nav aria-label="Rooms" className="lg:w-60 shrink-0">
          <ul className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {ROOMS.map((r) => (
              <li key={r.to} className="shrink-0">
                <NavLink to={r.to} end={r.end} className="cc-tab">
                  <r.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="leading-tight">
                    <span className="block font-heading font-bold text-sm">{r.am}</span>
                    <span className="block cc-type text-[10px] uppercase tracking-widest opacity-70">{r.en}</span>
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 min-w-0">
          <Routes>
            <Route index element={<Situation />} />
            <Route path="c/:key" element={<CollectionRoom />} />
            <Route path="c/:key/:id" element={<RecordEditor />} />
            <Route path="media" element={<MediaRoom />} />
            <Route path="dispatches" element={<DispatchesRoom />} />
            <Route path="settings" element={<SettingsRoom />} />
            <Route path="team" element={<TeamRoom />} />
            <Route path="orders" element={<OrdersRoom />} />
            <Route path="*" element={<Situation />} />
          </Routes>
        </main>
      </div>

      <Ticker />
    </div>
  );
}

function DispatchBanner({ dispatch }) {
  const text = {
    publishing: "Dispatch sent — the site is being rebuilt (about 1–2 minutes)…",
    live: "Dispatch is live on the site.",
    slow: "Dispatch sent, but the site hasn't confirmed it yet. Check Netlify if this persists.",
  }[dispatch.status];
  return (
    <div className={`${dispatch.status === "live" ? "bg-[#2f5a32]" : "bg-[#5e0a0f]"} text-white`}>
      <p className="max-w-[1500px] mx-auto px-4 py-2 cc-type text-xs tracking-wide" role="status">
        {text} <span className="opacity-70">({dispatch.sha.slice(0, 7)})</span>
      </p>
    </div>
  );
}

function Ticker() {
  const { source, dispatch } = useCommand();
  const [items, setItems] = useState([]);
  useEffect(() => {
    source
      .recentCommits(8)
      .then((list) => setItems(list))
      .catch(() => setItems([]));
  }, [source, dispatch?.sha]);
  if (!items.length) return null;
  return (
    <footer className="cc-ticker cc-type text-xs py-2" aria-label="Recent dispatches">
      <span className="cc-ticker-track">
        {items.map((c) => (
          <span key={c.sha} className="mr-12">
            ✦ {new Date(c.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} — {c.message.split("\n")[0]}
          </span>
        ))}
      </span>
    </footer>
  );
}
