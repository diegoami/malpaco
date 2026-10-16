import { act, core, opening, referenceMap } from "../core/victory-options-fixture";
import type { CompleteAction, CompleteState } from "../core/victory-options-fixture";

// [designed] Fixture budget only, below the existing complete-game ACTION_BUDGET.
// Every position arises from ordinary apply actions; no browser state injection.
export const VICTORY_ACTION_BUDGET = 6000;
export function fixtureAction(state: CompleteState, mode: "human-loss" | "conquest", conqueror: string): CompleteAction {
  const player = state.players[state.currentPlayer]!;
  if (state.phase === "capture") return { kind: "captureMove" };
  const target = (id: string) => mode === "conquest"
    ? state.ownerOf[id] !== player.id
    : state.players.find(p => p.id === state.ownerOf[id])!.kind === "human";
  const aggressive = mode === "human-loss" ? player.kind === "computer" : player.id === conqueror;
  if (state.phase === "reinforce") {
    if (!state.reinforcementPool) return { kind: "endReinforcement" };
    const owned = state.map.provinces.filter(p => state.ownerOf[p.id] === player.id);
    const frontier = owned.filter(p => [...p.borders, ...p.seaLanes].some(target));
    const choices = aggressive && frontier.length ? frontier : owned;
    choices.sort((a, b) => aggressive
      ? state.armies[b.id]! - state.armies[a.id]! || a.id.localeCompare(b.id)
      : Number(frontier.includes(a)) - Number(frontier.includes(b)) || state.armies[a.id]! - state.armies[b.id]! || a.id.localeCompare(b.id));
    return { kind: "reinforce", province: choices[0]!.id, amount: 1 };
  }
  if (aggressive && state.phase === "attack") {
    const attacks = core.legalAttacks(state as Parameters<typeof core.legalAttacks>[0]).filter((a): a is Extract<CompleteAction, { kind: "attack" }> => a.kind === "attack" && target(a.to));
    attacks.sort((a, b) => state.armies[a.to]! - state.armies[b.to]! || state.armies[b.from]! - state.armies[a.from]! || a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
    if (attacks[0]) return attacks[0];
  }
  return { kind: "endTurn" };
}

export function plan(kind: "domination" | "human-loss") {
  const settings = kind === "human-loss" ? {
    dominationWin: false,
    seats: [{ kind: "human" as const }, { kind: "computer" as const }, { kind: "computer" as const }],
    computerStrengths: ["Normal" as const, "Normal" as const],
  } : {};
  const start = opening(1994, kind === "human-loss" ? 3 : 2, settings);
  const conqueror = start.players[start.currentPlayer]!.id;
  const actions: CompleteAction[] = [];
  let state = start;
  for (let n = 0; n < VICTORY_ACTION_BUDGET; n++) {
    const counts = state.players.map(p => Object.values(state.ownerOf).filter(id => id === p.id).length);
    const reached = kind === "domination" ? counts[state.currentPlayer]! >= 35 : counts[0] === 0;
    const action = state.phase === "attack" && reached ? { kind: "endTurn" as const } : fixtureAction(state, kind === "human-loss" ? "human-loss" : "conquest", conqueror);
    state = act(state, action); actions.push(action);
    if (reached && action.kind === "endTurn") return { start, state, actions, conqueror, kind };
    if (state.phase === "finished" || state.phase === "human-loss") throw Error("Fixture ended before independent target");
  }
  throw Error(`Fixture exceeded ${VICTORY_ACTION_BUDGET} legal actions for ${kind}`);
}
export { act, core, referenceMap };
