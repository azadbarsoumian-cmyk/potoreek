import React, { Suspense, lazy, useEffect, useState } from "react";
import { Sparkles, Download, Stamp } from "lucide-react";
import { useCommand } from "../store";
import { usePreviewSrc } from "../fields";
import { generateKit, zipKit, blobToBase64 } from "./kit";
import { lifespanOf } from "./canvas";

const ModelViewer = lazy(() => import("@/components/shared/ModelViewer"));

// The Studio: one press makes the whole merchandise kit for a fedayi.
export default function StudioPanel({ record, onApply }) {
  const { stageFile, saveRecord } = useCommand();
  const preview = usePreviewSrc();
  const [state, setState] = useState({ busy: false, step: "", error: "" });
  const [kit, setKit] = useState(null);
  const [applied, setApplied] = useState("");

  useEffect(() => () => kit?.items.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)), [kit]);

  const ready = record.name_am && record.name_en && record.slug;

  const generate = async () => {
    setState({ busy: true, step: "Starting", error: "" });
    setApplied("");
    try {
      const result = await generateKit(record, preview(record.portrait_url), (step) => setState((s) => ({ ...s, step })));
      setKit(result);
      setState({ busy: false, step: "", error: "" });
    } catch (err) {
      setState({ busy: false, step: "", error: err.message });
    }
  };

  const download = async () => {
    setState((s) => ({ ...s, busy: true, step: "Packing the ZIP" }));
    const blob = await zipKit(record, kit.items);
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `potoreek-${record.slug}-kit.zip` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setState((s) => ({ ...s, busy: false, step: "" }));
  };

  // Queue the web-sized files, link them on the fedayi page, and add hidden shop items.
  const apply = async () => {
    setState((s) => ({ ...s, busy: true, step: "Queuing files for the site" }));
    const dir = `images/fidayis/${record.slug}`;
    const paths = {};
    for (const it of kit.items.filter((i) => i.siteBlob)) {
      const path = `public/${dir}/${it.siteName}`;
      stageFile(path, { base64: await blobToBase64(it.siteBlob), mime: it.siteBlob.type }, `Studio: ${record.name_en} — ${it.title}`);
      paths[it.key] = `/${dir}/${it.siteName}`;
    }
    const merch = kit.items.filter((i) => i.product).map((i) => ({ kind: i.productTitle, title: `${i.productTitle} · ${record.name_en}`, url: paths[i.key] }));
    merch.push({ kind: "Social", title: `Social post · ${record.name_en}`, url: paths["social-square"] });

    let created = 0;
    for (const it of kit.items.filter((i) => i.product)) {
      saveRecord("products", {
        title: `${it.productTitle} · ${record.name_en}`,
        ...it.product,
        price_label: "Coming soon",
        badge_color: "red",
        image_url: paths[it.key],
        description: `${it.productTitle} featuring ${record.name_en} (${record.name_am})${lifespanOf(record) ? `, ${lifespanOf(record)}` : ""}. From the Potoreek fedayi archive.`,
        fidayi_id: record.id,
        published: false,
      });
      created++;
    }

    onApply({
      card_front_url: paths["card-front"],
      card_back_url: paths["card-back"],
      model_url: paths["relief-glb"],
      merch,
    });
    setApplied(`Queued ${Object.keys(paths).length} files, linked them on the page and added ${created} hidden shop items. Put the shop items online from the Shop room when they're ready to sell, then dispatch.`);
    setState({ busy: false, step: "", error: "" });
  };

  const groups = kit ? [...new Set(kit.items.map((i) => i.group))] : [];
  const glb = kit?.items.find((i) => i.key === "relief-glb");

  return (
    <section className="sm:col-span-2 mt-4 border-2 border-[#1d1712] bg-[#1d1712] text-[#efe3c8] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="cc-type text-xs tracking-[0.3em] text-[#dcc28c]">ՍՏՈՒԴԻԱ · STUDIO</p>
          <h2 className="font-heading font-bold text-xl mt-1">Merchandise & 3D kit</h2>
          <p className="text-sm text-[#efe3c8]/75 mt-1 max-w-xl">
            One press makes a trading card (front & back), an A3 poster, social images, print-ready T-shirt, sticker and mug art, product
            mockups and a 3D portrait relief from the portrait and details above.
          </p>
        </div>
        <button type="button" className="cc-btn cc-btn-red" onClick={generate} disabled={!ready || state.busy}>
          <Sparkles className="w-4 h-4" aria-hidden="true" /> {kit ? "Generate again" : "Generate kit"}
        </button>
      </div>
      {!ready && <p className="mt-3 text-sm text-[#dcc28c]">Fill in both names and the page address first.</p>}
      {state.busy && (
        <p className="mt-4 cc-type text-sm" role="status">
          ✦ {state.step}…
        </p>
      )}
      {state.error && (
        <p className="mt-4 text-sm text-[#ff9b9b]" role="alert">
          {state.error}
        </p>
      )}
      {kit?.warnings.map((w) => (
        <p key={w} className="mt-3 text-sm text-[#dcc28c]">
          {w}
        </p>
      ))}

      {kit && (
        <>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="cc-btn" onClick={download} disabled={state.busy}>
              <Download className="w-4 h-4" aria-hidden="true" /> Download everything (ZIP)
            </button>
            <button type="button" className="cc-btn cc-btn-red" onClick={apply} disabled={state.busy}>
              <Stamp className="w-4 h-4" aria-hidden="true" /> Add to the page & shop
            </button>
          </div>
          {applied && (
            <p className="mt-3 text-sm text-[#b9e3b5]" role="status">
              {applied}
            </p>
          )}

          {glb && (
            <div className="mt-6 grid md:grid-cols-[320px_1fr] gap-5 items-center">
              <div className="h-[320px] bg-black/40 border border-[#b08d57]/40">
                <Suspense fallback={null}>
                  <ModelViewer url={glb.preview} />
                </Suspense>
              </div>
              <p className="text-sm text-[#efe3c8]/75">
                3D portrait relief in bronze — drag to turn. The STL in the ZIP is a closed 100 × 100 mm plaque ready for a 3D printer;
                the GLB is what the fedayi page shows.
              </p>
            </div>
          )}

          {groups
            .filter((g) => g !== "3D")
            .map((g) => (
              <div key={g} className="mt-6">
                <h3 className="cc-type text-xs uppercase tracking-widest text-[#dcc28c]">{g}</h3>
                <ul className="mt-2 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {kit.items
                    .filter((i) => i.group === g)
                    .map((i) => (
                      <li key={i.key} className="bg-black/30 border border-[#b08d57]/30 p-2">
                        <div className="aspect-square bg-[repeating-conic-gradient(#2a221d_0_25%,#211a16_0_50%)] bg-[length:16px_16px] flex items-center justify-center overflow-hidden">
                          {i.preview && <img src={i.preview} alt="" className="max-w-full max-h-full object-contain" />}
                        </div>
                        <p className="mt-2 text-xs leading-snug">{i.title}</p>
                        <button type="button" className="cc-link text-xs mt-1 text-[#ff8a8f]" onClick={() => downloadBlob(i.blob, `${record.slug}-${i.file}`)}>
                          Download
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
        </>
      )}
    </section>
  );
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
