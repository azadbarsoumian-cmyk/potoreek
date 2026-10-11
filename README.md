# Փոթորիկ · Potoreek

The living archive of the Armenian liberation struggle: stories, poems, quotes,
videos and books from the Fedayi era, in Armenian and English.

## Run it locally

```bash
npm install
npm run dev
```

## Publish

The site is hosted on Netlify at https://potoreek.netlify.app. Build it with
`npm run build`, then publish the `dist/` folder with
`npx netlify-cli deploy --prod --dir dist --no-build` (`netlify.toml` holds the
settings).

## Content

All content is in `public/data/`. See `CLAUDE.md` for the file layout.
