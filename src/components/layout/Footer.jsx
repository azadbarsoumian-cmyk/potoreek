import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#171717] text-white">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <span className="font-heading text-xl font-bold">Փոթորիկ</span>
        </div>
        <div className="flex flex-col gap-2 text-sm text-white/70">
          <Link to="/stories" className="hover:text-white transition-colors">Պատմութիւններ</Link>
          <Link to="/videos" className="hover:text-white transition-colors">Տեսանիւթեր</Link>
          <Link to="/news" className="hover:text-white transition-colors">Լուրեր</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm text-white/70">
          <Link to="/shop" className="hover:text-white transition-colors">Խանութ</Link>
          <Link to="/blog" className="hover:text-white transition-colors">Բլոգ</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        <div className="flex gap-4 text-white/70">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><Youtube className="w-5 h-5" /></a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pb-8 text-xs text-white/40">
        © Փոթորիկ {new Date().getFullYear()}
      </div>
    </footer>
  );
}