import React from "react";
import StormIntro from "@/components/home/StormIntro";
import StoriesPreview from "@/components/home/StoriesPreview";
import VideosAndNews from "@/components/home/VideosAndNews";
import ShopPreview from "@/components/home/ShopPreview";
import BlogNewsletter from "@/components/home/BlogNewsletter";
import { design, arrange } from "@/lib/design";

// Order and visibility come from the Command Center's Design room.
export const HOME_SECTIONS = [
  { key: "intro", Component: StormIntro },
  { key: "stories", Component: StoriesPreview },
  { key: "videosNews", Component: VideosAndNews },
  { key: "shop", Component: ShopPreview },
  { key: "blogNewsletter", Component: BlogNewsletter },
];

export default function Home() {
  return (
    <div>
      {arrange(HOME_SECTIONS, design.homeSections, (s) => s.key).map(({ key, Component }) => (
        <Component key={key} />
      ))}
    </div>
  );
}
