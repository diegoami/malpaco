import {describe, expect, it} from "vitest";
import {NAME_THEMES, THEMES, flavourNames, themeFor} from "../../src/core/flavour-names";
import {generateGeographicBoard} from "../../src/core/geographic-board";
import {createGeographicGame} from "../../src/core/geographic-game";
import {defaultOptions, validateGameOptions} from "../../src/core/options";
import {apply} from "../../src/core/rules";
import {computerAction} from "../../src/core/computer";
import type {GameOptions} from "../../src/core/options";
import type {GameState} from "../../src/core/types";

const SEEDS = [0, 1, 6, 1994, 4242];
const boards = SEEDS.map(seed => {const r = generateGeographicBoard(seed); if (!r.ok) throw Error(`seed ${seed}`); return {seed, map: r.map};});
const islandsOf = (map: (typeof boards)[number]["map"]) => map.islands.map(i => ({id: i.id, provinces: i.provinces, area: i.provinces.length}));

describe("flavour name data (T94)", () => {
  it("every theme has at least nine islands, each with ten towns, and no name twice", () => {
    for (const theme of NAME_THEMES) {
      const pool = THEMES[theme];
      expect(pool.length, theme).toBeGreaterThanOrEqual(9);
      for (const island of pool) expect(island.towns.length, island.name).toBeGreaterThanOrEqual(10);
      const all = pool.flatMap(i => [i.name, ...i.towns]);
      expect(new Set(all).size, `${theme} duplicates`).toBe(all.length);
    }
  });
});

describe("flavourNames (T94)", () => {
  it("names every island and country of each map once, towns from their own island, larger islands from larger real ones", () => {
    for (const {seed, map} of boards) for (const theme of NAME_THEMES) {
      const names = flavourNames(theme, seed, islandsOf(map));
      expect(Object.keys(names.islands).sort()).toEqual(map.islands.map(i => i.id).sort());
      expect(Object.keys(names.provinces).sort()).toEqual(map.provinces.map(p => p.id).sort());
      const used = [...Object.values(names.islands), ...Object.values(names.provinces)];
      expect(new Set(used).size).toBe(used.length);
      const real = new Map(THEMES[theme].map(i => [i.name, i]));
      for (const island of map.islands) {
        const source = real.get(names.islands[island.id]!)!;
        for (const id of island.provinces) expect(source.towns).toContain(names.provinces[id]);
      }
      for (const a of map.islands) for (const b of map.islands)
        if (a.provinces.length > b.provinces.length) expect(real.get(names.islands[a.id]!)!.area).toBeGreaterThan(real.get(names.islands[b.id]!)!.area);
    }
  });

  it("the same seed and theme give the same names; another seed varies them", () => {
    const {seed, map} = boards[0]!;
    expect(flavourNames("mediterranean", seed, islandsOf(map))).toEqual(flavourNames("mediterranean", seed, islandsOf(map)));
    expect(flavourNames("mediterranean", seed + 1, islandsOf(map))).not.toEqual(flavourNames("mediterranean", seed, islandsOf(map)));
  });

  it("By seed picks a theme from the seed and every theme is reachable; numbered keeps no theme", () => {
    expect(themeFor("seed", 7)).toBe(themeFor("seed", 7));
    expect(new Set(Array.from({length: 200}, (_, seed) => themeFor("seed", seed)))).toEqual(new Set(NAME_THEMES));
    expect(themeFor("caribbean", 7)).toBe("caribbean");
    expect(themeFor("numbered", 7)).toBeNull();
  });
});

describe("themes in a game (T94)", () => {
  const strip = (state: GameState) => ({...state, map: {...state.map, provinces: state.map.provinces.map(p => ({...p, name: ""})), islands: state.map.islands.map(i => ({...i, name: ""}))}});
  const game = (names: GameOptions["names"]) => {
    const {names: _, ...base} = {...defaultOptions(), seed: 1994};
    const r = createGeographicGame(names === undefined ? base : {...base, names});
    if (!r.ok) throw Error(r.errors.join(";"));
    return r;
  };

  it("changing only the theme changes names, never the map, deal, RNG or a scripted game", () => {
    const a = game("mediterranean"), b = game("pacific");
    expect(a.state.map.provinces.map(p => p.name)).not.toEqual(b.state.map.provinces.map(p => p.name));
    expect(strip(a.state)).toEqual(strip(b.state));
    expect(a.rng).toEqual(b.rng);
    let sa = a.state, sb = b.state;
    // The computer plays both games; every decision, roll and result must match.
    for (let i = 0; i < 200; i++) {
      const action = computerAction(sa);
      if (!action) break;
      expect(computerAction(sb)).toEqual(action);
      const ra = apply(sa, action), rb = apply(sb, action);
      if (!ra.ok || !rb.ok) throw Error("illegal computer action");
      expect(rb.outcome).toEqual(ra.outcome);
      sa = ra.state; sb = rb.state;
      expect(strip(sb)).toEqual(strip(sa));
    }
    expect(sa.history.length).toBeGreaterThan(20);
  });

  it("options without a theme (saves made before T94) keep numbered names", () => {
    const old = game(undefined);
    expect(validateGameOptions({...defaultOptions(), names: undefined}).names).toBeUndefined();
    expect(old.state.map.provinces[0]!.name).toBe("Country 1");
    expect(old.state.map.islands[0]!.name).toBe("Island 1");
  });
});
