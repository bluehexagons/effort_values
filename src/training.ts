import {
  type Generation,
  type Pokemon,
  statCap,
  type StatKey,
  statsForGeneration,
  totalCap,
  type Trainee,
} from "./types.ts";

// The games process modern battle EVs in their internal stat order. This
// matters when a mixed yield fills the last available point of the 510 cap.
const modernAwardOrder: readonly StatKey[] = [
  "hp",
  "attack",
  "defense",
  "speed",
  "specialAttack",
  "specialDefense",
];

export const recordBattleYield = (
  trainee: Trainee,
  pokemon: Pokemon,
  generation: Generation,
): number => {
  const cap = totalCap(generation);
  const stats = statsForGeneration(generation);
  let remaining =
    cap === null
      ? Infinity
      : Math.max(
          0,
          cap - stats.reduce((sum, stat) => sum + trainee.evs[stat], 0),
        );
  let gained = 0;
  for (const stat of generation <= 2 ? stats : modernAwardOrder) {
    const gain = Math.max(
      0,
      Math.min(
        pokemon.evs[stat],
        statCap(generation) - trainee.evs[stat],
        remaining,
      ),
    );
    trainee.evs[stat] += gain;
    gained += gain;
    remaining -= gain;
  }
  return gained;
};
