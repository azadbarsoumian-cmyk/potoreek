// One press: every artwork for a fedayi — trading card, poster, social images,
// print-ready merchandise art, product mockups and a 3D portrait relief.
import JSZip from "jszip";
import { ensureFonts, loadImage, toBlob, scaled, lifespanOf } from "./canvas";
import { cardFront, cardBack } from "./cards";
import { poster, socialSquare, socialStory, shirtPrint, sticker, mugWrap, shirtMockup, mugMockup, stickerMockup, cardMockup, posterMockup } from "./prints";
import { buildRelief } from "./relief";

const tick = () => new Promise((r) => setTimeout(r, 0)); // let the UI repaint between steps

export async function generateKit(f, portraitSrc, onProgress = () => {}) {
  const items = [];
  const warnings = [];
  const add = (item) => {
    items.push({ ...item, preview: URL.createObjectURL(item.previewBlob || item.siteBlob || item.blob) });
  };

  onProgress("Preparing fonts and portrait");
  await ensureFonts();
  let portrait = null;
  if (portraitSrc) {
    try {
      portrait = await loadImage(portraitSrc);
    } catch {
      warnings.push("The portrait could not be loaded, so the designs use the Փ emblem instead.");
    }
  } else warnings.push("No portrait yet — the designs use the Փ emblem. Add a portrait and generate again.");

  onProgress("Trading card");
  await tick();
  const front = cardFront(f, portrait);
  const back = cardBack(f);
  add({ key: "card-front", group: "Trading card", title: "Trading card — front", file: "card-front.png", blob: await toBlob(front), siteName: "card-front.jpg", siteBlob: await toBlob(front, "image/jpeg", 0.88) });
  add({ key: "card-back", group: "Trading card", title: "Trading card — back", file: "card-back.png", blob: await toBlob(back), siteName: "card-back.jpg", siteBlob: await toBlob(back, "image/jpeg", 0.88) });

  onProgress("Poster");
  await tick();
  const posterArt = poster(f, portrait);
  add({ key: "poster", group: "Prints", title: "Poster (A3, print)", file: "poster-a3.jpg", blob: await toBlob(posterArt, "image/jpeg", 0.92), previewBlob: await toBlob(scaled(posterArt, 600), "image/jpeg", 0.85) });

  onProgress("Social media images");
  await tick();
  const square = socialSquare(f, portrait);
  const story = socialStory(f, portrait);
  add({ key: "social-square", group: "Social media", title: "Instagram / Facebook post (1080²)", file: "social-square.jpg", blob: await toBlob(square, "image/jpeg", 0.9), siteName: "social-square.jpg", siteBlob: await toBlob(square, "image/jpeg", 0.85) });
  add({ key: "social-story", group: "Social media", title: "Story / reel cover (1080×1920)", file: "social-story.jpg", blob: await toBlob(story, "image/jpeg", 0.9), previewBlob: await toBlob(scaled(story, 500), "image/jpeg", 0.85) });

  onProgress("Merchandise artwork");
  await tick();
  const shirt = shirtPrint(f, portrait);
  const stickerArt = sticker(f, portrait);
  const mug = mugWrap(f, portrait);
  add({ key: "shirt-print", group: "Print files", title: "T-shirt print (transparent PNG)", file: "tshirt-print.png", blob: await toBlob(shirt), previewBlob: await toBlob(scaled(shirt, 500)) });
  add({ key: "sticker-print", group: "Print files", title: "Sticker (die-cut PNG)", file: "sticker-print.png", blob: await toBlob(stickerArt), previewBlob: await toBlob(scaled(stickerArt, 500)) });
  add({ key: "mug-print", group: "Print files", title: "Mug wrap (11 oz)", file: "mug-wrap.png", blob: await toBlob(mug), previewBlob: await toBlob(scaled(mug, 700), "image/jpeg", 0.85) });

  onProgress("Product mockups");
  await tick();
  const mockups = [
    { key: "mock-card", title: "Trading card", canvas: cardMockup(front), product: { category_en: "Trading card", category_am: "Հաւաքական քարտ", age_group: "12-15" } },
    { key: "mock-poster", title: "Poster", canvas: posterMockup(posterArt), product: { category_en: "Poster", category_am: "Պաստառ", age_group: "adults" } },
    { key: "mock-shirt", title: "T-shirt", canvas: shirtMockup(shirt), product: { category_en: "T-shirt", category_am: "Շապիկ", age_group: "adults" } },
    { key: "mock-mug", title: "Mug", canvas: mugMockup(mug), product: { category_en: "Mug", category_am: "Գաւաթ", age_group: "adults" } },
    { key: "mock-sticker", title: "Sticker", canvas: stickerMockup(stickerArt), product: { category_en: "Sticker", category_am: "Կպչուն", age_group: "kids" } },
  ];
  for (const m of mockups) {
    const blob = await toBlob(m.canvas, "image/jpeg", 0.86);
    add({ key: m.key, group: "Mockups", title: `${m.title} mockup`, file: `mockup-${m.key.slice(5)}.jpg`, blob, siteName: `mockup-${m.key.slice(5)}.jpg`, siteBlob: blob, product: m.product, productTitle: m.title });
  }

  onProgress("3D portrait relief");
  await tick();
  const { glb, stl } = await buildRelief(portrait);
  items.push({ key: "relief-glb", group: "3D", title: "3D relief (GLB, for the website and viewers)", file: "relief.glb", blob: glb, siteName: "relief.glb", siteBlob: glb, preview: URL.createObjectURL(glb), model: true });
  items.push({ key: "relief-stl", group: "3D", title: "3D relief (STL, for 3D printing, 100 mm)", file: "relief-print.stl", blob: stl, preview: null, model: true });

  onProgress("Done");
  return { items, warnings };
}

export async function zipKit(f, items) {
  const zip = new JSZip();
  const root = zip.folder(`potoreek-${f.slug || "fedayi"}`);
  for (const it of items) root.folder(it.group).file(it.file, it.blob);
  root.file(
    "README.txt",
    [
      `Potoreek merchandise kit — ${f.name_en || ""} (${f.name_am || ""}) ${lifespanOf(f)}`,
      "",
      "Trading card: 2.5 × 3.5 in at 300 dpi (750 × 1050 px). Add 1/8 in bleed at your printer if required.",
      "Poster: 2000 × 2828 px (A3 proportions).",
      "T-shirt print: 3000 × 3600 px transparent PNG (12 × 14.4 in at 250 dpi).",
      "Sticker: 1500 × 1500 px, round die-cut with white border.",
      "Mug wrap: 2700 × 1100 px for an 11 oz mug.",
      "3D relief: relief.glb for viewers, relief-print.stl for printing (100 × 100 mm plaque).",
      "",
      "Generated by the Potoreek Command Center.",
    ].join("\r\n")
  );
  return zip.generateAsync({ type: "blob" });
}

export const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
