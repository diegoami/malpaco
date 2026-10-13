/**
 * Board-fairness synthetic-map tests.
 *
 * For each of the 5 fairness checks from board-fairness.ts, build a
 * hand-crafted `GameMap` that violates ONLY that check (the other 4 must
 * pass on the same map).  Plus one structurally-valid map with no
 * violations, to confirm all 5 return empty on a clean input.
 *
 * Every map is built from a small spec with a deterministic helper.
 * No randomness, no I/O, no fetch — the core purity test enforces this.
 *
 * The "violates only this check" invariants are asserted by running the
 * other 4 checks too.  If the map accidentally trips check N+1, the
 * test fails and the builder is wrong (the design's hazard 5).
 */

import { describe, expect, it } from "vitest";
import type { GameMap, Province } from "../../src/core";
import {
  checkBonusOutOfProportion,
  checkCrowdedCrossing,
  checkEasyBonusesConcentrated,
  checkFortress,
  checkRemoteOrHub,
  runAllFairnessChecks,
} from "../../src/core/board-fairness";

// ---------------------------------------------------------------------------
// Map builder
// ---------------------------------------------------------------------------

/** Lanes are bidirectional; declared once per pair. */
interface LanePair {
  /** Province id on the source island. */
  readonly from: string;
  /** Province id on the destination island. */
  readonly to: string;
}

interface IslandSpec {
  readonly id: string;
  /** Number of provinces. */
  readonly size: number;
  readonly bonus: number;
  /** Lanes from this island's provinces to other islands' provinces. */
  readonly lanes?: readonly LanePair[];
}

interface MapSpec {
  readonly islands: readonly IslandSpec[];
}

/** Deterministic placeholder polygon (3 points), label inside. */
function placeholderPolygon(cx: number, cy: number): readonly [number, number][] {
  return [
    [cx - 1, cy - 1],
    [cx + 1, cy - 1],
    [cx, cy + 1],
  ] as const;
}

function buildMap(spec: MapSpec): GameMap {
  // Preserve `lanes` so we can iterate them after the rebuild.
  type IslandInternal = IslandSpec & { readonly provinces: readonly string[]; readonly idx: number };
  const islands: IslandInternal[] = spec.islands.map((isl, idx) => {
    const provs: string[] = [];
    for (let i = 0; i < isl.size; i++) {
      provs.push(`${isl.id}_p${i}`);
    }
    return { ...isl, provinces: provs, idx };
  });

  const allProvinces = new Map<string, {
    id: string;
    name: string;
    island: string;
    borders: Set<string>;
    seaLanes: Set<string>;
  }>();

  // Within-island borders form a chain: p0-p1-p2-...-p(N-1)
  for (const isl of islands) {
    for (let i = 0; i < isl.provinces.length; i++) {
      const id = isl.provinces[i]!;
      const borders = new Set<string>();
      if (i > 0) borders.add(isl.provinces[i - 1]!);
      if (i < isl.provinces.length - 1) borders.add(isl.provinces[i + 1]!);
      allProvinces.set(id, {
        id,
        name: id,
        island: isl.id,
        borders,
        seaLanes: new Set(),
      });
    }
  }

  // Inter-island sea lanes (declared once per pair, symmetrised).
  const processedPairs = new Set<string>();
  for (const isl of islands) {
    for (const lane of isl.lanes ?? []) {
      const key = lane.from < lane.to ? `${lane.from}|${lane.to}` : `${lane.to}|${lane.from}`;
      if (processedPairs.has(key)) {
        if (!allProvinces.has(lane.from) || !allProvinces.has(lane.to)) {
          throw new Error(`lane references a missing province: ${lane.from} or ${lane.to}`);
        }
        continue;
      }
      processedPairs.add(key);
      const a = allProvinces.get(lane.from);
      const b = allProvinces.get(lane.to);
      if (!a || !b) throw new Error(`lane references a missing province: ${lane.from} or ${lane.to}`);
      if (a.island === b.island) throw new Error(`lane must be inter-island: ${lane.from} -> ${lane.to}`);
      a.seaLanes.add(b.id);
      b.seaLanes.add(a.id);
    }
  }

  const provinces: Province[] = [];
  for (const isl of islands) {
    for (let i = 0; i < isl.provinces.length; i++) {
      const id = isl.provinces[i]!;
      const p = allProvinces.get(id)!;
      const cx = isl.idx * 100 + 20 + (i % 3) * 20;
      const cy = i * 30 + 20;
      provinces.push({
        id: p.id,
        name: p.name,
        island: p.island,
        borders: [...p.borders].sort(),
        seaLanes: [...p.seaLanes].sort(),
        polygon: placeholderPolygon(cx, cy),
        labelAt: [cx, cy],
      });
    }
  }

  const allX = provinces.flatMap((p) => p.polygon.map((pt) => pt[0]));
  const allY = provinces.flatMap((p) => p.polygon.map((pt) => pt[1]));
  const minX = Math.min(...allX) - 10;
  const minY = Math.min(...allY) - 10;
  const maxX = Math.max(...allX) + 10;
  const maxY = Math.max(...allY) + 10;

  return {
    id: "synthetic",
    name: "Synthetic",
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    provinces,
    islands: islands.map(({ idx: _idx, ...rest }) => rest),
  };
}

// ---------------------------------------------------------------------------
// Five synthetic maps, each violating exactly one check.
// ---------------------------------------------------------------------------

/** Map A — violates check 1 (bonus > size) only. */
function mapViolatesCheck1(): GameMap {
  // A (size 3, bonus 4) is the violator.  All islands have 3 entrances so
  // no fortress (and ≤ 3 single-entrance never holds).  Total bonus
  // 4+5+5+5 = 19; single-entrance bonus sum = 0 → easy-bonuses check
  // passes trivially.  Each province has exactly 1 lane.  Every degree ≤
  // 3, every eccentricity ≤ 1 → remote/hub passes.
  return buildMap({
    islands: [
      { id: "A", size: 3, bonus: 4, lanes: [
        { from: "A_p0", to: "B_p0" },
        { from: "A_p1", to: "C_p0" },
        { from: "A_p2", to: "D_p0" },
      ]},
      { id: "B", size: 5, bonus: 5, lanes: [
        { from: "B_p0", to: "A_p0" },
        { from: "B_p1", to: "C_p1" },
        { from: "B_p2", to: "D_p1" },
      ]},
      { id: "C", size: 5, bonus: 5, lanes: [
        { from: "C_p0", to: "A_p1" },
        { from: "C_p1", to: "B_p1" },
        { from: "C_p2", to: "D_p2" },
      ]},
      { id: "D", size: 5, bonus: 5, lanes: [
        { from: "D_p0", to: "A_p2" },
        { from: "D_p1", to: "B_p2" },
        { from: "D_p2", to: "C_p2" },
      ]},
    ],
  });
}

/**
 * Map B — violates check 2 (fortress) only.
 * F is size 7 with a single entrance (province F_p0 -> G_p0).  Each other
 * island has ≥ 2 entrances.  Single-entrance count = 1 (F), size 7 ≥ 7 →
 * check 2(a) fires.  Total bonus 5+5+5+5 = 20; single sum = 5; 5 > 20/4=5
 * is FALSE → check 3 does not fire.  Each province has ≤ 1 lane.  Max
 * island-graph degree 3, max eccentricity 2 → check 4 passes.
 */
function mapViolatesCheck2(): GameMap {
  return buildMap({
    islands: [
      { id: "F", size: 7, bonus: 5, lanes: [{ from: "F_p0", to: "G_p0" }] },
      { id: "G", size: 5, bonus: 5, lanes: [
        { from: "G_p0", to: "F_p0" },
        { from: "G_p1", to: "H_p0" },
        { from: "G_p2", to: "I_p1" },
      ]},
      { id: "H", size: 5, bonus: 5, lanes: [
        { from: "H_p0", to: "G_p1" },
        { from: "H_p1", to: "I_p0" },
      ]},
      { id: "I", size: 5, bonus: 5, lanes: [
        { from: "I_p0", to: "H_p1" },
        { from: "I_p1", to: "G_p2" },
      ]},
    ],
  });
}

/**
 * Map C — violates check 3 (easy bonuses concentrated) only.
 * A, B, E are single-entrance.  Sum of single-entrance bonuses
 * 6+6+6 = 18; total 30; 18 > 30/4 = 7.5 → check 3 fires.  Each island
 * size 6 < 7 → check 2(a) does not fire.  Single-entrance count = 3,
 * not > 3 → check 2(b) does not fire.  All bonuses ≤ 6 (= size 6) →
 * check 1 passes.  Max eccentricity 4 (A→B→C→D→E), not > 4 → check 4
 * passes.  Each province has ≤ 1 lane → check 5 passes.
 */
function mapViolatesCheck3(): GameMap {
  return buildMap({
    islands: [
      { id: "A", size: 6, bonus: 6, lanes: [{ from: "A_p0", to: "B_p0" }] },
      { id: "B", size: 6, bonus: 6, lanes: [
        { from: "B_p0", to: "A_p0" },
        { from: "B_p1", to: "C_p0" },
      ]},
      { id: "C", size: 6, bonus: 6, lanes: [
        { from: "C_p0", to: "B_p1" },
        { from: "C_p1", to: "D_p0" },
      ]},
      { id: "D", size: 6, bonus: 6, lanes: [
        { from: "D_p0", to: "C_p1" },
        { from: "D_p1", to: "E_p0" },
      ]},
      { id: "E", size: 6, bonus: 6, lanes: [{ from: "E_p0", to: "D_p1" }] },
    ],
  });
}

/**
 * Map D — violates check 4 (remote/hub) only.
 * Hub H has 6 leaves.  H degree = 6 > 5 (the cap, C-BRD-01).  Each leaf
 * has 2 entrances (chain L1-L2-…-L6), so 0 single-entrance islands →
 * check 2 passes.  Bonus H=5 ≤ 10 (size); leaves bonus 2 ≤ 3 (size) →
 * check 1 passes.  Total bonus = 5 + 6*2 = 17; single-entrance sum = 0 →
 * check 3 passes.  Each province has ≤ 1 lane → check 5 passes.
 */
function mapViolatesCheck4(): GameMap {
  const hubToLeaf = (leafIdx: number, hubProvIdx: number) => ({
    from: `H_p${hubProvIdx}`,
    to: `L${leafIdx}_p0`,
  });
  return buildMap({
    islands: [
      { id: "H", size: 10, bonus: 5, lanes: [
        hubToLeaf(1, 0),
        hubToLeaf(2, 1),
        hubToLeaf(3, 2),
        hubToLeaf(4, 3),
        hubToLeaf(5, 4),
        hubToLeaf(6, 5),
      ]},
      { id: "L1", size: 3, bonus: 2, lanes: [
        { from: "L1_p0", to: "H_p0" },
        { from: "L1_p1", to: "L2_p1" },
      ]},
      { id: "L2", size: 3, bonus: 2, lanes: [
        { from: "L2_p0", to: "H_p1" },
        { from: "L2_p1", to: "L1_p1" },
        { from: "L2_p2", to: "L3_p1" },
      ]},
      { id: "L3", size: 3, bonus: 2, lanes: [
        { from: "L3_p0", to: "H_p2" },
        { from: "L3_p1", to: "L2_p2" },
        { from: "L3_p2", to: "L4_p1" },
      ]},
      { id: "L4", size: 3, bonus: 2, lanes: [
        { from: "L4_p0", to: "H_p3" },
        { from: "L4_p1", to: "L3_p2" },
        { from: "L4_p2", to: "L5_p1" },
      ]},
      { id: "L5", size: 3, bonus: 2, lanes: [
        { from: "L5_p0", to: "H_p4" },
        { from: "L5_p1", to: "L4_p2" },
        { from: "L5_p2", to: "L6_p1" },
      ]},
      { id: "L6", size: 3, bonus: 2, lanes: [
        { from: "L6_p0", to: "H_p5" },
        { from: "L6_p1", to: "L5_p2" },
      ]},
    ],
  });
}

/**
 * Map E — violates check 5 (crowded crossing) only.
 *
 * Uses a custom builder that keeps `seaLanes` ASYMMETRIC by design:
 * X_p0 has 3 outbound lanes to Y_p0 / Z_p0 / W_p0; Y_p0 / Z_p0 / W_p0
 * have ZERO outbound lanes.  The crowded-crossing check counts
 * outbound lanes per province, so the violation lives only on X_p0.
 *
 * The asymmetric seaLanes still let check 4 build the island graph
 * correctly: every edge in the graph comes from X_p0's outbound list,
 * added in both directions.
 */
function buildAsymmetricMap(spec: {
  readonly islands: ReadonlyArray<{
    readonly id: string;
    readonly size: number;
    readonly bonus: number;
    readonly outboundFrom?: ReadonlyArray<[string, readonly string[]]>;
  }>;
}): GameMap {
  const provinces: Province[] = [];
  const islandsOut = [];
  const islandIndex = new Map<string, number>();

  spec.islands.forEach((isl, idx) => {
    islandIndex.set(isl.id, idx);
    const provIds: string[] = [];
    for (let i = 0; i < isl.size; i++) provIds.push(`${isl.id}_p${i}`);
    islandsOut.push({
      id: isl.id,
      name: isl.id,
      bonus: isl.bonus,
      provinces: provIds,
    });
  });

  // Default zero-outbound per province
  const outbound = new Map<string, string[]>();
  for (const isl of spec.islands) {
    for (let i = 0; i < isl.size; i++) outbound.set(`${isl.id}_p${i}`, []);
  }
  for (const isl of spec.islands) {
    for (const [from, tos] of isl.outboundFrom ?? []) {
      outbound.set(from, [...tos]);
    }
  }

  // Borders: chain within each island.
  const bordersByProvince = new Map<string, string[]>();
  for (const isl of spec.islands) {
    const provIds: string[] = [];
    for (let i = 0; i < isl.size; i++) provIds.push(`${isl.id}_p${i}`);
    for (let i = 0; i < provIds.length; i++) {
      const list: string[] = [];
      if (i > 0) list.push(provIds[i - 1]!);
      if (i < provIds.length - 1) list.push(provIds[i + 1]!);
      bordersByProvince.set(provIds[i]!, list);
    }
  }

  for (const isl of spec.islands) {
    for (let i = 0; i < isl.size; i++) {
      const id = `${isl.id}_p${i}`;
      const lanes = outbound.get(id) ?? [];
      // Sanity: every outbound target is on a different island.
      for (const t of lanes) {
        const tIsland = t.slice(0, t.lastIndexOf("_p"));
        if (tIsland === isl.id) {
          throw new Error(`outbound lane must be inter-island: ${id} -> ${t}`);
        }
      }
      const cx = (islandIndex.get(isl.id) ?? 0) * 100 + 20 + (i % 3) * 20;
      const cy = i * 30 + 20;
      provinces.push({
        id,
        name: id,
        island: isl.id,
        borders: (bordersByProvince.get(id) ?? []).slice().sort(),
        seaLanes: lanes.slice().sort(),
        polygon: placeholderPolygon(cx, cy),
        labelAt: [cx, cy],
      });
    }
  }

  const allX = provinces.flatMap((p) => p.polygon.map((pt) => pt[0]));
  const allY = provinces.flatMap((p) => p.polygon.map((pt) => pt[1]));
  const minX = Math.min(...allX) - 10, minY = Math.min(...allY) - 10;
  const maxX = Math.max(...allX) + 10, maxY = Math.max(...allY) + 10;

  return {
    id: "synthetic", name: "Synthetic",
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    provinces,
    islands: islandsOut,
  };
}

function mapViolatesCheck5(): GameMap {
  return buildAsymmetricMap({
    islands: [
      {
        id: "X",
        size: 1,
        bonus: 1,
        outboundFrom: [["X_p0", ["Y_p0", "Z_p0", "W_p0"]]],
      },
      { id: "Y", size: 1, bonus: 1 },
      { id: "Z", size: 1, bonus: 1 },
      { id: "W", size: 1, bonus: 1 },
    ],
  });
}

/** Map F — no violations: all 5 checks return empty on this map. */
function mapWithoutViolations(): GameMap {
  return buildMap({
    islands: [
      { id: "A", size: 3, bonus: 3, lanes: [
        { from: "A_p0", to: "B_p0" },
        { from: "A_p1", to: "C_p0" },
        { from: "A_p2", to: "D_p0" },
      ]},
      { id: "B", size: 5, bonus: 5, lanes: [
        { from: "B_p0", to: "A_p0" },
        { from: "B_p1", to: "C_p1" },
        { from: "B_p2", to: "D_p1" },
      ]},
      { id: "C", size: 5, bonus: 5, lanes: [
        { from: "C_p0", to: "A_p1" },
        { from: "C_p1", to: "B_p1" },
        { from: "C_p2", to: "D_p2" },
      ]},
      { id: "D", size: 5, bonus: 5, lanes: [
        { from: "D_p0", to: "A_p2" },
        { from: "D_p1", to: "B_p2" },
        { from: "D_p2", to: "C_p2" },
      ]},
    ],
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("board-fairness checks", () => {
  describe("check 1: bonus out of proportion", () => {
    it("returns non-empty for a map with bonus > size", () => {
      const map = mapViolatesCheck1();
      expect(checkBonusOutOfProportion(map).length).toBeGreaterThan(0);
    });

    it("returns empty for the no-violation map", () => {
      expect(checkBonusOutOfProportion(mapWithoutViolations())).toEqual([]);
    });

    it("does not fire on the maps that violate the other 4 checks", () => {
      expect(checkBonusOutOfProportion(mapViolatesCheck2())).toEqual([]);
      expect(checkBonusOutOfProportion(mapViolatesCheck3())).toEqual([]);
      expect(checkBonusOutOfProportion(mapViolatesCheck4())).toEqual([]);
      expect(checkBonusOutOfProportion(mapViolatesCheck5())).toEqual([]);
    });
  });

  describe("check 2: fortress", () => {
    it("returns non-empty for an island of size 7 with single entrance", () => {
      const map = mapViolatesCheck2();
      expect(checkFortress(map).length).toBeGreaterThan(0);
    });

    it("returns empty for the no-violation map", () => {
      expect(checkFortress(mapWithoutViolations())).toEqual([]);
    });

    it("does not fire on the maps that violate the other 4 checks", () => {
      expect(checkFortress(mapViolatesCheck1())).toEqual([]);
      expect(checkFortress(mapViolatesCheck3())).toEqual([]);
      expect(checkFortress(mapViolatesCheck4())).toEqual([]);
      expect(checkFortress(mapViolatesCheck5())).toEqual([]);
    });
  });

  describe("check 3: easy bonuses concentrated", () => {
    it("returns non-empty when single-entrance bonus sum exceeds 1/4 of total", () => {
      const map = mapViolatesCheck3();
      expect(checkEasyBonusesConcentrated(map).length).toBeGreaterThan(0);
    });

    it("returns empty for the no-violation map", () => {
      expect(checkEasyBonusesConcentrated(mapWithoutViolations())).toEqual([]);
    });

    it("does not fire on the maps that violate the other 4 checks", () => {
      expect(checkEasyBonusesConcentrated(mapViolatesCheck1())).toEqual([]);
      expect(checkEasyBonusesConcentrated(mapViolatesCheck2())).toEqual([]);
      expect(checkEasyBonusesConcentrated(mapViolatesCheck4())).toEqual([]);
      expect(checkEasyBonusesConcentrated(mapViolatesCheck5())).toEqual([]);
    });
  });

  describe("check 4: remote / hub island (C-BRD-01, degree cap raised to 5)", () => {
    it("returns non-empty when an island has degree > 5", () => {
      const map = mapViolatesCheck4();
      expect(checkRemoteOrHub(map).length).toBeGreaterThan(0);
    });

    it("returns empty for the no-violation map", () => {
      expect(checkRemoteOrHub(mapWithoutViolations())).toEqual([]);
    });

    it("does not fire on the maps that violate the other 4 checks", () => {
      expect(checkRemoteOrHub(mapViolatesCheck1())).toEqual([]);
      expect(checkRemoteOrHub(mapViolatesCheck2())).toEqual([]);
      expect(checkRemoteOrHub(mapViolatesCheck3())).toEqual([]);
      expect(checkRemoteOrHub(mapViolatesCheck5())).toEqual([]);
    });

    it("a degree-5 island does not violate (cap threshold is `> 5`)", () => {
      // A hand-built map with one hub at degree exactly 5 (not > 5) — must pass.
      // Topologically identical to mapViolatesCheck4 but with 5 leaves instead of 6.
      const leafToHub = (leafIdx: number, hubProvIdx: number) => ({
        from: `H_p${hubProvIdx}`,
        to: `L${leafIdx}_p0`,
      });
      const map = buildMap({
        islands: [
          { id: "H", size: 10, bonus: 5, lanes: [
            leafToHub(1, 0),
            leafToHub(2, 1),
            leafToHub(3, 2),
            leafToHub(4, 3),
            leafToHub(5, 4),
          ]},
          { id: "L1", size: 3, bonus: 2, lanes: [
            { from: "L1_p0", to: "H_p0" },
            { from: "L1_p1", to: "L2_p1" },
          ]},
          { id: "L2", size: 3, bonus: 2, lanes: [
            { from: "L2_p0", to: "H_p1" },
            { from: "L2_p1", to: "L1_p1" },
            { from: "L2_p2", to: "L3_p1" },
          ]},
          { id: "L3", size: 3, bonus: 2, lanes: [
            { from: "L3_p0", to: "H_p2" },
            { from: "L3_p1", to: "L2_p2" },
            { from: "L3_p2", to: "L4_p1" },
          ]},
          { id: "L4", size: 3, bonus: 2, lanes: [
            { from: "L4_p0", to: "H_p3" },
            { from: "L4_p1", to: "L3_p2" },
            { from: "L4_p2", to: "L5_p1" },
          ]},
          { id: "L5", size: 3, bonus: 2, lanes: [
            { from: "L5_p0", to: "H_p4" },
            { from: "L5_p1", to: "L4_p2" },
          ]},
        ],
      });
      expect(checkRemoteOrHub(map)).toEqual([]);
    });
  });

  describe("check 5: crowded crossing country", () => {
    it("returns non-empty for a province with > 2 sea lanes", () => {
      const map = mapViolatesCheck5();
      expect(checkCrowdedCrossing(map).length).toBeGreaterThan(0);
    });

    it("returns empty for the no-violation map", () => {
      expect(checkCrowdedCrossing(mapWithoutViolations())).toEqual([]);
    });

    it("does not fire on the maps that violate the other 4 checks", () => {
      expect(checkCrowdedCrossing(mapViolatesCheck1())).toEqual([]);
      expect(checkCrowdedCrossing(mapViolatesCheck2())).toEqual([]);
      expect(checkCrowdedCrossing(mapViolatesCheck3())).toEqual([]);
      expect(checkCrowdedCrossing(mapViolatesCheck4())).toEqual([]);
    });
  });

  describe("runAllFairnessChecks", () => {
    it("concatenates the 5 checks in order", () => {
      const map = mapViolatesCheck1();
      const all = runAllFairnessChecks(map);
      const sum =
        checkBonusOutOfProportion(map).length +
        checkFortress(map).length +
        checkEasyBonusesConcentrated(map).length +
        checkRemoteOrHub(map).length +
        checkCrowdedCrossing(map).length;
      expect(all.length).toBe(sum);
    });

    it("returns empty for the no-violation map", () => {
      expect(runAllFairnessChecks(mapWithoutViolations())).toEqual([]);
    });

    it("returns one batched violation for the check-N-violating maps", () => {
      for (const builder of [
        mapViolatesCheck1,
        mapViolatesCheck2,
        mapViolatesCheck3,
        mapViolatesCheck4,
        mapViolatesCheck5,
      ]) {
        const map = builder();
        const all = runAllFairnessChecks(map);
        expect(all.length).toBeGreaterThan(0);
      }
    });
  });
});
