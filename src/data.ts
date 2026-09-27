import {
  type Generation,
  type Pokemon,
  emptyEvs,
  statsForGeneration,
} from "./types.ts";

interface DataRow {
  id: string;
  dex: string;
  name: string;
  yields: number[];
}
export const loadPokemon = async (
  generation: Generation,
): Promise<Pokemon[]> => {
  const response = await fetch(
    `${import.meta.env.BASE_URL}data/gen${generation}.json`,
  );
  if (!response.ok)
    throw new Error(
      `Could not load Generation ${generation} data (${response.status})`,
    );
  const rows = (await response.json()) as DataRow[];
  const stats = statsForGeneration(generation);
  if (!Array.isArray(rows) || rows.length === 0)
    throw new Error("Pokémon data is empty");
  return rows.map((row) => {
    if (
      !row.id ||
      !row.name ||
      row.yields.length !== stats.length ||
      row.yields.some((value) => !Number.isInteger(value) || value < 0)
    )
      throw new Error(`Invalid Generation ${generation} data`);
    const evs = emptyEvs();
    stats.forEach((stat, index) => {
      evs[stat] = row.yields[index] ?? 0;
    });
    return { id: row.id, dex: row.dex, name: row.name, evs };
  });
};
export const totalYield = (pokemon: Pokemon, generation: Generation): number =>
  statsForGeneration(generation).reduce(
    (total, stat) => total + pokemon.evs[stat],
    0,
  );
export const spriteUrl = ({ dex }: Pokemon): string =>
  `${import.meta.env.BASE_URL}img/${dex}MS.png`;
