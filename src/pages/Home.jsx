import React from "react";
import StormIntro from "@/components/home/StormIntro";
import StoriesPreview from "@/components/home/StoriesPreview";
import VideosAndNews from "@/components/home/VideosAndNews";
import ShopPreview from "@/components/home/ShopPreview";
import BlogNewsletter from "@/components/home/BlogNewsletter";

export default function Home() {
  return (
    <div>
      <StormIntro />
      <StoriesPreview />
      <VideosAndNews />
      <ShopPreview />
      <BlogNewsletter />
    </div>
  );
}
