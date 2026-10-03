import { describe, expect, it } from "vitest";
import { neighbours, parseMap, province } from "../../src/core";
import { readMapJson, smallSea } from "./helpers";

// Mirrors test/data/test_small_sea.gd: the shipped board against RULES.md's table.
describe("data/maps/small_sea.json, read unchanged", () => {
  it("loads and validates: 14 provinces on 4 islands", () => {
    const map = smallSea();
    expect(map.id).toBe("small-sea");
    expect(map.provinces).toHaveLength(14);
    expect(map.islands.map((i) => [i.id, i.provinces.length, i.bonus])).toEqual([
      ["norda_vasto", 4, 3],
      ["la_spino", 4, 3],
      ["varmaj_sabloj", 3, 2],
      ["la_dentoj", 3, 4],
    ]);
  });

  it("adjacency is borders then sea lanes, and symmetric", () => {
    const map = smallSea();
    const frostkabo = province(map, "frostkabo");
    expect(frostkabo && neighbours(frostkabo)).toEqual(["sulo", "longa_strando", "ventflanko", "splito"]);
    for (const p of map.provinces) {
      for (const n of neighbours(p)) expect(neighbours(province(map, n)!)).toContain(p.id);
    }
  });
});

describe("a bad map loads nothing and says why", () => {
  const mutate = (change: (m: any) => void) => {
    const m = structuredClone(readMapJson()) as any;
    change(m);
    return parseMap(m);
  };

  it("rejects an unknown schema, a non-object and unknown keys", () => {
    expect(mutate((m) => (m.schema = 2))).toMatchObject({ ok: false });
    expect(parseMap([])).toMatchObject({ ok: false });
    const r = mutate((m) => (m.provinces[0].script = "evil"));
    expect(r).toMatchObject({ ok: false });
    expect(!r.ok && r.errors.join()).toContain("unexpected key 'script'");
  });

  it("rejects dangling and one-way crossings", () => {
    const dangling = mutate((m) => m.provinces[0].borders.push("atlantis"));
    expect(!dangling.ok && dangling.errors.join()).toContain("unknown province 'atlantis'");
    const oneWay = mutate((m) => (m.provinces[3].borders = ["sulo"]));
    expect(!oneWay.ok && oneWay.errors.join()).toContain("is not returned");
  });

  it("rejects a province on no island and a polygon with fewer than 3 points", () => {
    const orphan = mutate((m) => (m.islands[0].provinces = m.islands[0].provinces.slice(1)));
    expect(!orphan.ok && orphan.errors.join()).toContain("is on no island's list");
    const flat = mutate((m) => (m.provinces[0].polygon = [[0, 0], [1, 1]]));
    expect(!flat.ok && flat.errors.join()).toContain("fewer than 3 polygon points");
  });
});
