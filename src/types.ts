export const statKeys = [
  "hp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed",
] as const;
export type StatKey = (typeof statKeys)[number];
export type SortKey = "dex" | "name" | "exp" | StatKey;

export interface Pokemon {
  readonly name: string;
  readonly dex: string;
  readonly exp: number;
  readonly evs: Record<StatKey, number>;
}

export interface Trainee {
  readonly id: string;
  name: string;
  evs: Record<StatKey, number>;
}

export interface YieldFilters extends Record<StatKey, string> {
  exp: string;
}

export interface AppState {
  version: 4;
  query: string;
  filters: YieldFilters;
  filterEnabled: boolean;
  matchAnywhere: boolean;
  showNonMatches: boolean;
  showAllWhenEmpty: boolean;
  sortKey: SortKey;
  sortDescending: boolean;
  quickReference: string[];
  trainees: Trainee[];
  selectedTraineeId: string | null;
}

export const emptyEvs = (): Record<StatKey, number> => ({
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
});

export const emptyFilters = (): YieldFilters => ({
  exp: "",
  hp: "",
  attack: "",
  defense: "",
  specialAttack: "",
  specialDefense: "",
  speed: "",
});

export const defaultState = (): AppState => ({
  version: 4,
  query: "",
  filters: emptyFilters(),
  filterEnabled: true,
  matchAnywhere: true,
  showNonMatches: false,
  showAllWhenEmpty: true,
  sortKey: "dex",
  sortDescending: false,
  quickReference: [],
  trainees: [],
  selectedTraineeId: null,
});
