import React, { useEffect, useState } from "react";
import { content } from "@/api/content";
import ProductCard from "@/components/shared/ProductCard";

const FILTERS = [
  { key: "all", label: "Բոլորը" },
  { key: "kids", label: "Kids" },
  { key: "12-15", label: "Ages 12–15" },
  { key: "adults", label: "Adults" },
];

export default function Shop() {
  const [products, setProducts] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    content.Product.list("-created_date").then(setProducts);
  }, []);

  const filtered = products && (filter === "all" ? products : products.filter((p) => p.age_group === filter));

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-6 mb-10">
        <div>
          <h1 className="font-heading text-5xl font-bold">Խանութ</h1>
          <p className="text-black/60 mt-3">Printed books and gamebooks for every age, shipped from the US.</p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${filter === f.key ? "bg-black text-white border-black" : "border-black/20 hover:border-black"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {!filtered && <p className="text-black/50">Loading...</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {filtered && filtered.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}