import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { content } from "@/api/content";
import { Image } from "@/components/ui/image";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function StoryDetail() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [story, setStory] = useState(undefined);

  useEffect(() => {
    content.Story.get(id).then(setStory).catch(() => setStory(null));
  }, [id]);

  if (story === undefined) return <p className="max-w-3xl mx-auto px-6 py-20 text-black/50">Loading...</p>;
  if (story === null) return <p className="max-w-3xl mx-auto px-6 py-20 text-black/50">Story not found.</p>;

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <Link to="/stories" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-black/60 hover:text-[#C1272D] mb-8">
        <ArrowLeft className="w-4 h-4" /> Բոլոր պատմութիւնները
      </Link>
      {story.image_url && (
        <div className="aspect-[16/9] overflow-hidden mb-8">
          <Image src={story.image_url} alt={story.title_en} fittingType="fill" className="w-full h-full" />
        </div>
      )}
      <p className="text-xs uppercase tracking-widest text-[#C1272D]">
        {lang === "am" ? story.category_am : story.category_en} · {story.year}
      </p>
      <h1 className="font-heading text-4xl md:text-5xl font-bold mt-3">
        {lang === "am" ? story.title_am : story.title_en}
      </h1>
      {story.fidayis?.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-3" aria-label={lang === "am" ? "Ֆէտայիներ" : "Fedayi in this story"}>
          {story.fidayis.map((f) => (
            <li key={f.slug}>
              <Link to={`/fidayi/${f.slug}`} className="flex items-center gap-3 pr-4 border border-black/15 hover:border-[#C1272D] bg-white/50 transition-colors">
                {f.portrait_url && <img src={f.portrait_url} alt="" className="w-11 h-11 object-cover grayscale" />}
                <span className="font-heading font-bold text-sm py-3 pl-1">{lang === "am" ? f.name_am : f.name_en}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {(story.content_en || story.excerpt_en) && /<[a-z][\s\S]*>/i.test(story.content_en || story.excerpt_en) ? (
        <div
          className="mt-6 text-lg text-black/70 leading-relaxed [&_img]:max-w-full [&_h3]:mt-6 [&_h3]:font-bold [&_h3]:text-xl [&_p]:my-3 [&_a]:text-[#C1272D]"
          dangerouslySetInnerHTML={{ __html: story.content_en || story.excerpt_en }}
        />
      ) : (
        <p className="mt-6 text-lg text-black/70 leading-relaxed">{story.content_en || story.excerpt_en}</p>
      )}
    </article>
  );
}