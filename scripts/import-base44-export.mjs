// One-off migration: turns the Base44 data export (potorik-all-data.json)
// into the static files under public/data/ that src/api/content.js reads.
// Images hosted on Base44's media server are downloaded into public/images/
// so the site no longer depends on Base44.
//
// Usage: node scripts/import-base44-export.mjs <path-to-potorik-all-data.json>

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const exportPath = process.argv[2];
if (!exportPath) {
  console.error("Usage: node scripts/import-base44-export.mjs <potorik-all-data.json>");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "public", "data");
const imageDir = path.join(root, "public", "images");
const BASE44_MEDIA = /^https:\/\/media\.base44\.com\/images\/public\/[a-f0-9]+\/([^/?#]+)$/;

const { entities } = JSON.parse((await readFile(exportPath, "utf8")).replace(/^﻿/, ""));

const downloads = new Map();
function localizeImage(url) {
  const match = typeof url === "string" && url.match(BASE44_MEDIA);
  if (!match) return url;
  downloads.set(match[1], url);
  return `/images/${match[1]}`;
}

function clean(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined || value === "") continue;
    out[key] = key.endsWith("image_url") || key === "thumbnail_url" ? localizeImage(value) : value;
  }
  return out;
}

function omit(row, keys) {
  return Object.fromEntries(Object.entries(row).filter(([k]) => !keys.includes(k)));
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value));
}

await rm(dataDir, { recursive: true, force: true });

// Long-form collections: a light index for list pages + one file per record.
const longForm = [
  { name: "Story", file: "stories", body: "content_en" },
  { name: "BlogPost", file: "blog-posts", body: "content" },
];
for (const { name, file, body } of longForm) {
  const rows = (entities[name] || []).map(clean);
  await writeJson(path.join(dataDir, `${file}.json`), rows.map((r) => omit(r, [body, "updated_date"])));
  for (const row of rows) await writeJson(path.join(dataDir, file, `${row.id}.json`), row);
  console.log(`${name}: ${rows.length} records`);
}

const simple = { Poem: "poems", Quote: "quotes", Product: "products", Video: "videos", NewsItem: "news" };
for (const [name, file] of Object.entries(simple)) {
  const rows = (entities[name] || []).map(clean);
  await writeJson(path.join(dataDir, `${file}.json`), rows);
  console.log(`${name}: ${rows.length} records`);
}

await mkdir(imageDir, { recursive: true });
for (const [filename, url] of downloads) {
  const dest = path.join(imageDir, filename);
  if (existsSync(dest)) continue;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`downloaded ${filename}`);
}
console.log(`images referenced from Base44 media: ${downloads.size}`);
