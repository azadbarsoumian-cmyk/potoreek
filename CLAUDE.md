# Փոթորիկ (Potoreek) website

Bilingual (Armenian / English) archive of the Fedayi era, moved off Base44 to a
plain static site. React 18 + Vite + Tailwind 3, deployed on Netlify from GitHub.

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
- The hologram (`src/components/shared/HoloPortrait.jsx`) loads photos through
  the public wsrv.nl relay when the photo host blocks WebGL.
- `scripts/import-base44-export.mjs` was the one-off migration from the Base44
  export; `_base44-original/` keeps the old Base44 backend code for reference only.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build into `dist/`

## Publishing

- Live site: https://potoreek.netlify.app (Netlify project `potoreek`, team slug
  `azadbarsoumian-cmyk`). This folder is linked to it via `.netlify/state.json`.
- The site is NOT connected to GitHub for automatic deploys. To publish: run
  `npm run build`, then in the user's Terminal panel (where the Netlify login is
  stored) run `npx -y netlify-cli@27.12.0 deploy --prod --dir dist --no-build`.
  Each production deploy uses Netlify credits (free plan: 300/month), so batch
  changes into one publish.
- Also commit and push to GitHub (`origin`, branch `main`) to keep the history.
- New Netlify sites start private ("Netlify login required"); this one was
  switched to public (`sso_login: false`) and has form detection on.
