import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classicRules, generateBoard, islandIncome, newGame, parseMap } from "../../src/core";
import type { GameMap, GameState, Player } from "../../src/core";

// T09: island income as pure functions (issue #23). C-BON-01: a seat earns an
// island's `bonus` only when it owns every province of that island; partial
// control earns nothing; held islands sum with no diminishing; the result
// carries the count of held islands. Test code may do I/O; src/core may not,
// so the authored map is read here as data and handed to the pure function.

const MAP_PATH = fileURLToPath(new URL("../../data/maps/archipelago.json", import.meta.url));
const SEATS: Player[] = [
  { id: "blue", name: "Blue", eliminated: false },
  { id: "amber", name: "Amber", eliminated: false },
];

function authoredMap(): GameMap {
  const raw: unknown = JSON.parse(readFileSync(MAP_PATH, "utf8"));
  const result = parseMap(raw);
  if (!result.ok) throw new Error(`archipelago.json did not load: ${result.errors.join("; ")}`);
  return result.map;
}

/** A real game on `map` with blue holding exactly `blue` and amber the rest. */
function gameFor(map: GameMap, blue: readonly string[]): GameState {
  const state = newGame(map, classicRules(), SEATS, 7);
  const blueSet = new Set(blue);
  for (const p of map.provinces) state.ownerOf[p.id] = blueSet.has(p.id) ? "blue" : "amber";
  return state;
}

function generatedMap(seed: number): GameMap {
  const board = generateBoard(seed);
  if (!board.ok) throw new Error(`generateBoard(${seed}): ${board.errors.join("; ")}`);
  return board.map;
}

describe("islandIncome on the authored map (C-BON-01)", () => {
  const map = authoredMap();
  const first = map.islands[0]!;
  const second = map.islands[1]!;

  it("DW1a: owning every province of an island earns exactly that island's bonus", () => {
    const state = gameFor(map, first.provinces);
    const income = islandIncome(state, "blue");
    expect(income.islands).toEqual([first]);
    // The held island is the map's own Island record, not a copy.
    expect(income.islands[0]).toBe(first);
    expect(income.total).toBe(first.bonus);
    expect(income.count).toBe(1);
  });

  it("DW1b: one province owned by another seat makes the island pay nobody", () => {
    // Blue holds all of `first` but its last province.
    const state = gameFor(map, first.provinces.slice(0, -1));
    const blueIncome = islandIncome(state, "blue");
    expect(blueIncome.islands).toEqual([]);
    expect(blueIncome.total).toBe(0);
    expect(blueIncome.count).toBe(0);
    // Amber holds the missing province but not the whole island either.
    expect(islandIncome(state, "amber").islands.map((i) => i.id)).not.toContain(first.id);
  });

  it("DW1c: two held islands pay the sum of their bonuses", () => {
    const state = gameFor(map, [...first.provinces, ...second.provinces]);
    const income = islandIncome(state, "blue");
    expect(income.islands.map((i) => i.id)).toEqual([first.id, second.id]);
    expect(income.total).toBe(first.bonus + second.bonus);
    expect(income.count).toBe(2);
  });

  it("DW1d: a seat holding no island earns total 0 and count 0", () => {
    const state = gameFor(map, []);
    const income = islandIncome(state, "blue");
    expect(income.islands).toEqual([]);
    expect(income.total).toBe(0);
    expect(income.count).toBe(0);
  });

  it("never pays for an island with no provinces", () => {
    const withEmpty: GameMap = {
      ...map,
      islands: [...map.islands, { id: "empty", name: "Empty", bonus: 99, provinces: [] }],
    };
    const state = gameFor(withEmpty, map.provinces.map((p) => p.id));
    const income = islandIncome(state, "blue");
    expect(income.islands.map((i) => i.id)).not.toContain("empty");
    expect(income.count).toBe(map.islands.length);
    expect(income.total).toBe(map.islands.reduce((sum, i) => sum + i.bonus, 0));
  });
});

describe("islandIncome is deterministic (DW2, rule 18)", () => {
  it("gives the same answer twice on the authored map", () => {
    const map = authoredMap();
    const state = gameFor(map, map.islands[0]!.provinces);
    expect(islandIncome(state, "blue")).toEqual(islandIncome(state, "blue"));
  });

  it("gives the same answer twice on a generated board, and the right one", () => {
    const map = generatedMap(7);
    const first = map.islands[0]!;
    const second = map.islands[1]!;
    const state = gameFor(map, [...first.provinces, ...second.provinces.slice(0, -1)]);
    const a = islandIncome(state, "blue");
    const b = islandIncome(state, "blue");
    expect(a).toEqual(b);
    expect(a.islands.map((i) => i.id)).toEqual([first.id]);
    expect(a.total).toBe(first.bonus);
    expect(a.count).toBe(1);
  });

  it("pays the whole board's bonus to a seat that holds every province", () => {
    const map = generatedMap(7);
    const state = gameFor(map, map.provinces.map((p) => p.id));
    const income = islandIncome(state, "blue");
    expect(income.count).toBe(map.islands.length);
    expect(income.total).toBe(map.islands.reduce((sum, i) => sum + i.bonus, 0));
  });
});
