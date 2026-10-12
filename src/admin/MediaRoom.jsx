import React, { useEffect, useRef, useState } from "react";
import { Upload, Copy, Check } from "lucide-react";
import { useCommand } from "./store";
import { useImageUpload, usePreviewSrc } from "./fields";

const FOLDERS = ["public/images/uploads", "public/images"];
const isImage = (name) => /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(name);

export default function MediaRoom() {
  const { source, orders, unstageFile } = useCommand();
  const upload = useImageUpload();
  const preview = usePreviewSrc();
  const fileRef = useRef(null);
  const [files, setFiles] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    Promise.all(FOLDERS.map((f) => source.listDir(f)))
      .then((lists) => setFiles(lists.every((l) => l === null) ? null : lists.flat().filter(Boolean).filter((f) => isImage(f.name))))
      .catch((err) => setError(err.message));
  }, [source]);

  const staged = Object.entries(orders.files).filter(([, f]) => f.base64 != null);

  const pick = async (e) => {
    const list = [...(e.target.files || [])];
    e.target.value = "";
    setError("");
    for (const file of list) {
      try {
        await upload(file);
      } catch (err) {
        setError(`${file.name}: ${err.message}`);
      }
    }
  };

  const copy = async (path) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(path);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      window.prompt("Copy this path:", path);
    }
  };

  const Tile = ({ path, src, children }) => (
    <li className="cc-paper-2 border cc-rule p-2 flex flex-col gap-2">
      <div className="aspect-[4/3] bg-[#1d1712]/10 overflow-hidden">
        <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
      </div>
      <p className="cc-type text-[11px] break-all leading-snug">{path}</p>
      <div className="flex gap-2 mt-auto">
        <button type="button" className="cc-btn flex-1 px-2" onClick={() => copy(path)}>
          {copied === path ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied === path ? "Copied" : "Copy path"}
        </button>
        {children}
      </div>
    </li>
  );

  return (
    <div className="cc-paper px-5 sm:px-8 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="cc-type text-xs tracking-[0.3em] text-[#5b4b3b]">ԼՈՒՍԱՆԿԱՐՆԵՐ · PHOTO ARCHIVE</p>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl mt-1">Պատկերներ · Media</h1>
          <p className="mt-2 text-sm text-[#3d3227] max-w-xl">
            Upload images, then paste their path into any image field. You can also upload straight from an image field while editing.
          </p>
        </div>
        <button type="button" className="cc-btn cc-btn-red" onClick={() => fileRef.current?.click()}>
          <Upload className="w-4 h-4" aria-hidden="true" /> Upload images
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={pick} />
      </div>
      {error && (
        <p className="mt-4 text-sm text-[#a3161f]" role="alert">
          {error}
        </p>
      )}

      {staged.length > 0 && (
        <>
          <h2 className="mt-7 font-heading font-bold">Waiting for dispatch</h2>
          <ul className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {staged.map(([path]) => {
              const publicPath = path.replace(/^public/, "");
              return (
                <Tile key={path} path={publicPath} src={preview(publicPath)}>
                  <button type="button" className="cc-btn px-2" onClick={() => unstageFile(path)} aria-label="Withdraw this upload">
                    ✕
                  </button>
                </Tile>
              );
            })}
          </ul>
        </>
      )}

      <h2 className="mt-7 font-heading font-bold">On the site</h2>
      {files === null && !error && <p className="mt-3 text-sm text-[#5b4b3b]">Sign in with your GitHub key to browse the image folders.</p>}
      {files && files.length === 0 && <p className="mt-3 text-sm text-[#5b4b3b]">No images uploaded yet.</p>}
      {files && files.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {files.map((f) => {
            const publicPath = f.path.replace(/^public/, "");
            return <Tile key={f.path} path={publicPath} src={publicPath} />;
          })}
        </ul>
      )}
    </div>
  );
}
