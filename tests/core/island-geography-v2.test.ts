import {describe, expect, it} from "vitest";
import {generateIslandGeographyV2, inside, simple} from "../../src/core/island-geography-v2";
import type {Point} from "../../src/core/island-geography-v2";
import {createGeographicGame} from "../../src/core/geographic-game";
import {defaultOptions} from "../../src/core/options";
import {raidCardsRules} from "../../src/core";
import {GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY, deserializeVersionedMatch, serializeVersionedMatch} from "../../src/core/match-save";

const Q = 2048, SEEDS = Array.from({length: 16}, (_, i) => i).concat([1994, 4242]);
const results = SEEDS.map(seed => ({seed, r: generateIslandGeographyV2(seed)}));
const geographies = results.map(({seed, r}) => {if (!r.ok) throw Error(`seed ${seed}: ${r.failures.flatMap(f => f.constraints).join("; ")}`); return {seed, g: r.geography};});
const squareFits = (c: Point, poly: readonly Point[]) => {
  for (let t = -20; t <= 20; t += 5) for (const [dx, dy] of [[t, -20], [20, t], [t, 20], [-20, t]]) if (!inside([c[0] + dx! * Q, c[1] + dy! * Q], poly)) return false;
  return inside(c, poly);
};

describe("island geography v2 (T95)", () => {
  it("every seed of the corpus yields a valid map: 46 countries on 7–10 islands of 3–10", () => {
    for (const {seed, g} of geographies) {
      expect(g.version, `${seed}`).toBe("island-geography-v2");
      expect(g.provinces).toHaveLength(46);
      expect(g.islands.length).toBeGreaterThanOrEqual(7); expect(g.islands.length).toBeLessThanOrEqual(10);
      for (const island of g.islands) {expect(island.provinces.length).toBeGreaterThanOrEqual(3); expect(island.provinces.length).toBeLessThanOrEqual(10);}
      expect(new Set(g.provinces.map(p => p.id)).size).toBe(46);
      expect(g.islands.flatMap(i => i.provinces).sort()).toEqual(g.provinces.map(p => p.id).sort());
    }
  });

  it("outlines are simple, labels have their 40 px square and the v1 spacing", () => {
    for (const {seed, g} of geographies) {
      for (const i of g.islands) expect(simple(i.polygon), `${seed} ${i.id} coast`).toBe(true);
      for (const p of g.provinces) {
        expect(simple(p.polygon), `${seed} ${p.id}`).toBe(true);
        expect(squareFits(p.labelAt, p.polygon), `${seed} ${p.id} label square`).toBe(true);
      }
      for (const a of g.provinces) for (const b of g.provinces) if (a !== b)
        expect(Math.abs(a.labelAt[0] - b.labelAt[0]) >= 44 * Q || Math.abs(a.labelAt[1] - b.labelAt[1]) >= 47 * Q, `${seed} ${a.id}/${b.id}`).toBe(true);
    }
  });

  it("borders are mutual and stay on one island; every country has a neighbour", () => {
    for (const {seed, g} of geographies) {
      const byId = new Map(g.provinces.map(p => [p.id, p]));
      for (const p of g.provinces) {
        expect(p.borders.length, `${seed} ${p.id}`).toBeGreaterThan(0);
        for (const b of p.borders) {expect(byId.get(b)!.borders).toContain(p.id); expect(byId.get(b)!.island).toBe(p.island);}
      }
    }
  });

  it("sea lanes connect every island, clear of land, at most two per country, with bonus headroom", () => {
    for (const {seed, g} of geographies) {
      const islandOf = new Map(g.provinces.map(p => [p.id, p.island])), coasts = g.islands.map(i => i.polygon);
      const reach = new Set([g.islands[0]!.id]);
      for (let grew = true; grew;) {grew = false; for (const l of g.entranceReservations) {const a = islandOf.get(l.from)!, b = islandOf.get(l.to)!; if (reach.has(a) !== reach.has(b)) {reach.add(a); reach.add(b); grew = true;}}}
      expect(reach.size, `${seed} connected`).toBe(g.islands.length);
      const lanes = new Map<string, number>();
      for (const l of g.entranceReservations) {
        expect(islandOf.get(l.from)).not.toBe(islandOf.get(l.to));
        for (const id of [l.from, l.to]) lanes.set(id, (lanes.get(id) ?? 0) + 1);
        const [s, t] = l.points as [Point, Point], length = Math.hypot(t[0] - s[0], t[1] - s[1]);
        expect(length).toBeGreaterThanOrEqual(20 * Q);
        for (let d = 10 * Q; d < length - 10 * Q; d += 4 * Q) {
          const p: Point = [s[0] + ((t[0] - s[0]) * d) / length, s[1] + ((t[1] - s[1]) * d) / length];
          expect(coasts.some(c => inside(p, c)), `${seed} lane over land`).toBe(false);
        }
      }
      for (const n of lanes.values()) expect(n).toBeLessThanOrEqual(2);
      for (const island of g.islands) {
        const entrances = new Set(g.entranceReservations.flatMap(l => [l.from, l.to]).filter(id => islandOf.get(id) === island.id)).size, n = island.provinces.length;
        expect(Math.max(2, Math.floor(n / 2) + entrances), `${seed} ${island.id} bonus`).toBeLessThanOrEqual(n);
      }
    }
  });

  it("is deterministic per seed and varies across seeds", () => {
    expect(JSON.stringify(generateIslandGeographyV2(7))).toBe(JSON.stringify(generateIslandGeographyV2(7)));
    expect(new Set(geographies.map(({g}) => JSON.stringify(g.islands.map(i => i.provinces.length)))).size).toBeGreaterThan(8);
    expect(new Set(geographies.map(({g}) => g.islands.length)).size).toBeGreaterThanOrEqual(3);
  });

  it("a v2 game deals 46 countries and its save replays on v2", () => {
    const options = {...defaultOptions(), seed: 1994}, r = createGeographicGame(options, raidCardsRules(options), {}, 2);
    if (!r.ok) throw Error(r.errors.join(";"));
    expect(r.geography.version).toBe("island-geography-v2");
    expect(r.state.map.id).toBe("geographic-2-1994");
    expect(Object.keys(r.state.ownerOf)).toHaveLength(46);
    const loaded = deserializeVersionedMatch(serializeVersionedMatch(options, [], GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY));
    expect(loaded.identity).toEqual(GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY);
    expect(loaded.geography?.version).toBe("island-geography-v2");
    expect(loaded.state).toEqual(r.state);
  });
});
