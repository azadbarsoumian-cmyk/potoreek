import React, { useEffect, useState } from "react";
import { content } from "@/api/content";
import { Image } from "@/components/ui/image";
import { PlayCircle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Videos() {
  const { lang } = useLanguage();
  const [videos, setVideos] = useState(null);

  useEffect(() => {
    content.Video.list("-created_date").then(setVideos);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="font-heading text-5xl font-bold">Տեսանիւթեր</h1>
      <p className="text-black/60 mt-3 max-w-xl">Short films and episodes on the people and places of the movement.</p>
      {!videos && <p className="mt-10 text-black/50">Loading...</p>}
      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {videos && videos.map((v) => (
          <div key={v.id} className="group cursor-pointer">
            <div className="relative aspect-video bg-black overflow-hidden">
              <Image src={v.thumbnail_url} alt={v.title_en} fittingType="fill" className="w-full h-full opacity-70 group-hover:opacity-90 transition-opacity" />
              <PlayCircle className="absolute inset-0 m-auto w-12 h-12 text-white/90" />
            </div>
            <p className="mt-3 font-heading font-bold">{lang === "am" ? v.title_am : v.title_en}</p>
            <p className="text-sm text-black/50">{lang === "am" ? v.category_am : v.category_en} · {v.length}</p>
          </div>
        ))}
      </div>
    </div>
  );
}