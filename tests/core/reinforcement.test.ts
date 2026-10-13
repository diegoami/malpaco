import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classicRules, generateBoard, newGame, parseMap, reinforcementIncome } from "../../src/core";
import type { GameMap, GameState } from "../../src/core";

function authoredMap(): GameMap {
  const path = fileURLToPath(new URL("../../data/maps/archipelago.json", import.meta.url));
  const result = parseMap(JSON.parse(readFileSync(path, "utf8")));
  if (!result.ok) throw new Error(result.errors.join("; "));
  return result.map;
}

function gameFor(map: GameMap, blue: readonly string[]): GameState {
  const state = newGame(map, classicRules(), [
    { id: "blue", name: "Blue", eliminated: false },
    { id: "amber", name: "Amber", eliminated: false },
  ], 7);
  const held = new Set(blue);
  for (const p of map.provinces) state.ownerOf[p.id] = held.has(p.id) ? "blue" : "amber";
  return state;
}

describe("reinforcementIncome (C-REI-01..03)", () => {
  const map = authoredMap();

  it.each([[0, 2], [1, 2], [2, 2], [3, 2], [6, 2], [9, 3]])(
    "DW1: %i provinces give base %i",
    (count, base) => {
      const state = gameFor(map, map.provinces.slice(0, count).map((p) => p.id));
      const income = reinforcementIncome(state, "blue");
      expect(income.provinceCount).toBe(count);
      expect(income.base).toBe(base);
      expect(income.total).toBe(income.base + income.islandBonus);
    },
  );

  it("DW1: held islands add their bonuses, not their count", () => {
    const first = map.islands[0]!;
    const second = map.islands[1]!;
    const state = gameFor(map, [...first.provinces, ...second.provinces]);
    const income = reinforcementIncome(state, "blue");
    expect(income.islandBonus).toBe(first.bonus + second.bonus);
    expect(income.total).toBe(income.base + first.bonus + second.bonus);
  });

  it("DW1: no provinces earn no island bonus", () => {
    expect(reinforcementIncome(gameFor(map, []), "blue")).toEqual({
      base: 2, islandBonus: 0, total: 2, provinceCount: 0,
    });
  });

  it("DW1: eliminated seats use the same ownership formula", () => {
    const state = gameFor(map, []);
    state.players[0]!.eliminated = true;
    expect(reinforcementIncome(state, "blue")).toEqual({
      base: 2, islandBonus: 0, total: 2, provinceCount: 0,
    });
  });

  it.each(["authored", "generated"])("DW2: repeatable and non-mutating on the %s map", (kind) => {
    let board = map;
    if (kind === "generated") {
      const result = generateBoard(7);
      if (!result.ok) throw new Error(result.errors.join("; "));
      board = result.map;
    }
    const state = gameFor(board, board.provinces.map((p) => p.id));
    const before = JSON.stringify(state);
    const expected = {
      base: Math.max(Math.floor(board.provinces.length / 3), 2),
      islandBonus: board.islands.reduce((sum, island) => sum + island.bonus, 0),
      provinceCount: board.provinces.length,
    };
    const a = reinforcementIncome(state, "blue");
    expect(a).toEqual({ ...expected, total: expected.base + expected.islandBonus });
    expect(reinforcementIncome(state, "blue")).toEqual(a);
    expect(JSON.stringify(state)).toBe(before);
  });
});
