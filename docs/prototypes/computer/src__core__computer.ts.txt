import { activePlayer, provincesOf } from "./state";
import { legalAttacks } from "./rules";
import type { Action, GameState } from "./types";

/** [designed] Basic deterministic policy; priorities and finite budget in computer/README.md. */
export function computerAction(state: GameState): Action | null {
  const mover = activePlayer(state);
  if (!mover || mover.kind !== "computer" || mover.eliminated || state.phase === "finished") return null;
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
    if (action.kind === "endTurn") break;
    if (action.kind === "attack") attacks++;
  }
  if (state.phase === "attack" && attacks < state.map.provinces.length) {
    const choices = legalAttacks(state).filter((a): a is Extract<Action,{kind:"attack"}> => a.kind === "attack" && state.armies[a.from]! > state.armies[a.to]!);
    const key = (a: Extract<Action,{kind:"attack"}>) => a.from + "/" + a.to;
    choices.sort((a,b) => state.armies[a.to]! - state.armies[b.to]! || state.armies[b.from]! - state.armies[a.from]! || (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
    if (choices[0]) return choices[0];
  }
  return { kind: "endTurn" };
}
