import React, { useEffect, useState } from "react";
import { content } from "@/api/content";
import StoryCard from "@/components/shared/StoryCard";

const PAGE_SIZE = 24;

export default function Stories() {
  const category = new URLSearchParams(window.location.search).get("category");
  const [stories, setStories] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const query = category ? { category_en: category } : {};
    content.Story.filter(query, "-created_date", PAGE_SIZE).then((initial) => {
      setStories(initial);
      setHasMore(initial.length === PAGE_SIZE);
    });
  }, [category]);

  const handleLoadMore = async () => {
    const last = stories[stories.length - 1];
    setLoadingMore(true);
    const query = { created_date: { $lte: last.created_date }, id: { $nin: stories.filter((s) => s.created_date === last.created_date).map((s) => s.id) } };
    if (category) query.category_en = category;
    const next = await content.Story.filter(query, "-created_date", PAGE_SIZE);
    setStories((prev) => [...prev, ...next]);
    setHasMore(next.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="font-heading text-5xl font-bold">Պատմութիւններ</h1>
      <p className="text-black/60 mt-3 max-w-xl">Stories from the archive, retold for today's readers.{category ? ` — ${category}` : ""}</p>
      {!stories && <p className="mt-10 text-black/50">Loading...</p>}
      {stories && stories.length === 0 && <p className="mt-10 text-black/50">No stories in this category yet.</p>}
      <div className="grid md:grid-cols-3 gap-10 mt-12">
        {stories && stories.map((s) => <StoryCard key={s.id} story={s} />)}
      </div>
      {stories && hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="mt-12 w-full border border-black/20 py-3 text-sm uppercase tracking-widest hover:border-[#C1272D] hover:text-[#C1272D] transition-colors disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Աւելին · Load more"}
        </button>
      )}
    </div>
  );
}