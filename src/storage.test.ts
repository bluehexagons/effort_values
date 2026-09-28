import { afterEach, describe, expect, it, vi } from "vitest";
import { clearStoredState } from "./storage.ts";
import { sanitizeState } from "./state-validation.ts";

afterEach(() => vi.unstubAllGlobals());

describe("saved-state validation", () => {
  it("migrates v3 tracker rows and quick-reference records", () => {
    const state = sanitizeState({
      version: 3,
      quickchart: ["Pikachu/82/0/0/0/0/0/2/025"],
      evtracker: ["Sparky/0/10/20/30/40/50/60/0"],
      selected: 0,
      search: "pika",
    });
    expect(state.version).toBe(5);
    expect(state.generation).toBe(4);
    expect(state.quickReference).toEqual(["025"]);
    expect(state.trainees[0]?.evs.speed).toBe(60);
    expect(state.selectedTraineeId).toBe(state.trainees[0]?.id);
  });

  it("bounds untrusted values", () => {
    const state = sanitizeState({
      version: 4,
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

  it("preserves compatible legacy settings without selecting a trainee", () => {
    const state = sanitizeState({
      version: 3,
      evtracker: ["Sparky/1/2/3/4/5/6"],
      selected: -1,
      evq: ["", "", "2+", "", "", "", ""],
      settings: { within: false, always: true, evsearch: true, loadall: false },
      sort: { column: 3, descending: true },
    });
    expect(state.selectedTraineeId).toBeNull();
    expect(state.filters.attack).toBe("2+");
    expect(state.matchAnywhere).toBe(false);
    expect(state.showNonMatches).toBe(true);
    expect(state.showAllWhenEmpty).toBe(false);
    expect(state.sortKey).toBe("attack");
    expect(state.sortDescending).toBe(true);
  });

  it("deduplicates references and trainee identifiers", () => {
    const state = sanitizeState({
      version: 4,
      filters: { hp: "invalid" },
      quickReference: ["025", "025", "not-a-dex-number"],
      trainees: [
        { id: "same", name: "One", evs: {} },
        { id: "same", name: "Two", evs: {} },
      ],
      selectedTraineeId: "same",
    });
    expect(state.filters.hp).toBe("");
    expect(state.quickReference).toEqual(["025"]);
    expect(new Set(state.trainees.map(({ id }) => id)).size).toBe(2);
    expect(state.selectedTraineeId).toBe("same");
  });

  it("clears current and legacy browser storage", () => {
    const removeItem = vi.fn<() => void>();
    vi.stubGlobal("localStorage", { removeItem });
    clearStoredState();
    expect(removeItem).toHaveBeenCalledTimes(12);
    expect(removeItem).toHaveBeenCalledWith("effort-values-state-v5-g1");
    expect(removeItem).toHaveBeenCalledWith("effort-values-state-v5-g9");
    expect(removeItem).toHaveBeenCalledWith("effort-values-state-v4");
    expect(removeItem).toHaveBeenCalledWith("effort-values-state-v2");
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

  it("migrates v4 progress into Generation IV", () => {
    const state = sanitizeState({
      version: 4,
      sortKey: "exp",
      quickReference: ["025"],
      trainees: [{ id: "one", name: "One", evs: { speed: 200 } }],
    });
    expect(state.version).toBe(5);
    expect(state.generation).toBe(4);
    expect(state.sortKey).toBe("dex");
    expect(state.quickReference).toEqual(["025"]);
    expect(state.trainees[0]?.evs.speed).toBe(200);
  });
});
