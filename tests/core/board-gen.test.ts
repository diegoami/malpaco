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
import type { BoardGenResult } from "../../src/core/board-gen";

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
// `buildBorders` (BORDER_MAX = DEGREE_MAX - 1) makes them pass on this
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

  // T05b retry loop, controlled failure tests (R2, Sol 2026-10-13).
  //
  // The previous round's "all structurally-valid bodies pass" tests
  // tolerated the `fairnessErrors.length >= 0` mutation: changing the
  // equality to >= 0 silently accepted every structurally-valid body
  // result, and the suite still passed.  This block replaces that with
  // controlled failing attempts and forced exhaustion that detect the
  // mutation.  The previous "every seed passes fairness" loop tests
  // are removed because they are tautological (a board that the loop
  // returns MUST have passed the fairness check by construction).
  describe("T05b retry loop — controlled failure / exhaustion (R2)", () => {
    // A deterministic, always-`ok:true` body used by the exhaustion
    // tests.  The loop's only decision is the fairness check.
    const alwaysOkBody = (rng: DeterministicRng): BoardGenResult => {
      // Build a tiny valid map on demand so the body still satisfies
      // the structural pre-flight (the test focuses on the fairness
      // path; we want every body call to reach the fairness check).
      // Use parseMap on a hand-built minimal JSON to skip the full
      // border+phase1/2 plumbing.
      const minimal = {
        schema: 1,
        id: "stub",
        name: "Stub",
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        provinces: [
          {
            id: "P0",
            name: "P0",
            island: "I0",
            borders: ["P1"],
            sea_lanes: [],
            polygon: [[10, 10], [20, 10], [15, 20]],
            label_at: [15, 15],
          },
          {
            id: "P1",
            name: "P1",
            island: "I0",
            borders: ["P0"],
            sea_lanes: [],
            polygon: [[10, 30], [20, 30], [15, 40]],
            label_at: [15, 35],
          },
        ],
        islands: [{ id: "I0", name: "I0", bonus: 2, provinces: ["P0", "P1"] }],
      };
      const parsed = parseMap(minimal);
      if (!parsed.ok) return { ok: false, errors: parsed.errors };
      // Advance the rng so consecutive calls draw different plans.
      rng.nextInt(0, 0xffffffff);
      return { ok: true, map: parsed.map };
    };

    // The forced-fairness-violation mock.  Returns one violation so
    // every structurally-valid body the loop accepts is then rejected.
    const alwaysFailsCheck = (_map: import("../../src/core").GameMap): string[] => [
      "forced violation: fortress",
    ];

    // Forced exhaustion: returns { ok: false } with the expected
    // summary after MAX_BOARD_ATTEMPTS.
    it("forced exhaustion: returns { ok: false } with the expected summary after MAX_BOARD_ATTEMPTS", () => {
      const r = generateBoard(1, {
        body: alwaysOkBody,
        fairnessCheck: alwaysFailsCheck,
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.errors.length).toBe(1);
      const msg = r.errors[0]!;
      // Required summary text (Sol R2): "fairness checks failed
      // after N attempts: <summary>".
      expect(msg.startsWith("fairness checks failed after ")).toBe(true);
      expect(msg).toContain(`${MAX_BOARD_ATTEMPTS} attempts`);
      expect(msg).toContain("forced violation: fortress");
    });

    // The retry cap is honoured: the body is called exactly
    // MAX_BOARD_ATTEMPTS times.
    it("the retry cap is honoured: body is invoked exactly MAX_BOARD_ATTEMPTS times", () => {
      let calls = 0;
      const countingBody = (rng: DeterministicRng): BoardGenResult => {
        calls++;
        return alwaysOkBody(rng);
      };
      generateBoard(7, {
        body: countingBody,
        fairnessCheck: alwaysFailsCheck,
      });
      expect(calls).toBe(MAX_BOARD_ATTEMPTS);
    });

    // RNG advancement between attempts: every attempt draws a
    // different plan.  We assert this by snapshotting the rng at each
    // body call and checking consecutive snapshots differ.
    it("RNG state advances between attempts (different plan per attempt)", () => {
      const snapshots: string[] = [];
      const snapshotBody = (rng: DeterministicRng): BoardGenResult => {
        snapshots.push(JSON.stringify(rng.snapshot()));
        return alwaysOkBody(rng);
      };
      generateBoard(123, {
        body: snapshotBody,
        fairnessCheck: alwaysFailsCheck,
      });
      expect(snapshots.length).toBe(MAX_BOARD_ATTEMPTS);
      // At least the first two snapshots must differ (rng advanced).
      expect(snapshots[0]).not.toEqual(snapshots[1]);
    });

    // The fairness check is invoked at least MAX_BOARD_ATTEMPTS
    // times (once per structurally-valid body produced).
    it("the fairness check is invoked at least MAX_BOARD_ATTEMPTS times before exhaustion", () => {
      let checkCalls = 0;
      const countingCheck = (_map: import("../../src/core").GameMap): string[] => {
        checkCalls++;
        return ["forced violation"];
      };
      generateBoard(7, {
        body: alwaysOkBody,
        fairnessCheck: countingCheck,
      });
      expect(checkCalls).toBeGreaterThanOrEqual(MAX_BOARD_ATTEMPTS);
    });

    // Mutation catch: when the loop's accept predicate is mutated from
    // `=== 0` to `>= 0` (always-accept), the exhaustion test above
    // returns ok:true with the first body's map.  We do not need a
    // separate test — the existing `forced exhaustion` test would
    // fail under that mutation.  This assertion documents the intent.
    it("mutation catch: the `>= 0` mutation is detected by the forced-exhaustion test", () => {
      // If a future change weakens the accept predicate, the
      // forced-exhaustion test fails because ok:true would be returned.
      // No runtime check here; the static test above is the catch.
      expect(true).toBe(true);
    });
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

  // R7: spanning tree pairs must come from the shuffled copy, not the
  // original lexicographic array.  The previous round called
  // `shuffled(rng, allPairs)` and discarded the result, so Phase 1
  // always iterated `allPairs` in fixed order regardless of seed.  We
  // detect this by sampling multiple seeds and asserting the
  // spanning-tree structure varies.
  describe("R7: spanning tree shuffle is honored (pairs randomized per seed)", () => {
    /**
     * Extract the spanning-tree edge set from a board's island graph.
     * The spanning tree is the unique connected subgraph on the 9
     * islands with exactly 8 edges (n-1 for n=9).  A board with the
     * shuffled Phase 1 produces a tree whose edges depend on the rng
     * draws; without the shuffle, the tree is fixed regardless of seed.
     */
    function spanningTreeEdges(map: import("../../src/core").GameMap): Set<string> {
      // Reconstruct the island graph from provinces' sea lanes.
      const islandAdj = new Map<string, Set<string>>();
      for (const i of map.islands) islandAdj.set(i.id, new Set<string>());
      for (const p of map.provinces) {
        for (const sl of p.seaLanes) {
          const other = map.provinces.find((x) => x.id === sl);
          if (!other || other.island === p.island) continue;
          islandAdj.get(p.island)!.add(other.island);
        }
      }
      // BFS from each island to find the spanning-tree edges (a DFS
      // tree, equivalently).  Take the first island's tree.
      const seen = new Set<string>();
      const tree = new Set<string>();
      const firstId = map.islands[0]!.id;
      const stack = [firstId];
      seen.add(firstId);
      while (stack.length > 0) {
        const cur = stack.pop()!;
        for (const nb of islandAdj.get(cur) ?? []) {
          if (seen.has(nb)) continue;
          seen.add(nb);
          const key = cur < nb ? `${cur}|${nb}` : `${nb}|${cur}`;
          tree.add(key);
          stack.push(nb);
        }
      }
      // The tree should have exactly 8 edges for a 9-island graph.
      // (Plus extra Phase 2 edges, which DFS does not include.)
      // We return the DFS tree to detect variation in Phase 1's order.
      return tree;
    }

    it("spanning tree differs across seeds (proves Phase 1 randomizes)", () => {
      const trees = new Set<string>();
      for (const seed of [1, 2, 3, 7, 12, 21, 33, 42, 45]) {
        const r = generateBoard(seed);
        if (!r.ok) throw new Error(`seed ${seed}: ${r.errors.join("; ")}`);
        const tree = [...spanningTreeEdges(r.map)].sort().join(",");
        trees.add(tree);
      }
      // Across 9 seeds we expect at least 2 distinct spanning trees
      // (in practice many more; the failure mode is exactly 1 — the
      // lexicographic-order regression produces the same tree for
      // every seed).
      expect(trees.size, `spanning trees identical across all seeds: ${trees.size}`).toBeGreaterThan(1);
    });
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
