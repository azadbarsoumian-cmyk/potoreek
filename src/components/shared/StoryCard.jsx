import React, { Suspense, lazy, useState } from "react";
import { Link } from "react-router-dom";

// three.js is large, so the hologram viewer loads only when a visitor opens one.
const HoloViewer = lazy(() => import("./HoloViewer"));
import { Image } from "@/components/ui/image";
import { useLanguage } from "@/lib/LanguageContext";

export default function StoryCard({ story, large = false, dark = false }) {
  const { lang } = useLanguage();
  const [holo, setHolo] = useState(false);
  return (
    <div className="group">
      <Link to={`/stories/${story.id}`} className="block">
        <div className={`relative overflow-hidden bg-black ${large ? "aspect-[4/3]" : "aspect-[4/3]"}`}>
          {story.image_url && (
            <Image
              src={story.image_url}
              alt={story.title_en}
              fittingType="fill"
              className="w-full h-full transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <span className={`absolute bottom-4 left-4 font-heading font-black text-white ${large ? "text-5xl md:text-6xl" : "text-3xl"}`}>
            {story.year}
          </span>
        </div>
        <p className="mt-4 text-xs uppercase tracking-widest text-[#C1272D]">
          {lang === "am" ? story.category_am : story.category_en}
        </p>
      </Link>
      <h3
        onClick={() => setHolo(true)}
        className={`font-heading font-bold mt-1 cursor-pointer ${large ? "text-3xl" : "text-xl"} group-hover:text-[#C1272D] transition-colors ${dark ? "text-white" : ""}`}
      >
        {lang === "am" ? story.title_am : story.title_en}
      </h3>
      {story.excerpt_en && (
        <p className={`mt-2 text-sm leading-relaxed line-clamp-2 ${dark ? "text-white/50" : "text-black/60"}`}>{story.excerpt_en}</p>
      )}
      {holo && (
        <Suspense fallback={null}>
          <HoloViewer story={story} onClose={() => setHolo(false)} />
        </Suspense>
      )}
    </div>
  );
}