// Posters, social images and print-ready merchandise artwork, plus product mockups.
import { REGIONS } from "@/lib/regions";
import { INK, FONTS, makeCanvas, duotone, stencil, fitFont, roundRect, grain, lifespanOf, drawCover } from "./canvas";

const TAGLINE = "ԱՆՈՆՑ ԿԵԱՆՔԸ . ԵՐԳԸ . ԿՌԻՒԸ . ԵՐԿԻՐԸ";
const regionAm = (key) => REGIONS.find((r) => r.key === key)?.am || "";

function centered(ctx, text, x, y) {
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

// Placeholder when there's no portrait yet: the archive's Փ.
function portraitOr(portrait, w, h, dark, light) {
  if (portrait) return duotone(portrait, w, h, dark, light, { contrast: 1.4 });
  const [c, ctx] = makeCanvas(w, h);
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(193,39,45,0.35)";
  ctx.font = `700 ${Math.round(h * 0.5)}px ${FONTS.serif}`;
  centered(ctx, "Փ", w / 2, h * 0.68);
  return c;
}

// Poster, about A3 proportions (2000 × 2828).
export function poster(f, portrait) {
  const W = 2000, H = 2828;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = INK.night;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(portraitOr(portrait, W, Math.round(H * 0.72), "#120505", "#e9c9b6"), 0, 0);
  const fade = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.74);
  fade.addColorStop(0, "rgba(20,17,16,0)");
  fade.addColorStop(1, INK.night);
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);
  // Red rule and brand
  ctx.fillStyle = INK.red;
  ctx.fillRect(120, 120, 16, 260);
  ctx.font = `700 96px ${FONTS.logo}`;
  ctx.fillText("Փոթորիկ", 170, 230);
  ctx.fillStyle = INK.brassLight;
  ctx.font = `400 40px ${FONTS.type}`;
  ctx.fillText("ՖԷՏԱՅԻ · FEDAYI", 172, 300);
  // Name block
  const nameAm = f.name_am || f.name_en || "";
  ctx.fillStyle = "#fff4ee";
  const size = fitFont(ctx, nameAm, FONTS.serif, 900, 220, W - 240, 80);
  ctx.font = `900 ${size}px ${FONTS.serif}`;
  centered(ctx, nameAm, W / 2, H * 0.8);
  ctx.fillStyle = INK.red;
  fitFont(ctx, (f.name_en || "").toUpperCase(), FONTS.type, 400, 84, W - 300, 30);
  centered(ctx, (f.name_en || "").toUpperCase(), W / 2, H * 0.8 + 120);
  ctx.fillStyle = INK.brassLight;
  ctx.font = `400 64px ${FONTS.type}`;
  centered(ctx, [lifespanOf(f), regionAm(f.region)].filter(Boolean).join("  ·  "), W / 2, H * 0.8 + 230);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = `400 46px ${FONTS.dvin}`;
  centered(ctx, TAGLINE, W / 2, H - 170);
  ctx.fillStyle = INK.red;
  ctx.font = `400 40px ${FONTS.type}`;
  centered(ctx, "potoreek.com", W / 2, H - 90);
  return c;
}

// Square social post (1080 × 1080).
export function socialSquare(f, portrait) {
  const S = 1080;
  const [c, ctx] = makeCanvas(S, S);
  ctx.drawImage(portraitOr(portrait, S, S, "#130606", "#e9c9b6"), 0, 0);
  const g = ctx.createLinearGradient(0, S * 0.45, 0, S);
  g.addColorStop(0, "rgba(20,17,16,0)");
  g.addColorStop(1, "rgba(20,17,16,0.95)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = INK.red;
  ctx.fillRect(0, 0, S, 12);
  ctx.font = `700 52px ${FONTS.logo}`;
  ctx.fillText("Փոթորիկ", 60, 100);
  const nameAm = f.name_am || f.name_en || "";
  ctx.fillStyle = "#fff4ee";
  const size = fitFont(ctx, nameAm, FONTS.serif, 900, 110, S - 120, 40);
  ctx.font = `900 ${size}px ${FONTS.serif}`;
  ctx.fillText(nameAm, 60, S - 170);
  ctx.fillStyle = INK.brassLight;
  ctx.font = `400 40px ${FONTS.type}`;
  ctx.fillText([f.name_en, lifespanOf(f)].filter(Boolean).join(" · "), 60, S - 105);
  ctx.fillStyle = INK.red;
  ctx.font = `400 32px ${FONTS.type}`;
  ctx.fillText(`potoreek.com/fidayi/${f.slug || ""}`, 60, S - 52);
  return c;
}

// Vertical story image (1080 × 1920).
export function socialStory(f, portrait) {
  const W = 1080, H = 1920;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = INK.night;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(portraitOr(portrait, W, 1300, "#130606", "#e9c9b6"), 0, 160);
  const g = ctx.createLinearGradient(0, 1050, 0, 1460);
  g.addColorStop(0, "rgba(20,17,16,0)");
  g.addColorStop(1, INK.night);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = INK.red;
  ctx.font = `700 70px ${FONTS.logo}`;
  centered(ctx, "Փոթորիկ", W / 2, 110);
  const nameAm = f.name_am || f.name_en || "";
  ctx.fillStyle = "#fff4ee";
  const size = fitFont(ctx, nameAm, FONTS.serif, 900, 120, W - 120, 44);
  ctx.font = `900 ${size}px ${FONTS.serif}`;
  centered(ctx, nameAm, W / 2, 1560);
  ctx.fillStyle = INK.brassLight;
  ctx.font = `400 44px ${FONTS.type}`;
  centered(ctx, [f.name_en, lifespanOf(f)].filter(Boolean).join(" · "), W / 2, 1640);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `400 34px ${FONTS.dvin}`;
  centered(ctx, TAGLINE, W / 2, 1760);
  ctx.fillStyle = INK.red;
  ctx.font = `400 34px ${FONTS.type}`;
  centered(ctx, "potoreek.com", W / 2, 1840);
  return c;
}

// T-shirt print: transparent PNG, 3000 × 3600 (12 × 14.4 in at 250 dpi).
export function shirtPrint(f, portrait) {
  const W = 3000, H = 3600;
  const [c, ctx] = makeCanvas(W, H);
  if (portrait) {
    const art = stencil(portrait, 2200, 2400, INK.coal, { threshold: 0.42 });
    ctx.drawImage(art, (W - 2200) / 2, 180);
  }
  ctx.fillStyle = INK.red;
  ctx.fillRect((W - 2200) / 2, 2660, 2200, 30);
  const nameAm = f.name_am || f.name_en || "";
  ctx.fillStyle = INK.red;
  const size = fitFont(ctx, nameAm, FONTS.serif, 900, 300, 2400, 120);
  ctx.font = `900 ${size}px ${FONTS.serif}`;
  centered(ctx, nameAm, W / 2, 3000);
  ctx.fillStyle = INK.coal;
  ctx.font = `400 150px ${FONTS.type}`;
  centered(ctx, [lifespanOf(f), "ՖԷՏԱՅԻ"].filter(Boolean).join(" · "), W / 2, 3240);
  return c;
}

// Round die-cut sticker: 1500 × 1500 with a white cut border.
export function sticker(f, portrait) {
  const S = 1500, R = S / 2;
  const [c, ctx] = makeCanvas(S, S);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(R, R, R - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK.red;
  ctx.beginPath();
  ctx.arc(R, R, R - 60, 0, Math.PI * 2);
  ctx.fill();
  if (portrait) {
    const inner = R - 170;
    const art = stencil(portrait, inner * 2, inner * 2, "#1a0a0a", {
      threshold: 0.45,
      mask: (x, y) => (x - inner) ** 2 + (y - inner) ** 2 < inner * inner,
    });
    ctx.drawImage(art, R - inner, R - inner - 60);
  }
  ctx.fillStyle = "#ffffff";
  const nameAm = f.name_am || f.name_en || "";
  const size = fitFont(ctx, nameAm, FONTS.serif, 900, 130, S - 520, 50);
  ctx.font = `900 ${size}px ${FONTS.serif}`;
  centered(ctx, nameAm, R, S - 250);
  ctx.font = `400 70px ${FONTS.type}`;
  centered(ctx, lifespanOf(f) || "ՖԷՏԱՅԻ", R, S - 165);
  return c;
}

// Mug wrap: 2700 × 1100 (standard 11 oz full wrap at 300 dpi).
export function mugWrap(f, portrait) {
  const W = 2700, H = 1100;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = INK.cream;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, W, H, 10);
  ctx.fillStyle = INK.red;
  ctx.fillRect(0, 0, W, 40);
  ctx.fillRect(0, H - 40, W, 40);
  if (portrait) {
    const art = stencil(portrait, 820, 900, INK.coal, { threshold: 0.45 });
    ctx.drawImage(art, 110, 100);
    ctx.drawImage(art, W - 110 - 820, 100);
  }
  // The centre column between the two portraits is 840 px wide.
  const nameAm = f.name_am || f.name_en || "";
  ctx.fillStyle = INK.red;
  const size = fitFont(ctx, nameAm, FONTS.serif, 900, 120, 740, 40);
  ctx.font = `900 ${size}px ${FONTS.serif}`;
  centered(ctx, nameAm, W / 2, 470);
  ctx.fillStyle = INK.coal;
  ctx.font = `400 60px ${FONTS.type}`;
  centered(ctx, lifespanOf(f) || "", W / 2, 570);
  ctx.font = `400 40px ${FONTS.dvin}`;
  centered(ctx, "ԱՆՈՆՑ ԿԵԱՆՔԸ . ԵՐԳԸ", W / 2, 700);
  centered(ctx, "ԿՌԻՒԸ . ԵՐԿԻՐԸ", W / 2, 760);
  ctx.fillStyle = INK.red;
  ctx.font = `700 64px ${FONTS.logo}`;
  centered(ctx, "Փոթորիկ", W / 2, 920);
  return c;
}

// ---- Mockups (1200 × 1200 JPEG previews for the site and shop) ----

function studioBackdrop(ctx, S, top = "#2a221d", bottom = "#14100d") {
  const g = ctx.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
}

export function shirtMockup(print) {
  const S = 1200;
  const [c, ctx] = makeCanvas(S, S);
  studioBackdrop(ctx, S, "#e6ddd0", "#cbbfae");
  // Shirt silhouette
  ctx.save();
  ctx.translate(S / 2, 140);
  ctx.beginPath();
  ctx.moveTo(-150, 0);
  ctx.quadraticCurveTo(0, 70, 150, 0);
  ctx.lineTo(330, 70);
  ctx.lineTo(430, 300);
  ctx.lineTo(320, 360);
  ctx.lineTo(280, 290);
  ctx.lineTo(280, 960);
  ctx.quadraticCurveTo(0, 990, -280, 960);
  ctx.lineTo(-280, 290);
  ctx.lineTo(-320, 360);
  ctx.lineTo(-430, 300);
  ctx.lineTo(-330, 70);
  ctx.closePath();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "#f4f1ea";
  ctx.fill();
  ctx.shadowColor = "transparent";
  const shade = ctx.createLinearGradient(-280, 0, 280, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.10)");
  shade.addColorStop(0.5, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.10)");
  ctx.fillStyle = shade;
  ctx.fill();
  ctx.restore();
  // Print on chest
  const pw = 380, ph = (print.height / print.width) * pw;
  ctx.drawImage(print, S / 2 - pw / 2, 300, pw, ph);
  return c;
}

export function mugMockup(wrap) {
  const S = 1200;
  const [c, ctx] = makeCanvas(S, S);
  studioBackdrop(ctx, S);
  const x = 300, y = 300, w = 520, h = 600;
  // Handle
  ctx.lineWidth = 60;
  ctx.strokeStyle = "#ece6dc";
  ctx.beginPath();
  ctx.ellipse(x + w + 40, y + h / 2, 120, 170, 0, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // Body with the front half of the wrap
  ctx.save();
  roundRect(ctx, x, y, w, h, 30);
  ctx.clip();
  ctx.fillStyle = "#f2efe8";
  ctx.fillRect(x, y, w, h);
  const sw = wrap.width / 2;
  ctx.drawImage(wrap, wrap.width / 4, 0, sw, wrap.height, x - 40, y + 70, w + 80, ((w + 80) / sw) * wrap.height);
  const curve = ctx.createLinearGradient(x, 0, x + w, 0);
  curve.addColorStop(0, "rgba(0,0,0,0.35)");
  curve.addColorStop(0.25, "rgba(0,0,0,0)");
  curve.addColorStop(0.7, "rgba(255,255,255,0.12)");
  curve.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = curve;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  return c;
}

export function stickerMockup(stickerArt) {
  const S = 1200;
  const [c, ctx] = makeCanvas(S, S);
  studioBackdrop(ctx, S, "#3b3f45", "#1f2226");
  ctx.save();
  ctx.translate(S / 2, S / 2);
  ctx.rotate(-0.12);
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  ctx.drawImage(stickerArt, -400, -400, 800, 800);
  ctx.restore();
  return c;
}

export function cardMockup(front) {
  const S = 1200;
  const [c, ctx] = makeCanvas(S, S);
  studioBackdrop(ctx, S, "#3a1414", "#140808");
  ctx.save();
  ctx.translate(S / 2, S / 2);
  ctx.rotate(0.06);
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  const h = 900, w = (front.width / front.height) * h;
  ctx.drawImage(front, -w / 2, -h / 2, w, h);
  ctx.restore();
  return c;
}

export function posterMockup(posterArt) {
  const S = 1200;
  const [c, ctx] = makeCanvas(S, S);
  studioBackdrop(ctx, S, "#d8cfc2", "#b9ad9c");
  const h = 960, w = (posterArt.width / posterArt.height) * h;
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#1a1512";
  ctx.fillRect(S / 2 - w / 2 - 18, 120 - 18, w + 36, h + 36);
  ctx.shadowColor = "transparent";
  drawCover(ctx, posterArt, S / 2 - w / 2, 120, w, h, 0);
  return c;
}
