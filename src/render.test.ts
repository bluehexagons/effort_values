import { describe, expect, it } from "vitest";
import { renderResult } from "./render.ts";
import type { Pokemon } from "./types.ts";

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

describe("result rendering", () => {
  it("keeps pixel sprites at their native dimensions", () => {
    const result = renderResult(pikachu, false, true);
    expect(result).toContain('width="32" height="32"');
    expect(result).toContain("img/025MS.png");
  });

  it("disables yield actions until a trainee is selected", () => {
    expect(renderResult(pikachu, false, false)).toContain(
      'class="primary-action yield-action" data-action="yield" data-dex="025" disabled',
    );
  });
});
