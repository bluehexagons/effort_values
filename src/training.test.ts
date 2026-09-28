import { describe, expect, it } from "vitest";
import { recordBattleYield } from "./training.ts";
import { emptyEvs, type Pokemon, type Trainee } from "./types.ts";

const trainee = (): Trainee => ({ id: "one", name: "One", evs: emptyEvs() });
const source = (evs: Partial<Pokemon["evs"]>): Pokemon => ({
  id: "001",
  dex: "001",
  name: "Test source",
  evs: { ...emptyEvs(), ...evs },
});

describe("battle yield limits", () => {
  it("awards Speed before special stats at the final modern EV point", () => {
    const target = trainee();
    target.evs.hp = 252;
    target.evs.attack = 252;
    target.evs.defense = 5;
    expect(
      recordBattleYield(target, source({ speed: 1, specialAttack: 1 }), 9),
    ).toBe(1);
    expect(target.evs.speed).toBe(1);
    expect(target.evs.specialAttack).toBe(0);
  });

  it("keeps the earlier 255 per-stat cap", () => {
    const target = trainee();
    target.evs.speed = 254;
    expect(recordBattleYield(target, source({ speed: 3 }), 4)).toBe(1);
    expect(target.evs.speed).toBe(255);
  });

  it("allows independent stat experience up to 65,535", () => {
    const target = trainee();
    target.evs.hp = 65530;
    target.evs.attack = 65535;
    expect(
      recordBattleYield(target, source({ hp: 10, attack: 20, special: 5 }), 2),
    ).toBe(10);
    expect(target.evs.hp).toBe(65535);
    expect(target.evs.attack).toBe(65535);
    expect(target.evs.special).toBe(5);
  });
});
