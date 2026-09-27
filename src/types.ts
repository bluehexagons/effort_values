export const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Generation = (typeof generations)[number];
export const statKeys = [
  "hp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed",
  "special",
] as const;
export type StatKey = (typeof statKeys)[number];
export const modernStatKeys = statKeys.slice(0, 6) as readonly StatKey[];
export const legacyStatKeys = [
  "hp",
  "attack",
  "defense",
  "special",
  "speed",
] as const;
export const statsForGeneration = (
  generation: Generation,
): readonly StatKey[] => (generation <= 2 ? legacyStatKeys : modernStatKeys);
export const statLabels: Record<StatKey, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  specialAttack: "Sp. Atk",
  specialDefense: "Sp. Def",
  speed: "Speed",
  special: "Special",
};
export const statCap = (generation: Generation): number =>
  generation <= 2 ? 65535 : generation <= 5 ? 255 : 252;
export const totalCap = (generation: Generation): number | null =>
  generation <= 2 ? null : 510;
export type SortKey = "dex" | "name" | StatKey;
export const MAX_QUICK_REFERENCE = 100;
export const MAX_TRAINEES = 50;
export interface Pokemon {
  readonly id: string;
  readonly name: string;
  readonly dex: string;
  readonly evs: Record<StatKey, number>;
}
export interface Trainee {
  readonly id: string;
  name: string;
  evs: Record<StatKey, number>;
}
export type YieldFilters = Record<StatKey, string>;
export interface AppState {
  version: 5;
  generation: Generation;
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
  special: 0,
});
export const emptyFilters = (): YieldFilters => ({
  hp: "",
  attack: "",
  defense: "",
  specialAttack: "",
  specialDefense: "",
  speed: "",
  special: "",
});
export const defaultState = (generation: Generation = 4): AppState => ({
  version: 5,
  generation,
  query: "",
  filters: emptyFilters(),
  filterEnabled: false,
  matchAnywhere: true,
  showNonMatches: false,
  showAllWhenEmpty: false,
  sortKey: "dex",
  sortDescending: false,
  quickReference: [],
  trainees: [],
  selectedTraineeId: null,
});
