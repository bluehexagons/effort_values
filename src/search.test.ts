import { describe, expect, it } from "vitest";
import { matchesFilter, matchesPokemon, sortPokemon } from "./search.ts";
import { defaultState, type Pokemon } from "./types.ts";

const pikachu: Pokemon = {
  name: "Pikachu",
  dex: "025",
  exp: 82,
  evs: {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 2,
  },
};

describe("yield filters", () => {
  it("supports exact, minimum, maximum, wildcard, and invalid expressions", () => {
    expect(matchesFilter(2, "2")).toBe(true);
    expect(matchesFilter(2, "1+")).toBe(true);
    expect(matchesFilter(2, "3-")).toBe(true);
    expect(matchesFilter(2, "*")).toBe(true);
    expect(matchesFilter(2, "oops")).toBe(false);
  });
});

describe("Pokémon search", () => {
  it("combines name and EV filters", () => {
    const state = defaultState();
    state.query = "kachu";
    state.filters.speed = "2";
    expect(matchesPokemon(pikachu, state)).toBe(true);
    state.filters.speed = "3+";
    expect(matchesPokemon(pikachu, state)).toBe(false);
  });

  it("sorts without mutating the source", () => {
    const bulbasaur = { ...pikachu, name: "Bulbasaur", dex: "001" };
    const source = [pikachu, bulbasaur];
    const state = defaultState();
    const sorted = sortPokemon(source, state);
    expect(sorted.map(({ dex }) => dex)).toEqual(["001", "025"]);
    expect(source[0]).toBe(pikachu);
  });
});
