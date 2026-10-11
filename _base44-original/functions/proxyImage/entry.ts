import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Fetches an external image and returns it as a data URL so the client can
// use it as a WebGL/Canvas texture (direct loads are blocked by CORS).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url || typeof url !== 'string' || !/^https:\/\//i.test(url)) {
      return Response.json({ error: 'A https:// image url is required' }, { status: 400 });
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return Response.json({ error: 'Image fetch failed: ' + res.status }, { status: 502 });
    const type = res.headers.get('content-type') || 'image/jpeg';
    if (!type.startsWith('image/')) return Response.json({ error: 'Not an image' }, { status: 400 });

    const buf = await res.arrayBuffer();
    if (buf.byteLength > 5 * 1024 * 1024) return Response.json({ error: 'Image too large' }, { status: 413 });

    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return Response.json({ dataUrl: `data:${type};base64,${b64}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}