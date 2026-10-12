// Shared drawing helpers for the Studio generators (2D canvas).

export const INK = {
  red: "#C1272D",
  deepRed: "#7a0f15",
  night: "#141110",
  coal: "#1d1712",
  paper: "#efe5cf",
  cream: "#f2f1ee",
  brass: "#b08d57",
  brassLight: "#dcc28c",
};

export const FONTS = {
  logo: "'Braind Street', 'Noto Serif Armenian', serif",
  serif: "'Noto Serif Armenian', Georgia, serif",
  sans: "'Noto Sans Armenian', system-ui, sans-serif",
  type: "'Special Elite', 'Noto Sans Armenian', monospace",
  dvin: "'GHEA Dvin', 'Noto Sans Armenian', sans-serif",
};

// Make sure display fonts are ready before drawing text into a canvas.
export async function ensureFonts() {
  if (!document.fonts?.load) return;
  await Promise.all(
    [
      `700 40px 'Braind Street'`,
      `700 40px 'Noto Serif Armenian'`,
      `900 40px 'Noto Serif Armenian'`,
      `400 20px 'Noto Sans Armenian'`,
      `600 20px 'Noto Sans Armenian'`,
      `400 20px 'GHEA Dvin'`,
      `400 20px 'Special Elite'`,
    ].map((f) => document.fonts.load(f, "Փոթորիկ Potoreek").catch(() => null))
  );
}

// Remote photos go through a CORS-enabled relay so the canvas can be exported.
export function corsSafe(url) {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (/^https?:/.test(url) && !url.startsWith(window.location.origin)) return `https://wsrv.nl/?url=${encodeURIComponent(url)}&n=-1`;
  return url;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load the image (${src.slice(0, 80)})`));
    img.src = corsSafe(src);
  });
}

export function makeCanvas(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext("2d")];
}

// Draw an image cropped to fill a box (like CSS object-fit: cover).
export function drawCover(ctx, img, x, y, w, h, focusY = 0.3) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale, sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = Math.max(0, Math.min(img.height - sh, (img.height - sh) * focusY));
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Portrait processed into a monochrome duotone: shadows -> dark, lights -> light.
export function duotone(img, w, h, dark, light, { contrast = 1.25, focusY = 0.3 } = {}) {
  const [canvas, ctx] = makeCanvas(w, h);
  drawCover(ctx, img, 0, 0, w, h, focusY);
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  const [dr, dg, db] = hexRgb(dark), [lr, lg, lb] = hexRgb(light);
  for (let i = 0; i < d.length; i += 4) {
    let v = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    v = Math.min(1, Math.max(0, (v - 0.5) * contrast + 0.5));
    d[i] = dr + (lr - dr) * v;
    d[i + 1] = dg + (lg - dg) * v;
    d[i + 2] = db + (lb - db) * v;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

// Two-tone stencil (for print): ink where the photo is dark, transparent elsewhere.
export function stencil(img, w, h, ink, { threshold = 0.5, focusY = 0.3, mask = null } = {}) {
  const [canvas, ctx] = makeCanvas(w, h);
  drawCover(ctx, img, 0, 0, w, h, focusY);
  ctx.filter = "none";
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  const [r, g, b] = hexRgb(ink);
  // Normalize brightness so dark and light photos both give a usable stencil.
  let min = 1, max = 0;
  for (let i = 0; i < d.length; i += 16) {
    const v = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = Math.max(0.05, max - min);
  for (let p = 0, i = 0; i < d.length; i += 4, p++) {
    const v = ((0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255 - min) / span;
    const x = p % w, y = (p / w) | 0;
    const inside = mask ? mask(x, y) : true;
    const on = inside && v < threshold;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = on ? 255 : 0;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

export function hexRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Fit text into a width by shrinking the font size.
export function fitFont(ctx, text, family, weight, maxSize, maxWidth, minSize = 10) {
  let size = maxSize;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > minSize);
  return size;
}

// Word-wrapped paragraph; returns the y below the last line.
export function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ");
  let line = "", lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      if (lines === maxLines - 1) {
        ctx.fillText(`${line.replace(/[,.;:]?$/, "")}…`, x, y);
        return y + lineHeight;
      }
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines++;
      line = words[i];
    } else line = test;
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Faint paper grain over a filled area.
export function grain(ctx, w, h, amount = 18, seed = 7) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(data, 0, 0);
}

export const toBlob = (canvas, type = "image/png", quality = 0.9) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

export function scaled(canvas, width) {
  const h = Math.round((canvas.height / canvas.width) * width);
  const [out, ctx] = makeCanvas(width, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, width, h);
  return out;
}

export const lifespanOf = (f) => (f.birth_year || f.death_year ? `${f.birth_year || "?"}–${f.death_year || "?"}` : "");
