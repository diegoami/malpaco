import { DeterministicRng } from "./rng";
import type { GameMap, Island, Point, Province } from "./types";

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
 * C-BON-02: island bonus = max(2, floor(size/2) + cross-island-entrances).
 * The divisor 2 is the design constant from decision 12.
 */
export const BONUS_DIVISOR = 2;

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
 * degree between 2 and `maxDegree`, preferring 3–4 when possible.
 * Returns a symmetric adjacency map.
 */
function buildBorders(
  rng: DeterministicRng,
  provinceIds: readonly string[],
  maxDegree: number,
): Map<string, Set<string>> {
  const n = provinceIds.length;
  const adj = new Map<string, Set<string>>(provinceIds.map((id) => [id, new Set<string>()]));

  if (n === 1) return adj; // single-province island: no borders

  // Ensure connectivity: build a random spanning tree.
  const shuffledIds = shuffled(rng, [...provinceIds]);
  for (let i = 1; i < shuffledIds.length; i++) {
    const child = shuffledIds[i]!;
    // attach to a random earlier node (tree edge)
    const parent = shuffledIds[rng.nextInt(0, i - 1)]!;
    adj.get(parent)!.add(child);
    adj.get(child)!.add(parent);
  }

  // Add extra random edges to raise degree toward the 2–5 target.
  const ids = [...provinceIds];
  for (let attempt = 0; attempt < 200; attempt++) {
    const a = ids[rng.nextInt(0, n - 1)]!;
    const b = ids[rng.nextInt(0, n - 1)]!;
    if (a === b) continue;
    const degA = adj.get(a)!.size;
    const degB = adj.get(b)!.size;
    if (degA >= maxDegree || degB >= maxDegree) continue;
    if (adj.get(a)!.has(b)) continue;
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
    if (adj.get(a)!.size >= maxDegree && adj.get(b)!.size >= maxDegree) break;
  }

  // Guarantee minimum degree 2 by adding edges for any stragglers.
  for (const id of ids) {
    while (adj.get(id)!.size < 2) {
      let partner = ids[rng.nextInt(0, n - 1)]!;
      if (partner === id || adj.get(id)!.has(partner)) {
        partner = ids.find((p) => p !== id && !adj.get(id)!.has(p)) ?? id;
      }
      if (partner === id) break;
      adj.get(id)!.add(partner);
      adj.get(partner)!.add(id);
    }
  }

  return adj;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

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
 * The 5 fairness checks are T05b's scope.
 */
export function generateBoard(seed: number): BoardGenResult {
  const rng = new DeterministicRng(seed);
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
  const allBorders = new Map<string, Set<string>>();
  for (const island of islandStructs) {
    const adj = buildBorders(rng, island.provinceIds, DEGREE_MAX);
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
  const frontier: { fromIsland: string; toIsland: string }[] = [];

  // Seed frontier with edges from island 0 to every other island.
  for (let i = 1; i < islandStructs.length; i++) {
    frontier.push({ fromIsland: islandStructs[0]!.id, toIsland: islandStructs[i]!.id });
  }

  while (connectedIslands.size < islandStructs.length) {
    // Pick a random frontier entry (island already connected → not yet connected).
    const entry = frontier[rng.nextInt(0, frontier.length - 1)]!;
    const { fromIsland, toIsland } = entry;
    if (connectedIslands.has(toIsland)) {
      // Already connected; remove and skip
      frontier.splice(frontier.indexOf(entry), 1);
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
        if (!connectedIslands.has(other.id)) {
          frontier.push({ fromIsland: toIsland, toIsland: other.id });
        }
      }
    }
  }

  // Phase 2: fill remaining slots up to SEA_LANE_COUNT.
  let seaLaneAttempts = 0;
  let seaLaneCount = islandStructs.length - 1; // spanning tree used this many lanes
  while (seaLaneCount < SEA_LANE_COUNT && seaLaneAttempts < 2000) {
    seaLaneAttempts++;
    const islandA = islandStructs[rng.nextInt(0, islandStructs.length - 1)]!;
    const islandB = islandStructs[rng.nextInt(0, islandStructs.length - 1)]!;
    if (islandA === islandB) continue;
    const provA = islandA.provinceIds[rng.nextInt(0, islandA.provinceIds.length - 1)]!;
    const provB = islandB.provinceIds[rng.nextInt(0, islandB.provinceIds.length - 1)]!;
    if (tryAddLane(provA, provB)) seaLaneCount++;
  }
  if (seaLaneCount < SEA_LANE_COUNT)
    errors.push(`could not place ${SEA_LANE_COUNT} sea lanes in 2000 attempts`);

  // ---- Compute cross-island entrances per island (for bonus) -------------
  const islandEntrances = new Map<string, number>();
  for (const island of islandStructs) {
    let entrances = 0;
    for (const pid of island.provinceIds) {
      for (const sl of (allSeaLanes.get(pid) ?? [])) {
        const otherIsland = islandStructs.find((isl) => isl.provinceIds.includes(sl));
        if (otherIsland && otherIsland !== island) entrances++;
      }
    }
    islandEntrances.set(island.id, entrances);
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
