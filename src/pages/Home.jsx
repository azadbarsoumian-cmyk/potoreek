import React from "react";
import Hero from "@/components/home/Hero";
import ArchiveNav from "@/components/home/ArchiveNav";
import StoriesPreview from "@/components/home/StoriesPreview";
import VideosAndNews from "@/components/home/VideosAndNews";
import ShopPreview from "@/components/home/ShopPreview";
import BlogNewsletter from "@/components/home/BlogNewsletter";

export default function Home() {
  return (
    <div>
      <Hero />
      <ArchiveNav />
      <StoriesPreview />
      <VideosAndNews />
      <ShopPreview />
      <BlogNewsletter />
    </div>
  );
}