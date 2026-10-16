// Fixture authoring only. The parent freezes these outputs from merged T30
// before dispatch; acceptance reads the frozen JSON, never this generator.
import { apply, createGame, createReferenceGame, defaultOptions, legalAttacks, victoryRules } from "../../src/core";
import type { Action, GameOptions, GameState } from "../../src/core";
import { serializeMatch } from "../../src/core/match-save";
import { fixture as battleFixture } from "../e2e/battle-fixture";
import { fixture as moveFixture } from "../e2e/friendly-fixture";
import { fixtureAction, plan, referenceMap } from "../e2e/victory-fixture";
import { envelope, legacyIdentity, logicalState, referenceIdentity } from "./versioned-match-fixture";
import type { PinnedMatch } from "./versioned-match-fixture";

function step(state: GameState, action: Action) {
  const result = apply(state, action);
  if (!result.ok) throw Error(JSON.stringify(action) + ": " + result.error);
  return result.state;
}
function optionsFor(seed: number, seats = 2): GameOptions {
  return { ...defaultOptions(), seed, seats: Array.from({ length: seats }, () => ({ kind: "human" as const })), computerStrengths: [] };
}
function start(options: GameOptions, legacy = false) {
  const result = legacy ? createGame(options) : createReferenceGame(referenceMap, options, victoryRules(options));
  if (!result.ok) throw Error(result.errors.join("; "));
  return result.state;
}
function ordinaryNext(state: GameState): Action | undefined {
  if (state.phase === "finished") return;
  if (state.phase === "human-loss") return { kind: "watchComputers" };
  if (state.phase === "capture") return { kind: "captureMove", amount: 1 };
  if (state.phase === "reinforce") return state.reinforcementPool ? { kind: "reinforce", province: state.map.provinces.find(p => state.ownerOf[p.id] === state.players[state.currentPlayer]!.id)!.id, amount: 1 } : { kind: "endReinforcement" };
  return legalAttacks(state)[0] ?? { kind: "endTurn" };
}
export function generatePinned(): PinnedMatch[] {
  const cases: PinnedMatch[] = [];
  function add(name: string, options: GameOptions, state: GameState, legacy = false, next = ordinaryNext(state)) {
    const identity = legacy ? legacyIdentity : referenceIdentity;
    cases.push({ name, formatVersion: legacy ? 1 : 2, identity, options, actions: state.history,
      text: legacy ? serializeMatch(options, state.history) : JSON.stringify(envelope(options, state.history), null, 2),
      expected: logicalState(state), next: next ? { action: next, expected: logicalState(step(state, next)) } : null });
  }
  const oldOptions = optionsFor(1994, 3);
  let old = start(oldOptions, true); add("legacy-opening", oldOptions, old, true);
  const oldOwn = old.map.provinces.find(p => old.ownerOf[p.id] === old.players[old.currentPlayer]!.id)!.id;
  old = step(old, { kind: "reinforce", province: oldOwn, amount: old.reinforcementPool });
  old = step(old, { kind: "endReinforcement" });
  for (let i = 0; i < 3; i++) { const attack = legalAttacks(old)[0]; if (attack) old = step(old, attack); }
  add("legacy-progress", oldOptions, old, true);

  const placementOptions = { ...optionsFor(1994), startingArmiesRange: "1-4" as const, humanShare: 1, animationSpeed: "fast" as const, sound: false };
  let placement = start(placementOptions); placement = step(placement, ordinaryNext(placement)!);
  add("placement", placementOptions, placement);

  const battle = battleFixture("capture"), battleOptions = optionsFor(battle.seed);
  let capture = start(battleOptions);
  for (let n = 0; n < battle.placements; n++) capture = step(capture, { kind: "reinforce", province: battle.from, amount: 1 });
  capture = step(capture, { kind: "endReinforcement" });
  for (let n = 0; n < 128 && capture.phase === "attack"; n++) capture = step(capture, { kind: "attack", from: battle.from, to: battle.to });
  if (!capture.pendingCapture) throw Error("Expected ordinary pending capture");
  add("pending-capture", battleOptions, capture);
  capture = step(capture, { kind: "captureMove", amount: 1 });
  add("capture-completed", battleOptions, capture);

  const move = moveFixture(), moveOptions = optionsFor(move.seed);
  let movement = start(moveOptions);
  for (let n = 0; n < move.placements; n++) movement = step(movement, { kind: "reinforce", province: move.from, amount: 1 });
  movement = step(movement, { kind: "endReinforcement" });
  const friendly: Action = { kind: "friendlyMove", from: move.from, to: move.to, amount: 1 };
  add("move-ready", moveOptions, movement, false, friendly);
  movement = step(movement, friendly); add("move-completed", moveOptions, movement);

  for (const kind of ["domination", "human-loss"] as const) {
    const fixture = plan(kind);
    const options: GameOptions = kind === "human-loss" ? { ...optionsFor(1994, 3), dominationWin: false, seats: [{ kind: "human" }, { kind: "computer" }, { kind: "computer" }], computerStrengths: ["Normal", "Normal"] } : optionsFor(1994);
    const state = fixture.actions.reduce(step, start(options));
    add(kind, options, state);
    if (kind === "human-loss") {
      const watched = step(state, { kind: "watchComputers" });
      add("watch", options, watched, false, fixtureAction(watched, "human-loss", ""));
      add("stop", options, step(state, { kind: "stopGame" }));
    }
  }
  const limitOptions = { ...optionsFor(1994), dominationWin: false, roundLimit: 20 as const };
  let limit = start(limitOptions);
  for (let n = 0; n < 40; n++) {
    if (limit.reinforcementPool) limit = step(limit, { kind: "reinforce", province: limit.map.provinces.find(p => limit.ownerOf[p.id] === limit.players[limit.currentPlayer]!.id)!.id, amount: limit.reinforcementPool });
    limit = step(limit, { kind: "endReinforcement" }); limit = step(limit, { kind: "endTurn" });
  }
  add("round-limit", limitOptions, limit);
  return cases;
}
