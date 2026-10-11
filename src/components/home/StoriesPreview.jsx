import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { content } from "@/api/content";
import StoryCard from "@/components/shared/StoryCard";
import { useLanguage } from "@/lib/LanguageContext";

export default function StoriesPreview() {
  const { lang } = useLanguage();
  const [stories, setStories] = useState([]);

  useEffect(() => {
    content.Story.list("-created_date", 4).then(setStories);
  }, []);

  if (stories.length === 0) return null;
  const [featured, ...rest] = stories;

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-10">
        <div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold">Պատմութիւններ</h2>
          <p className="text-black/60 mt-2">{lang === "am" ? "Ապրողներ մեզի պատմած՝ մեր օրերու համար։" : "Stories from the archive, retold for today's readers."}</p>
        </div>
        <Link to="/stories" className="text-sm uppercase tracking-widest underline hover:text-[#C1272D]">
          Բոլոր պատմութիւնները
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-12">
        <StoryCard story={featured} large />
        <div className="flex flex-col divide-y divide-black/10">
          {rest.map((s) => (
            <div key={s.id} className="py-5 first:pt-0">
              <StoryLine story={s} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryLine({ story }) {
  const { lang } = useLanguage();
  return (
    <Link to={`/stories/${story.id}`} className="group flex items-start gap-4">
      <span className="font-heading text-xl font-bold text-[#C1272D] border border-black/20 px-2 py-1 text-center shrink-0">{story.year}</span>
      <div>
        <p className="text-xs uppercase tracking-widest text-black/50">{lang === "am" ? story.category_am : story.category_en}</p>
        <h3 className="font-heading font-bold text-lg group-hover:text-[#C1272D] transition-colors">
          {lang === "am" ? story.title_am : story.title_en}
        </h3>
        <p className="text-sm text-black/60 mt-1 line-clamp-2">{story.excerpt_en}</p>
      </div>
    </Link>
  );
}