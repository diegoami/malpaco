import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseMap, province } from "../../src/core";
import type { GameMap } from "../../src/core";

// T03: the game's one board, as data (issue #10). The suite reads the JSON
// file alone and pins the structure the promoted spec states: behaviour and
// design only — names, geometry and adjacency are ours ([designed]).
const MAP_PATH = fileURLToPath(new URL("../../data/maps/archipelago.json", import.meta.url));
const raw: unknown = JSON.parse(readFileSync(MAP_PATH, "utf8"));

// C-BRD-03: nine islands sized 3, 5, 5, 10, 3, 7, 3, 7, 3, each one a
// consecutive range of the province order.
const ISLAND_SIZES = [3, 5, 5, 10, 3, 7, 3, 7, 3];
// C-BON-02: the island bonuses, in island order.
const ISLAND_BONUSES = [2, 4, 4, 8, 2, 5, 2, 5, 3];
// C-BRD-04: every province at 2 to 5 neighbours, exactly 8 with 2, 12 with 3,
// 22 with 4, 4 with 5; 16 inter-island sea lanes; one connected graph.
const NEIGHBOUR_HISTOGRAM: Record<number, number> = { 2: 8, 3: 12, 4: 22, 5: 4 };
const SEA_LANES = 16;

let map!: GameMap;

describe("data/maps/archipelago.json, the game's board", () => {
  it("loads and validates through the ordinary reader", () => {
    const result = parseMap(raw);
    if (!result.ok) throw new Error(`archipelago.json did not load: ${result.errors.join("; ")}`);
    map = result.map;
    expect(map.provinces).toHaveLength(46);
    expect(map.islands).toHaveLength(9);
  });

  it("has 9 islands whose lists partition the province order into consecutive ranges (C-BRD-03)", () => {
    expect(map.islands.map((i) => i.provinces.length)).toEqual(ISLAND_SIZES);
    let cursor = 0;
    for (const island of map.islands) {
      for (const pid of island.provinces) {
        // The island's list must run along the file's province order without
        // gaps or reordering, and the ranges must tile all 46 exactly once.
        expect(map.provinces[cursor]?.id).toBe(pid);
        expect(map.provinces[cursor]?.island).toBe(island.id);
        cursor++;
      }
    }
    expect(cursor).toBe(map.provinces.length);
  });

  it("carries the island bonuses in island order (C-BON-02)", () => {
    expect(map.islands.map((i) => i.bonus)).toEqual(ISLAND_BONUSES);
  });

  it("meets the neighbour histogram: {2: 8, 3: 12, 4: 22, 5: 4} (C-BRD-04)", () => {
    const histogram: Record<number, number> = {};
    for (const p of map.provinces) {
      const degree = p.borders.length + p.seaLanes.length;
      histogram[degree] = (histogram[degree] ?? 0) + 1;
    }
    expect(histogram).toEqual(NEIGHBOUR_HISTOGRAM);
  });

  it("has exactly 16 undirected sea lanes, 32 directed entries, symmetric (C-BRD-04)", () => {
    // parseMap itself rejects self lanes, duplicates, dangling ends, one-way
    // crossings and lanes that stay on an island; this pins the counts.
    let directed = 0;
    const undirected = new Set<string>();
    for (const p of map.provinces) {
      for (const target of p.seaLanes) {
        directed++;
        const other = province(map, target);
        expect(other?.island).not.toBe(p.island);
        expect(other?.seaLanes).toContain(p.id);
        undirected.add(p.id < target ? `${p.id}|${target}` : `${target}|${p.id}`);
      }
    }
    expect(directed).toBe(SEA_LANES * 2);
    expect(undirected.size).toBe(SEA_LANES);
  });

  it("is one connected border-plus-sea-lane graph (C-BRD-04)", () => {
    const start = map.provinces[0]!.id;
    const seen = new Set<string>([start]);
    const queue = [start];
    while (queue.length > 0) {
      const current = province(map, queue.shift()!)!;
      for (const next of [...current.borders, ...current.seaLanes]) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect(seen.size).toBe(map.provinces.length);
  });

  // Scope: placeholder polygons (at least 3 points) and labels within bounds.
  it("places every label inside the bounds and gives every polygon 3+ points", () => {
    const { x, y, width, height } = map.bounds;
    for (const p of map.provinces) {
      const [lx, ly] = p.labelAt;
      expect(lx).toBeGreaterThanOrEqual(x);
      expect(lx).toBeLessThanOrEqual(x + width);
      expect(ly).toBeGreaterThanOrEqual(y);
      expect(ly).toBeLessThanOrEqual(y + height);
      expect(p.polygon.length).toBeGreaterThanOrEqual(3);
    }
  });
});
