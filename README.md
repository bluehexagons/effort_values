# EV Yield Planner

A static Pokémon effort-value yield search and training tracker. It supports responsive layouts, local autosave, shareable setup links, saved Pokémon, and multiple named trainees.

## Using the planner

1. Add a trainee and give it a name. New trainees are selected automatically.
2. Search for a Pokémon, or turn on yield filters to find a specific EV yield.
3. Use the EV button on a result to record its yield for the selected trainee. Choose **Save** to keep a Pokémon in the saved list for later.
4. Use **Share setup** to copy a link containing the current setup. Changes also save automatically in your browser.

## Development

The project uses TypeScript 7's native compiler, Vite, Vitest, Oxlint, and Oxfmt. Node.js 22 or newer is recommended.

```sh
npm install
npm run dev
```

Useful commands:

- `npm run build` — type-check with TypeScript 7 and create the production bundle
- `npm test` — run the unit test suite once
- `npm run check` — lint, format-check, and type-check the project
- `npm run check:fix` — apply safe lint fixes and format the project
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
