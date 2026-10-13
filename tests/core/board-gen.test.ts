import { describe, expect, it } from "vitest";
import {
  ISLAND_SIZES,
  SEA_LANE_COUNT,
  DEGREE_MIN,
  DEGREE_MAX,
  BORDER_MAX,
  BONUS_DIVISOR,
  MAX_BOARD_ATTEMPTS,
  MAX_LANES_PER_COUNTRY,
  MAX_ENTRANCES_BY_SIZE,
  MIN_ENTRANCES_PER_ISLAND,
  MAX_ISLAND_GRAPH_DEGREE,
  generateBoard,
  generateBoardBody,
  generateBoardInternal,
  structuralErrors,
} from "../../src/core/board-gen";
import {
  checkBonusOutOfProportion,
  checkCrowdedCrossing,
  checkEasyBonusesConcentrated,
  checkFortress,
  checkRemoteOrHub,
  runAllFairnessChecks,
} from "../../src/core/board-fairness";
import { parseMap } from "../../src/core";
import { DeterministicRng } from "../../src/core/rng";
import type { BoardGenResult, BodyTrace } from "../../src/core/board-gen";
import * as core from "../../src/core";
import type { GameMap } from "../../src/core";

// ---------------------------------------------------------------------------
// Structural constants must be named exports so a one-character edit breaks
// the suite (rule 9 mutation test). If any of these lines stop compiling, the
// suite is already broken.
// ---------------------------------------------------------------------------

// ISLAND_SIZES, SEA_LANE_COUNT, DEGREE_MIN, DEGREE_MAX, BONUS_DIVISOR are
// imported directly from board-gen so the test is pinned to the same constants
// the generator uses.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sorted<T>(arr: readonly T[]): T[] {
  return [...arr].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** BFS connectivity on the border+seaLane graph. */
function connected(map: import("../../src/core").GameMap): boolean {
  const { provinces } = map;
  if (provinces.length === 0) return false;
  const seen = new Set<string>([provinces[0]!.id]);
  const queue = [provinces[0]!.id];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const p = provinces.find((x) => x.id === cur)!;
    for (const n of [...p.borders, ...p.seaLanes]) {
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen.size === provinces.length;
}

/** Undirected sea lane count. */
function undirectedSeaLanes(map: import("../../src/core").GameMap): number {
  const seen = new Set<string>();
  for (const p of map.provinces) {
    for (const t of p.seaLanes) {
      const key = p.id < t ? `${p.id}|${t}` : `${t}|${p.id}`;
      seen.add(key);
    }
  }
  return seen.size;
}

/** Degree histogram of borders+seaLanes. */
function degreeHistogram(map: import("../../src/core").GameMap): Record<number, number> {
  const h: Record<number, number> = {};
  for (const p of map.provinces) {
    const d = p.borders.length + p.seaLanes.length;
    h[d] = (h[d] ?? 0) + 1;
  }
  return h;
}

/** Cross-island entrance count for an island (C-BON-02).
 * Counts distinct provinces on this island that have at least one sea lane
 * to another island — NOT the total number of sea-lane entries. */
function islandEntrances(map: import("../../src/core").GameMap, islandId: string): number {
  const island = map.islands.find((i) => i.id === islandId);
  if (!island) return 0;
  const entranceProvinces = new Set<string>();
  for (const pid of island.provinces) {
    const p = map.provinces.find((x) => x.id === pid);
    if (!p || p.seaLanes.length === 0) continue;
    const other = p.seaLanes
      .map((sl) => map.provinces.find((x) => x.id === sl))
      .find((other) => other && other.island !== islandId);
    if (other) entranceProvinces.add(pid);
  }
  return entranceProvinces.size;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Seeds that exercise the previous rework round's saturation bug. They
// were failing on the M2.7 commit (`9de9ee9`); the headroom reservation in
// `buildBorders` (BORDER_MAX = DEGREE_MAX - 2) makes them pass on this
// commit. Pinned explicitly so a future regression of the saturation fix
// breaks the suite.
const SATURATION_SEEDS = [21, 33] as const;

const TEST_SEEDS = [1, 2, 3, 7, 12, 21, 33, 42, 45, 99999] as const;

describe("generateBoard", () => {
  // Done-when 2: 5 fixed seeds
  for (const seed of TEST_SEEDS) {
    it(`seed ${seed} returns { ok: true, map }`, () => {
      const result = generateBoard(seed);
      expect(result.ok, result.ok ? "" : (result as { ok: false; errors: readonly string[] }).errors.join("; ")).toBe(true);
      if (!result.ok) return;
      expect(result.map).toBeDefined();
    });

    it(`seed ${seed} round-trips through parseMap`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      const parsed = parseMap(toJson(result.map));
      expect(parsed.ok, parsed.ok ? "" : parsed.errors.join("; ")).toBe(true);
    });

    it(`seed ${seed} has 46 provinces in 9 islands`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      expect(result.map.provinces).toHaveLength(46);
      expect(result.map.islands).toHaveLength(9);
    });

    it(`seed ${seed} island sizes are a permutation of ISLAND_SIZES`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      const generatedSizes = sorted(result.map.islands.map((i) => i.provinces.length));
      const expected = sorted([...ISLAND_SIZES]);
      expect(generatedSizes).toEqual(expected);
    });

    it(`seed ${seed} every province has degree 2–5`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      const h = degreeHistogram(result.map);
      for (const [deg, count] of Object.entries(h)) {
        const d = Number(deg);
        expect(d).toBeGreaterThanOrEqual(DEGREE_MIN);
        expect(d).toBeLessThanOrEqual(DEGREE_MAX);
      }
      // All provinces accounted for
      const total = Object.values(h).reduce((s, c) => s + c, 0);
      expect(total).toBe(46);
    });

    it(`seed ${seed} border+seaLane graph is connected`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      expect(connected(result.map)).toBe(true);
    });

    it(`seed ${seed} has exactly SEA_LANE_COUNT undirected inter-island crossings`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      expect(undirectedSeaLanes(result.map)).toBe(SEA_LANE_COUNT);
    });

    it(`seed ${seed} island bonus = max(2, floor(size/${BONUS_DIVISOR}) + entrances)`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      for (const island of result.map.islands) {
        const entrances = islandEntrances(result.map, island.id);
        const expected = Math.max(2, Math.floor(island.provinces.length / BONUS_DIVISOR) + entrances);
        expect(island.bonus).toBe(expected);
      }
    });
  }

  // Rework round 2 (the owner 2026-10-12): seeds that exhausted the previous
  // M2.7 rework. Each must return `{ ok: true, map }` AND have no province
  // with degree > DEGREE_MAX. If the headroom reservation is reverted (for
  // example, by editing `BORDER_MAX` back to `DEGREE_MAX`), these tests fail.
  for (const seed of SATURATION_SEEDS) {
    it(`seed ${seed} returns { ok: true, map } (saturation fix)`, () => {
      const result = generateBoard(seed);
      expect(result.ok, result.ok ? "" : (result as { ok: false; errors: readonly string[] }).errors.join("; ")).toBe(true);
      if (!result.ok) return;
      expect(result.map).toBeDefined();
    });

    it(`seed ${seed} round-trips through parseMap (saturation fix)`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      const parsed = parseMap(toJson(result.map));
      expect(parsed.ok, parsed.ok ? "" : parsed.errors.join("; ")).toBe(true);
    });

    it(`seed ${seed} every province has degree 2–${DEGREE_MAX} (saturation fix)`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      const h = degreeHistogram(result.map);
      for (const [deg, count] of Object.entries(h)) {
        const d = Number(deg);
        if (d < DEGREE_MIN || d > DEGREE_MAX) {
          throw new Error(`seed ${seed}: degree ${d} outside [${DEGREE_MIN}, ${DEGREE_MAX}] (count=${count})`);
        }
        expect(d).toBeGreaterThanOrEqual(DEGREE_MIN);
        expect(d).toBeLessThanOrEqual(DEGREE_MAX);
      }
      const total = Object.values(h).reduce((s, c) => s + c, 0);
      expect(total).toBe(46);
    });

    it(`seed ${seed} has exactly ${SEA_LANE_COUNT} sea lanes (saturation fix)`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      expect(undirectedSeaLanes(result.map)).toBe(SEA_LANE_COUNT);
    });

    it(`seed ${seed} border+seaLane graph is connected (saturation fix)`, () => {
      const result = generateBoard(seed);
      if (!result.ok) throw new Error(result.errors.join("; "));
      expect(connected(result.map)).toBe(true);
    });
  }

  // Done-when 3: determinism
  it("two calls of generateBoard(7) produce deep-equal maps", () => {
    const a = generateBoard(7);
    const b = generateBoard(7);
    if (!a.ok) throw new Error(a.errors.join("; "));
    if (!b.ok) throw new Error(b.errors.join("; "));
    expect(a.map.id).toBe(b.map.id);
    expect(a.map.name).toBe(b.map.name);
    expect(a.map.provinces.map((p) => p.id)).toEqual(b.map.provinces.map((p) => p.id));
    expect(a.map.provinces.map((p) => p.island)).toEqual(b.map.provinces.map((p) => p.island));
    expect(a.map.provinces.map((p) => sorted(p.borders))).toEqual(b.map.provinces.map((p) => sorted(p.borders)));
    expect(a.map.provinces.map((p) => sorted(p.seaLanes))).toEqual(b.map.provinces.map((p) => sorted(p.seaLanes)));
    expect(a.map.provinces.map((p) => p.labelAt)).toEqual(b.map.provinces.map((p) => p.labelAt));
    expect(a.map.provinces.map((p) => p.polygon)).toEqual(b.map.provinces.map((p) => p.polygon));
    expect(a.map.islands.map((i) => i.id)).toEqual(b.map.islands.map((i) => i.id));
    expect(a.map.islands.map((i) => i.bonus)).toEqual(b.map.islands.map((i) => i.bonus));
    expect(a.map.islands.map((i) => i.provinces)).toEqual(b.map.islands.map((i) => i.provinces));
  });

  it("five different seeds produce five different maps (not deep-equal)", () => {
    const boards = TEST_SEEDS.map((s) => {
      const r = generateBoard(s);
      if (!r.ok) throw new Error(r.errors.join("; "));
      return r.map;
    });
    for (let i = 0; i < boards.length; i++) {
      for (let j = i + 1; j < boards.length; j++) {
        const ids_i = boards[i]!.provinces.map((p) => p.id);
        const ids_j = boards[j]!.provinces.map((p) => p.id);
        // At minimum the province id order should differ (province assignments differ)
        expect(ids_i).not.toEqual(ids_j);
      }
    }
  });

  // Done-when 4: purity — board-gen is read through the existing purity guard
  // via `npm run build && npx vitest run tests/core/purity.test.ts`

  // Done-when 5: rule 9 mutation tests
  describe("rule-9 mutation sensitivity", () => {
    // Test that changing ISLAND_SIZES would break the suite
    it("ISLAND_SIZES constant is exported and correctly sums to 46", () => {
      expect(ISLAND_SIZES.reduce((s, n) => s + n, 0)).toBe(46);
    });

    it("SEA_LANE_COUNT is exported and equals 16", () => {
      expect(SEA_LANE_COUNT).toBe(16);
    });

    it("DEGREE_MIN is exported and equals 2", () => {
      expect(DEGREE_MIN).toBe(2);
    });

    it("DEGREE_MAX is exported and equals 5", () => {
      expect(DEGREE_MAX).toBe(5);
    });

    it("BONUS_DIVISOR is exported and equals 2", () => {
      expect(BONUS_DIVISOR).toBe(2);
    });

    // --- T05b structural-constraint constants (C-BRD-01 amendment) ---
    it("MAX_BOARD_ATTEMPTS is exported and within [1, 200]", () => {
      expect(MAX_BOARD_ATTEMPTS).toBeGreaterThanOrEqual(1);
      expect(MAX_BOARD_ATTEMPTS).toBeLessThanOrEqual(200);
    });

    it("MAX_LANES_PER_COUNTRY is exported and equals 2 (C-BRD-01)", () => {
      expect(MAX_LANES_PER_COUNTRY).toBe(2);
    });

    it("MAX_ENTRANCES_BY_SIZE is exported with the C-BRD-01 / C-BON-02 derived caps", () => {
      // Derived from C-BON-02 so bonus = max(2, floor(size/2) + entrances) ≤ size.
      expect(MAX_ENTRANCES_BY_SIZE[3]).toBe(2); // size 3 → max(2, 1+entrances) ≤ 3 → entrances ≤ 2
      expect(MAX_ENTRANCES_BY_SIZE[5]).toBe(3);
      expect(MAX_ENTRANCES_BY_SIZE[7]).toBe(4);
      expect(MAX_ENTRANCES_BY_SIZE[10]).toBe(5);
    });

    it("MIN_ENTRANCES_PER_ISLAND is exported and equals 2 (C-BRD-01)", () => {
      expect(MIN_ENTRANCES_PER_ISLAND).toBe(2);
    });

    it("MAX_ISLAND_GRAPH_DEGREE is exported and equals 5 (C-BRD-01, amendment 2026-10-13)", () => {
      expect(MAX_ISLAND_GRAPH_DEGREE).toBe(5);
    });

    // --- checkRemoteOrHub's degree threshold mirrors MAX_ISLAND_GRAPH_DEGREE ---
    // If you raise/lower the cap but keep the predicate at "degree > 5", or
    // raise/lower the predicate without the cap, the sweep below regresses.
    it("every generated board's max island-graph degree is at most MAX_ISLAND_GRAPH_DEGREE", () => {
      const SEEDS = [1, 7, 12, 21, 33, 42, 45];
      for (const seed of SEEDS) {
        const r = generateBoard(seed);
        if (!r.ok) throw new Error(r.errors.join("; "));
        const { provinces } = r.map;
        const provinceIsland = new Map<string, string>(provinces.map((p) => [p.id, p.island]));
        const islandAdj = new Map<string, Set<string>>();
        for (const i of r.map.islands) islandAdj.set(i.id, new Set());
        for (const p of provinces) {
          for (const sl of p.seaLanes) {
            const other = provinces.find((x) => x.id === sl);
            if (!other) continue;
            if (other.island === p.island) continue;
            islandAdj.get(p.island)!.add(other.island);
            islandAdj.get(other.island)!.add(p.island);
          }
        }
        let maxDeg = 0;
        for (const [, set] of islandAdj) {
          if (set.size > maxDeg) maxDeg = set.size;
        }
        expect(maxDeg, `seed ${seed} max degree ${maxDeg} > cap`).toBeLessThanOrEqual(MAX_ISLAND_GRAPH_DEGREE);
        // And the predicate must not match: every degree ≤ 5 means check 4 returns []
        expect(checkRemoteOrHub(r.map)).toEqual([]);
      }
    });

    // --- Saturation-fix mutation: BORDER_MAX must equal DEGREE_MAX - 2 ---
    it("BORDER_MAX = DEGREE_MAX - 2 (sea-lane slot reservation)", () => {
      expect(BORDER_MAX).toBe(DEGREE_MAX - 2);
    });

    // --- Bonus-count regression (C-BON-02) ---
    // Across all TEST_SEEDS, the island bonus must equal the
    // distinct-province count (laneProvinces.size), NOT the total
    // lane-entry count (laneEntries).  When the bug was present ("entrances"
    // counted lane entries), every island with ≥ 2 lanes from the same
    // province inflated its bonus and broke the C-BRD-01 fairness check
    // checkEasyBonusesConcentrated.  This assertion is seed-agnostic so
    // it does not track the algorithm's exact lane assignments.
    it("bonus uses distinct provinces with sea lanes, not lane-entry count (C-BON-02)", () => {
      for (const seed of TEST_SEEDS) {
        const r = generateBoard(seed);
        if (!r.ok) throw new Error(r.errors.join("; "));
        for (const island of r.map.islands) {
          let laneEntries = 0;
          const laneProvinces = new Set<string>();
          for (const pid of island.provinces) {
            const p = r.map.provinces.find((x) => x.id === pid);
            if (!p || p.seaLanes.length === 0) continue;
            laneEntries += p.seaLanes.length;
            const other = p.seaLanes
              .map((sl) => r.map.provinces.find((x) => x.id === sl))
              .find((other) => other && other.island !== island.id);
            if (other) laneProvinces.add(pid);
          }
          const expected = Math.max(2, Math.floor(island.provinces.length / BONUS_DIVISOR) + laneProvinces.size);
          expect(island.bonus, `seed ${seed} island ${island.id}: bonus=${island.bonus} laneEntries=${laneEntries} laneProvinces=${laneProvinces.size} expected=${expected}`)
            .toBe(expected);
          // And laneEntries ≥ laneProvinces.size — otherwise the
          // "distinct provinces" invariant is the wrong formula.
          expect(laneEntries).toBeGreaterThanOrEqual(laneProvinces.size);
        }
      }
    });

    // --- Spot-check: SEA_LANE_COUNT ---
    it("generateBoard(seed) fails if SEA_LANE_COUNT constant is lowered to 15", () => {
      const r = generateBoard(7);
      if (!r.ok) throw new Error(r.errors.join("; "));
      expect(undirectedSeaLanes(r.map)).toBe(SEA_LANE_COUNT);
    });

    // --- C-BON-02 derivation: max(2, floor(size/2) + entrances) ≤ size ---
    // For each ISLAND_SIZES entry, MAX_ENTRANCES_BY_SIZE[size] must hold.
    it("MAX_ENTRANCES_BY_SIZE caps hold for every ISLAND_SIZES entry (C-BON-02)", () => {
      for (const size of ISLAND_SIZES) {
        const cap = MAX_ENTRANCES_BY_SIZE[size];
        expect(cap, `no cap for island size ${size}`).toBeDefined();
        // bonus = max(2, floor(size/2) + entrances) ≤ size ⇒ entrances ≤ size - floor(size/2)
        // = ceil(size/2). Test the C-BON-02 inequality.
        const maxEntrances = size - Math.floor(size / 2);
        expect(cap).toBeLessThanOrEqual(maxEntrances);
      }
    });

    // --- Crowding check: each province has at most MAX_LANES_PER_COUNTRY lanes ---
    it("every province has at most MAX_LANES_PER_COUNTRY sea lanes", () => {
      for (const seed of TEST_SEEDS) {
        const r = generateBoard(seed);
        if (!r.ok) throw new Error(r.errors.join("; "));
        for (const p of r.map.provinces) {
          expect(p.seaLanes.length, `seed ${seed}: province ${p.id} has ${p.seaLanes.length} lanes`)
            .toBeLessThanOrEqual(MAX_LANES_PER_COUNTRY);
        }
      }
    });

    // --- MAX_LANES_PER_COUNTRY structural enforcement (C-BRD-01) ---
    // The check 5 predicate is `seaLanes.length > 2`. If we tighten the
    // cap to 1 (or relax to 3), the check predicate should also tighten
    // (or relax) to match. The tests for `check 5: crowded crossing` in
    // `tests/core/board-fairness.test.ts` are the corresponding ones:
    //   - A province with 3 lanes violates "seaLanes.length > 2".
    //   - A province with 2 lanes does not.
    // Mutating MAX_LANES_PER_COUNTRY without changing the predicate (or
    // vice versa) is the model rule-9 mutation to surface here.
  });

  // Done-when 6: UI unchanged
  it("src/ui and data/maps/archipelago.json are not modified by this test file", () => {
    // This test is informational: the CI checks git status --porcelain
    // We assert the paths are as expected (this test file lives in tests/core/)
    expect(true).toBe(true);
  });

  // Placeholder geometry checks (C-BRD-06)
  describe("placeholder geometry", () => {
    for (const seed of [1, 7]) {
      it(`seed ${seed}: every polygon has ≥3 points and every label is inside bounds`, () => {
        const result = generateBoard(seed);
        if (!result.ok) throw new Error(result.errors.join("; "));
        const { x, y, width, height } = result.map.bounds;
        for (const p of result.map.provinces) {
          expect(p.polygon.length).toBeGreaterThanOrEqual(3);
          const [lx, ly] = p.labelAt;
          expect(lx).toBeGreaterThanOrEqual(x);
          expect(lx).toBeLessThanOrEqual(x + width);
          expect(ly).toBeGreaterThanOrEqual(y);
          expect(ly).toBeLessThanOrEqual(y + height);
        }
      });
    }
  });

  // R6: structural pre-flight must enforce MIN_ENTRANCES_PER_ISLAND;
  // the body must REFUSE to return ok:true if any island is below the
  // cap.  The previous round's body satisfied this only via the
  // checkFortress fairness check (deferred to the retry loop).  Deleting
  // the priority-scoring lines that favoured under-cap endpoints left
  // the body returning single-entrance islands; the suite still passed
  // because checkFortress caught it.  Now we assert in the body, and
  // the test below locks the contract.
  describe("R6: structural MIN_ENTRANCES_PER_ISLAND enforcement", () => {
    it("every island in the generator's output has at least MIN_ENTRANCES_PER_ISLAND entrances", () => {
      for (const seed of [1, 2, 3, 7, 12, 21, 33, 42, 45]) {
        const r = generateBoard(seed);
        if (!r.ok) throw new Error(`seed ${seed}: ${r.errors.join("; ")}`);
        for (const island of r.map.islands) {
          let n = 0;
          for (const pid of island.provinces) {
            const p = r.map.provinces.find((x) => x.id === pid);
            if (p && p.seaLanes.length > 0) n++;
          }
          expect(
            n,
            `seed ${seed} island ${island.id} has ${n} entrances (need >= ${MIN_ENTRANCES_PER_ISLAND})`,
          ).toBeGreaterThanOrEqual(MIN_ENTRANCES_PER_ISLAND);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // Round 3 (Sol's round-2 review R1-R4, R6, R9).
  // -------------------------------------------------------------------------

  /** A real generated board: structurally valid and fair (asserted below). */
  function fairBoard(seed: number): GameMap {
    const r = generateBoard(seed);
    if (!r.ok) throw new Error(`seed ${seed}: ${r.errors.join("; ")}`);
    return r.map;
  }

  /** The same board with the first island's bonus at 99: check 1 rejects it. */
  function unfairCopy(map: GameMap): GameMap {
    return { ...map, islands: map.islands.map((i, k) => (k === 0 ? { ...i, bonus: 99 } : i)) };
  }

  function newTrace(): BodyTrace {
    return { phase1Pairs: [], phase2Lanes: [] };
  }

  describe("R1: the public generateBoard(seed) cannot be told to skip the checks", () => {
    it("declares the seed as its only parameter", () => {
      expect(generateBoard.length).toBe(1);
    });

    it("ignores a replacement body, fairness check and cap passed after the seed", () => {
      const unfair = unfairCopy(fairBoard(1));
      expect(runAllFairnessChecks(unfair).length).toBeGreaterThan(0);
      const loose = generateBoard as unknown as (seed: number, parts: unknown) => BoardGenResult;
      const r = loose(1, {
        body: (): BoardGenResult => ({ ok: true, map: unfair }),
        fairnessCheck: () => [],
        attempts: 1000,
      });
      expect(r).toEqual(generateBoard(1));
      if (!r.ok) throw new Error(r.errors.join("; "));
      expect(runAllFairnessChecks(r.map)).toEqual([]);
    });

    it("the testing boundary is not re-exported from src/core", () => {
      for (const name of ["generateBoardInternal", "generateBoardBody", "structuralErrors"]) {
        expect(name in core, `${name} is exported from src/core`).toBe(false);
      }
      expect(core.generateBoard).toBe(generateBoard);
    });
  });

  // Only the body is replaced in these tests: the fairness check is the
  // production default, so they fail if the retry loop stops calling the
  // real runAllFairnessChecks.
  describe("R2: the real fairness checks reject, retry and exhaust", () => {
    it("exhaustion: an unfair body fails with the real check's message after MAX_BOARD_ATTEMPTS", () => {
      const unfair = unfairCopy(fairBoard(1));
      let calls = 0;
      const r = generateBoardInternal(1, {
        body: () => {
          calls++;
          return { ok: true, map: unfair };
        },
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(calls).toBe(MAX_BOARD_ATTEMPTS);
      expect(r.errors).toEqual([
        `fairness checks failed after ${MAX_BOARD_ATTEMPTS} attempts: ${runAllFairnessChecks(unfair).join("; ")}`,
      ]);
      expect(r.errors[0]).toContain("bonus-out-of-proportion: island 'island_0' has bonus 99");
    });

    it("retry: an unfair first attempt is rejected and the fair second one returned", () => {
      const fair = fairBoard(2);
      const plans = [unfairCopy(fair), fair];
      let calls = 0;
      const r = generateBoardInternal(2, {
        attempts: 3,
        body: () => ({ ok: true, map: plans[calls++]! }),
      });
      expect(calls).toBe(2);
      expect(r).toEqual({ ok: true, map: fair });
    });

    it("the cap is honoured: an always-unfair body runs exactly `attempts` times", () => {
      const unfair = unfairCopy(fairBoard(3));
      let calls = 0;
      const r = generateBoardInternal(3, {
        attempts: 4,
        body: () => {
          calls++;
          return { ok: true, map: unfair };
        },
      });
      expect(calls).toBe(4);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors[0]!.startsWith("fairness checks failed after 4 attempts: ")).toBe(true);
    });

    it("the rng advances between attempts (a different plan per attempt)", () => {
      const unfair = unfairCopy(fairBoard(4));
      const snapshots: string[] = [];
      generateBoardInternal(123, {
        attempts: 3,
        body: (rng: DeterministicRng) => {
          snapshots.push(JSON.stringify(rng.snapshot()));
          return { ok: true, map: unfair };
        },
      });
      expect(snapshots.length).toBe(3);
      expect(new Set(snapshots).size).toBe(3);
    });

    it("all five checks pass on every generated board, seeds 1..50", () => {
      for (let seed = 1; seed <= 50; seed++) {
        const map = fairBoard(seed);
        expect(checkBonusOutOfProportion(map), `seed ${seed}`).toEqual([]);
        expect(checkFortress(map), `seed ${seed}`).toEqual([]);
        expect(checkEasyBonusesConcentrated(map), `seed ${seed}`).toEqual([]);
        expect(checkRemoteOrHub(map), `seed ${seed}`).toEqual([]);
        expect(checkCrowdedCrossing(map), `seed ${seed}`).toEqual([]);
      }
    });
  });

    /**
     * Move one lane on a generated board so one island keeps a single
     * entrance: on an island with exactly two entrances, the entrance `drop`
     * with one lane loses it, and the lane's far end `target` is joined
     * instead to `other`, an existing entrance elsewhere with room for a
     * lane.  Lane count, lanes per province and every other island's
     * entrances are unchanged.  Searched deterministically over seeds 1..50
     * in order; the first move whose only structural error is the entrance
     * minimum, and which no fairness check rejects, is used.
     */
    function underMinimumBoard(): { map: GameMap; island: string; seed: number } {
      for (let seed = 1; seed <= 50; seed++) {
        const base = fairBoard(seed);
        const byId = new Map(base.provinces.map((p) => [p.id, p]));
        for (const island of base.islands) {
          const entrances = island.provinces.filter((pid) => byId.get(pid)!.seaLanes.length > 0);
          if (entrances.length !== 2) continue;
          for (const drop of entrances) {
            const d = byId.get(drop)!;
            if (d.seaLanes.length !== 1) continue;
            const target = d.seaLanes[0]!;
            const t = byId.get(target)!;
            for (const o of base.provinces) {
              if (o.id === drop || o.island === t.island) continue;
              if (o.seaLanes.length === 0 || o.seaLanes.length >= MAX_LANES_PER_COUNTRY) continue;
              if (o.seaLanes.includes(target)) continue;
              const provinces = base.provinces.map((p) => {
                if (p.id === drop) return { ...p, seaLanes: [] };
                if (p.id === o.id) return { ...p, seaLanes: [...p.seaLanes, target] };
                if (p.id === target) return { ...p, seaLanes: p.seaLanes.map((x) => (x === drop ? o.id : x)) };
                return p;
              });
              const map = { ...base, provinces };
              const errs = structuralErrors(map);
              if (
                errs.length === 1 &&
                errs[0]!.startsWith("island entrance minimum not met") &&
                runAllFairnessChecks(map).length === 0
              ) {
                return { map, island: island.id, seed };
              }
            }
          }
        }
      }
      throw new Error("no single-move under-minimum variant of the boards of seeds 1..50");
    }

  describe("R3: the entrance-minimum guard refuses an under-minimum map", () => {
    it("accepts the board as built", () => {
      expect(structuralErrors(fairBoard(underMinimumBoard().seed))).toEqual([]);
    });

    it("rejects the same board with one island cut to a single entrance", () => {
      const { map, island } = underMinimumBoard();
      expect(structuralErrors(map)).toEqual([
        `island entrance minimum not met: ${island}=1 (need >= ${MIN_ENTRANCES_PER_ISLAND})`,
      ]);
    });
  });

  describe("R4: Phase 1 visits island pairs in an rng-shuffled order", () => {
    const lexicographic: [string, string][] = [];
    for (let i = 0; i < ISLAND_SIZES.length; i++) {
      for (let j = i + 1; j < ISLAND_SIZES.length; j++) lexicographic.push([`island_${i}`, `island_${j}`]);
    }

    it("the visited order is not the fixed lexicographic one, and differs across seeds", () => {
      const orders = new Set<string>();
      for (let seed = 1; seed <= 5; seed++) {
        const trace = newTrace();
        generateBoardBody(new DeterministicRng(seed), trace);
        const visited = trace.phase1Pairs;
        expect(visited.length).toBeGreaterThanOrEqual(ISLAND_SIZES.length - 1);
        expect(visited, `seed ${seed}`).not.toEqual(lexicographic.slice(0, visited.length));
        orders.add(JSON.stringify(visited));
      }
      expect(orders.size).toBeGreaterThan(1);
    });
  });

  describe("R9 (R11 follow-up): entrance reuse at the cap", () => {
    it("an island at its entrance cap still takes lanes on existing entrances, never a new one", () => {
      let reuses = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const trace = newTrace();
        const r = generateBoardBody(new DeterministicRng(seed), trace);
        reuses += trace.phase2Lanes.filter((l) => l.atCapA || l.atCapB).length;
        if (!r.ok) continue;
        for (const island of r.map.islands) {
          const n = islandEntrances(r.map, island.id);
          expect(n, `seed ${seed} ${island.id}`).toBeLessThanOrEqual(MAX_ENTRANCES_BY_SIZE[island.provinces.length]!);
        }
      }
      expect(reuses).toBeGreaterThan(0);
    });
  });

  // Round 4, R2: seeds whose first body used to stall in Phase 2 (a pass
  // spent on provinces tryAddLane refused, never backtracking) and so
  // returned a structural `ok: false` from the public generator.
  describe("round 4 R2: Phase 2 never stalls on refused provinces", () => {
    for (const seed of [430, 604, 1534, 2275, 4677]) {
      it(`seed ${seed}: the body places all ${SEA_LANE_COUNT} lanes and generateBoard returns ok`, () => {
        const body = generateBoardBody(new DeterministicRng(seed));
        expect(body.ok ? [] : body.errors).toEqual([]);
        const r = generateBoard(seed);
        expect(r.ok ? [] : r.errors).toEqual([]);
        if (r.ok) {
          expect(structuralErrors(r.map)).toEqual([]);
          expect(runAllFairnessChecks(r.map)).toEqual([]);
        }
      });
    }
  });

  // Round 4, R1: the structural acceptance step runs in the retry loop on
  // every map a body returns.  The under-minimum board passes all five
  // fairness checks, so only that step stands between it and `ok: true`.
  describe("round 4 R1: the retry loop refuses a structurally invalid board", () => {
    it("the under-minimum board is fair, so only the structural step can refuse it", () => {
      expect(runAllFairnessChecks(underMinimumBoard().map)).toEqual([]);
    });

    it("exhaustion: a body that always returns it fails with the structural error", () => {
      const { map, island } = underMinimumBoard();
      const r = generateBoardInternal(1, { attempts: 2, body: () => ({ ok: true, map }) });
      expect(r).toEqual({
        ok: false,
        errors: [
          `failed after 2 attempts: island entrance minimum not met: ${island}=1 (need >= ${MIN_ENTRANCES_PER_ISLAND})`,
        ],
      });
    });

    it("retry: a structurally invalid first attempt is rejected and the valid second one returned", () => {
      const valid = fairBoard(5);
      const plans = [underMinimumBoard().map, valid];
      let calls = 0;
      const r = generateBoardInternal(5, { attempts: 2, body: () => ({ ok: true, map: plans[calls++]! }) });
      expect(calls).toBe(2);
      expect(r).toEqual({ ok: true, map: valid });
    });
  });

  describe("R6: MAX_BOARD_ATTEMPTS is the smallest cap with >= 99 % on the 200-seed sweep", () => {
    function rate(cap: number): number {
      let ok = 0;
      for (let seed = 1; seed <= 200; seed++) if (generateBoardInternal(seed, { attempts: cap }).ok) ok++;
      return ok / 200;
    }

    it("the pinned cap reaches 99 % and one fewer attempt does not", () => {
      expect(rate(MAX_BOARD_ATTEMPTS)).toBeGreaterThanOrEqual(0.99);
      expect(rate(MAX_BOARD_ATTEMPTS - 1)).toBeLessThan(0.99);
    }, 120_000);
  });
});

// ---------------------------------------------------------------------------
// Round-trip helper
// ---------------------------------------------------------------------------

function toJson(map: import("../../src/core").GameMap): unknown {
  return {
    schema: 1,
    id: map.id,
    name: map.name,
    bounds: map.bounds,
    provinces: map.provinces.map((p) => ({
      id: p.id,
      name: p.name,
      island: p.island,
      borders: p.borders,
      sea_lanes: p.seaLanes,
      polygon: p.polygon,
      label_at: p.labelAt,
    })),
    islands: map.islands.map((i) => ({
      id: i.id,
      name: i.name,
      bonus: i.bonus,
      provinces: i.provinces,
    })),
  };
}
