import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearStoredState,
  encodeState,
  loadGenerationState,
  loadState,
} from "./storage.ts";
import { sanitizeState } from "./state-validation.ts";
import { defaultState } from "./types.ts";

afterEach(() => vi.unstubAllGlobals());

const stubStorage = (entries: Record<string, string> = {}) => {
  const data = new Map(Object.entries(entries));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  });
  return data;
};

describe("saved-state validation", () => {
  it("rejects unsupported save formats", () => {
    expect(
      sanitizeState({ version: 4, trainees: [{ id: "old", name: "Old" }] }),
    ).toEqual(defaultState());
  });

  it("bounds untrusted values", () => {
    const state = sanitizeState({
      version: 5,
      generation: 4,
      trainees: [
        {
          id: "one",
          name: "bad/name",
          evs: {
            hp: 99_999,
            attack: -2,
            defense: 2.5,
            specialAttack: true,
            speed: "3oops",
          },
        },
      ],
      selectedTraineeId: "one",
    });
    expect(state.trainees[0]?.name).toBe("badname");
    expect(state.trainees[0]?.evs.hp).toBe(255);
    expect(state.trainees[0]?.evs.attack).toBe(0);
    expect(state.trainees[0]?.evs.defense).toBe(2);
    expect(state.trainees[0]?.evs.specialAttack).toBe(0);
    expect(state.trainees[0]?.evs.speed).toBe(0);
  });

  it("deduplicates references and trainee identifiers", () => {
    const state = sanitizeState({
      version: 5,
      generation: 4,
      filters: { hp: "invalid" },
      quickReference: ["025", "025", "1000", "not-a-dex-number"],
      trainees: [
        { id: "same", name: "One", evs: {} },
        { id: "same", name: "Two", evs: {} },
      ],
      selectedTraineeId: "same",
    });
    expect(state.filters.hp).toBe("");
    expect(state.quickReference).toEqual(["025", "1000"]);
    expect(new Set(state.trainees.map(({ id }) => id)).size).toBe(2);
    expect(state.selectedTraineeId).toBe("same");
  });

  it("clears current generation profiles", () => {
    const data = stubStorage({
      "effort-values-state-v5-g1": "saved",
      "effort-values-state-v5-g9": "saved",
      "effort-values-active-generation": "9",
      "other-app": "keep",
    });
    clearStoredState();
    expect([...data.entries()]).toEqual([["other-app", "keep"]]);
  });
});

describe("generation profiles", () => {
  it("keeps Generation I stat experience and uses its 65,535 cap", () => {
    const state = sanitizeState({
      version: 5,
      generation: 1,
      trainees: [
        {
          id: "red",
          name: "Red",
          evs: { hp: 70000, special: 1234, specialAttack: 50 },
        },
      ],
      filters: { special: "100+" },
      sortKey: "special",
    });
    expect(state.trainees[0]?.evs.hp).toBe(65535);
    expect(state.trainees[0]?.evs.special).toBe(1234);
    expect(state.trainees[0]?.evs.specialAttack).toBe(0);
    expect(state.filters.special).toBe("100+");
    expect(state.sortKey).toBe("special");
  });

  it("loads only the current format for the selected generation", () => {
    stubStorage({
      "effort-values-state-v4": JSON.stringify({ version: 4 }),
      "effort-values-state-v5-g3": JSON.stringify(defaultState(3)),
    });
    expect(loadGenerationState(3)).toEqual(defaultState(3));
    expect(loadGenerationState(4)).toEqual(defaultState(4));
  });

  it("uses local progress when a share link has an unsupported format", () => {
    const local = { ...defaultState(7), query: "Pikachu" };
    stubStorage({
      "effort-values-active-generation": "7",
      "effort-values-state-v5-g7": JSON.stringify(local),
    });
    vi.stubGlobal("window", {
      location: {
        hash: `#state=${btoa(JSON.stringify({ ...local, version: 4 }))}`,
      },
    });
    expect(loadState()).toEqual({ state: local, fromLink: false });
  });

  it("loads a current share link", () => {
    const linked = { ...defaultState(2), query: "Eevee" };
    stubStorage();
    vi.stubGlobal("window", {
      location: { hash: `#state=${encodeState(linked)}` },
    });
    expect(loadState()).toEqual({ state: linked, fromLink: true });
  });
});
