// Historical pre-T41 policy oracle, preserved independently of candidate.
import { activePlayer, provincesOf } from "../../src/core/state";
import { friendlySources, friendlyTargets } from "../../src/core/movement";
import { legalAttacks } from "../../src/core/rules";
import type { Action, GameState } from "../../src/core/types";

/** [designed] Basic deterministic policy; priorities and finite budget in fixtures/new-game/T32/README.md. */
export function historicalComputerAction(state: GameState): Action | null {
  const mover = activePlayer(state);
  if (!mover || mover.kind !== "computer" || mover.eliminated || (state.phase === "finished" || state.phase === "human-loss")) return null;
  if (state.phase === "capture") return { kind: "captureMove" };
  if (state.phase === "reinforce") {
    if (!state.reinforcementPool) return { kind: "endReinforcement" };
    const held = provincesOf(state, mover.id);
    const frontier = held.filter(id => {
      const p = state.map.provinces.find(p => p.id === id)!;
      return [...p.borders, ...p.seaLanes].some(n => state.ownerOf[n] !== mover.id);
    });
    const choices = frontier.length ? frontier : held;
    choices.sort((a,b) => state.armies[b]! - state.armies[a]! || (a < b ? -1 : a > b ? 1 : 0));
    return choices[0] ? { kind: "reinforce", province: choices[0], amount: state.reinforcementPool } : null;
  }
  let attacks = 0;
  for (let i = state.history.length - 1; i >= 0; i--) {
    const action = state.history[i]!;
    if (action.kind === "endTurn" || action.kind === "friendlyMove" || action.kind === "watchComputers") break;
    if (action.kind === "attack") attacks++;
  }
  if (state.phase === "attack" && attacks < state.map.provinces.length) {
    const choices = legalAttacks(state).filter((a): a is Extract<Action,{kind:"attack"}> => a.kind === "attack" && state.armies[a.from]! > state.armies[a.to]!);
    const key = (a: Extract<Action,{kind:"attack"}>) => a.from + "/" + a.to;
    choices.sort((a,b) => state.armies[a.to]! - state.armies[b.to]! || state.armies[b.from]! - state.armies[a.from]! || (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
    if (choices[0]) return choices[0];
  }
  // [designed] Move an interior reserve to a neighbouring frontier; no RNG draws.
  const frontier = (id: string) => {
    const p = state.map.provinces.find(p => p.id === id)!;
    return [...p.borders, ...p.seaLanes].some(n => state.ownerOf[n] !== mover.id);
  };
  const moves = friendlySources(state).filter(id => !frontier(id)).flatMap(from =>
    friendlyTargets(state, from).filter(frontier).map(to => ({ kind: "friendlyMove" as const, from, to })));
  moves.sort((a,b) => state.armies[b.from]! - state.armies[a.from]! ||
    (a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : a.to > b.to ? 1 : 0));
  return moves[0] ?? { kind: "endTurn" };
}
