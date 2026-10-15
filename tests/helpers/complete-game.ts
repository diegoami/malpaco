import { apply, createGame, defaultOptions, legalAttacks } from "../../src/core";
import type { Action, GameState } from "../../src/core";

// Test fixture only: one conqueror, passive opponents. No shipping AI and no
// changes to ownership, armies, dice or RNG outside ordinary apply actions.
export const ACTION_BUDGET = 12000;
export function opening(seed: number, seats: number): GameState {
  const result = createGame({ ...defaultOptions(), seed,
    seats: Array.from({ length: seats }, () => ({ kind: "human" as const })), computerStrengths: [] });
  if (!result.ok) throw Error(result.errors.join("; "));
  return result.state;
}
export interface Policy { conqueror: string; handedOffAfterElimination: boolean }
export function policyFor(state: GameState): Policy {
  return { conqueror: state.players[state.currentPlayer]!.id, handedOffAfterElimination: false };
}
export function nextAction(state: GameState, policy: Policy): Action {
  const mover = state.players[state.currentPlayer]!.id;
  if (state.phase === "reinforce") {
    if (!state.reinforcementPool) return { kind: "endReinforcement" };
    const held = state.map.provinces.filter(p => state.ownerOf[p.id] === mover);
    const frontier = held.filter(p => [...p.borders, ...p.seaLanes].some(id => state.ownerOf[id] !== mover));
    // Conqueror concentrates on its strongest frontier. Opponents spread income
    // on their weakest holdings, preferring inland: a deliberately passive fixture.
    const choices = mover === policy.conqueror ? frontier : held;
    choices.sort((a, b) => mover === policy.conqueror
      ? state.armies[b.id]! - state.armies[a.id]! || a.id.localeCompare(b.id)
      : Number(frontier.includes(a)) - Number(frontier.includes(b)) || state.armies[a.id]! - state.armies[b.id]! || a.id.localeCompare(b.id));
    if (!choices[0]) throw Error("no legal reinforcement holding");
    return { kind: "reinforce", province: choices[0].id, amount: 1 };
  }
  if (mover === policy.conqueror && state.phase === "attack") {
    // Force a real living-seat handoff after first elimination, before victory.
    if (state.players.some(p => p.eliminated) && !policy.handedOffAfterElimination) {
      policy.handedOffAfterElimination = true;
      return { kind: "endTurn" };
    }
    const attacks = legalAttacks(state).filter((a): a is Extract<Action, {kind:"attack"}> => a.kind === "attack");
    attacks.sort((a, b) => state.armies[a.to]! - state.armies[b.to]! || state.armies[b.from]! - state.armies[a.from]! || a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
    if (attacks[0]) return attacks[0];
  }
  return { kind: "endTurn" };
}
export function advance(state: GameState, action: Action): GameState {
  const result = apply(state, action);
  if (!result.ok) throw Error(`${JSON.stringify(action)}: ${result.error}`);
  return result.state;
}
