import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { content } from "@/api/content";
import ProductCard from "@/components/shared/ProductCard";

export default function ShopPreview() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    content.Product.list("-created_date", 4).then(setProducts);
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-baseline justify-between mb-10">
        <div>
          <h2 className="font-heading text-4xl font-bold">Խանութ</h2>
          <p className="text-black/60 mt-2">Printed books and gamebooks for every age, shipped from the US.</p>
        </div>
        <Link to="/shop" className="text-sm uppercase tracking-widest underline hover:text-[#C1272D]">Բոլորը</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}