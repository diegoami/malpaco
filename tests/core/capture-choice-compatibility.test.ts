import { describe, expect, it } from "vitest";
import raw from "../../fixtures/new-game/T63/board.json";
import { captureChoiceRules, cloneState, createReferenceGame, defaultOptions, malpacoRules } from "../../src/core";
import type { GameMap, Province } from "../../src/core";
import { capture, frozen } from "./capture-choice-fixtures";

const map: GameMap = {
  id: "capture-choice-reference", name: "Capture choice reference", bounds: raw.bounds,
  provinces: raw.provinces as unknown as readonly Province[], islands: raw.islands,
};

describe("capture-choice compatibility seams", () => {
  it("opts the reference factory in without changing legacy defaults or consuming setup draws", () => {
    const legacyRules = malpacoRules();
    const choiceRules = captureChoiceRules();
    expect(choiceRules).toEqual({ ...legacyRules, id: "malpaco-capture-choice", combat: { ...legacyRules.combat, capture: "choice" } });
    const options = frozen(defaultOptions());
    const legacy = createReferenceGame(frozen(map), options);
    const explicit = createReferenceGame(map, options, choiceRules);
    expect(legacy.ok).toBe(true);
    expect(explicit.ok).toBe(true);
    if (!legacy.ok || !explicit.ok) throw new Error("reference deal failed");
    expect(legacy.state.rules).toEqual(legacyRules);
    expect(explicit.state.rules).toBe(choiceRules);
    expect({ ...explicit.state, rules: legacy.state.rules }).toEqual(legacy.state);
    expect(malpacoRules()).toEqual(legacyRules);
  });

  it("clones the pending record independently without changing its total-quantity bounds", () => {
    const state = frozen(capture());
    const copy = cloneState(state);
    expect(copy).toEqual(state);
    expect(copy.pendingCapture).toEqual({ from: "sulo", to: "frostkabo", min: 1, max: 4, defaultAmount: 4 });
    expect(copy.pendingCapture).not.toBe(state.pendingCapture);
  });
});
