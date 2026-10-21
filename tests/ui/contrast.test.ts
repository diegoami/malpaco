// T87: computed contrast of the map's text and essential boundaries, from the shipped
// stylesheet and palette. [designed] targets: 4.5:1 for text, 3:1 for essential boundaries.
import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";
import {SEATS} from "../../src/ui/palette";

const css = readFileSync("src/styles.css", "utf8");
/** The value of `property` in the one-line map rule whose selector ends with `selector`. */
function value(selector: string, property: string): string {
  const line = css.split("\n").find(l => l.startsWith(":is(#geographic-map,#reference-map)") && l.split("{")[0]!.trim().endsWith(selector));
  const match = line?.match(new RegExp(`[{;]\\s*${property}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw Error(`No ${property} for ${selector}`);
  return match[1]!;
}
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe("map contrast (T87)", () => {
  const badge = value(".badge", "fill"), water = value(".water", "fill"), band = value(".country:is(.selected,.neighbor,.target) .cell", "stroke");
  it("text meets 4.5:1: counts on their badge, the selected count, names on their halo", () => {
    expect(contrast(value(".count", "fill"), badge)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(value(".country.selected .count", "fill"), value(".country.selected .badge", "fill"))).toBeGreaterThanOrEqual(4.5);
    const name = ".country:is(:hover,:focus,.selected) .name";
    expect(contrast(value(name, "fill"), value(name, "stroke"))).toBeGreaterThanOrEqual(4.5);
  });
  it("essential boundaries meet 3:1: the coast, every owner's badge outline, and the selection outlines on every owner colour", () => {
    expect(contrast(value(".coast", "stroke"), water)).toBeGreaterThanOrEqual(3);
    expect(contrast(value(".coast", "stroke"), value(".shelf", "fill"))).toBeGreaterThanOrEqual(3);
    for (const seat of SEATS) {
      expect(contrast(seat.color, badge), `badge outline ${seat.color}`).toBeGreaterThanOrEqual(3);
      // The dark band separates the outline from the land; the light line separates from the band.
      expect(contrast(band, seat.color), `band on ${seat.color}`).toBeGreaterThanOrEqual(3);
    }
    for (const ring of [".country.selected .ring", ".country.neighbor .ring", ".country.target .ring"]) expect(contrast(value(ring, "stroke"), band), ring).toBeGreaterThanOrEqual(3);
    expect(contrast(value(".target-mark", "stroke"), water)).toBeGreaterThanOrEqual(3);
  });
});
