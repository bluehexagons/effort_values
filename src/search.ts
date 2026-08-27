import {
  type AppState,
  type Pokemon,
  type SortKey,
  statKeys,
} from "./types.ts";

export const matchesFilter = (value: number, filter: string): boolean => {
  const normalized = filter.trim();
  if (normalized === "" || normalized === "*") return true;
  const match = /^(\d+)([+-])?$/.exec(normalized);
  if (!match) return false;
  const target = Number(match[1]);
  if (match[2] === "+") return value >= target;
  if (match[2] === "-") return value <= target;
  return value === target;
};

export const matchesPokemon = (pokemon: Pokemon, state: AppState): boolean => {
  const query = state.query.trim().toLocaleLowerCase();
  const name = pokemon.name.toLocaleLowerCase();
  const nameMatches =
    query === ""
      ? state.showAllWhenEmpty
      : state.matchAnywhere
        ? name.includes(query)
        : name.startsWith(query);
  if (!nameMatches) return false;
  if (!state.filterEnabled) return true;
  if (!matchesFilter(pokemon.exp, state.filters.exp)) return false;
  return statKeys.every((stat) =>
    matchesFilter(pokemon.evs[stat], state.filters[stat]),
  );
};

const sortValue = (pokemon: Pokemon, key: Exclude<SortKey, "name">): number => {
  if (key === "dex") return Number(pokemon.dex);
  if (key === "exp") return pokemon.exp;
  return pokemon.evs[key];
};

export const sortPokemon = (
  pokemon: readonly Pokemon[],
  state: AppState,
): Pokemon[] => {
  const direction = state.sortDescending ? -1 : 1;
  return [...pokemon].sort((left, right) => {
    const comparison =
      state.sortKey === "name"
        ? left.name.localeCompare(right.name)
        : sortValue(left, state.sortKey) - sortValue(right, state.sortKey);
    return comparison * direction;
  });
};
