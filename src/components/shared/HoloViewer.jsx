import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, MousePointer2 } from "lucide-react";
import HoloPortrait from "./HoloPortrait";
import { useLanguage } from "@/lib/LanguageContext";

export default function HoloViewer({ story, onClose }) {
  const { lang } = useLanguage();
  const L = (am, en) => (lang === "am" ? am : en);
  const name = lang === "am" ? story.title_am : story.title_en;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl h-[80vh] border border-[#C1272D]/40 bg-black/70 shadow-[0_0_60px_rgba(193,39,45,0.25)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="corner-bracket corner-tl" />
        <span className="corner-bracket corner-tr" />
        <span className="corner-bracket corner-bl" />
        <span className="corner-bracket corner-br" />

        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-brass">
              {L("ՀՈԼՈԳՐԱՄ · ԹԻՎ ՖԱՅԼ", "HOLOGRAM · RECORD FILE")} {story.year ? `· ${story.year}` : ""}
            </p>
            <h2 className="font-heading font-bold text-2xl text-white mt-1">{name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-[#C1272D] transition-colors"
            aria-label={L("Փակել", "Close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="scanlines flex-1 min-h-0">
          <HoloPortrait imageUrl={story.image_url} name={name} year={story.year} />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
            <MousePointer2 className="w-3.5 h-3.5" />
            {L("ՔԱՇԵԼ՝ ՊՏՈՒԵԼՈՒ ՀԱՄԱՐ", "DRAG TO ROTATE")}
          </p>
          <Link
            to={`/stories/${story.id}`}
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-widest text-[#C1272D] hover:text-white transition-colors"
          >
            {L("ԲԱՐՑ ԱՄԲՈՂՋ ԹՂԹԱՅԹԻՒՆԸ", "OPEN FULL FILE")}
          </Link>
        </div>
      </div>
    </div>
  );
}