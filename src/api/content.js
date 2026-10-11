// Local content store. Replaces the Base44 database: every collection is a
// static JSON file under public/data/, and long-form records (stories, blog
// posts) keep their full text in one file per record so list pages stay fast.
//
// The API mirrors the subset of the Base44 SDK the site used, so pages call
// content.Story.list(...), .filter(...), .get(id) and .aggregate(...).

const COLLECTIONS = {
  Story: { file: "stories", detailDir: "stories" },
  BlogPost: { file: "blog-posts", detailDir: "blog-posts" },
  Poem: { file: "poems" },
  Quote: { file: "quotes" },
  Product: { file: "products" },
  Video: { file: "videos" },
  NewsItem: { file: "news" },
};

const cache = new Map();

function fetchJson(path) {
  if (!cache.has(path)) {
    const request = fetch(path).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
      return res.json();
    });
    request.catch(() => cache.delete(path));
    cache.set(path, request);
  }
  return cache.get(path);
}

function compare(a, b) {
  if (a === b) return 0;
  if (a === undefined || a === null || a === "") return 1;
  if (b === undefined || b === null || b === "") return -1;
  return a < b ? -1 : 1;
}

function sortRows(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...rows].sort((x, y) => (desc ? -1 : 1) * compare(x[field], y[field]));
}

function matchesCondition(value, condition) {
  if (condition === null || typeof condition !== "object" || Array.isArray(condition)) {
    return value === condition;
  }
  return Object.entries(condition).every(([op, operand]) => {
    switch (op) {
      case "$gte": return value !== undefined && value !== null && value >= operand;
      case "$gt": return value !== undefined && value !== null && value > operand;
      case "$lte": return value !== undefined && value !== null && value <= operand;
      case "$lt": return value !== undefined && value !== null && value < operand;
      case "$in": return operand.includes(value);
      case "$nin": return !operand.includes(value);
      case "$ne": return value !== operand;
      default: throw new Error(`Unsupported query operator ${op}`);
    }
  });
}

function filterRows(rows, query = {}) {
  const entries = Object.entries(query);
  if (entries.length === 0) return rows;
  return rows.filter((row) => entries.every(([field, condition]) => matchesCondition(row[field], condition)));
}

function pickFields(row, fields) {
  if (!fields) return row;
  return Object.fromEntries(["id", ...fields].map((f) => [f, row[f]]));
}

function collection(name) {
  const { file, detailDir } = COLLECTIONS[name];
  const all = () => fetchJson(`/data/${file}.json`);

  return {
    async list(sort, limit) {
      const rows = sortRows(await all(), sort);
      return limit ? rows.slice(0, limit) : rows;
    },

    // filter(query, sort, limit) returns an array.
    // filter(query, { sort, limit, cursor, fields }) returns a page:
    // { items, next_cursor, has_more }, where the cursor is an offset.
    async filter(query, sortOrOptions, limit) {
      if (sortOrOptions && typeof sortOrOptions === "object") {
        const { sort, limit: pageSize = 50, cursor = 0, fields } = sortOrOptions;
        const rows = sortRows(filterRows(await all(), query), sort);
        const start = Number(cursor) || 0;
        const items = rows.slice(start, start + pageSize).map((r) => pickFields(r, fields));
        const end = start + items.length;
        return { items, next_cursor: end < rows.length ? end : undefined, has_more: end < rows.length };
      }
      const rows = sortRows(filterRows(await all(), query), sortOrOptions);
      return limit ? rows.slice(0, limit) : rows;
    },

    async get(id) {
      if (detailDir) {
        if (!/^[a-f0-9]{24}$/.test(id)) throw new Error(`${name} not found`);
        return fetchJson(`/data/${detailDir}/${id}.json`);
      }
      const row = (await all()).find((r) => r.id === id);
      if (!row) throw new Error(`${name} not found`);
      return row;
    },

    async aggregate({ groupBy }) {
      const counts = new Map();
      for (const row of await all()) {
        const key = row[groupBy] ?? null;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      return { rows: [...counts].map(([value, count]) => ({ [groupBy]: value, count })) };
    },
  };
}

export const content = Object.fromEntries(Object.keys(COLLECTIONS).map((name) => [name, collection(name)]));
