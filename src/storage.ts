import {
  type AppState,
  defaultState,
  generations,
  type Generation,
} from "./types.ts";
import { sanitizeState } from "./state-validation.ts";

const STORAGE_PREFIX = "effort-values-state-v5-g";
const ACTIVE_KEY = "effort-values-active-generation";
const PREVIOUS_KEY = "effort-values-state-v4";
const LEGACY_KEY = "effort-values-state-v2";
const asGeneration = (value: unknown): Generation | null =>
  generations.includes(value as Generation) ? (value as Generation) : null;

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
