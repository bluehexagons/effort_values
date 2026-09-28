import {
  type Generation,
  type Pokemon,
  emptyEvs,
  statsForGeneration,
} from "./types.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
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
  const rows: unknown = await response.json();
  const stats = statsForGeneration(generation);
  if (!Array.isArray(rows) || rows.length === 0)
    throw new Error("Pokémon data is empty");
  const seen = new Set<string>();
  return rows.map((row) => {
    if (
      !isRecord(row) ||
      typeof row.id !== "string" ||
      !/^\d{3,4}(?:-[a-z0-9-]+)?$/.test(row.id) ||
      seen.has(row.id) ||
      typeof row.dex !== "string" ||
      !/^\d{3,4}$/.test(row.dex) ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      !Array.isArray(row.yields) ||
      row.yields.length !== stats.length ||
      row.yields.some(
        (value: unknown) =>
          !Number.isInteger(value) ||
          (value as number) < 0 ||
          (value as number) > (generation <= 2 ? 255 : 3),
      )
    )
      throw new Error(`Invalid Generation ${generation} data`);
    seen.add(row.id);
    const yields = row.yields as number[];
    const evs = emptyEvs();
    stats.forEach((stat, index) => {
      evs[stat] = yields[index] ?? 0;
    });
    return { id: row.id, dex: row.dex, name: row.name, evs };
  });
};
export const totalYield = (pokemon: Pokemon, generation: Generation): number =>
  statsForGeneration(generation).reduce(
    (total, stat) => total + pokemon.evs[stat],
    0,
  );
