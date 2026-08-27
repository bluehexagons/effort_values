# EV Yield Planner

A static Pokémon effort-value yield search and training tracker. It supports responsive layouts, local autosave, shareable setup links, quick-reference lists, and multiple named trainees.

## Development

The project uses TypeScript 7's native compiler, Vite, Vitest, and Biome. Node.js 22 or newer is recommended.

```sh
npm install
npm run dev
```

Useful commands:

- `npm run build` — type-check with TypeScript 7 and create the production bundle
- `npm test` — run the unit test suite once
- `npm run check` — lint, format-check, and type-check the project
- `npm run check:fix` — apply safe formatting and lint fixes
- `npm run preview` — serve the production build locally

## Structure

- `src/data.ts` loads and parses the XML Pokémon dataset.
- `src/types.ts` defines the domain and persisted-state models.
- `src/search.ts` contains pure filtering and sorting logic.
- `src/storage.ts` validates, migrates, saves, and shares app state.
- `src/render.ts` renders results, reference entries, trainees, and details.
- `src/main.ts` coordinates state, browser events, and UI updates.
- `src/styles.css` contains the responsive presentation layer.
- `public/` contains the XML dataset, sprites, and favicon copied into builds.

Saved state is validated at the browser boundary. The current v4 format automatically migrates compatible v2 and v3 state from existing installations and shared links.

## Deployment

`npm run build` writes the deployable static site to `dist/`. Vite uses relative asset paths, so the output works from a GitHub Pages project subdirectory as well as a domain root.

## License

Pokémon-related names and assets belong to their respective owners. The codebase is licensed under the Apache License; see [LICENSE](LICENSE).
