# Փոթորիկ (Potoreek) website

Bilingual (Armenian / English) archive of the Fedayi era, moved off Base44 to a
plain static site. React 18 + Vite + Tailwind 3, deployed on Netlify from GitHub.

## Site mode

- Coming-soon mode is ON (`UNDER_CONSTRUCTION = true` in `src/lib/siteMode.js`;
  briefly launched on 2026-10-12, then switched back at the user's request).
  Every address shows the coming-soon page (`src/pages/ComingSoon.jsx`) — the
  original Potoreek film on loop, a launch sign-up (Netlify form `newsletter`)
  and social links.
- While on, `?preview=on` on any URL shows the full site in that browser
  (`?preview=off` undoes it). Not a password.
- To launch: set `UNDER_CONSTRUCTION = false`, build, push.
- Videos live in `public/video/`: `potoreek-*` is the full original film
  (landing page), `intro-*` is the homepage opening film, trimmed at 9.6 s
  before the Patreon card with a fade out. 1080p for wide screens, 720p for
  phones (`src/lib/video.js`). The raw source and FFmpeg scratch files stay in
  `.video-work/` (git-ignored); FFmpeg is installed via winget (Gyan.FFmpeg).

## How it fits together

- Content lives in `public/data/` as JSON. `src/api/content.js` loads it and
  offers `content.Story.list / filter / get / aggregate` (same shape the pages
  used with Base44).
  - `stories.json` and `blog-posts.json` are light indexes (no body text);
    the full record with the body is `stories/<id>.json` / `blog-posts/<id>.json`.
  - `poems.json`, `quotes.json`, `products.json`, `videos.json`, `news.json`
    hold complete records.
- To add or edit content, edit those JSON files. A new record needs a unique
  24-character lowercase hex `id` and a `created_date` (ISO timestamp); for a
  story or blog post, add it to the index file and write its detail file too.
- Images on Base44's servers were copied to `public/images/`. Story photos are
  still linked from Blogger (`blogger.googleusercontent.com`).
- Forms (pre-order, newsletter) post to Netlify Forms via `src/lib/forms.js`.
  A new form also needs a hidden copy in `index.html`.
- The homepage opens with an animated intro (`src/components/home/StormIntro.jsx`):
  the archive swirls around the logo, then settles into the 12 category tiles.
  It plays once per browser session (skippable, replay button, off for
  reduced-motion). To use an AI-generated background clip, add it under
  `public/video/` and set `HERO_VIDEO` in that file.
- The hologram (`src/components/shared/HoloPortrait.jsx`) loads photos through
  the public wsrv.nl relay when the photo host blocks WebGL.
- `scripts/import-base44-export.mjs` was the one-off migration from the Base44
  export; `_base44-original/` keeps the old Base44 backend code for reference only.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build into `dist/`

## Publishing

- Live site: https://potoreek.com (bought through Netlify; Netlify DNS + HTTPS).
  Netlify project `idyllic-begonia-79b895`, id `455724da-18cb-4024-95c5-e78b009a2823`,
  team slug `azadbarsoumian-cmyk`. This folder is linked to it via `.netlify/state.json`.
- Publishing = push to GitHub: the project builds `main` from
  `azadbarsoumian-cmyk/potoreek` automatically. Run `npm run build` locally
  first to catch errors, then commit and push.
- Each production deploy uses Netlify credits (free plan: 300/month), so batch
  changes into one push. Put `[skip netlify]` in the commit message for
  changes that don't affect the site (docs only).
- Netlify CLI commands need the user's login, which only works in the user's
  Terminal panel: `npx -y netlify-cli@27.12.0 <command>`.
- New Netlify projects start private ("Netlify login required"); this one was
  switched to public (`sso_login: false`) and has form detection on.
- A second, older project `potoreek` (https://potoreek.netlify.app) was a manual
  upload and no longer updates; it can be deleted in the Netlify dashboard.
