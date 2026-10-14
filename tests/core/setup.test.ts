import { expect, it } from "vitest";
import * as core from "../../src/core";

it("creates the T07 generated starting state from validated options", () => {
  const createGame = (core as unknown as { createGame?: (options: core.GameOptions) => { ok: boolean; state?: core.GameState; errors?: string[] } }).createGame;
  expect(createGame, "T07 generated-game entry point").toBeTypeOf("function");
  const result = createGame!({ ...core.defaultOptions(), seed: 7 });
  expect(result.ok, result.errors?.join("; ")).toBe(true);
  const state = result.state!;
  expect(state.map.provinces).toHaveLength(46);
  const ordered = Array.from({ length: 4 }, (_, i) => state.players[(state.currentPlayer + i) % 4]!);
  expect(ordered.map(p => core.provincesOf(state, p.id).length)).toEqual([11, 11, 12, 12]);
  for (const island of state.map.islands) {
    expect(new Set(island.provinces.map(id => state.ownerOf[id])).size).toBeGreaterThan(1);
  }
  for (const player of state.players) {
    expect(core.armyTotal(state, player.id)).toBe(2 * core.provincesOf(state, player.id).length);
  }
  const centres = (state as core.GameState & { productionCentres: string[] }).productionCentres;
  expect(centres).toHaveLength(3);
  expect(new Set(centres).size).toBe(3);
  for (const id of centres) expect(state.map.provinces.some(p => p.id === id)).toBe(true);
});
