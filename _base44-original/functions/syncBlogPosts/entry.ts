import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { capContent, decodeEntities } from '../../shared/blogFeed.ts';

const FEED_URL = 'https://arftroshag.blogspot.com/feeds/posts/default?alt=json&max-results=25';

function buildRecord(entry) {
  const link = (entry.link || []).find((l) => l.rel === 'alternate');
  const raw = capContent(entry.content && entry.content.$t ? entry.content.$t : '');
  const plain = decodeEntities(raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
  const excerpt = plain.length > 220 ? plain.slice(0, 220).trim() + '…' : plain;
  let image = entry.media$thumbnail && entry.media$thumbnail.url;
  if (image) image = image.replace('s72-w640-h360-c', 's640');
  return {
    title: entry.title && entry.title.$t ? entry.title.$t : 'Untitled',
    date: entry.published && entry.published.$t ? entry.published.$t.slice(0, 10) : '',
    excerpt,
    content: raw,
    source_url: link ? link.href : undefined,
    image_url: image || undefined
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Only admins can sync the blog' }, { status: 403 });
    }
    const res = await fetch(FEED_URL);
    const data = await res.json();
    const entries = data.feed.entry || [];
    let imported = 0;
    let skipped = 0;
    for (const entry of entries) {
      const record = buildRecord(entry);
      if (!record.source_url) { skipped++; continue; }
      const existing = await base44.entities.BlogPost.filter({ source_url: record.source_url });
      if (existing.length > 0) { skipped++; continue; }
      await base44.entities.BlogPost.create(record);
      imported++;
    }
    return Response.json({ checked: entries.length, imported, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}