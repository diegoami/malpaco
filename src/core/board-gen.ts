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
 * C-BRD-04: borders stop one short of DEGREE_MAX so every province has at
 * least one slot for a sea lane. Without this reservation, buildBorders packs
 * some provinces to DEGREE_MAX and leaves Phase 1 (the connectivity
 * spanning tree) without any endpoint to use — the previous M2.7 rework
 * shipped with that saturation bug (seeds 21 and 33). Capping borders at
 * DEGREE_MAX - 1 makes every seed fixable on the first try with the existing
 * Phase 1 / Phase 2 layout (2026-10-12).
 */
export const BORDER_MAX = DEGREE_MAX - 1;

/**
 * C-BON-02: island bonus = max(2, floor(size/2) + cross-island-entrances).
 * The divisor 2 is the design constant from decision 12.
 */
export const BONUS_DIVISOR = 2;

/**
 * C-BRD-01: the generator must find a valid board within this many attempts
 * on a 200-seed sweep (≥ 99 % success rate).  The cap is a named export so
 * a rule-9 mutation can set it to 0 and prove the loop is live.
 */
export const MAX_BOARD_ATTEMPTS = 50;

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

  /** Add a sea lane between two provinces if both have degree headroom. Returns true on success. */
  function tryAddLane(provA: string, provB: string): boolean {
    const degA = (allBorders.get(provA)?.size ?? 0) + (allSeaLanes.get(provA)?.size ?? 0);
    const degB = (allBorders.get(provB)?.size ?? 0) + (allSeaLanes.get(provB)?.size ?? 0);
    if (degA >= DEGREE_MAX || degB >= DEGREE_MAX) return false;
    if (allSeaLanes.get(provA)?.has(provB)) return false;
    allSeaLanes.get(provA)!.add(provB);
    allSeaLanes.get(provB)!.add(provA);
    return true;
  }

  // Phase 1: Prim's spanning tree across islands (guarantees connectivity).
  // Start from island 0, grow a frontier until all islands are connected.
  const connectedIslands = new Set<string>([islandStructs[0]!.id]);
  const frontier: { fromIsland: string; toIsland: string; attempts: number }[] = [];
  // R1 fix: track permanently exhausted island pairs so they are never re-added.
  const exhaustedPairs = new Set<string>();

  // Seed frontier with edges from island 0 to every other island.
  for (let i = 1; i < islandStructs.length; i++) {
    frontier.push({ fromIsland: islandStructs[0]!.id, toIsland: islandStructs[i]!.id, attempts: 0 });
  }

  // R1 fix: cap attempts per frontier entry pair. When a pair is exhausted,
  // mark it permanently exhausted; if the frontier empties before all islands
  // are connected, give up on Phase 1 (the spanning tree cannot be completed).
  const MAX_ENTRY_ATTEMPTS = 200;

  while (connectedIslands.size < islandStructs.length) {
    if (frontier.length === 0) {
      // All remaining pairs are exhausted — give up on Phase 1.
      break;
    }

    // Pick a random frontier entry.
    const entryIdx = rng.nextInt(0, frontier.length - 1);
    const entry = frontier[entryIdx]!;
    const { fromIsland, toIsland } = entry;

    if (connectedIslands.has(toIsland)) {
      // Already connected; remove and skip.
      frontier.splice(entryIdx, 1);
      continue;
    }

    entry.attempts++;
    if (entry.attempts > MAX_ENTRY_ATTEMPTS) {
      // Give up on this pair permanently.
      exhaustedPairs.add(`${fromIsland}|${toIsland}`);
      frontier.splice(entryIdx, 1);
      continue;
    }

    const from = islandStructs.find((isl) => isl.id === fromIsland)!;
    const to = islandStructs.find((isl) => isl.id === toIsland)!;
    const provA = from.provinceIds[rng.nextInt(0, from.provinceIds.length - 1)]!;
    const provB = to.provinceIds[rng.nextInt(0, to.provinceIds.length - 1)]!;
    if (tryAddLane(provA, provB)) {
      connectedIslands.add(toIsland);
      // Add new frontier entries from the newly connected island.
      for (const other of islandStructs) {
        if (!connectedIslands.has(other.id) && !exhaustedPairs.has(`${toIsland}|${other.id}`)) {
          frontier.push({ fromIsland: toIsland, toIsland: other.id, attempts: 0 });
        }
      }
    }
  }

  // Phase 2: fill remaining slots up to SEA_LANE_COUNT.
  // R1 fix: greedily pick provinces with available degree headroom, so lanes are
  // placed even when many provinces are near DEGREE_MAX. Shuffle the candidate list
  // each pass to avoid systematic bias.
  let seaLaneCount = islandStructs.length - 1; // spanning tree used this many lanes
  let phase2Passes = 0;
  const MAX_PHASE2_PASSES = 100;
  while (seaLaneCount < SEA_LANE_COUNT && phase2Passes < MAX_PHASE2_PASSES) {
    phase2Passes++;
    // Build shuffled list of province-island pairs to try
    const candidates: { prov: string; islandId: string }[] = [];
    for (const island of islandStructs) {
      for (const prov of island.provinceIds) {
        candidates.push({ prov, islandId: island.id });
      }
    }
    // Fisher-Yates shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = rng.nextInt(0, i);
      const tmp = candidates[i]!;
      candidates[i] = candidates[j]!;
      candidates[j] = tmp;
    }
    // Try each candidate pair once this pass
    for (const { prov: provA, islandId: idA } of candidates) {
      if (seaLaneCount >= SEA_LANE_COUNT) break;
      for (const { prov: provB, islandId: idB } of candidates) {
        if (idA === idB) continue;
        if (tryAddLane(provA, provB)) {
          seaLaneCount++;
          break;
        }
      }
    }
  }
  if (seaLaneCount < SEA_LANE_COUNT)
    errors.push(
      `could not place ${SEA_LANE_COUNT} sea lanes in ${MAX_PHASE2_PASSES} passes (placed ${seaLaneCount})`,
    );

  // ---- Compute cross-island entrances per island (for bonus) -------------
  // C-BON-02: "entrances" = number of distinct provinces on this island
  // that have at least one sea lane to another island.  Not the total
  // number of sea-lane entries (a country may have 2+ lanes from the same
  // province, e.g. island_0 on seed 1 has 3 lanes from 2 countries).
  const islandEntrances = new Map<string, number>();
  for (const island of islandStructs) {
    const entranceProvinces = new Set<string>();
    for (const pid of island.provinceIds) {
      const lanes = allSeaLanes.get(pid);
      if (!lanes || lanes.size === 0) continue;
      const otherIsland = islandStructs.find((isl) => [...isl.provinceIds].some((otherPid) => lanes.has(otherPid)));
      if (otherIsland && otherIsland !== island) entranceProvinces.add(pid);
    }
    islandEntrances.set(island.id, entranceProvinces.size);
  }

  // ---- Build island records ------------------------------------------------
  const islands: Island[] = islandStructs.map((isl) => ({
    id: isl.id,
    name: isl.name,
    bonus: Math.max(2, Math.floor(isl.size / BONUS_DIVISOR) + (islandEntrances.get(isl.id) ?? 0)),
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
  for (let attempt = 1; attempt <= MAX_BOARD_ATTEMPTS; attempt++) {
    const result = generateBoardBody(rng);
    if (!result.ok) return result; // structural failure — not retryable
    const fairnessErrors = runAllFairnessChecks(result.map);
    if (fairnessErrors.length === 0) return result; // all clear
    // Advance the RNG to draw a different plan next attempt.  One draw is
    // enough: the body always consumes a deterministic sequence, so skipping
    // one state guarantees a different plan.
    rng.nextInt(0, 0xffffffff);
  }
  // Cap reached: run a final body call just to collect a summary for the error.
  const lastResult = generateBoardBody(rng);
  if (lastResult.ok) {
    const fairnessErrors = runAllFairnessChecks(lastResult.map);
    return {
      ok: false,
      errors: [`fairness checks failed after ${MAX_BOARD_ATTEMPTS} attempts: ${fairnessErrors.join("; ")}`],
    };
  }
  return {
    ok: false,
    errors: [`structural errors after ${MAX_BOARD_ATTEMPTS} attempts: ${lastResult.errors.join("; ")}`],
  };
}
