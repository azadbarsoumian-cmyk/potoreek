import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { content } from "@/api/content";
import { Image } from "@/components/ui/image";
import { useLanguage } from "@/lib/LanguageContext";

export default function VideosAndNews() {
  const { lang } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [news, setNews] = useState([]);

  useEffect(() => {
    content.Video.list("-created_date", 4).then(setVideos);
    content.NewsItem.list("-created_date", 4).then(setNews);
  }, []);

  const [featured, ...rest] = videos;

  return (
    <section className="bg-vitrine text-white py-16 border-y border-brass/20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
        <div className="md:col-span-2">
          <h2 className="font-heading text-3xl md:text-4xl font-bold">Տեսանիւթեր</h2>
          <p className="text-white/60 mt-2">Short films and episodes on the people and places of the movement.</p>
          {featured && (
            <Link to="/videos" className="mt-8 block relative aspect-video bg-white/5 border border-white/10 overflow-hidden group">
              <Image src={featured.thumbnail_url} alt={featured.title_en} fittingType="fill" className="w-full h-full opacity-70 group-hover:opacity-90 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-brass" />
              </div>
              <div className="absolute bottom-4 left-4 flex items-baseline gap-3">
                <span className="font-bold">{lang === "am" ? featured.title_am : featured.title_en}</span>
                <span className="text-xs text-white/60">{featured.length}</span>
              </div>
            </Link>
          )}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {rest.map((v) => (
              <Link key={v.id} to="/videos" className="relative aspect-video bg-white/5 border border-white/10 overflow-hidden group">
                <Image src={v.thumbnail_url} alt={v.title_en} fittingType="fill" className="w-full h-full opacity-60 group-hover:opacity-90 transition-opacity" />
                <PlayCircle className="absolute inset-0 m-auto w-8 h-8 text-brass/80" />
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-heading text-3xl font-bold">Լուրեր</h2>
          <div className="mt-6 divide-y divide-white/15">
            {news.map((n) => (
              <div key={n.id} className="py-4">
                <p className="text-xs uppercase tracking-widest text-[#C1272D]">{lang === "am" ? n.type_am : n.type_en} · {n.date}</p>
                <p className="mt-1 font-medium">{n.title}</p>
              </div>
            ))}
          </div>
          <Link to="/news" className="inline-block mt-4 text-sm uppercase tracking-widest underline hover:text-[#C1272D]">Բոլոր լուրերը</Link>
        </div>
      </div>
    </section>
  );
}