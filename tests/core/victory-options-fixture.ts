import * as core from "../../src/core";
import type { Action, GameOptions, GameState, RuleSet } from "../../src/core";
import { createReferenceGame } from "../../src/core/reference-game";
import { readFileSync } from "node:fs";
import type { GameMap, Province } from "../../src/core";
import type BoardData from "../../fixtures/new-game/T63/board.json";

const board: typeof BoardData = JSON.parse(readFileSync(new URL("../../fixtures/new-game/T63/board.json", import.meta.url), "utf8"));
export const referenceMap: GameMap = { id: "reference-coast-first-a", name: "Nine Isles", bounds: board.bounds, provinces: board.provinces as unknown as readonly Province[], islands: board.islands };

export interface Standing { player: string; countries: number; armies: number }
export type CompleteState = Omit<GameState, "phase"> & {
  phase: GameState["phase"] | "human-loss";
  roundOrigin?: number;
  result?: { reason: string; standings: Standing[] };
  watchingComputers?: boolean;
};
export type CompleteAction = Action | { kind: "watchComputers" } | { kind: "stopGame" };
type VictoryOptions = Pick<GameOptions, "dominationWin" | "roundLimit">;
const api = core as typeof core & { victoryRules?: (options: VictoryOptions) => RuleSet };

// Exercise inherited behavior without a missing-export/import failure in preflight.
export function opening(seed = 1994, seats = 4, options: Partial<GameOptions> = {}): CompleteState {
  const settings: GameOptions = {
    ...core.defaultOptions(), seed,
    seats: Array.from({ length: seats }, () => ({ kind: "human" as const })),
    computerStrengths: [], ...options,
  };
  const rules = api.victoryRules?.(settings) ?? core.friendlyMoveRules();
  const result = createReferenceGame(referenceMap, settings, rules);
  if (!result.ok) throw Error(result.errors.join("; "));
  return result.state;
}

export function rotation(seats: number, first: number, options: Partial<GameOptions> = {}) {
  for (let seed = 0; seed < 128; seed++) {
    const state = opening(seed, seats, options);
    if (state.currentPlayer === first) return state;
  }
  throw Error(`No seeded ${seats}-seat origin ${first} in bounded probe`);
}

export function act(state: CompleteState, action: CompleteAction): CompleteState {
  const result = core.apply(state as GameState, action as Action);
  if (!result.ok) throw Error(`${JSON.stringify(action)}: ${result.error}`);
  return result.state;
}

export function ready(state: CompleteState): CompleteState {
  if (state.phase !== "reinforce") return state;
  const own = state.map.provinces.find(p => state.ownerOf[p.id] === state.players[state.currentPlayer]!.id)!;
  if (state.reinforcementPool) state = act(state, { kind: "reinforce", province: own.id, amount: state.reinforcementPool });
  return act(state, { kind: "endReinforcement" });
}

export function end(state: CompleteState): CompleteState {
  return act(ready(state), { kind: "endTurn" });
}

/** Independent explicit examples; only pure core tests edit positions. */
export function layout(state: CompleteState, counts: readonly number[], totals?: readonly number[]) {
  if (counts.reduce((a, b) => a + b, 0) !== 46) throw Error("Example must assign all 46 countries");
  let offset = 0;
  counts.forEach((count, seat) => {
    const player = state.players[seat]!;
    player.eliminated = count === 0;
    for (let i = 0; i < count; i++) {
      const id = state.map.provinces[offset++]!.id;
      state.ownerOf[id] = player.id;
      state.armies[id] = i === 0 ? (totals?.[seat] ?? count) - count + 1 : 1;
    }
  });
  state.phase = "attack";
  state.reinforcementPool = 0;
  return state;
}

export function standings(state: CompleteState): Standing[] {
  const origin = state.roundOrigin ?? 0;
  const order = (id: string) => (state.players.findIndex(p => p.id === id) - origin + state.players.length) % state.players.length;
  return state.players.map(player => {
    const ids = state.map.provinces.filter(p => state.ownerOf[p.id] === player.id).map(p => p.id);
    return { player: player.id, countries: ids.length, armies: ids.reduce((n, id) => n + state.armies[id]!, 0) };
  }).sort((a, b) => b.countries - a.countries || b.armies - a.armies || order(b.player) - order(a.player));
}

export function frozen<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(frozen);
  }
  return value;
}
export { core };
