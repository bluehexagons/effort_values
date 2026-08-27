import { afterEach, describe, expect, it, vi } from "vitest";
import { clearStoredState, sanitizeState } from "./storage.ts";

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
    expect(state.version).toBe(4);
    expect(state.quickReference).toEqual(["025"]);
    expect(state.trainees[0]?.evs.speed).toBe(60);
    expect(state.selectedTraineeId).toBe(state.trainees[0]?.id);
  });

  it("bounds untrusted values", () => {
    const state = sanitizeState({
      version: 4,
      trainees: [
        { id: "one", name: "bad/name", evs: { hp: 99_999, attack: -2 } },
      ],
      selectedTraineeId: "one",
    });
    expect(state.trainees[0]?.name).toBe("badname");
    expect(state.trainees[0]?.evs.hp).toBe(9999);
    expect(state.trainees[0]?.evs.attack).toBe(0);
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
    const removeItem = vi.fn();
    vi.stubGlobal("localStorage", { removeItem });
    clearStoredState();
    expect(removeItem).toHaveBeenCalledTimes(2);
    expect(removeItem).toHaveBeenNthCalledWith(1, "effort-values-state-v4");
    expect(removeItem).toHaveBeenNthCalledWith(2, "effort-values-state-v2");
  });
});
