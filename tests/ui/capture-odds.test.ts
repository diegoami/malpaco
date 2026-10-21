import {describe, expect, it} from "vitest";
import {createGeographicGame} from "../../src/core/geographic-game";
import {defaultOptions} from "../../src/core/options";
import {DeterministicRng, resolve} from "../../src/core";
import type {GameState} from "../../src/core";
import {captureOdds, oddsLabel} from "../../src/ui/captureOdds";

const base = (() => {const r = createGeographicGame({...defaultOptions(), seed: 1994}); if (!r.ok) throw Error(r.errors.join(";")); return r.state;})();
const pair = (() => {const from = base.map.provinces.find(p => p.borders.length)!; return {from: from.id, to: from.borders[0]!};})();
const [mover, other] = base.players.map(p => p.id) as [string, string];
const withStacks = (a: number, d: number): GameState => ({...base, phase: "attack", armies: {...base.armies, [pair.from]: a, [pair.to]: d}, ownerOf: {...base.ownerOf, [pair.from]: mover, [pair.to]: other}});

/** Exchange by exchange: the attacker wins one with p; it stops at one army. */
function recurrence(a: number, d: number, p = 0.5): number {
  if (d === 0) return 1;
  if (a < 2) return 0;
  return p * recurrence(a, d - 1, p) + (1 - p) * recurrence(a - 1, d, p);
}

describe("capture odds if fought to the end (T82, R5)", () => {
  it("matches the exchange-by-exchange recurrence for the game's fair single-die exchanges", () => {
    for (let a = 1; a <= 12; a++) for (let d = 1; d <= 10; d++) expect(captureOdds(withStacks(a, d), pair.from, pair.to), `${a} v ${d}`).toBeCloseTo(recurrence(a, d), 12);
    expect(captureOdds(withStacks(2, 1), pair.from, pair.to)).toBe(0.5);
    expect(captureOdds(withStacks(1, 1), pair.from, pair.to)).toBe(0);
  });

  it("agrees with the engine's own dice over many fought battles", () => {
    const [a, d] = [6, 4];
    let captured = 0;
    const runs = 4000, rng = new DeterministicRng(81);
    for (let i = 0; i < runs; i++) {
      const state = structuredClone(withStacks(a, d));
      while (state.armies[pair.to]! > 0 && state.armies[pair.from]! >= 2) resolve(state, pair.from, pair.to, rng);
      if (state.ownerOf[pair.to] === mover) captured++;
    }
    expect(Math.abs(captured / runs - captureOdds(withStacks(a, d), pair.from, pair.to)!)).toBeLessThan(0.025);
  });

  it("labels as whole percents and never rounds an uncertain battle to 0% or 100%", () => {
    expect(oddsLabel(0.9134)).toBe("91%");
    expect(oddsLabel(0.999)).toBe("99%");
    expect(oddsLabel(0.001)).toBe("1%");
    expect(oddsLabel(1)).toBe("100%");
    expect(oddsLabel(0)).toBe("0%");
  });
});
