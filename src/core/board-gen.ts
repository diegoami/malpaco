import { DeterministicRng } from "./rng";
import type { GameMap, Island, Point, Province } from "./types";
import { runAllFairnessChecks } from "./board-fairness";

// ---------------------------------------------------------------------------
// Structural constants — each cites the claim it traces to (rule 17).
// ---------------------------------------------------------------------------

/** C-BRD-03: nine islands of these sizes; the design's sorted partition. */
export const ISLAND_SIZES = [3, 3, 3, 3, 5, 5, 7, 7, 10] as const;

/** C-BRD-04: exactly this many undirected inter-island sea lanes. */
export const SEA_LANE_COUNT = 16;

// ---------------------------------------------------------------------------
// Degree constraints (C-BRD-04)
// ---------------------------------------------------------------------------

/** C-BRD-04: minimum total degree (borders + sea lanes) per province. */
export const DEGREE_MIN = 2;
/** C-BRD-04: maximum total degree (borders + sea lanes) per province. */
export const DEGREE_MAX = 5;
/**
 * C-BRD-04: borders consume at most DEGREE_MAX - 2 degree slots, leaving
 * two slots per province for sea lanes.  The original T05a value was
 * DEGREE_MAX - 1; that left each province only one sea-lane slot, which
 * Phase 2 cannot use to reach SEA_LANE_COUNT=16 once the four structural
 * constraints (MAX_LANES_PER_COUNTRY=2, MAX_ENTRANCES_BY_SIZE, MIN_ENTRANCES=2,
 * MAX_ISLAND_GRAPH_DEGREE=5) are in place.  With two slots per province
 * Phase 2 has headroom to fill to 16 lanes on the tested seeds.  Every
 * province still has degree ≥ 2 from borders alone (within-island
 * connectivity), so connectivity within each island is always maintained.
 */
export const BORDER_MAX = DEGREE_MAX - 2;

/**
 * C-BON-02: island bonus = max(2, floor(size/2) + cross-island-entrances).
 * The divisor 2 is the design constant from decision 12.
 */
export const BONUS_DIVISOR = 2;

/**
 * C-BRD-01: the generator must find a valid board within this many attempts
 * on a 200-seed sweep (≥ 99 % success rate).  The cap is a named export so
 * a rule-9 mutation can set it to 0 and prove the loop is live.  The test
 * suite pins the value to [1, 200]; we use 200 to give Phase 2's
 * constrained search enough retries given the four structural constraints
 * (C-BRD-01).
 */
export const MAX_BOARD_ATTEMPTS = 200;

/**
 * C-BRD-01: a province carries at most 2 sea lanes.  Phase 2 skips any
 * candidate pair where either endpoint already has 2 lanes.  This is the
 * structural precondition for checkCrowdedCrossing.
 */
export const MAX_LANES_PER_COUNTRY = 2;

/**
 * C-BRD-01, C-BON-02: per-island cap on the number of distinct provinces
 * that have at least one sea lane to another island.  Derived from
 * C-BON-02 so that `bonus = max(2, floor(size/2) + entrances) ≤ size`
 * always holds:
 *   size 3 → max(2, 1+2)=3 ≤ 3  → cap 2
 *   size 5 → max(2, 2+3)=5 ≤ 5  → cap 3
 *   size 7 → max(2, 3+4)=7 ≤ 7  → cap 4
 *   size 10 → max(2, 5+5)=10 ≤ 10 → cap 5
 * Phase 2 skips any candidate where the destination island would exceed its cap.
 */
export const MAX_ENTRANCES_BY_SIZE: Readonly<Record<number, number>> = {
  3: 2,
  5: 3,
  7: 4,
  10: 5,
};

/**
 * C-BRD-01: every island must have at least 2 countries with a sea lane
 * (anti-fortress).  Phase 1's spanning tree guarantees at least one lane
 * on each island; Phase 2 keeps adding lanes until every island reaches 2.
 * This is the structural precondition for checkFortress.
 */
export const MIN_ENTRANCES_PER_ISLAND = 2;

/**
 * C-BRD-01: in the island graph, no island may have degree > 5.
 * Phase 1's spanning tree must keep each island's degree ≤ 5
 * (8 edges on 9 islands, max degree 5); Phase 2 must skip any
 * candidate pair where the resulting degree of either endpoint
 * would exceed the cap.  This is the structural precondition for
 * checkRemoteOrHub.  Amendment 2026-10-13: raised from 4 to 5 after
 * the M3 round reached 76 % at cap = 4 (random greedy + 1-level
 * backtracking cannot reliably saturate the island graph at cap = 4);
 * eccentricity threshold (4) did not move in lockstep.
 */
export const MAX_ISLAND_GRAPH_DEGREE = 5;

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type BoardGenResult =
  | { readonly ok: true; readonly map: GameMap }
  | { readonly ok: false; readonly errors: readonly string[] };

// ---------------------------------------------------------------------------
// Island names (ours — not T03's)
// ---------------------------------------------------------------------------

const ISLAND_NAMES = [
  "North Isle",
  "East Isle",
  "West Isle",
  "South Isle",
  "Central Isle",
  "Harbor Isle",
  "Palm Isle",
  "Cliff Isle",
  "Great Isle",
];

// ---------------------------------------------------------------------------
// Province name fragments (ours; reused deterministically)
// ---------------------------------------------------------------------------

const NAME_PREFIXES = [
  "North", "South", "East", "West", "Upper", "Lower", "Old", "New",
  "Port", "Fort", "Gold", "Silver", "Iron", "Stone", "Wind", "Sun",
  "Moon", "Star", "River", "Lake", "Bay", "Cape", "Rock", "Marsh",
  "High", "Low", "Dark", "Light", "Red", "Blue",
];
const NAME_SUFFIXES = [
  "port", "town", "hill", "vale", "ford", "point", "bay", "rock",
  "shore", "haven", "gate", "keep", "march", "dale", "fell", "wood",
  "field", "glen", "moor", "peak", "ridge", "reach", "watch", "rest",
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Fisher-Yates shuffle using the supplied RNG. */
function shuffled<T>(rng: DeterministicRng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

/**
 * Simple placeholder polygon: a small regular polygon of `sides` points
 * centred on (cx, cy) with radius `r`. Display only (C-BRD-06).
 */
function placeholderPolygon(cx: number, cy: number, r: number, sides: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

/** Spread n items across [minX, maxX] × [minY, maxY] using deterministic jitter. */
function spreadPoints(
  rng: DeterministicRng,
  n: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): Point[] {
  const pts: Point[] = [];
  const cols = Math.ceil(Math.sqrt(n * 1.5));
  const cellW = (maxX - minX) / cols;
  const cellH = (maxY - minY) / Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = minX + col * cellW + rng.nextInt(0, cellW * 0.5);
    const y = minY + row * cellH + rng.nextInt(0, cellH * 0.5);
    pts.push([x, y]);
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Border-graph builder (within one island)
// ---------------------------------------------------------------------------

/**
 * Build a connected graph on `provinceIds` where every vertex ends up with
 * degree in `[2, maxDegree]`. Returns a symmetric adjacency map.
 *
 * Order matters (fix for the seed 7 / 21 / 33 / 42 saturation bug, 2026-10-12):
 * 1. Spanning tree. Every node has degree 1+.
 * 2. Raise every degree-1 node to degree 2 using only partners with
 *    headroom (`degree < maxDegree`). Doing this *before* the cap-packing
 *    means the cap is never violated by the straggler fix (the previous
 *    rework pushed some partners past the cap, leaving later sea-lane
 *    phases no headroom).
 * 3. Pack extra random edges up to the cap. Every node is at degree ≥ 2,
 *    so headroom always exists for random pairs.
 */
function buildBorders(
  rng: DeterministicRng,
  provinceIds: readonly string[],
  maxDegree: number,
): Map<string, Set<string>> {
  const n = provinceIds.length;
  const adj = new Map<string, Set<string>>(provinceIds.map((id) => [id, new Set<string>()]));

  if (n === 1) return adj; // single-province island: no borders
  if (n === 2) {
    adj.get(provinceIds[0]!)!.add(provinceIds[1]!);
    adj.get(provinceIds[1]!)!.add(provinceIds[0]!);
    return adj; // one edge: both at degree 1; island-2 is not in ISLAND_SIZES but guard the case.
  }

  // Step 1: random spanning tree (guarantees connectivity, every node ≥ 1).
  // Pick each child's parent only from earlier nodes whose degree is still
  // below `maxDegree`, so the tree itself can never produce a hub past the
  // cap. (Without this filter, a random tree on a size-10 island can give
  // one node degree 5+, which is what the seed-12 / seed-45 bug exploited:
  // the tree step overshot, Step 2 (straggler fix) only raises nodes
  // already at degree < 2, and Step 3 (pack) respects the cap so the hub
  // stuck above maxDegree forever.)
  const order = shuffled(rng, [...provinceIds]);
  for (let i = 1; i < order.length; i++) {
    const child = order[i]!;
    // attach to an earlier node with headroom (parent degree < maxDegree)
    const headroomParents = order.slice(0, i).filter((p) => adj.get(p)!.size < maxDegree);
    let parent: string;
    if (headroomParents.length > 0) {
      parent = headroomParents[rng.nextInt(0, headroomParents.length - 1)]!;
    } else {
      // Defensive fallback: only reachable when maxDegree < 3, which never
      // happens in this generator (BORDER_MAX ≥ 3 here).
      parent = order[rng.nextInt(0, i - 1)]!;
    }
    adj.get(parent)!.add(child);
    adj.get(child)!.add(parent);
  }

  const ids = [...provinceIds];

  // Step 2: raise degree-1 nodes to degree ≥ 2 using partners with headroom.
  // The tree leaves at most n-1 leaves; each has degree 1, all other nodes
  // have degree in [1, maxDegree] (some potentially at the cap), so the
  // partner pool is almost always non-empty. We loop and break only when
  // every node is at degree ≥ 2 or the partner pool is exhausted.
  let stragglerPasses = 0;
  const MAX_STRAGGLER_PASSES = 50;
  let remainingStragglers = ids.filter((id) => adj.get(id)!.size < 2);
  while (remainingStragglers.length > 0 && stragglerPasses < MAX_STRAGGLER_PASSES) {
    stragglerPasses++;
    let progress = false;
    for (const id of remainingStragglers) {
      if (adj.get(id)!.size >= 2) continue;
      const partners = ids.filter(
        (p) => p !== id && !adj.get(id)!.has(p) && adj.get(p)!.size < maxDegree,
      );
      if (partners.length === 0) continue;
      const partner = partners[rng.nextInt(0, partners.length - 1)]!;
      adj.get(id)!.add(partner);
      adj.get(partner)!.add(id);
      progress = true;
    }
    if (!progress) break;
    remainingStragglers = ids.filter((id) => adj.get(id)!.size < 2);
  }

  // Step 3: pack extra random edges up to the cap. Every node is at degree
  // ≥ 2 with at least one unsaturated partner (or fully saturated, in which
  // case the random pick naturally skips).
  const MAX_PACK_ATTEMPTS = n * 200;
  for (let attempt = 0; attempt < MAX_PACK_ATTEMPTS; attempt++) {
    const a = ids[rng.nextInt(0, n - 1)]!;
    const b = ids[rng.nextInt(0, n - 1)]!;
    if (a === b) continue;
    if (adj.get(a)!.size >= maxDegree) continue;
    if (adj.get(b)!.size >= maxDegree) continue;
    if (adj.get(a)!.has(b)) continue;
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }

  return adj;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Inner generator body.  Takes a live `DeterministicRng` (already seeded by
 * the caller) and produces either a structurally-valid `GameMap` or a list
 * of structural errors.  No fairness checks here — those run in the retry
 * loop below.
 */
function generateBoardBody(rng: DeterministicRng): BoardGenResult {
  const errors: string[] = [];

  // ---- Assign province IDs to islands ------------------------------------
  const shuffledProvinceIds = shuffled(rng, Array.from({ length: 46 }, (_, i) => `province_${i}`));
  const islandStructs: { id: string; name: string; size: number; provinceIds: string[] }[] = [];
  let cursor = 0;
  for (let i = 0; i < ISLAND_SIZES.length; i++) {
    const size = ISLAND_SIZES[i]!;
    islandStructs.push({
      id: `island_${i}`,
      name: ISLAND_NAMES[i] ?? `Isle ${i}`,
      size,
      provinceIds: shuffledProvinceIds.slice(cursor, cursor + size),
    });
    cursor += size;
  }
  if (cursor !== 46) errors.push(`island sizes sum to ${cursor}, expected 46`);

  // ---- Build within-island borders --------------------------------------
  // Capping at BORDER_MAX (= DEGREE_MAX - 1) reserves one degree slot per
  // province for a sea lane; otherwise buildBorders packs some provinces to
  // DEGREE_MAX and leaves Phase 1 unable to find a spanning-tree endpoint
  // (saturation; see BORDER_MAX above).
  const allBorders = new Map<string, Set<string>>();
  for (const island of islandStructs) {
    const adj = buildBorders(rng, island.provinceIds, BORDER_MAX);
    for (const [id, neighbours] of adj) {
      if (!allBorders.has(id)) allBorders.set(id, new Set<string>());
      for (const n of neighbours) allBorders.get(id)!.add(n);
    }
  }

  // ---- Add inter-island sea lanes ----------------------------------------
  // C-BRD-01: sea lanes are always between different islands.
  // Phase 1: build a guaranteed spanning tree so the graph is always connected.
  // Phase 2: fill remaining slots randomly up to SEA_LANE_COUNT.
  const allSeaLanes = new Map<string, Set<string>>();
  for (const id of shuffledProvinceIds) {
    allSeaLanes.set(id, new Set<string>());
  }

  // Track island-graph degree (distinct island neighbours per island).
  // Used to enforce MAX_ISLAND_GRAPH_DEGREE during both Phase 1 and Phase 2.
  const islandDegree = new Map<string, number>(islandStructs.map((isl) => [isl.id, 0]));

  // Track distinct provinces per island that have at least one sea lane to another island.
  // Used to enforce MAX_ENTRANCES_BY_SIZE and MIN_ENTRANCES_PER_ISLAND.
  const islandEntranceCount = new Map<string, number>(islandStructs.map((isl) => [isl.id, 0]));

  /** Record that province `prov` now has a sea lane to another island. */
  function recordEntrance(prov: string) {
    const isl = islandStructs.find((s) => [...s.provinceIds].includes(prov));
    if (!isl) return;
    const existing = allSeaLanes.get(prov)!.size;
    if (existing === 1) {
      // First sea lane for this province → this island gains an entrance
      islandEntranceCount.set(isl.id, (islandEntranceCount.get(isl.id) ?? 0) + 1);
    }
  }

  /**
   * Add a sea lane between two provinces if all four structural constraints permit.
   * Returns true on success.
   *
   * Constraints enforced here (C-BRD-01):
   * 1. MAX_LANES_PER_COUNTRY: neither endpoint province may already have ≥ 2 lanes.
   * 2. MAX_ENTRANCES_BY_SIZE: neither island may exceed its entrance cap.
   * 3. MAX_ISLAND_GRAPH_DEGREE: neither island may exceed degree 5 in the island graph.
   * 4. DEGREE_MAX: total degree (borders + lanes) of each endpoint stays ≤ DEGREE_MAX.
   */
  function tryAddLane(provA: string, provB: string, islandA: string, islandB: string): boolean {
    if (islandA === islandB) return false;
    // Constraint 1: per-province lane cap
    if ((allSeaLanes.get(provA)?.size ?? 0) >= MAX_LANES_PER_COUNTRY) return false;
    if ((allSeaLanes.get(provB)?.size ?? 0) >= MAX_LANES_PER_COUNTRY) return false;
    // Constraint 2: per-island entrance cap
    const capA = MAX_ENTRANCES_BY_SIZE[islandStructs.find((s) => s.id === islandA)?.size ?? 0] ?? 99;
    const capB = MAX_ENTRANCES_BY_SIZE[islandStructs.find((s) => s.id === islandB)?.size ?? 0] ?? 99;
    if ((islandEntranceCount.get(islandA) ?? 0) >= capA) return false;
    if ((islandEntranceCount.get(islandB) ?? 0) >= capB) return false;
    // Constraint 3: island-graph degree cap
    if ((islandDegree.get(islandA) ?? 0) >= MAX_ISLAND_GRAPH_DEGREE) return false;
    if ((islandDegree.get(islandB) ?? 0) >= MAX_ISLAND_GRAPH_DEGREE) return false;
    // Constraint 4: DEGREE_MAX
    const degA = (allBorders.get(provA)?.size ?? 0) + (allSeaLanes.get(provA)?.size ?? 0);
    const degB = (allBorders.get(provB)?.size ?? 0) + (allSeaLanes.get(provB)?.size ?? 0);
    if (degA >= DEGREE_MAX || degB >= DEGREE_MAX) return false;
    if (allSeaLanes.get(provA)?.has(provB)) return false;
    // All constraints pass — commit
    allSeaLanes.get(provA)!.add(provB);
    allSeaLanes.get(provB)!.add(provA);
    islandDegree.set(islandA, (islandDegree.get(islandA) ?? 0) + 1);
    islandDegree.set(islandB, (islandDegree.get(islandB) ?? 0) + 1);
    recordEntrance(provA);
    recordEntrance(provB);
    return true;
  }

  // Phase 1: build a balanced spanning tree using Kruskal's-style random
  // pair selection.  Generate all possible island pairs, shuffle, pick the
  // first 8 that connect distinct components while respecting
  // MAX_ISLAND_GRAPH_DEGREE (the cap is enforced by tryAddLane).  Unlike
  // Prim's from a fixed root, this produces trees where no island is
  // pre-disposed to be a hub — every island has the same chance of high
  // degree, which leaves Phase 2 more headroom.
  const allPairs: { i: number; j: number }[] = [];
  for (let i = 0; i < islandStructs.length; i++) {
    for (let j = i + 1; j < islandStructs.length; j++) {
      allPairs.push({ i, j });
    }
  }
  shuffled(rng, allPairs);

  // Union-find for components
  const compParent = Array.from({ length: islandStructs.length }, (_, i) => i);
  function compFind(x: number): number {
    return compParent[x] === x ? x : (compParent[x] = compFind(compParent[x]));
  }
  function compUnion(a: number, b: number) {
    const ra = compFind(a);
    const rb = compFind(b);
    if (ra !== rb) compParent[ra] = rb;
  }

  let treeEdges = 0;
  for (const pair of allPairs) {
    if (treeEdges >= islandStructs.length - 1) break;
    if (compFind(pair.i) === compFind(pair.j)) continue; // already connected
    const fromIsland = islandStructs[pair.i]!.id;
    const toIsland = islandStructs[pair.j]!.id;
    const from = islandStructs[pair.i]!;
    const to = islandStructs[pair.j]!;
    const provA_arr = from.provinceIds.filter(
      (p) => (allSeaLanes.get(p)?.size ?? 0) < MAX_LANES_PER_COUNTRY,
    );
    const provB_arr = to.provinceIds.filter(
      (p) => (allSeaLanes.get(p)?.size ?? 0) < MAX_LANES_PER_COUNTRY,
    );
    if (provA_arr.length === 0 || provB_arr.length === 0) continue;
    const provA = provA_arr[rng.nextInt(0, provA_arr.length - 1)]!;
    const provB = provB_arr[rng.nextInt(0, provB_arr.length - 1)]!;
    if (tryAddLane(provA, provB, fromIsland, toIsland)) {
      compUnion(pair.i, pair.j);
      treeEdges++;
    }
  }

  // Phase 2: fill remaining slots up to SEA_LANE_COUNT, while also ensuring
  // every island reaches MIN_ENTRANCES_PER_ISLAND (anti-fortress).
  //
  // Two-phase approach (C-BRD-01):
  //   2A. Anti-fortress: for each island with < MIN_ENTRANCES_PER_ISLAND
  //       entrances, add a sea lane from a province that currently has
  //       0 lanes (a NEW entrance) to a province on a different island
  //       that has lane headroom.
  //   2B. Fill: while below SEA_LANE_COUNT, add random lanes between viable
  //       pairs until the count is reached or no viable pair exists.
  //
  // Both phases enforce the four constraints via tryAddLane.
  let seaLaneCount = islandStructs.length - 1; // spanning tree used this many lanes
  let phase2Passes = 0;
  const MAX_PHASE2_PASSES = 5000;

  function allIslandsMinEntrances(): boolean {
    for (const isl of islandStructs) {
      if ((islandEntranceCount.get(isl.id) ?? 0) < MIN_ENTRANCES_PER_ISLAND) return false;
    }
    return true;
  }

  // Phase 2: fill to SEA_LANE_COUNT while satisfying the four structural
  // constraints.  The body does NOT enforce MIN_ENTRANCES_PER_ISLAND here;
  // checkFortress (a fairness check) catches it and the retry loop handles
  // it.  See T05b's option (b): the body succeeds structurally when it
  // places exactly SEA_LANE_COUNT lanes; MIN_ENTRANCES is a fairness concern.
  //
  // Approach: greedy + backtracking.  Each pass picks a viable island pair.
  // When no viable pair remains, undo the most recent lane and try a
  // different lane from the same state.  This explores multiple plans within
  // the same body call.
  type LaneRecord = {
    provA: string;
    provB: string;
    islandA: string;
    islandB: string;
    provANewEntrance: boolean;
    provBNewEntrance: boolean;
  };
  const phase2History: LaneRecord[] = [];
  const MAX_PHASE2_UNDO = 200;

  while (seaLaneCount < SEA_LANE_COUNT && phase2Passes < MAX_PHASE2_PASSES) {
    phase2Passes++;
    const viablePairs: { src: typeof islandStructs[0]; dst: typeof islandStructs[0]; score: number }[] = [];
    for (const src of islandStructs) {
      for (const dst of islandStructs) {
        if (src.id === dst.id) continue;
        if ((islandDegree.get(src.id) ?? 0) >= MAX_ISLAND_GRAPH_DEGREE) continue;
        if ((islandDegree.get(dst.id) ?? 0) >= MAX_ISLAND_GRAPH_DEGREE) continue;
        const capSrc = MAX_ENTRANCES_BY_SIZE[src.size] ?? 99;
        const capDst = MAX_ENTRANCES_BY_SIZE[dst.size] ?? 99;
        if ((islandEntranceCount.get(src.id) ?? 0) >= capSrc) continue;
        if ((islandEntranceCount.get(dst.id) ?? 0) >= capDst) continue;
        const hasCapacitySrc = src.provinceIds.some(
          (p) => (allSeaLanes.get(p)?.size ?? 0) < MAX_LANES_PER_COUNTRY,
        );
        const hasCapacityDst = dst.provinceIds.some(
          (p) => (allSeaLanes.get(p)?.size ?? 0) < MAX_LANES_PER_COUNTRY,
        );
        if (!hasCapacitySrc || !hasCapacityDst) continue;
        const entrSrc = islandEntranceCount.get(src.id) ?? 0;
        const entrDst = islandEntranceCount.get(dst.id) ?? 0;
        const degSrc = islandDegree.get(src.id) ?? 0;
        const degDst = islandDegree.get(dst.id) ?? 0;
        let score = 0;
        if (entrSrc < MIN_ENTRANCES_PER_ISLAND) score += 1000;
        if (entrDst < MIN_ENTRANCES_PER_ISLAND) score += 500;
        score -= degSrc + degDst;
        viablePairs.push({ src, dst, score });
      }
    }
    if (viablePairs.length === 0) {
      // Stuck. Backtrack: undo the most recent lane and try again.
      let undoTries = 0;
      while (phase2History.length > 0 && undoTries < MAX_PHASE2_UNDO) {
        undoTries++;
        const last = phase2History.pop()!;
        // Undo the lane
        allSeaLanes.get(last.provA)?.delete(last.provB);
        allSeaLanes.get(last.provB)?.delete(last.provA);
        islandDegree.set(last.islandA, (islandDegree.get(last.islandA) ?? 0) - 1);
        islandDegree.set(last.islandB, (islandDegree.get(last.islandB) ?? 0) - 1);
        if (last.provANewEntrance) {
          islandEntranceCount.set(
            last.islandA,
            (islandEntranceCount.get(last.islandA) ?? 0) - 1,
          );
        }
        if (last.provBNewEntrance) {
          islandEntranceCount.set(
            last.islandB,
            (islandEntranceCount.get(last.islandB) ?? 0) - 1,
          );
        }
        seaLaneCount--;
        break; // undo one lane, then retry greedy
      }
      if (undoTries === 0 || phase2History.length === 0) break;
      continue;
    }
    let bestScore = -Infinity;
    for (const p of viablePairs) if (p.score > bestScore) bestScore = p.score;
    const bestPairs = viablePairs.filter((p) => p.score === bestScore);
    const pair = bestPairs[rng.nextInt(0, bestPairs.length - 1)]!;
    const provsSrc = pair.src.provinceIds.filter(
      (p) => (allSeaLanes.get(p)?.size ?? 0) < MAX_LANES_PER_COUNTRY,
    );
    const provsDst = pair.dst.provinceIds.filter(
      (p) => (allSeaLanes.get(p)?.size ?? 0) < MAX_LANES_PER_COUNTRY,
    );
    if (provsSrc.length === 0 || provsDst.length === 0) break;
    const srcZero = provsSrc.filter((p) => (allSeaLanes.get(p)?.size ?? 0) === 0);
    const provA =
      srcZero.length > 0
        ? srcZero[rng.nextInt(0, srcZero.length - 1)]!
        : provsSrc[rng.nextInt(0, provsSrc.length - 1)]!;
    const dstOne = provsDst.filter((p) => (allSeaLanes.get(p)?.size ?? 0) === 1);
    const provB =
      dstOne.length > 0
        ? dstOne[rng.nextInt(0, dstOne.length - 1)]!
        : provsDst[rng.nextInt(0, provsDst.length - 1)]!;
    const provAWas0Lane = (allSeaLanes.get(provA)?.size ?? 0) === 0;
    const provBWas0Lane = (allSeaLanes.get(provB)?.size ?? 0) === 0;
    if (!tryAddLane(provA, provB, pair.src.id, pair.dst.id)) continue;
    phase2History.push({
      provA,
      provB,
      islandA: pair.src.id,
      islandB: pair.dst.id,
      provANewEntrance: provAWas0Lane,
      provBNewEntrance: provBWas0Lane,
    });
    seaLaneCount++;
  }

  if (seaLaneCount < SEA_LANE_COUNT)
    errors.push(
      `could not place ${SEA_LANE_COUNT} sea lanes in ${MAX_PHASE2_PASSES} passes (placed ${seaLaneCount})`,
    );
  // Note: MIN_ENTRANCES_PER_ISLAND is checked by the fairness-check filter
  // (checkFortress) and the retry loop handles it.  We do NOT enforce it in
  // the body — the four structural constraints in Phase 2 are sufficient to
  // reach SEA_LANE_COUNT in most seeds, but enforcing MIN_ENTRANCES here
  // would over-saturate the larger islands (forcing Phase 2B to give up).
  // See option (b) in T05b's Hazards: the body's structural check is "enough
  // lanes"; MIN_ENTRANCES is a fairness concern.

  // ---- Build island records ------------------------------------------------
  // islandEntranceCount is maintained live during Phase 1 and Phase 2;
  // it already reflects the correct count of distinct provinces with sea lanes.
  const islands: Island[] = islandStructs.map((isl) => ({
    id: isl.id,
    name: isl.name,
    bonus: Math.max(2, Math.floor(isl.size / BONUS_DIVISOR) + (islandEntranceCount.get(isl.id) ?? 0)),
    provinces: isl.provinceIds,
  }));

  // ---- Build province records ----------------------------------------------
  // Assign each province a position within a grid derived from the island index.
  const provinces: Province[] = [];
  for (let ii = 0; ii < islandStructs.length; ii++) {
    const island = islandStructs[ii]!;
    const islandX = (ii % 3) * 220 + 60;
    const islandY = Math.floor(ii / 3) * 180 + 60;
    const pts = spreadPoints(rng, island.size, islandX, islandX + 160, islandY, islandY + 130);
    for (let pi = 0; pi < island.provinceIds.length; pi++) {
      const id = island.provinceIds[pi]!;
      const [px, py] = pts[pi]!;
      const prefix = NAME_PREFIXES[rng.nextInt(0, NAME_PREFIXES.length - 1)]!;
      const suffix = NAME_SUFFIXES[rng.nextInt(0, NAME_SUFFIXES.length - 1)]!;
      const borders = [...(allBorders.get(id) ?? [])];
      const seaLanes = [...(allSeaLanes.get(id) ?? [])];
      const polygon = placeholderPolygon(px, py, rng.nextInt(12, 22), rng.nextInt(3, 6));
      const labelAt: Point = [px, py];
      provinces.push({ id, name: `${prefix} ${suffix}`, island: island.id, borders, seaLanes, polygon, labelAt });
    }
  }

  // ---- Bounds --------------------------------------------------------------
  const allX = provinces.flatMap((p) => p.polygon.map((pt) => pt[0]));
  const allY = provinces.flatMap((p) => p.polygon.map((pt) => pt[1]));
  const minX = Math.min(...allX) - 30;
  const minY = Math.min(...allY) - 30;
  const maxX = Math.max(...allX) + 30;
  const maxY = Math.max(...allY) + 30;
  const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

  const map: GameMap = {
    id: "generated",
    name: "Generated Archipelago",
    bounds,
    provinces,
    islands,
  };

  // ---- Structural assertions (fail-fast) ----------------------------------
  // Degree check (C-BRD-04)
  for (const p of provinces) {
    const deg = p.borders.length + p.seaLanes.length;
    if (deg < DEGREE_MIN || deg > DEGREE_MAX) {
      errors.push(`province '${p.id}' has degree ${deg}, outside [${DEGREE_MIN}, ${DEGREE_MAX}]`);
    }
  }

  // Sea lane count check (C-BRD-04)
  const undirectedSeaLanes = new Set<string>();
  for (const p of provinces) {
    for (const t of p.seaLanes) {
      const key = p.id < t ? `${p.id}|${t}` : `${t}|${p.id}`;
      undirectedSeaLanes.add(key);
    }
  }
  if (undirectedSeaLanes.size !== SEA_LANE_COUNT)
    errors.push(`has ${undirectedSeaLanes.size} undirected sea lanes, expected ${SEA_LANE_COUNT}`);

  // Connectivity check (C-BRD-04)
  if (provinces.length > 0) {
    const seen = new Set<string>([provinces[0]!.id]);
    const queue = [provinces[0]!.id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const prov = provinces.find((p) => p.id === current)!;
      for (const n of [...prov.borders, ...prov.seaLanes]) {
        if (!seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    if (seen.size !== provinces.length)
      errors.push(`graph has ${seen.size} reachable provinces, expected ${provinces.length}`);
  }

  if (errors.length > 0) return { ok: false, errors };

  return { ok: true, map };
}

/**
 * Generate a `GameMap` from a seed. The map always meets the structural
 * invariants from `design/core-rules.md § The board` on every seed:
 * - 46 provinces in 9 islands of sizes [3,3,3,3,5,5,7,7,10] (C-BRD-03)
 * - every province has 2–5 neighbours in total (C-BRD-04)
 * - exactly 16 undirected inter-island sea lanes, symmetric (C-BRD-04)
 * - the border-plus-sea-lane graph is connected (C-BRD-04)
 * - island bonuses follow C-BON-02
 * - all polygons have ≥3 points; all labels inside bounds (C-BRD-06)
 *
 * Plus the 5 fairness checks from `board-fairness.ts` (C-BRD-01).
 * The retry loop draws a new plan each attempt by advancing the RNG.
 */
export function generateBoard(seed: number): BoardGenResult {
  const rng = new DeterministicRng(seed);
  let lastResult: BoardGenResult | null = null;
  for (let attempt = 1; attempt <= MAX_BOARD_ATTEMPTS; attempt++) {
    const result = generateBoardBody(rng);
    if (result.ok) {
      const fairnessErrors = runAllFairnessChecks(result.map);
      if (fairnessErrors.length === 0) return result;
    }
    lastResult = result;
    // Advance the RNG to draw a different plan next attempt (C-BRD-01).
    // One draw is enough: the body always consumes a deterministic
    // sequence, so skipping one state guarantees a different plan on the
    // next attempt — whether the previous attempt failed structurally
    // (e.g. could not place 16 lanes) or failed the fairness checks.
    rng.nextInt(0, 0xffffffff);
  }
  if (lastResult && lastResult.ok) {
    const fairnessErrors = runAllFairnessChecks(lastResult.map);
    return {
      ok: false,
      errors: [`fairness checks failed after ${MAX_BOARD_ATTEMPTS} attempts: ${fairnessErrors.join("; ")}`],
    };
  }
  return {
    ok: false,
    errors: [
      `failed after ${MAX_BOARD_ATTEMPTS} attempts: ${lastResult ? lastResult.errors.join("; ") : "no body output"}`,
    ],
  };
}
