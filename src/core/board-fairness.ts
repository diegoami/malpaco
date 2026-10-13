/**
 * Board fairness checks — pure functions over a `GameMap`.
 *
 * Each check returns a list of violation messages (empty list = pass).
 * All are rooted in C-BRD-01 (the generator must meet the structural
 * invariants AND pass the fairness checks).  The design's own words:
 * "the fairness checks are not weakened to make generation easier."
 *
 * Key definitions:
 * - "single-entrance island" = an island where exactly one of its countries
 *   (provinces) has a non-empty `seaLanes` list.
 * - "island graph": vertices = islands, edges = island pairs where at least
 *   one province of one has a sea lane to a province of the other.
 */

import type { GameMap, Island, Province } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when exactly one province on the island has sea lanes. */
function isSingleEntrance(island: Island, provincesById: Map<string, Province>): boolean {
  let count = 0;
  for (const pid of island.provinces) {
    const p = provincesById.get(pid);
    if (p && p.seaLanes.length > 0) count++;
    if (count > 1) return false;
  }
  return count === 1;
}

/**
 * Build the island graph: vertices = island ids; edges = pairs that share
 * at least one sea lane between a province of one and a province of the other.
 * Returns an adjacency set per island.
 */
function buildIslandGraph(
  islands: readonly Island[],
  provincesById: Map<string, Province>,
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>(islands.map((i) => [i.id, new Set<string>()]));

  for (const island of islands) {
    for (const pid of island.provinces) {
      const p = provincesById.get(pid);
      if (!p) continue;
      for (const sl of p.seaLanes) {
        const other = provincesById.get(sl);
        if (!other || other.island === island.id) continue;
        adj.get(island.id)!.add(other.island);
        adj.get(other.island)!.add(island.id);
      }
    }
  }
  return adj;
}

/** BFS distance from startId to every other vertex in an adjacency map. */
function bfsDistances(adj: Map<string, Set<string>>, startId: string): Map<string, number> {
  const dist = new Map<string, number>();
  const visited = new Set<string>();
  const queue: string[] = [startId];
  dist.set(startId, 0);
  visited.add(startId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const d = dist.get(current)!;
    for (const neighbour of adj.get(current) ?? []) {
      if (!visited.has(neighbour)) {
        visited.add(neighbour);
        dist.set(neighbour, d + 1);
        queue.push(neighbour);
      }
    }
  }
  return dist;
}

// ---------------------------------------------------------------------------
// Check 1: Bonus out of proportion  (C-BRD-01)
// ---------------------------------------------------------------------------

/**
 * Any island whose bonus exceeds its size.
 * A small rich island is unfair however the bonus got there.
 */
export function checkBonusOutOfProportion(map: GameMap): string[] {
  const violations: string[] = [];
  for (const island of map.islands) {
    if (island.bonus > island.provinces.length) {
      violations.push(
        `bonus-out-of-proportion: island '${island.id}' has bonus ${island.bonus} > size ${island.provinces.length}`,
      );
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Check 2: Fortress  (C-BRD-01)
// ---------------------------------------------------------------------------

/**
 * Fortress = (a) any island of size >= 7 with a single entrance, OR
 * (b) more than 3 islands (any size) with a single entrance.
 *
 * A large island with only one sea-lane entry point can be held by one
 * player and is hard to dislodge — an unfair "fortress".
 */
export function checkFortress(map: GameMap): string[] {
  const violations: string[] = [];
  const provincesById = new Map<string, Province>(map.provinces.map((p) => [p.id, p]));
  const singleEntranceIslands: string[] = [];

  for (const island of map.islands) {
    if (isSingleEntrance(island, provincesById)) {
      singleEntranceIslands.push(island.id);
      if (island.provinces.length >= 7) {
        violations.push(
          `fortress: island '${island.id}' (size ${island.provinces.length}) has a single entrance`,
        );
      }
    }
  }

  if (singleEntranceIslands.length > 3) {
    violations.push(
      `fortress: ${singleEntranceIslands.length} islands have a single entrance (max 3): ${singleEntranceIslands.join(", ")}`,
    );
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Check 3: Easy bonuses concentrated  (C-BRD-01)
// ---------------------------------------------------------------------------

/**
 * The sum of bonuses on single-entrance islands is more than a quarter of
 * the sum of all bonuses.
 *
 * Single-entrance islands are easy to defend. If most of the map's bonus
 * value is concentrated there, the game rewards passive play.
 */
export function checkEasyBonusesConcentrated(map: GameMap): string[] {
  const violations: string[] = [];
  const provincesById = new Map<string, Province>(map.provinces.map((p) => [p.id, p]));

  let totalBonus = 0;
  let singleEntranceBonus = 0;

  for (const island of map.islands) {
    totalBonus += island.bonus;
    if (isSingleEntrance(island, provincesById)) {
      singleEntranceBonus += island.bonus;
    }
  }

  // More than 1/4 of total bonus concentrated on single-entrance islands
  if (totalBonus > 0 && singleEntranceBonus > totalBonus / 4) {
    violations.push(
      `easy-bonuses-concentrated: single-entrance islands hold bonus ${singleEntranceBonus} > 1/4 of total bonus ${totalBonus}`,
    );
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Check 4: Remote / hub island  (C-BRD-01)
// ---------------------------------------------------------------------------

/**
 * In the island graph, any island with eccentricity > 4 (requires more
 * than 4 crossings to reach some other island) OR degree > 5 (touches
 * more than 5 other islands).
 *
 * A remote island (isolated, requires many hops) or a hub (over-connected)
 * both distort strategy.
 *
 * Amendment 2026-10-13: degree threshold moved from `> 4` to `> 5`
 * in lockstep with `MAX_ISLAND_GRAPH_DEGREE = 5` in board-gen.ts
 * (C-BRD-01).  Eccentricity threshold (4) did not move.
 */
export function checkRemoteOrHub(map: GameMap): string[] {
  const violations: string[] = [];
  const provincesById = new Map<string, Province>(map.provinces.map((p) => [p.id, p]));
  const islandAdj = buildIslandGraph(map.islands, provincesById);

  for (const island of map.islands) {
    const neighbours = islandAdj.get(island.id) ?? new Set<string>();

    // Degree check: more than 5 other islands directly adjacent
    if (neighbours.size > 5) {
      violations.push(
        `remote-or-hub: island '${island.id}' has degree ${neighbours.size} > 5`,
      );
    }

    // Eccentricity check: max distance to any other island > 4
    const dists = bfsDistances(islandAdj, island.id);
    for (const [, dist] of dists) {
      if (dist > 4) {
        violations.push(
          `remote-or-hub: island '${island.id}' has eccentricity ${dist} > 4`,
        );
        break; // only report once per island
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Check 5: Crowded crossing country  (C-BRD-01)
// ---------------------------------------------------------------------------

/**
 * Any province with more than 2 sea lanes.
 * A province that serves too many crossings concentrates connectivity and
 * makes the map brittle.
 */
export function checkCrowdedCrossing(map: GameMap): string[] {
  const violations: string[] = [];
  for (const p of map.provinces) {
    if (p.seaLanes.length > 2) {
      violations.push(
        `crowded-crossing: province '${p.id}' has ${p.seaLanes.length} sea lanes > 2`,
      );
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Convenience: run all 5 checks
// ---------------------------------------------------------------------------

/** Run all 5 fairness checks and return the concatenated list of violations. */
export function runAllFairnessChecks(map: GameMap): string[] {
  return [
    ...checkBonusOutOfProportion(map),
    ...checkFortress(map),
    ...checkEasyBonusesConcentrated(map),
    ...checkRemoteOrHub(map),
    ...checkCrowdedCrossing(map),
  ];
}
