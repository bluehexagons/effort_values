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
  it("keeps pixel sprites at their native dimensions", () => {
    const result = renderResult(pikachu, 4, false, true);
    expect(result).toContain('width="32" height="32"');
    expect(result).toContain("img/025MS.png");
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
