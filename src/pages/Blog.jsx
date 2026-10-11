import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { content } from "@/api/content";

const PAGE_SIZE = 30;

export default function Blog() {
  const [posts, setPosts] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    content.BlogPost.list("-date", PAGE_SIZE).then((initial) => {
      setPosts(initial);
      setHasMore(initial.length === PAGE_SIZE);
    });
  }, []);

  const handleLoadMore = async () => {
    const last = posts[posts.length - 1];
    const tieIds = posts.filter((p) => p.date === last.date).map((p) => p.id);
    setLoadingMore(true);
    const next = await content.BlogPost.filter(
      { date: { $lte: last.date }, id: { $nin: tieIds } },
      "-date",
      PAGE_SIZE
    );
    setPosts((prev) => [...prev, ...next]);
    setHasMore(next.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-heading text-5xl font-bold">Բլոգ</h1>
      <p className="text-black/60 mt-3">Notes from the team: how we find, translate and rebuild the record.</p>
      {!posts && <p className="mt-10 text-black/50">Loading...</p>}
      <div className="divide-y divide-black/10 mt-10">
        {posts && posts.map((p) => (
          <Link key={p.id} to={`/blog/${p.id}`} className="group flex items-baseline justify-between py-6 gap-4">
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-2xl group-hover:text-[#C1272D] transition-colors break-words">{p.title}</h3>
              <p className="text-black/60 mt-2 break-words">{p.excerpt}</p>
            </div>
            <span className="text-xs text-black/40 shrink-0">{p.date}</span>
          </Link>
        ))}
      </div>
      {posts && hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="mt-10 w-full border border-black/20 py-3 text-sm uppercase tracking-widest hover:border-[#C1272D] hover:text-[#C1272D] transition-colors disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Աւելին · Load more"}
        </button>
      )}
    </div>
  );
}