import { describe, expect, it } from "vitest";
import * as core from "../../src/core";
import { PLAYERS, smallSea } from "./helpers";
import type { Action, GameState } from "../../src/core";

// Proposed action/state vocabulary for T11's acceptance contract.
const pool = (s: GameState): number => (s as GameState & { reinforcementPool: number }).reinforcementPool;
const place = (province: string, amount: number): Action => ({ kind: "reinforce", province, amount } as unknown as Action);
const advance = { kind: "endReinforcement" } as unknown as Action;
const fresh = (): GameState => core.newGame(smallSea(), core.malpacoRules(), PLAYERS, 7);
function run(s: GameState, a: Action): GameState {
  const result = core.apply(s, a);
  expect(result?.ok).toBe(true);
  if (!result?.ok) throw new Error("action was refused");
  return result.state;
}
function combat(s: GameState): GameState {
  const owned = core.provincesOf(s, core.activePlayer(s)!.id)[0]!;
  return run(run(s, place(owned, pool(s))), advance);
}
function refuse(s: GameState, a: Action): void {
  const before = JSON.stringify(s);
  expect(core.apply(s, a)?.ok).toBe(false);
  expect(JSON.stringify(s)).toBe(before);
}

describe("T11 reinforcement turns", () => {
  it("starts authored Malpaco games with the active seat's income", () => {
    const s = fresh();
    expect(s.phase).toBe("reinforce");
    expect(pool(s)).toBe(core.reinforcementIncome(s, core.activePlayer(s)!.id).total);
  });
  it("starts generated games with income without changing their initial armies", () => {
    const result = core.createGame({ ...core.defaultOptions(), seed: 53 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const s = result.state;
    expect(s.phase).toBe("reinforce");
    expect(pool(s)).toBe(core.reinforcementIncome(s, core.activePlayer(s)!.id).total);
    expect(core.createGame({ ...core.defaultOptions(), seed: 53 })).toEqual(result);
    for (const player of s.players) {
      expect(core.armyTotal(s, player.id)).toBe(Math.floor(2 * core.provincesOf(s, player.id).length));
    }
  });
  it("places exactly the requested armies, records history and preserves input/RNG", () => {
    const s = fresh();
    const id = core.provincesOf(s, core.activePlayer(s)!.id)[0]!;
    const before = JSON.stringify(s);
    const action = place(id, 1);
    const next = run(s, action);
    expect(next.armies[id]).toBe(s.armies[id]! + 1);
    expect(pool(next)).toBe(pool(s) - 1);
    expect(next.rng).toEqual(s.rng);
    expect(next.computerRngs).toEqual(s.computerRngs);
    expect(next.history.at(-1)).toEqual(action);
    expect(JSON.stringify(s)).toBe(before);
    expect(core.cloneState(next)).toEqual(next);
  });
  it.each([0, -1, 0.5, NaN, Infinity, -Infinity])("refuses quantity %s", (amount) => {
    const s = fresh();
    refuse(s, place(core.provincesOf(s, core.activePlayer(s)!.id)[0]!, amount));
  });
  it("refuses unknown/enemy provinces and overspending", () => {
    const s = fresh();
    refuse(s, place("missing", 1));
    const enemy = s.map.provinces.find((p) => s.ownerOf[p.id] !== core.activePlayer(s)!.id)!;
    refuse(s, place(enemy.id, 1));
    refuse(s, place(core.provincesOf(s, core.activePlayer(s)!.id)[0]!, pool(s) + 1));
  });
  it("blocks combat and turn ending until placement and explicit advance", () => {
    const s = fresh();
    refuse(s, advance);
    refuse(s, { kind: "endTurn" });
    refuse(s, { kind: "attack", from: s.map.provinces[0]!.id, to: s.map.provinces[1]!.id });
    expect(core.legalAttacks(s)).toEqual([]);
    const id = core.provincesOf(s, core.activePlayer(s)!.id)[0]!;
    const empty = run(s, place(id, pool(s)));
    expect(pool(empty)).toBe(0);
    expect(empty.phase).toBe("reinforce");
    refuse(empty, { kind: "endTurn" });
    const attack = run(empty, advance);
    expect(attack.phase).toBe("attack");
    expect(pool(attack)).toBe(0);
    expect(attack.history.at(-1)).toEqual(advance);
    refuse(attack, advance);
    refuse(attack, place(id, 1));
    const wrongPhaseWithPool = core.cloneState(attack);
    wrongPhaseWithPool.reinforcementPool = 1;
    refuse(wrongPhaseWithPool, place(id, 1));
  });
  it("hands off once per seat and advances the round on wrap", () => {
    const s = fresh();
    const next = run(combat(s), { kind: "endTurn" });
    expect(next.currentPlayer).toBe(1);
    expect(next.turnNumber).toBe(1);
    expect(next.phase).toBe("reinforce");
    expect(pool(next)).toBe(core.reinforcementIncome(next, core.activePlayer(next)!.id).total);
    refuse(next, { kind: "endTurn" });
    const wrapped = run(combat(next), { kind: "endTurn" });
    expect(wrapped.currentPlayer).toBe(0);
    expect(wrapped.turnNumber).toBe(2);
    expect(pool(wrapped)).toBe(core.reinforcementIncome(wrapped, PLAYERS[0]!.id).total);
  });
  it("skips eliminated seats before granting income", () => {
    const players = [...PLAYERS.slice(0, 1), { id: "gone", name: "Gone", eliminated: true }, PLAYERS[1]!];
    const s = core.newGame(smallSea(), core.malpacoRules(), players, 7);
    const next = run(combat(s), { kind: "endTurn" });
    expect(next.currentPlayer).toBe(2);
    expect(pool(next)).toBe(core.reinforcementIncome(next, PLAYERS[1]!.id).total);
  });
  it("refuses all actions in a finished game", () => {
    const s = fresh();
    s.phase = "finished";
    refuse(s, place(s.map.provinces[0]!.id, 1));
    refuse(s, advance);
    refuse(s, { kind: "endTurn" });
  });
  it("preserves Classic's attack-only entry and handoff", () => {
    const s = core.newGame(smallSea(), core.classicRules(), PLAYERS, 7);
    expect(s.phase).toBe("attack");
    expect(run(s, { kind: "endTurn" }).phase).toBe("attack");
    refuse(s, place(core.provincesOf(s, PLAYERS[0]!.id)[0]!, 1));
    refuse(s, advance);
  });
});
