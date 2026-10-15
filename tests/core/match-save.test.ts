import { describe, expect, it, vi } from "vitest";
import { defaultOptions, deserializeOptions, serializeOptions } from "../../src/core";
import { deserializeMatch, serializeMatch } from "../../src/core/match-save";
import * as setup from "../../src/core/setup";
import type { GameState } from "../../src/core";
import { ACTION_BUDGET, advance, nextAction, opening, policyFor } from "../helpers/complete-game";

const optionsFor = (seats: number) => ({ ...defaultOptions(), seed: 1994, seats: Array.from({ length: seats }, () => ({ kind: "human" as const })), computerStrengths: [] });
function roundTrip(state: GameState, seats: number) {
  const options = optionsFor(seats), before = JSON.stringify({ options, state });
  const text = serializeMatch(options, state.history), result = deserializeMatch(text);
  expect(result.options).toEqual(options);
  expect(result.state).toEqual(state); // Includes map, centres, logs/history and every RNG stream.
  expect(serializeMatch(result.options, result.state.history)).toBe(text);
  expect(JSON.stringify({ options, state })).toBe(before);
  expect(Object.keys(JSON.parse(text))).toEqual(["version", "options", "actions"]);
  return result.state;
}
describe("generated match saves", () => {
  for (const seats of [2, 3, 4]) it(`${seats} humans replay opening, partial reinforcement, combat, handoff and victory exactly`, () => {
    let state = opening(1994, seats), actions = 0;
    const policy = policyFor(state), visited = new Set<string>();
    roundTrip(state, seats); visited.add("opening");
    while (state.phase !== "finished" && actions++ < ACTION_BUDGET) {
      const action = nextAction(state, policy), before = state;
      state = advance(state, action);
      const marker = action.kind === "reinforce" && state.reinforcementPool > 0 ? "partial" : action.kind === "attack" ? "combat" : action.kind === "endTurn" ? "handoff" : "";
      if (marker && !visited.has(marker)) {
        const restored = roundTrip(before, seats);
        expect(advance(restored, action)).toEqual(state); // Next dice and handoff agree with uninterrupted play.
        roundTrip(state, seats); visited.add(marker);
      }
    }
    expect(state.phase).toBe("finished"); roundTrip(state, seats);
    expect([...visited].sort()).toEqual(["combat", "handoff", "opening", "partial"]);
    const afterFinish = [...state.history, {kind:"endTurn" as const}];
    expect(() => deserializeMatch(JSON.stringify({version:1, options:optionsFor(seats),actions:afterFinish}))).toThrow(/replay action.*game is over/i);
  });
  it("keeps all computer RNGs and presentation settings without storing snapshots", () => {
    const options = {...defaultOptions(),seed:42, animationSpeed:"fast" as const,sound:false};
    const created = setup.createGame(options); expect(created.ok).toBe(true); if (!created.ok) return;
    expect(Object.keys(created.state.computerRngs)).toHaveLength(3);
    expect(deserializeMatch(serializeMatch(options, [])).state).toEqual(created.state);
    expect(deserializeMatch(serializeMatch(options, [])).options).toEqual(options);
  });
  const invalid: [string, unknown][] = [
    ["nonobject", null], ["array", []], ["version", {version:99,options:optionsFor(2),actions:[]}],
    ["missing options", {version:1,actions:[]}], ["bad options", {version:1,options:{...optionsFor(2),seed:-1},actions:[]}],
    ["missing actions", {version:1,options:optionsFor(2)}], ["actions object", {version:1,options:optionsFor(2),actions:{}}],
    ...[null, {}, {kind:"unknown"}, {kind:"endTurn",extra:1}, {kind:"attack",from:4,to:"x"}, {kind:"reinforce",province:"x",amount:0}, {kind:"reinforce",province:"x",amount:1.5}].map(a => ["action " + JSON.stringify(a),{version:1,options:optionsFor(2),actions:[a]}] as [string,unknown]),
    ["illegal history",{version:1,options:optionsFor(2),actions:[{kind:"attack",from:"missing",to:"missing"}]}],
    ["snapshot injection",{version:1,options:optionsFor(2),actions:[],state:{winner:"seat1"}}],
  ];
  for(const [name,payload] of invalid) it(`rejects ${name}`, () => { expect(() => deserializeMatch(JSON.stringify(payload))).toThrow(); });
  it("rejects malformed JSON", () => { expect(() => deserializeMatch("{" )).toThrow(/JSON/); });
  it("reports generation refusal", () => {
    const mock = vi.spyOn(setup,"createGame").mockReturnValue({ok:false,errors:["board exhausted"]});
    try { expect(() => deserializeMatch(JSON.stringify({version:1,options:optionsFor(2),actions:[]}))).toThrow(/Cannot generate.*board exhausted/); } finally { mock.mockRestore(); }
  });
  it("preserves the old options-only API", () => { expect(deserializeOptions(serializeOptions(defaultOptions()))).toEqual(defaultOptions()); });
});
