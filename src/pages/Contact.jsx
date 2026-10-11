import React from "react";
import { Mail, Instagram, Youtube } from "lucide-react";

export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="font-heading text-5xl font-bold">Contact</h1>
      <p className="text-black/60 mt-4">Questions about the archive, the shop, or the Patreon? Reach us here.</p>
      <div className="mt-10 flex flex-col gap-4">
        <a href="mailto:hello@photorik.org" className="flex items-center gap-3 text-lg hover:text-[#C1272D] transition-colors">
          <Mail className="w-5 h-5" /> hello@photorik.org
        </a>
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-lg hover:text-[#C1272D] transition-colors">
          <Instagram className="w-5 h-5" /> Instagram
        </a>
        <a href="https://youtube.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-lg hover:text-[#C1272D] transition-colors">
          <Youtube className="w-5 h-5" /> YouTube
        </a>
      </div>
    </div>
  );
}