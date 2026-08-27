import { describe, expect, it } from "vitest";
import { sanitizeState } from "./storage.ts";

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
});
