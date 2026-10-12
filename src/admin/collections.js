// What the Command Center can edit. Each collection maps to a JSON file in
// content/ (the editable archive); scripts/build-data.mjs publishes the records
// marked `published` into public/data/ for the site. Long-form collections keep
// a light index file plus one detail file per record (fields in `detailOnly`).
import taxonomy from "@/config/taxonomy.json";
import { REGIONS } from "@/lib/regions";

const regionPairs = REGIONS.map((r) => ({ am: r.am, en: r.key }));
const regionKeys = REGIONS.map((r) => ({ value: r.key, label: `${r.am} · ${r.en}` }));
const newsTypes = [
  { am: "Լուր", en: "News" },
  { am: "Յայտարարութիւն", en: "Announcement" },
];

const PUBLISHED = { name: "published", label: "Online · visible to the public", type: "boolean", wide: true };

export const COLLECTIONS = [
  {
    key: "stories",
    am: "Պատմութիւններ",
    en: "Archive stories",
    file: "content/stories.json",
    detailDir: "content/stories",
    detailOnly: ["content_en"],
    sitePath: (r) => `/stories/${r.id}`,
    title: (r) => r.title_am || r.title_en,
    meta: (r) => [r.year, r.category_en, r.region_en].filter(Boolean).join(" · "),
    image: (r) => r.image_url,
    search: ["title_am", "title_en", "excerpt_en", "category_en", "region_en", "year"],
    filters: [{ field: "category_en", options: taxonomy.archiveCategories.map((c) => c.en) }],
    fields: [
      PUBLISHED,
      { name: "title_am", label: "Վերնագիր · Title (Armenian)", type: "text", required: true },
      { name: "title_en", label: "Title (English)", type: "text", required: true },
      { label: "Բաժին · Category", type: "pair", fields: { am: "category_am", en: "category_en" }, options: taxonomy.archiveCategories, required: true },
      { name: "year", label: "Տարի · Year", type: "text", placeholder: "1897" },
      { label: "Շրջան · Region (map)", type: "pair", fields: { am: "region_am", en: "region_en" }, options: regionPairs },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "image_url", label: "Image", type: "image" },
      { name: "excerpt_en", label: "Excerpt (shown on cards)", type: "textarea", rows: 3 },
      { name: "content_en", label: "Full text (HTML allowed)", type: "html" },
      { name: "source_url", label: "Source link", type: "url" },
    ],
  },
  {
    key: "fidayis",
    am: "Ֆէտայիներ",
    en: "Fedayi registry",
    file: "content/fidayis.json",
    detailDir: "content/fidayis",
    // story_ids / quote_ids / poem_ids stay in the index so stories can show
    // their fedayi without opening every file.
    detailOnly: [
      "bio_am", "bio_en", "birth_place_am", "birth_place_en", "death_place_am", "death_place_en",
      "timeline", "gallery", "sources", "merch", "card_front_url", "card_back_url", "model_url", "notes",
    ],
    sitePath: (r) => `/fidayi/${r.slug}`,
    title: (r) => r.name_am || r.name_en,
    meta: (r) => [lifespan(r), r.region, (r.roles_en || []).join(", ")].filter(Boolean).join(" · "),
    image: (r) => r.portrait_url,
    search: ["name_am", "name_en", "aliases_am", "aliases_en", "region", "roles_en"],
    fields: [
      PUBLISHED,
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "name_am", label: "Անուն · Name (Armenian)", type: "text", required: true },
      { name: "name_en", label: "Name (English)", type: "text", required: true },
      { name: "slug", label: "Page address (potoreek.com/fidayi/…)", type: "slug", from: "name_en", required: true },
      { name: "aliases_am", label: "Other names (Armenian), one per line", type: "list" },
      { name: "aliases_en", label: "Other names (English), one per line", type: "list" },
      { name: "birth_year", label: "Born (year)", type: "text" },
      { name: "death_year", label: "Died (year)", type: "text" },
      { name: "region", label: "Region (map)", type: "select", options: regionKeys },
      { name: "roles_en", label: "Roles, one per line", type: "list" },
      { name: "portrait_url", label: "Portrait", type: "image" },
      { name: "birth_place_am", label: "Birthplace (Armenian)", type: "text" },
      { name: "birth_place_en", label: "Birthplace (English)", type: "text" },
      { name: "death_place_am", label: "Place of death (Armenian)", type: "text" },
      { name: "death_place_en", label: "Place of death (English)", type: "text" },
      { name: "bio_am", label: "Կենսագրութիւն · Biography (Armenian, HTML allowed)", type: "html" },
      { name: "bio_en", label: "Biography (English, HTML allowed)", type: "html" },
      {
        name: "timeline",
        label: "Timeline",
        type: "repeater",
        item: [
          { name: "year", label: "Year", type: "text" },
          { name: "text_am", label: "Event (Armenian)", type: "text" },
          { name: "text_en", label: "Event (English)", type: "text" },
        ],
      },
      {
        name: "gallery",
        label: "Photo gallery",
        type: "repeater",
        item: [
          { name: "url", label: "Image", type: "image" },
          { name: "caption", label: "Caption", type: "text" },
        ],
      },
      {
        name: "sources",
        label: "Sources",
        type: "repeater",
        item: [
          { name: "label", label: "Source", type: "text" },
          { name: "url", label: "Link", type: "url" },
        ],
      },
      { name: "story_ids", label: "Stories about him / her", type: "relations", collection: "stories" },
      { name: "quote_ids", label: "Quotes", type: "relations", collection: "quotes" },
      { name: "poem_ids", label: "Poems", type: "relations", collection: "poems" },
      { name: "notes", label: "Research notes (never shown on the site)", type: "textarea", rows: 4 },
    ],
  },
  {
    key: "blog",
    am: "Բլոգ",
    en: "Blog posts",
    file: "content/blog-posts.json",
    detailDir: "content/blog-posts",
    detailOnly: ["content"],
    sitePath: (r) => `/blog/${r.id}`,
    title: (r) => r.title,
    meta: (r) => r.date,
    image: (r) => r.image_url,
    search: ["title", "excerpt", "date"],
    fields: [
      PUBLISHED,
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
    file: "content/poems.json",
    sitePath: () => "/poems",
    title: (r) => r.title_am || r.title_en,
    meta: (r) => [r.author_en || r.author_am, r.year].filter(Boolean).join(" · "),
    search: ["title_am", "title_en", "author_am", "author_en", "excerpt_am", "excerpt_en"],
    fields: [
      PUBLISHED,
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
    file: "content/quotes.json",
    sitePath: () => "/quotes",
    title: (r) => r.text_am || r.text_en,
    meta: (r) => [r.author_en || r.author_am, r.subject_en].filter(Boolean).join(" · "),
    search: ["text_am", "text_en", "author_am", "author_en", "subject_en"],
    filters: [{ field: "subject_en", options: taxonomy.quoteSubjects.map((s) => s.en) }],
    fields: [
      PUBLISHED,
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
    file: "content/products.json",
    sitePath: () => "/shop",
    title: (r) => r.title,
    meta: (r) => [r.category_en, r.age_group, r.price_label].filter(Boolean).join(" · "),
    image: (r) => r.image_url,
    search: ["title", "description", "category_en"],
    fields: [
      PUBLISHED,
      { name: "title", label: "Title", type: "text", required: true },
      { name: "category_am", label: "Category (Armenian)", type: "text" },
      { name: "category_en", label: "Category (English)", type: "text" },
      { name: "age_group", label: "Readers", type: "select", options: ["kids", "12-15", "adults"], required: true },
      { name: "price_label", label: "Price label", type: "text", placeholder: "$24 or Coming soon", required: true },
      { name: "badge_color", label: "Cover colour (when there's no image)", type: "select", options: ["red", "black", "cream", "grey"] },
      { name: "image_url", label: "Product image", type: "image" },
      { name: "description", label: "Description", type: "textarea", rows: 4, required: true },
      { name: "fidayi_id", label: "Fedayi (for merchandise)", type: "relation", collection: "fidayis" },
    ],
  },
  {
    key: "videos",
    am: "Տեսանիւթեր",
    en: "Videos",
    file: "content/videos.json",
    sitePath: () => "/videos",
    title: (r) => r.title_am || r.title_en,
    meta: (r) => [r.category_en, r.length, r.is_featured ? "featured" : ""].filter(Boolean).join(" · "),
    image: (r) => r.thumbnail_url,
    search: ["title_am", "title_en", "category_en"],
    fields: [
      PUBLISHED,
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
    file: "content/news.json",
    sitePath: () => "/news",
    title: (r) => r.title,
    meta: (r) => [r.type_en, r.date].filter(Boolean).join(" · "),
    search: ["title", "type_en", "date"],
    fields: [
      PUBLISHED,
      { label: "Տեսակ · Type", type: "pair", fields: { am: "type_am", en: "type_en" }, options: newsTypes, required: true },
      { name: "title", label: "Headline", type: "text", required: true },
      { name: "date", label: "Date label", type: "text", placeholder: "Oct 2026", required: true },
    ],
  },
];

export function lifespan(r) {
  if (!r.birth_year && !r.death_year) return "";
  return `${r.birth_year || "?"}–${r.death_year || "?"}`;
}

export const collectionByKey = (key) => COLLECTIONS.find((c) => c.key === key);

// The light index row for a long-form record (detail-only fields removed).
export const indexRow = (col, record) => {
  const row = { ...record };
  delete row.updated_date;
  for (const f of col.detailOnly || []) delete row[f];
  return row;
};

// Missing required fields, by label.
export function missingFields(col, record) {
  return col.fields
    .filter((f) => f.required)
    .filter((f) => (f.type === "pair" ? !record[f.fields.en] : !String(record[f.name] ?? "").trim()))
    .map((f) => f.label);
}

// Armenian → Latin (a readable transliteration for names and page addresses).
const ARM = {
  ա: "a", բ: "b", գ: "g", դ: "d", ե: "e", զ: "z", է: "e", ը: "y", թ: "t", ժ: "zh", ի: "i", լ: "l", խ: "kh", ծ: "ts",
  կ: "k", հ: "h", ձ: "dz", ղ: "gh", ճ: "ch", մ: "m", յ: "y", ն: "n", շ: "sh", ո: "o", չ: "ch", պ: "p", ջ: "j", ռ: "r",
  ս: "s", վ: "v", տ: "t", ր: "r", ց: "ts", ւ: "v", փ: "p", ք: "k", օ: "o", ֆ: "f", և: "ev",
};
export const hasArmenian = (s) => /[Ա-֏]/.test(String(s || ""));
export function transliterate(s) {
  const lower = String(s || "")
    .replace(/[՚-՟։֊]/g, "") // Armenian punctuation marks
    .replace(/Ու|ՈՒ/g, "U")
    .replace(/ու/g, "u")
    .replace(/իւ/g, "yu") // classical spelling: Աղբիւր → Aghbyur
    .replace(/ԵԱ|Եա/g, "Ya")
    .replace(/եա/g, "ya"); // -եան → -yan
  const out = [...lower].map((ch) => {
    const low = ch.toLowerCase();
    if (!(low in ARM)) return ch;
    const t = ARM[low];
    return ch === low ? t : t.charAt(0).toUpperCase() + t.slice(1);
  });
  return out.join("").replace(/\s+/g, " ").trim();
}

// Slug for page addresses: lowercase ascii words joined by hyphens.
export const toSlug = (s) =>
  transliterate(s)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
