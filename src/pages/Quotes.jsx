import React, { useEffect, useState } from "react";
import { content } from "@/api/content";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/lib/LanguageContext";

export default function Quotes() {
  const { lang } = useLanguage();
  const [quotes, setQuotes] = useState(null);
  const [author, setAuthor] = useState("all");
  const [subject, setSubject] = useState("all");

  useEffect(() => {
    content.Quote.list("-created_date").then(setQuotes);
  }, []);

  const authors = quotes ? [...new Set(quotes.map((q) => q.author_en))] : [];
  const subjects = quotes ? [...new Set(quotes.map((q) => q.subject_en))] : [];
  const filtered = quotes && quotes.filter(
    (q) => (author === "all" || q.author_en === author) && (subject === "all" || q.subject_en === subject)
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="font-heading text-5xl font-bold">Քաղվածքներ</h1>
      <p className="text-black/60 mt-3">Sayings from the era, grouped by author and by subject.</p>

      <div className="flex flex-wrap gap-4 mt-8 mb-12">
        <div>
          <Select value={author} onValueChange={setAuthor}>
            <SelectTrigger className="w-56 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All authors</SelectItem>
              {authors.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-56 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!quotes && <p className="text-black/50">Loading...</p>}
      <div className="grid md:grid-cols-3 gap-8">
        {filtered && filtered.map((q) => (
          <figure key={q.id} className="border-t-2 border-black/10 pt-5">
            <blockquote className="font-heading text-lg leading-relaxed">
              {lang === "am" ? q.text_am : q.text_en}
            </blockquote>
            <figcaption className="mt-4 text-sm text-black/50">
              — {lang === "am" ? q.author_am : q.author_en}
            </figcaption>
            <span className="inline-block mt-3 text-xs uppercase tracking-widest text-[#C1272D]">
              {lang === "am" ? q.subject_am : q.subject_en}
            </span>
          </figure>
        ))}
      </div>
    </div>
  );
}