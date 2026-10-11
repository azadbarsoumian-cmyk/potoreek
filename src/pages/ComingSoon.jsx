import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { submitForm } from "@/lib/forms";
import { pickVideo } from "@/lib/video";

// Under-construction landing page: the Potoreek film on loop, a launch
// sign-up and the social links. Shown to everyone while UNDER_CONSTRUCTION
// is on (see src/lib/siteMode.js).
const FILM = {
  hd: "/video/potoreek-1080.mp4",
  sd: "/video/potoreek-720.mp4",
  poster: "/video/potoreek-poster.jpg",
};

const LINKS = [
  { label: "Patreon", href: "https://www.patreon.com/potoreek" },
  { label: "Instagram", href: "https://www.instagram.com/potoreek" },
  { label: "YouTube", href: "https://www.youtube.com/@potoreek" },
  { label: "TikTok", href: "https://www.tiktok.com/@potoreek" },
  { label: "Facebook", href: "https://www.facebook.com/potoreek" },
];

export default function ComingSoon() {
  const [src] = useState(() => pickVideo(FILM));
  const [muted, setMuted] = useState(true);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    try {
      await submitForm("newsletter", { email });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="h-[100svh] w-full flex flex-col bg-black text-white overflow-hidden">
      <h1 className="sr-only">Փոթորիկ · Potoreek — կայքը շուտով / site coming soon</h1>

      {/* The film. On tall phone screens it is letterboxed so its titles stay whole. */}
      <div className="relative flex-1 min-h-0">
        <img
          src={FILM.poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
        />
        <video
          className="intro-film absolute inset-0 w-full h-full"
          src={src}
          poster={FILM.poster}
          autoPlay
          muted={muted}
          loop
          playsInline
          aria-label="Potoreek film"
        />
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Միացնել ձայնը · Turn sound on" : "Անջատել ձայնը · Turn sound off"}
          className="absolute top-4 right-4 h-11 px-4 flex items-center gap-2 text-white/85 border border-white/25 bg-black/40 hover:text-white hover:border-white/60"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="font-mono text-[11px] uppercase tracking-widest" aria-hidden="true">
            {muted ? "Ձայն · Sound" : "Լռել · Mute"}
          </span>
        </button>
      </div>

      {/* Launch bar */}
      <footer className="shrink-0 border-t border-white/10 bg-[#0d0b0b] px-5 py-5">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          <div className="text-center lg:text-left">
            <p className="font-heading font-bold text-lg leading-tight">Կայքը շուտով</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-brass mt-1">Site coming soon</p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col sm:flex-row gap-2 lg:max-w-xl lg:mx-auto w-full">
            {status === "done" ? (
              <p className="text-sm text-white/80 py-3 text-center w-full">
                Շնորհակալութիւն — we'll email you when Potoreek launches.
              </p>
            ) : (
              <>
                <label htmlFor="launch-email" className="sr-only">
                  Email for launch news
                </label>
                <input
                  id="launch-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-11 px-4 bg-white text-black text-sm placeholder:text-black/40"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="h-11 px-5 whitespace-nowrap bg-[#C1272D] hover:bg-[#a11f24] text-white text-xs uppercase tracking-widest disabled:opacity-60"
                >
                  {status === "sending" ? "…" : "Տեղեկացուցէք ինծի · Notify me"}
                </button>
              </>
            )}
          </form>

          <nav aria-label="Potoreek elsewhere" className="flex flex-wrap justify-center lg:justify-end gap-x-4 gap-y-1">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white py-2"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        {status === "error" && (
          <p className="text-center text-sm text-[#ff8a8a] mt-2">Something went wrong. Please try again.</p>
        )}
      </footer>
    </main>
  );
}
