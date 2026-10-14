import { describe, expect, it } from "vitest";
import { generateBoard } from "../../src/core";
import type { GameMap, Point } from "../../src/core";
import { layoutGeneratedBoard } from "../../src/ui/prototype/layout";

const seeds = [1, 2, 3, 7, 42, 1994];
function freeze(value: unknown): void {
  if (value && typeof value === "object") { Object.freeze(value); for (const child of Object.values(value)) freeze(child); }
}
const semantics = (map: GameMap) => ({ ...map, bounds: undefined, provinces: map.provinces.map(({ polygon: _polygon, labelAt: _labelAt, ...p }) => p) });
function inside(poly: readonly Point[], [x, y]: Point): boolean {
  let yes = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[i]!; const [bx, by] = poly[j]!;
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) yes = !yes;
  }
  return yes;
}

describe("generated-board presentation contract", () => {
  for (const seed of seeds) it(`seed ${seed}: immutable, deterministic, semantic-preserving readable geometry`, () => {
    const result = generateBoard(seed); expect(result.ok).toBe(true); if (!result.ok) throw new Error(result.errors.join(";"));
    const input = result.map; const bytes = JSON.stringify(input); freeze(input);
    const output = layoutGeneratedBoard(input);
    expect(JSON.stringify(input)).toBe(bytes);
    expect(output).toEqual(layoutGeneratedBoard(input));
    expect(semantics(output)).toEqual(semantics(input));
    expect(output.provinces).toHaveLength(46); expect(output.islands).toHaveLength(9);
    const b = output.bounds;
    expect(b.width).toBeGreaterThan(0); expect(b.height).toBeGreaterThan(0);
    // [designed] conservative 12px name box, after inspecting MapView's 21px
    // placeholder label-box estimate; actual font/paint are separately gated in E2E.
    const boxes = output.provinces.map(p => ({ id: p.id, x: p.labelAt[0], y: p.labelAt[1], hw: p.name.length * 3.7 + 3, hh: 8 }));
    for (const p of output.provinces) {
      expect(p.polygon.length).toBeGreaterThanOrEqual(3);
      for (const [x, y] of [...p.polygon, p.labelAt]) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(b.x); expect(x).toBeLessThanOrEqual(b.x + b.width);
        expect(y).toBeGreaterThanOrEqual(b.y); expect(y).toBeLessThanOrEqual(b.y + b.height);
      }
      const box = boxes.find(c => c.id === p.id)!;
      for (const corner of [[box.x-box.hw,box.y-box.hh],[box.x+box.hw,box.y-box.hh],[box.x-box.hw,box.y+box.hh],[box.x+box.hw,box.y+box.hh]] as Point[]) expect(inside(p.polygon, corner), `${p.id}: label/hit box inside its region`).toBe(true);
      expect(output.provinces.filter(q => inside(q.polygon, p.labelAt)).map(q=>q.id), `${p.id}: distinct hit region`).toEqual([p.id]);
    }
    for (let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++) {
      const a=boxes[i]!,c=boxes[j]!;
      expect(Math.abs(a.x-c.x)>=a.hw+c.hw || Math.abs(a.y-c.y)>=a.hh+c.hh, `${a.id}/${c.id}: disjoint names`).toBe(true);
    }
  });
  it("failure seed is a real existing-generator refusal", () => {
    expect(generateBoard(1506).ok).toBe(false);
  });
});
