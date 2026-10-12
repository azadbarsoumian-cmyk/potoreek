// Trading card, front and back: 2.5 × 3.5 in at 300 dpi (750 × 1050 px).
import { REGIONS } from "@/lib/regions";
import { INK, FONTS, makeCanvas, duotone, fitFont, wrapText, roundRect, grain, lifespanOf } from "./canvas";

const W = 750, H = 1050;
const regionAm = (key) => REGIONS.find((r) => r.key === key)?.am || "";
const regionEn = (key) => REGIONS.find((r) => r.key === key)?.en || key || "";

// A stable card number from the record id (so reprints keep their number).
export const cardNumber = (f) => String((parseInt(String(f.id || "0").slice(-6), 16) % 999) + 1).padStart(3, "0");

export function cardFront(f, portrait) {
  const [c, ctx] = makeCanvas(W, H);
  // Base and frame
  ctx.fillStyle = INK.night;
  ctx.fillRect(0, 0, W, H);
  const band = ctx.createLinearGradient(0, 0, W, H);
  band.addColorStop(0, "#2a0b0d");
  band.addColorStop(0.55, INK.night);
  band.addColorStop(1, "#2a0b0d");
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK.brass;
  ctx.lineWidth = 6;
  roundRect(ctx, 18, 18, W - 36, H - 36, 26);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  roundRect(ctx, 32, 32, W - 64, H - 64, 18);
  ctx.stroke();

  // Header
  ctx.fillStyle = INK.red;
  ctx.font = `700 34px ${FONTS.logo}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Փոթորիկ", 56, 88);
  ctx.textAlign = "right";
  ctx.fillStyle = INK.brassLight;
  ctx.font = `400 24px ${FONTS.type}`;
  ctx.fillText(`№ ${cardNumber(f)}`, W - 56, 86);
  ctx.textAlign = "left";

  // Portrait window
  const px = 56, py = 112, pw = W - 112, ph = 560;
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 10);
  ctx.clip();
  if (portrait) ctx.drawImage(duotone(portrait, pw, ph, "#160606", "#efd9c4", { contrast: 1.35 }), px, py);
  else {
    ctx.fillStyle = "#1f1515";
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = "rgba(193,39,45,0.35)";
    ctx.font = `700 260px ${FONTS.serif}`;
    ctx.textAlign = "center";
    ctx.fillText("Փ", W / 2, py + ph / 2 + 90);
    ctx.textAlign = "left";
  }
  const vignette = ctx.createRadialGradient(W / 2, py + ph * 0.42, ph * 0.25, W / 2, py + ph / 2, ph * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
  ctx.strokeStyle = INK.brass;
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 10);
  ctx.stroke();

  // Name plate
  const ny = py + ph + 22;
  ctx.fillStyle = INK.red;
  ctx.fillRect(px, ny, pw, 132);
  ctx.fillStyle = "#fff6ef";
  const nameAm = f.name_am || f.name_en || "";
  const size = fitFont(ctx, nameAm, FONTS.serif, 900, 56, pw - 40, 26);
  ctx.font = `900 ${size}px ${FONTS.serif}`;
  ctx.fillText(nameAm, px + 20, ny + 62);
  ctx.fillStyle = "#ffd9cf";
  fitFont(ctx, f.name_en || "", FONTS.type, 400, 28, pw - 40, 14);
  ctx.fillText(f.name_en || "", px + 20, ny + 108);

  // Stat boxes
  const sy = ny + 152;
  const stats = [
    { label: "ՏԱՐԻՆԵՐ · YEARS", value: lifespanOf(f) || "—" },
    { label: "ՇՐՋԱՆ · REGION", value: regionAm(f.region) || regionEn(f.region) || "—" },
    { label: "ԴԵՐ · ROLE", value: (f.roles_en || [])[0] || "Fedayi" },
  ];
  const bw = (pw - 24) / 3;
  stats.forEach((s, i) => {
    const bx = px + i * (bw + 12);
    ctx.strokeStyle = "rgba(220,194,140,0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, sy, bw, 84);
    ctx.fillStyle = INK.brassLight;
    ctx.font = `400 15px ${FONTS.type}`;
    ctx.fillText(s.label, bx + 12, sy + 26);
    ctx.fillStyle = "#f6efe2";
    fitFont(ctx, s.value, FONTS.sans, 600, 26, bw - 24, 12);
    ctx.fillText(s.value, bx + 12, sy + 64);
  });

  // Footer
  ctx.fillStyle = INK.brassLight;
  ctx.font = `400 18px ${FONTS.type}`;
  ctx.fillText("ՖԷՏԱՅԻ · FEDAYI ARCHIVE", 56, H - 50);
  ctx.textAlign = "right";
  ctx.fillStyle = f.featured ? "#e7c46a" : INK.brassLight;
  ctx.font = `700 22px ${FONTS.sans}`;
  ctx.fillText(f.featured ? "◆ ◆ ◆" : "◆ ◆", W - 56, H - 50);
  ctx.textAlign = "left";
  return c;
}

export function cardBack(f) {
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = INK.paper;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, W, H, 16);
  ctx.strokeStyle = INK.red;
  ctx.lineWidth = 6;
  roundRect(ctx, 18, 18, W - 36, H - 36, 26);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  roundRect(ctx, 32, 32, W - 64, H - 64, 18);
  ctx.stroke();

  // Seal
  const cx = W / 2, cy = 120;
  const seal = ctx.createRadialGradient(cx - 14, cy - 14, 6, cx, cy, 58);
  seal.addColorStop(0, "#d4434a");
  seal.addColorStop(0.65, "#8f1118");
  seal.addColorStop(1, "#5e0a0f");
  ctx.fillStyle = seal;
  ctx.beginPath();
  ctx.arc(cx, cy, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f6d6cf";
  ctx.font = `700 60px ${FONTS.serif}`;
  ctx.textAlign = "center";
  ctx.fillText("Փ", cx, cy + 22);

  // Name
  ctx.fillStyle = INK.coal;
  const nameAm = f.name_am || f.name_en || "";
  const size = fitFont(ctx, nameAm, FONTS.serif, 900, 46, W - 140, 22);
  ctx.font = `900 ${size}px ${FONTS.serif}`;
  ctx.fillText(nameAm, cx, 236);
  ctx.font = `400 22px ${FONTS.type}`;
  ctx.fillStyle = "#5b4b3b";
  ctx.fillText([f.name_en, lifespanOf(f)].filter(Boolean).join(" · "), cx, 274);
  ctx.textAlign = "left";

  // Rule
  ctx.strokeStyle = "rgba(29,23,18,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, 300);
  ctx.lineTo(W - 70, 300);
  ctx.stroke();

  // Dossier facts, pinned above the footer so the card never looks empty
  const facts = [
    ["ՇՐՋԱՆ · REGION", regionEn(f.region)],
    ["ԾՆՈՒՆԴ · BORN", [f.birth_year, f.birth_place_en || f.birth_place_am].filter(Boolean).join(", ")],
    ["ՆԱՀԱՏԱԿ · FELL", [f.death_year, f.death_place_en || f.death_place_am].filter(Boolean).join(", ")],
    ["ԿՈՉՈՒՄ · ALSO KNOWN AS", [...(f.aliases_am || []), ...(f.aliases_en || [])].slice(0, 3).join(", ")],
    ["ԴԵՐ · ROLE", (f.roles_en || []).slice(0, 3).join(", ") || "Fedayi"],
  ].filter(([, v]) => v);
  const factsTop = H - 96 - facts.length * 40 - 30;

  // Biography
  const bio = stripHtml(f.bio_en || f.bio_am || "");
  ctx.fillStyle = INK.coal;
  ctx.font = `400 22px ${FONTS.sans}`;
  const bioLines = Math.max(3, Math.min(10, Math.floor((factsTop - 344 - 40) / 32)));
  let y = wrapText(ctx, bio || "A fighter of the Armenian liberation movement.", 70, 344, W - 140, 32, bioLines);

  // Timeline highlights
  const timeline = (f.timeline || []).filter((t) => t.year && (t.text_en || t.text_am)).slice(0, 4);
  if (timeline.length) {
    y += 14;
    ctx.fillStyle = INK.red;
    ctx.font = `400 18px ${FONTS.type}`;
    ctx.fillText("ԺԱՄԱՆԱԿԱԳՐՈՒԹԻՒՆ · TIMELINE", 70, y);
    y += 34;
    for (const t of timeline) {
      if (y > factsTop - 40) break;
      ctx.fillStyle = INK.red;
      ctx.font = `700 22px ${FONTS.sans}`;
      ctx.fillText(String(t.year), 70, y);
      ctx.fillStyle = INK.coal;
      ctx.font = `400 20px ${FONTS.sans}`;
      y = wrapText(ctx, t.text_en || t.text_am, 160, y, W - 230, 28, 2) + 6;
    }
  }

  ctx.strokeStyle = "rgba(29,23,18,0.35)";
  ctx.beginPath();
  ctx.moveTo(70, factsTop);
  ctx.lineTo(W - 70, factsTop);
  ctx.stroke();
  facts.forEach(([label, value], i) => {
    const fy = factsTop + 44 + i * 40;
    ctx.fillStyle = INK.red;
    ctx.font = `400 15px ${FONTS.type}`;
    ctx.fillText(label, 70, fy);
    ctx.fillStyle = INK.coal;
    fitFont(ctx, value, FONTS.sans, 600, 21, W - 140 - 250, 13);
    ctx.fillText(value, 320, fy);
  });

  // Footer
  ctx.fillStyle = "#5b4b3b";
  ctx.font = `400 18px ${FONTS.type}`;
  ctx.fillText(`potoreek.com/fidayi/${f.slug || ""}`, 70, H - 52);
  ctx.textAlign = "right";
  ctx.fillText(`№ ${cardNumber(f)}`, W - 70, H - 52);
  ctx.textAlign = "left";
  return c;
}

export const stripHtml = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
