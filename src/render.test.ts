import { describe, expect, it } from "vitest";
import { renderResult } from "./render.ts";
import type { Pokemon } from "./types.ts";

const pikachu: Pokemon = {
  id: "025",
  name: "Pikachu",
  dex: "025",
  evs: {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 2,
    special: 0,
  },
};

describe("result rendering", () => {
  it("uses the pinned sprite sheet for the species", () => {
    const result = renderResult(pikachu, 4, false, true);
    expect(result).toContain("sprites/gen1.png");
    expect(result).toContain('style="left:-320px;top:-40px"');
  });

  it("uses the same species sprite for different forms", () => {
    const result = renderResult(
      { ...pikachu, id: "025-costume", name: "Pikachu (Costume)" },
      4,
      false,
      true,
    );
    expect(result).toContain("sprites/gen1.png");
  });

  it("shows a later-generation sprite", () => {
    const result = renderResult(
      { ...pikachu, id: "1000", dex: "1000", name: "Gholdengo" },
      9,
      false,
      true,
    );
    expect(result).toContain("sprites/gen9.png");
  });

  it("shows a fallback for unknown numbers", () => {
    const result = renderResult(
      { ...pikachu, id: "9999", dex: "9999" },
      9,
      false,
      true,
    );
    expect(result).toContain('class="sprite-wrap no-sprite"');
  });

  it("disables yield actions until a trainee is selected", () => {
    expect(renderResult(pikachu, 4, false, false)).toContain(
      'class="primary-action yield-action" data-action="yield" data-id="025" disabled',
    );
  });

  it("shows when a Pokémon is already saved", () => {
    expect(renderResult(pikachu, 4, false, true, true)).toContain(
      'aria-label="Pikachu saved for later" disabled',
    );
  });
});
