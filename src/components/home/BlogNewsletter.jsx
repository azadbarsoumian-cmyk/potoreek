import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { content } from "@/api/content";
import { submitForm } from "@/lib/forms";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function BlogNewsletter() {
  const [posts, setPosts] = useState([]);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    content.BlogPost.list("-date", 3).then(setPosts);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError(false);
    try {
      await submitForm("newsletter", { email });
      setSubscribed(true);
    } catch {
      setError(true);
    }
    setSending(false);
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="font-heading text-4xl font-bold">Բլոգ</h2>
        <p className="text-black/60 mt-2 mb-10">Notes from the team: how we find, translate and rebuild the record.</p>
        <div className="divide-y divide-black/10">
          {posts.map((p) => (
            <Link key={p.id} to={`/blog/${p.id}`} className="group flex items-baseline justify-between py-5 gap-4">
              <div>
                <h3 className="font-heading font-bold text-xl group-hover:text-[#C1272D] transition-colors">{p.title}</h3>
                <p className="text-sm text-black/60 mt-1">{p.excerpt}</p>
              </div>
              <span className="text-xs text-black/40 shrink-0">{p.date}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#C1272D] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-heading text-3xl font-bold">Պահենք յիշողութիւնը։</h2>
            <p className="mt-3 text-white/85 max-w-md">Every page we digitize is funded by readers. Support the archive on Patreon, or get new stories by email.</p>
            <a href="https://patreon.com" target="_blank" rel="noreferrer" className="inline-block mt-6 bg-white text-black px-6 py-3 text-sm uppercase tracking-widest hover:bg-white/90 transition-colors">
              Support on Patreon
            </a>
          </div>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
            <label className="text-sm font-medium">Email for new stories</label>
            {subscribed ? (
              <p className="text-white/90">Thank you — you're on the list.</p>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white text-black"
                />
                <Button type="submit" disabled={sending} className="bg-black hover:bg-black/80 text-white shrink-0">Բաժանորդագրուիլ</Button>
              </div>
            )}
            {error && <p className="text-sm text-white">Something went wrong. Please try again.</p>}
          </form>
        </div>
      </section>
    </>
  );
}