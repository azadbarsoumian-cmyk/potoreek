// What the Command Center can edit. Each collection maps to a JSON file in
// public/data/ (see src/api/content.js); long-form collections keep a light
// index plus one detail file per record holding the body text.
import taxonomy from "@/config/taxonomy.json";
import { REGIONS } from "@/lib/regions";

const regionOptions = REGIONS.map((r) => ({ am: r.am, en: r.key }));
const newsTypes = [
  { am: "Լուր", en: "News" },
  { am: "Յայտարարութիւն", en: "Announcement" },
];

export const COLLECTIONS = [
  {
    key: "stories",
    am: "Պատմութիւններ",
    en: "Archive stories",
    file: "public/data/stories.json",
    detailDir: "public/data/stories",
    body: "content_en",
    sitePath: (r) => `/stories/${r.id}`,
    title: (r) => r.title_am || r.title_en,
    meta: (r) => [r.year, r.category_en, r.region_en].filter(Boolean).join(" · "),
    image: (r) => r.image_url,
    search: ["title_am", "title_en", "excerpt_en", "category_en", "region_en", "year"],
    filters: [{ field: "category_en", options: taxonomy.archiveCategories.map((c) => c.en) }],
    fields: [
      { name: "title_am", label: "Վերնագիր · Title (Armenian)", type: "text", required: true },
      { name: "title_en", label: "Title (English)", type: "text", required: true },
      { label: "Բաժին · Category", type: "pair", fields: { am: "category_am", en: "category_en" }, options: taxonomy.archiveCategories, required: true },
      { name: "year", label: "Տարի · Year", type: "text", placeholder: "1897" },
      { label: "Շրջան · Region (map)", type: "pair", fields: { am: "region_am", en: "region_en" }, options: regionOptions },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "image_url", label: "Image", type: "image" },
      { name: "excerpt_en", label: "Excerpt (shown on cards)", type: "textarea", rows: 3 },
      { name: "content_en", label: "Full text (HTML allowed)", type: "html" },
      { name: "source_url", label: "Source link", type: "url" },
    ],
  },
  {
    key: "blog",
    am: "Բլոգ",
    en: "Blog posts",
    file: "public/data/blog-posts.json",
    detailDir: "public/data/blog-posts",
    body: "content",
    sitePath: (r) => `/blog/${r.id}`,
    title: (r) => r.title,
    meta: (r) => r.date,
    image: (r) => r.image_url,
    search: ["title", "excerpt", "date"],
    fields: [
      { name: "title", label: "Վերնագիր · Title", type: "text", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "image_url", label: "Image", type: "image" },
      { name: "excerpt", label: "Excerpt", type: "textarea", rows: 3, required: true },
      { name: "content", label: "Full text (HTML allowed)", type: "html" },
      { name: "source_url", label: "Source link", type: "url" },
    ],
  },
  {
    key: "poems",
    am: "Բանաստեղծութիւններ",
    en: "Poems",
    file: "public/data/poems.json",
    sitePath: () => "/poems",
    title: (r) => r.title_am || r.title_en,
    meta: (r) => [r.author_en || r.author_am, r.year].filter(Boolean).join(" · "),
    search: ["title_am", "title_en", "author_am", "author_en", "excerpt_am", "excerpt_en"],
    fields: [
      { name: "title_am", label: "Վերնագիր · Title (Armenian)", type: "text", required: true },
      { name: "title_en", label: "Title (English)", type: "text", required: true },
      { name: "author_am", label: "Հեղինակ · Author (Armenian)", type: "text" },
      { name: "author_en", label: "Author (English)", type: "text" },
      { name: "year", label: "Տարի · Year", type: "text" },
      { name: "excerpt_am", label: "Text (Armenian)", type: "textarea", rows: 8 },
      { name: "excerpt_en", label: "Text or note (English)", type: "textarea", rows: 4 },
      { name: "source_url", label: "Source link", type: "url" },
    ],
  },
  {
    key: "quotes",
    am: "Քաղուածքներ",
    en: "Quotes",
    file: "public/data/quotes.json",
    sitePath: () => "/quotes",
    title: (r) => r.text_am || r.text_en,
    meta: (r) => [r.author_en || r.author_am, r.subject_en].filter(Boolean).join(" · "),
    search: ["text_am", "text_en", "author_am", "author_en", "subject_en"],
    filters: [{ field: "subject_en", options: taxonomy.quoteSubjects.map((s) => s.en) }],
    fields: [
      { name: "text_am", label: "Քաղուածք · Quote (Armenian)", type: "textarea", rows: 3, required: true },
      { name: "text_en", label: "Quote (English)", type: "textarea", rows: 3, required: true },
      { name: "author_am", label: "Հեղինակ · Author (Armenian)", type: "text" },
      { name: "author_en", label: "Author (English)", type: "text" },
      { label: "Նիւթ · Subject", type: "pair", fields: { am: "subject_am", en: "subject_en" }, options: taxonomy.quoteSubjects },
    ],
  },
  {
    key: "products",
    am: "Խանութ",
    en: "Shop products",
    file: "public/data/products.json",
    sitePath: () => "/shop",
    title: (r) => r.title,
    meta: (r) => [r.category_en, r.age_group, r.price_label].filter(Boolean).join(" · "),
    search: ["title", "description", "category_en"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "category_am", label: "Category (Armenian)", type: "text" },
      { name: "category_en", label: "Category (English)", type: "text" },
      { name: "age_group", label: "Readers", type: "select", options: ["kids", "12-15", "adults"], required: true },
      { name: "price_label", label: "Price label", type: "text", placeholder: "$24 or Coming soon", required: true },
      { name: "badge_color", label: "Cover colour", type: "select", options: ["red", "black", "cream", "grey"] },
      { name: "description", label: "Description", type: "textarea", rows: 4, required: true },
    ],
  },
  {
    key: "videos",
    am: "Տեսանիւթեր",
    en: "Videos",
    file: "public/data/videos.json",
    sitePath: () => "/videos",
    title: (r) => r.title_am || r.title_en,
    meta: (r) => [r.category_en, r.length, r.is_featured ? "featured" : ""].filter(Boolean).join(" · "),
    image: (r) => r.thumbnail_url,
    search: ["title_am", "title_en", "category_en"],
    fields: [
      { name: "title_am", label: "Վերնագիր · Title (Armenian)", type: "text", required: true },
      { name: "title_en", label: "Title (English)", type: "text", required: true },
      { name: "category_am", label: "Category (Armenian)", type: "text" },
      { name: "category_en", label: "Category (English)", type: "text" },
      { name: "length", label: "Length", type: "text", placeholder: "12 min" },
      { name: "thumbnail_url", label: "Thumbnail", type: "image" },
      { name: "is_featured", label: "Featured (big player on the homepage)", type: "boolean" },
    ],
  },
  {
    key: "news",
    am: "Լուրեր",
    en: "News",
    file: "public/data/news.json",
    sitePath: () => "/news",
    title: (r) => r.title,
    meta: (r) => [r.type_en, r.date].filter(Boolean).join(" · "),
    search: ["title", "type_en", "date"],
    fields: [
      { label: "Տեսակ · Type", type: "pair", fields: { am: "type_am", en: "type_en" }, options: newsTypes, required: true },
      { name: "title", label: "Headline", type: "text", required: true },
      { name: "date", label: "Date label", type: "text", placeholder: "Oct 2026", required: true },
    ],
  },
];

export const collectionByKey = (key) => COLLECTIONS.find((c) => c.key === key);

// Which fields belong in the light index file for a long-form collection.
export const indexRow = (col, record) => {
  const { [col.body]: _body, updated_date: _u, ...rest } = record;
  return rest;
};

// Missing required fields, by label.
export function missingFields(col, record) {
  return col.fields
    .filter((f) => f.required)
    .filter((f) => (f.type === "pair" ? !record[f.fields.en] : !String(record[f.name] ?? "").trim()))
    .map((f) => f.label);
}
