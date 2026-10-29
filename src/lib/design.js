// Site design (colours, fonts, corner radius, homepage sections, menu) from
// src/config/design.json, edited in the Command Center's Design room.
// The Design room's live preview passes a draft through localStorage.
import saved from "@/config/design.json";

export const DRAFT_KEY = "potoreek-design-draft";

export const FONT_CHOICES = {
  "Noto Serif Armenian": "'Noto Serif Armenian', ui-serif, Georgia, serif",
  "Noto Sans Armenian": "'Noto Sans Armenian', ui-sans-serif, system-ui, sans-serif",
  "GHEA Dvin": "'GHEA Dvin', 'Noto Serif Armenian', serif",
  "Braind Street": "'Braind Street', 'Noto Sans Armenian', sans-serif",
  "Noto Serif": "'Noto Serif', 'Noto Serif Armenian', serif",
  "Playfair Display": "'Playfair Display', 'Noto Serif Armenian', serif",
  "Inter": "'Inter', 'Noto Sans Armenian', sans-serif",
};
const GOOGLE = { "Noto Serif": "Noto+Serif:wght@400;700", "Playfair Display": "Playfair+Display:wght@400;700;900", Inter: "Inter:wght@400;500;600" };

function readDraft() {
  try {
    if (!new URLSearchParams(window.location.search).has("designPreview")) return null;
    return JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "null");
  } catch {
    return null;
  }
}

export const design = readDraft() || saved;

// "#rrggbb" -> "h s% l%" for the CSS variables Tailwind reads.
export function hexToHsl(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyDesign(d = design) {
  const root = document.documentElement.style;
  const c = d.colors || {};
  const set = (name, hex) => hex && root.setProperty(`--${name}`, hexToHsl(hex));
  set("primary", c.primary); set("accent", c.primary); set("ring", c.primary);
  set("background", c.background); set("card", c.background);
  set("foreground", c.foreground); set("card-foreground", c.foreground);
  set("muted", c.muted); set("vitrine", c.vitrine); set("brass", c.brass);
  if (c.primary) root.setProperty("--brand-red", c.primary);
  const f = d.fonts || {};
  if (FONT_CHOICES[f.heading]) { root.setProperty("--font-heading", FONT_CHOICES[f.heading]); root.setProperty("--font-display", FONT_CHOICES[f.heading]); }
  if (FONT_CHOICES[f.body]) root.setProperty("--font-body", FONT_CHOICES[f.body]);
  if (d.radius != null) root.setProperty("--radius", `${d.radius / 16}rem`);
  const extra = [f.heading, f.body].map((n) => GOOGLE[n]).filter(Boolean);
  if (extra.length && !document.getElementById("design-fonts")) {
    const link = Object.assign(document.createElement("link"), { id: "design-fonts", rel: "stylesheet", href: `https://fonts.googleapis.com/css2?${extra.map((e) => `family=${e}`).join("&")}&display=swap` });
    document.head.appendChild(link);
  }
}

// Items in the saved order, hidden ones removed; unknown keys keep their default place.
export function arrange(items, prefs = [], keyOf) {
  const pos = new Map(prefs.map((p, i) => [p.key ?? p.to, { i, visible: p.visible !== false }]));
  return items
    .filter((it) => pos.get(keyOf(it))?.visible !== false)
    .sort((a, b) => (pos.get(keyOf(a))?.i ?? 999) - (pos.get(keyOf(b))?.i ?? 999));
}
