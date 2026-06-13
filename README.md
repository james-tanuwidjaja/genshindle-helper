# Genshindle Solver

A helper tool for Genshin Impact guessing games, built with **Vue 3 + Vite +
TypeScript** (Pinia for state, Vue Router for routing).

Live: https://james-tanuwidjaja.github.io/genshindle-helper/

## Features

- Manual filtering for characters.
- Minimax algorithm for optimal guesses.
- Cardcaptor Sakura theme.
- Bundled default dataset, plus your own CSV upload.

## Project structure

```
src/
  assets/        images (element/weapon/region icons) + main.css
  components/    AttrTag, LoadCard, FilterCard, ResultsCard
  views/         HomeView (composes the cards)
  router/        Vue Router setup
  stores/        Pinia store (game state + solver actions)
  lib/           framework-free logic: logic.ts (parse/filter/minimax),
                 genshinAssets.ts (build-time icon map)
  data/          characters.csv (bundled default dataset)
  App.vue        router outlet
  main.ts        app bootstrap
```

The `@` alias points at `src/` (configured in `vite.config.ts` and
`tsconfig.json`).

## Development

Requires **Node.js >= 24**.

```bash
npm install
npm run dev         # local dev server with hot reload
npm run type-check  # vue-tsc type checking
npm run build       # type-check + production build into dist/
npm run preview     # serve the production build under the /genshindle-helper/ base
npm run lint        # ESLint (with --fix)
npm run format      # Prettier (writes formatting across the repo)
```

A default character dataset is bundled (`src/data/characters.csv`). You can also
upload your own CSV at runtime — it must have the headers:
`Character, Quality, Element, Weapon, Region, Version`.

## Run with Docker

The included `Dockerfile` builds the app and serves the static files with nginx.

```bash
# Easiest: build + run with Docker Compose
docker compose up --build      # then open http://localhost:8080
docker compose down            # stop and remove the container

# Or with plain Docker
docker build -t genshindle-helper .
docker run --rm -p 8080:80 genshindle-helper   # open http://localhost:8080
```

The image overrides Vite's `base` to `/` (instead of the `/genshindle-helper/`
GitHub Pages sub-path) so it serves cleanly at the container root. To use a
different host port, change the left side of the mapping, e.g. `-p 3000:80`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which type-checks,
builds, and publishes the app to GitHub Pages.

**One-time setup:** in the repo **Settings → Pages**, set **Source** to
**GitHub Actions**.

The Vite `base` is set to `/genshindle-helper/` in `vite.config.ts` to match the
Pages sub-path. If the repo is ever renamed, update that value.
