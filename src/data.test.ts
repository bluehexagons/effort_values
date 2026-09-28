import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPokemon } from "./data.ts";
import { spriteForDex } from "./sprites.ts";
import { generations } from "./types.ts";

afterEach(() => vi.unstubAllGlobals());

describe("Pokémon data", () => {
  it("loads every committed generation dataset", async () => {
    vi.stubGlobal("fetch", async (url: string) => ({
      ok: true,
      json: async () =>
        JSON.parse(
          await readFile(new URL(`../public${url}`, import.meta.url), "utf8"),
        ),
    }));
    for (const generation of generations) {
      const pokemon = await loadPokemon(generation);
      expect(pokemon.length).toBeGreaterThan(0);
      expect(new Set(pokemon.map(({ id }) => id)).size).toBe(pokemon.length);
      expect(pokemon.every(({ dex }) => spriteForDex(dex) !== null)).toBe(true);
    }
  });

  it("reports a malformed row as a data error", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => [{ id: "001", name: "Bulbasaur" }],
    }));
    await expect(loadPokemon(4)).rejects.toThrow("Invalid Generation 4 data");
  });
});
