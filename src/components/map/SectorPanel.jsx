import React from "react";

export default function SectorPanel({ regions, selected, onSelect, labels }) {
  const max = Math.max(...regions.map((r) => r.count), 1);
  return (
    <div className="border border-white/15 bg-black/40">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/15">
        <span className="font-mono text-[11px] uppercase tracking-widest text-brass">{labels.title}</span>
        <span className="font-mono text-[11px] text-white/30">{regions.length} SEC</span>
      </div>
      <div className="max-h-[480px] overflow-y-auto">
        {regions.map((r) => (
          <button
            key={r.key}
            onClick={() => onSelect(selected === r.key ? null : r.key)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-white/5 text-left transition-colors ${
              selected === r.key ? "bg-[#C1272D]/20" : "hover:bg-white/5"
            }`}
          >
            <span
              className={`font-mono text-[11px] uppercase tracking-widest w-32 shrink-0 truncate ${
                selected === r.key ? "text-[#C1272D]" : "text-white/70"
              }`}
            >
              {r.label}
            </span>
            <span className="flex-1 h-1 bg-white/10">
              <span
                className="block h-full bg-[#C1272D]"
                style={{ width: `${Math.max((r.count / max) * 100, r.count > 0 ? 3 : 0)}%` }}
              />
            </span>
            <span className="font-mono text-[11px] text-white/40 w-8 text-right">{r.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}