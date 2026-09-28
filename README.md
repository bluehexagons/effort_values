# Pokémon Training Planner

A static Pokémon battle-yield search and training tracker for Generations I–IX. Search by name or yield, save common battle sources, and track named trainees. Progress is saved separately for each generation in your browser; share links include the selected generation.

## Game rules and scope

- **Generations I–II:** Defeated Pokémon award their base stats as stat experience. Generation I has one Special stat; Generation II's Special gain uses the defeated Pokémon's Special Attack base stat. Each stat has a 65,535 cap and there is no combined 510 cap. When multiple Pokémon participate in a battle, the stat experience is divided among them.
- **Generations III–V:** The tracker uses a 510 total EV cap and a 255 per-stat cap. Generation V uses the Black 2/White 2 yield table; some original Black/White yields differ. In Generations III–IV, level 100 Pokémon do not receive battle EVs.
- **Generations VI–IX:** The tracker uses a 510 total EV cap and a 252 per-stat cap. Generation VII excludes Let's Go, and Generation VIII excludes Legends: Arceus, which use different training systems.

The lists contain species and forms from a generation, not game-specific encounter or Pokédex availability. The **Add** action records the base battle yield only. It does not calculate effects from held items, Pokérus, vitamins, or other bonuses. Where a species has forms with different yields, each differing form appears as its own result.

## Using the planner

1. Choose the game generation, then add a trainee. A new trainee is selected automatically.
2. Search for a Pokémon or enable yield filters.
3. Use **Add** to record a battle yield, or **Save** for quick access.
4. Use **Share setup** to copy a link containing the current generation's setup.

Existing v2–v4 saved state and links migrate into a Generation IV profile. The old EXP search and display have been removed because EXP awards vary between games and were not reliably represented by the archived dataset.

## Data and attribution

The committed `public/data/gen3.json` through `gen9.json` files were generated from pinned revisions of Bulbapedia's [Generation III](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_effort_value_yield_in_Generation_III), [Generation IV](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_effort_value_yield_in_Generation_IV), [Generations V–VI](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_effort_value_yield_in_Generations_V_and_VI), [Generation VII](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_effort_value_yield_in_Generation_VII), [Generation VIII](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_effort_value_yield_in_Generation_VIII), and [Generation IX](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_effort_value_yield_in_Generation_IX) yield tables. Bulbapedia content is available under [CC BY-NC-SA 2.5](https://bulbapedia.bulbagarden.net/wiki/Bulbapedia:Copyright_policy); the derived JSON files follow that license. Revision IDs are pinned in `scripts/generate_data.py`.

Generation I–II stat-experience values are derived from historical base stats in [PokéAPI](https://github.com/PokeAPI/pokeapi)'s pinned CSV dataset, released under the BSD 3-Clause license. Its copyright and license notice are retained in [DATA-LICENSES.md](public/DATA-LICENSES.md). `scripts/generate_data.py` regenerates the JSON with Python's standard library and an internet connection. Run `npm run format` afterward to format the generated files.

## Development

Node.js 22 or newer is recommended.

```sh
npm install
npm run dev
```

- `npm run build` — type-check and create the production bundle
- `npm test` — run unit tests
- `npm run check` — lint, format-check, and type-check
- `npm run check:fix` — apply lint fixes and formatting
- `npm run preview` — serve the production bundle

`npm run build` writes the static site to `dist/`. Vite uses relative asset paths, so the output works from a GitHub Pages project subdirectory.

## License

The application code is licensed under Apache 2.0; see [LICENSE](LICENSE). The generated data has the licenses described above. Pokémon-related names and assets belong to their respective owners.
