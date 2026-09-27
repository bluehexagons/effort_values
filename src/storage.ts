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

const STORAGE_PREFIX = "effort-values-state-v5-g";
const ACTIVE_KEY = "effort-values-active-generation";
const PREVIOUS_KEY = "effort-values-state-v4";
const LEGACY_KEY = "effort-values-state-v2";
const sortKeys = new Set<SortKey>(["dex", "name", ...statKeys]);
const legacySortKeys: readonly (SortKey | "exp")[] = [
  "name",
  "exp",
  "hp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed",
  "dex",
];
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
const integer = (value: unknown, fallback: number): number => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) ? number : fallback;
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
const migrateLegacyTrainee = (raw: unknown, index: number): Trainee | null => {
  if (typeof raw !== "string") return null;
  const fields = raw.split("/");
  const values = fields.length === 9 ? fields.slice(2, 8) : fields.slice(1, 7);
  if (values.length !== 6) return null;
  const evs = emptyEvs();
  statsForGeneration(4).forEach((stat, statIndex) => {
    evs[stat] = boundedNumber(values[statIndex], 255);
  });
  return { id: `migrated-${index}`, name: (fields[0] ?? "").slice(0, 40), evs };
};
const legacyFilters = (value: unknown): ReturnType<typeof emptyFilters> => {
  const filters = emptyFilters();
  if (Array.isArray(value))
    statsForGeneration(4).forEach((key, index) => {
      filters[key] = cleanFilter(value[index + 1]);
    });
  return filters;
};
export const sanitizeState = (value: unknown): AppState => {
  const fallback = defaultState();
  if (!isRecord(value)) return fallback;
  if (value.version === 2 || value.version === 3) {
    const trainees = Array.isArray(value.evtracker)
      ? value.evtracker
          .flatMap((entry, index) => migrateLegacyTrainee(entry, index) ?? [])
          .slice(0, MAX_TRAINEES)
      : [];
    const selected = Math.max(
      -1,
      Math.min(trainees.length - 1, integer(value.selected, -1)),
    );
    const settings = isRecord(value.settings) ? value.settings : {};
    const savedSort = isRecord(value.sort) ? value.sort : {};
    const quickReference = Array.isArray(value.quickchart)
      ? value.quickchart.flatMap((entry) =>
          typeof entry === "string" ? [entry.split("/").at(-1) ?? ""] : [],
        )
      : [];
    const legacySort = legacySortKeys[integer(savedSort.column, 8)];
    return {
      ...fallback,
      query: typeof value.search === "string" ? value.search.slice(0, 80) : "",
      filters: legacyFilters(value.evq),
      filterEnabled: settings.evsearch !== false,
      matchAnywhere: settings.within !== false,
      showNonMatches: settings.always === true,
      showAllWhenEmpty: settings.loadall !== false,
      sortKey: legacySort === "exp" ? "dex" : (legacySort ?? "dex"),
      sortDescending: savedSort.descending === true,
      quickReference: [
        ...new Set(quickReference.filter((dex) => /^\d{3}$/.test(dex))),
      ].slice(0, MAX_QUICK_REFERENCE),
      trainees,
      selectedTraineeId: trainees[selected]?.id ?? null,
    };
  }
  if (value.version !== 4 && value.version !== 5) return fallback;
  const generation =
    value.version === 5 ? (asGeneration(value.generation) ?? 4) : 4;
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
                /^\d{3}(?:-[a-z0-9-]+)?$/.test(entry),
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
const decode = (encoded: string): unknown => {
  const base64 = encoded
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  return JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)),
    ),
  );
};
export const encodeState = (state: AppState): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll(/=+$/g, "");
};
export const loadState = (): { state: AppState; fromLink: boolean } => {
  const linked = window.location.hash.match(/^#state=([^&]+)$/)?.[1];
  if (linked) {
    try {
      return { state: sanitizeState(decode(linked)), fromLink: true };
    } catch {
      /* use local state */
    }
  }
  let generation: Generation = 4;
  try {
    generation = asGeneration(Number(localStorage.getItem(ACTIVE_KEY))) ?? 4;
  } catch {
    /* use default */
  }
  return { state: loadGenerationState(generation), fromLink: false };
};
export const loadGenerationState = (generation: Generation): AppState => {
  try {
    const stored =
      localStorage.getItem(`${STORAGE_PREFIX}${generation}`) ??
      (generation === 4
        ? (localStorage.getItem(PREVIOUS_KEY) ??
          localStorage.getItem(LEGACY_KEY))
        : null);
    const state = sanitizeState(stored ? JSON.parse(stored) : null);
    return state.generation === generation ? state : defaultState(generation);
  } catch {
    return defaultState(generation);
  }
};
export const saveState = (state: AppState): void => {
  localStorage.setItem(
    `${STORAGE_PREFIX}${state.generation}`,
    JSON.stringify(state),
  );
  localStorage.setItem(ACTIVE_KEY, String(state.generation));
};
export const clearStoredState = (): void => {
  for (const generation of generations)
    localStorage.removeItem(`${STORAGE_PREFIX}${generation}`);
  localStorage.removeItem(ACTIVE_KEY);
  localStorage.removeItem(PREVIOUS_KEY);
  localStorage.removeItem(LEGACY_KEY);
};
