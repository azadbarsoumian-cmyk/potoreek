const FEED_BASE = 'https://arftroshag.blogspot.com/feeds/posts/default?alt=json';
export const MAX_CONTENT_CHARS = 16000;

export function capContent(html) {
  if (html.length <= MAX_CONTENT_CHARS) return html;
  const cut = html.slice(0, MAX_CONTENT_CHARS);
  const lastParagraph = cut.lastIndexOf('</p>');
  const trimmed = lastParagraph > 1000 ? cut.slice(0, lastParagraph + 4) : cut;
  return trimmed + '<p><em>(Յօդուածը կրճատուած է — ամբողջը աղբիւրի կայքին մէջ: / Article truncated — read the full text at the source.)</em></p>';
}

export function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (m, code) => String.fromCharCode(code))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&hellip;/g, '…')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// Fetches every post in the blog feed, paginating with start-index
// (Blogger caps the page size, so overlapping pages are deduped by link).
export async function fetchAllEntries() {
  const all = [];
  const seen = new Set();
  let start = 1;
  for (let guard = 0; guard < 30; guard++) {
    const res = await fetch(FEED_BASE + '&max-results=100&start-index=' + start);
    if (!res.ok) throw new Error('Blog feed error ' + res.status);
    const data = await res.json();
    const entries = data.feed.entry || [];
    if (entries.length === 0) break;
    for (const e of entries) {
      const link = (e.link || []).find((l) => l.rel === 'alternate');
      if (!link || seen.has(link.href)) continue;
      seen.add(link.href);
      all.push(e);
    }
    start += entries.length;
    if (start > 800) break;
  }
  return all;
}

const POEM_CAT = 'Բանաստեղծութիւններ';

// Substring rules — blog category spellings vary slightly, so exact
// matching is unreliable. Order = priority for multi-category posts.
const SUBSTR_CATS = [
  ['Կռիւն', ['Battles', 'Կռիւներ']],
  ['թաթար', ['Battles', 'Կռիւներ']],
  ['Յայտարար', ['Announcements', 'Յայտարարութիւններ']],
  ['Կենսագր', ['Biographies', 'Կենսագրականներ']],
  ['Լուրեր', ['News', 'Լուրեր']],
  ['Չարեր', ['Speeches & songs', 'Ճառեր-Երգեր']],
  ['Խմբագր', ['Editorials', 'Խմբագրականներ']],
  ['Կամբագր', ['Editorials', 'Խմբագրականներ']],
  ['նամակ', ['Memoirs', 'Ինքնակենսագրականներ']],
  ['Տետր', ['Operations', 'Տեռորներ']],
  ['Դէպք', ['Events', 'Դէպքեր']],
  ['Յուդուած', ['Articles', 'Յօդուածներ']],
];

// Maps a post's blog categories to the app's archive taxonomy.
// Returns { poem: true } for poems, otherwise { cat: [en, am] }.
export function mapCategory(cats) {
  if (cats.includes(POEM_CAT)) return { poem: true };
  for (const [needle, cat] of SUBSTR_CATS) {
    for (const c of cats) if (c.includes(needle)) return { cat };
  }
  for (const c of cats) {
    if (c.startsWith('«') || c.startsWith('Դրուշակ')) return { cat: ['Series', 'Յօդուածաշարներ'] };
  }
  return { cat: ['Articles', 'Յօդուածներ'] };
}

// Poem posts use the "Title. Author" pattern, e.g. "Դաւաճաններ. Սիամանթը".
export function splitAuthor(title) {
  const idx = title.lastIndexOf('. ');
  if (idx === -1) return { title, author: '' };
  return { title: title.slice(0, idx).trim(), author: title.slice(idx + 2).trim() };
}