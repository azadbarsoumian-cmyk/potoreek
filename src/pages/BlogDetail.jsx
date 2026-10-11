import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { content } from "@/api/content";
import { ArrowLeft } from "lucide-react";

export default function BlogDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(undefined);

  useEffect(() => {
    content.BlogPost.get(id).then(setPost).catch(() => setPost(null));
  }, [id]);

  if (post === undefined) return <p className="max-w-3xl mx-auto px-6 py-20 text-black/50">Loading...</p>;
  if (post === null) return <p className="max-w-3xl mx-auto px-6 py-20 text-black/50">Post not found.</p>;

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <Link to="/blog" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-black/60 hover:text-[#C1272D] mb-8">
        <ArrowLeft className="w-4 h-4" /> Բլոգ
      </Link>
      <p className="text-xs uppercase tracking-widest text-black/40">{post.date}</p>
      <h1 className="font-heading text-4xl font-bold mt-3 break-words">{post.title}</h1>
      {post.image_url && <img src={post.image_url} alt={post.title} className="w-full mt-6" />}
      <div
        className="mt-6 text-lg text-black/70 leading-relaxed [&_a]:text-[#C1272D] [&_a]:underline [&_img]:max-w-full [&_img]:h-auto"
        dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }}
      />
      {post.source_url && (
        <a
          href={post.source_url}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-8 text-sm uppercase tracking-widest text-black/60 hover:text-[#C1272D]"
        >
          Source: arftroshag.blogspot.com
        </a>
      )}
    </article>
  );
}