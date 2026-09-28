import {
  type AppState,
  defaultState,
  emptyEvs,
  emptyFilters,
  generations,
  type Generation,
  MAX_QUICK_REFERENCE,
  MAX_TRAINEES,
  type SortKey,
  statCap,
  statKeys,
  statsForGeneration,
  type Trainee,
} from "./types.ts";

const sortKeys = new Set<SortKey>(["dex", "name", ...statKeys]);
const filterPattern = /^(?:\*|\d+[+-]?)?$/;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const asGeneration = (value: unknown): Generation | null =>
  generations.includes(value as Generation) ? (value as Generation) : null;
const boundedNumber = (value: unknown, cap: number): number => {
  const number =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(number)
    ? Math.max(0, Math.min(cap, Math.trunc(number)))
    : 0;
};
const cleanTrainee = (
  value: unknown,
  index: number,
  generation: Generation,
): Trainee | null => {
  if (!isRecord(value)) return null;
  const sourceEvs = isRecord(value.evs) ? value.evs : {};
  const evs = emptyEvs();
  for (const stat of statsForGeneration(generation))
    evs[stat] = boundedNumber(sourceEvs[stat], statCap(generation));
  return {
    id:
      typeof value.id === "string" && /^[\w-]{1,80}$/.test(value.id)
        ? value.id
        : `restored-${index}`,
    name:
      typeof value.name === "string"
        ? value.name.replaceAll(/[\\/]/g, "").slice(0, 40)
        : "",
    evs,
  };
};
const cleanFilter = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const filter = value.trim().slice(0, 8);
  return filterPattern.test(filter) ? filter : "";
};
const uniqueTrainees = (
  values: readonly unknown[],
  generation: Generation,
): Trainee[] => {
  const usedIds = new Set<string>();
  return values.slice(0, MAX_TRAINEES).flatMap((entry, index) => {
    const trainee = cleanTrainee(entry, index, generation);
    if (!trainee) return [];
    let id = trainee.id;
    let suffix = 0;
    while (usedIds.has(id)) {
      id = `restored-${index}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    return [{ ...trainee, id }];
  });
};
export const isCurrentState = (
  value: unknown,
): value is Record<string, unknown> & { version: 5; generation: Generation } =>
  isRecord(value) &&
  value.version === 5 &&
  asGeneration(value.generation) !== null;
export const sanitizeState = (value: unknown): AppState => {
  const fallback = defaultState();
  if (!isCurrentState(value)) return fallback;
  const generation = value.generation;
  const rawFilters = isRecord(value.filters) ? value.filters : {};
  const filters = emptyFilters();
  for (const key of statKeys) filters[key] = cleanFilter(rawFilters[key]);
  const trainees = Array.isArray(value.trainees)
    ? uniqueTrainees(value.trainees, generation)
    : [];
  const selected =
    typeof value.selectedTraineeId === "string"
      ? value.selectedTraineeId
      : null;
  const sortKey =
    typeof value.sortKey === "string" &&
    sortKeys.has(value.sortKey as SortKey) &&
    (value.sortKey === "dex" ||
      value.sortKey === "name" ||
      statsForGeneration(generation).includes(
        value.sortKey as (typeof statKeys)[number],
      ))
      ? (value.sortKey as SortKey)
      : "dex";
  return {
    version: 5,
    generation,
    query: typeof value.query === "string" ? value.query.slice(0, 80) : "",
    filters,
    filterEnabled: value.filterEnabled === true,
    matchAnywhere: value.matchAnywhere !== false,
    showNonMatches: value.showNonMatches === true,
    showAllWhenEmpty: value.showAllWhenEmpty === true,
    sortKey,
    sortDescending: value.sortDescending === true,
    quickReference: Array.isArray(value.quickReference)
      ? [
          ...new Set(
            value.quickReference.filter(
              (entry): entry is string =>
                typeof entry === "string" &&
                /^\d{3,4}(?:-[a-z0-9-]+)?$/.test(entry),
            ),
          ),
        ].slice(0, MAX_QUICK_REFERENCE)
      : [],
    trainees,
    selectedTraineeId: trainees.some(({ id }) => id === selected)
      ? selected
      : null,
  };
};
