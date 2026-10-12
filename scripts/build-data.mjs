// Builds public/data/ (what the website serves) from content/ (the editable
// archive). Only records with `published: true` are copied, so hidden records
// never reach the live site's files. Runs before `npm run dev` and `npm run build`.
//
// Also links the archive together for the public pages:
// - each published story's detail file gets `fidayis` (the published fedayi it belongs to)
// - each fedayi's detail keeps only links to published stories, quotes and poems

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const CONTENT = path.join(root, "content");
const OUT = path.join(root, "public", "data");

const ADMIN_ONLY = ["published", "notes"];
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const readList = (name) => {
  const p = path.join(CONTENT, `${name}.json`);
  return existsSync(p) ? readJson(p) : [];
};
const publicCopy = (r) => Object.fromEntries(Object.entries(r).filter(([k]) => !ADMIN_ONLY.includes(k)));
const isPublished = (r) => r.published === true;
const write = (rel, data) => {
  const file = path.join(OUT, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data));
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Simple collections
const published = {};
for (const name of ["poems", "quotes", "products", "videos", "news"]) {
  const rows = readList(name).filter(isPublished);
  published[name] = new Set(rows.map((r) => r.id));
  write(`${name}.json`, rows.map(publicCopy));
}

// Fedayi (index + detail)
const fidayiIndex = readList("fidayis").filter(isPublished);
const fidayis = fidayiIndex.map((row) => {
  const detailPath = path.join(CONTENT, "fidayis", `${row.id}.json`);
  return existsSync(detailPath) ? { ...row, ...readJson(detailPath) } : row;
});

// Stories and blog posts (index + one detail file each)
const stories = readList("stories").filter(isPublished);
published.stories = new Set(stories.map((r) => r.id));
const storyFidayis = {};
for (const f of fidayis) {
  for (const id of f.story_ids || []) {
    (storyFidayis[id] ||= []).push({ slug: f.slug, name_am: f.name_am, name_en: f.name_en, portrait_url: f.portrait_url });
  }
}
write("stories.json", stories.map(publicCopy));
for (const row of stories) {
  const detail = readJson(path.join(CONTENT, "stories", `${row.id}.json`));
  write(`stories/${row.id}.json`, { ...publicCopy(detail), ...(storyFidayis[row.id] ? { fidayis: storyFidayis[row.id] } : {}) });
}

const posts = readList("blog-posts").filter(isPublished);
write("blog-posts.json", posts.map(publicCopy));
for (const row of posts) write(`blog-posts/${row.id}.json`, publicCopy(readJson(path.join(CONTENT, "blog-posts", `${row.id}.json`))));

const keep = (ids, set) => (ids || []).filter((id) => set.has(id));
write(
  "fidayis.json",
  fidayiIndex.map((r) => ({
    ...publicCopy(r),
    story_ids: keep(r.story_ids, published.stories),
    quote_ids: keep(r.quote_ids, published.quotes),
    poem_ids: keep(r.poem_ids, published.poems),
  }))
);
for (const f of fidayis) {
  write(`fidayis/${f.id}.json`, {
    ...publicCopy(f),
    story_ids: keep(f.story_ids, published.stories),
    quote_ids: keep(f.quote_ids, published.quotes),
    poem_ids: keep(f.poem_ids, published.poems),
  });
}

console.log(
  `public data: ${stories.length} stories, ${posts.length} blog posts, ${fidayiIndex.length} fedayi, ` +
    ["poems", "quotes", "products", "videos", "news"].map((n) => `${published[n].size} ${n}`).join(", ")
);
