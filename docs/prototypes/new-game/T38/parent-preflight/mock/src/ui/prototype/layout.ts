import type { GameMap, Point, Province } from "../../core";

/**
 * [designed] A 1480×860 atlas, 184×54 country spacing and 18-unit names.
 * Inspected board-gen.ts placeholderPolygon/spreadPoints and mapView.ts's
 * labelBox/markerSpot: placeholders cannot fit full names at desktop scale.
 * Large islands occupy the broad central/northern waters; small ones fill the
 * remaining bays. Coordinates depend only on island size/order, never rule RNG.
 */
const ATLAS = { x: 0, y: 0, width: 1480, height: 860 } as const;
const ANCHORS: readonly Point[] = [
  [560, 450], [110, 115], [1030, 105],
  [105, 435], [1035, 460], [570, 80],
  [590, 260], [120, 700], [1070, 725],
];
const COUNTRY_WIDTH = 184;
const COUNTRY_HEIGHT = 54;

/** Only presentation coordinates change. All rule/map fields retain their values. */
export function layoutGeneratedBoard(map: GameMap): GameMap {
  const ranked = map.islands.map((island, index) => ({ island, index }))
    .sort((a, b) => b.island.provinces.length - a.island.provinces.length || a.index - b.index);
  const geometry = new Map<string, { polygon: Point[]; labelAt: Point }>();
  for (const [rank, { island }] of ranked.entries()) {
    const [ox, oy] = ANCHORS[rank]!;
    for (const [index, id] of island.provinces.entries()) {
      const row = Math.floor(index / 2);
      // [designed] Small alternating offsets break rigid rows while keeping full
      // name boxes inside each region. The coast is drawn around each island.
      const x = ox + (index % 2) * COUNTRY_WIDTH + (row % 2 === 0 ? 0 : 12);
      const y = oy + row * COUNTRY_HEIGHT;
      const variation = (rank + index) % 3;
      const polygon: Point[] = [
        [x - 85, y - 13], [x - 62, y - 25], [x - 13, y - 22 - variation],
        [x + 48, y - 25], [x + 85, y - 12 + variation], [x + 87, y + 10],
        [x + 60, y + 23], [x + 15, y + 25], [x - 47, y + 22], [x - 86, y + 12],
      ];
      geometry.set(id, { polygon, labelAt: [x, y] });
    }
  }
  return {
    ...map,
    bounds: ATLAS,
    provinces: map.provinces.map(p => ({ ...p, ...geometry.get(p.id)! })),
  };
}

/**
 * [designed] A coherent coast encloses the separated country regions. Convex
 * support points receive a 28-unit shore margin and shallow, varying inlets.
 * This is display geography, not adjacency: the graph's explicit lines define
 * neighbours. Inspected MapView.shore's union-by-wide-stroke approach.
 */
export function coastOf(provinces: readonly Province[]): readonly Point[] {
  const points = provinces.flatMap(p => [...p.polygon]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a: Point, b: Point, c: Point) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const half = (values: readonly Point[]) => {
    const result: Point[] = [];
    for (const p of values) {
      while (result.length > 1 && cross(result[result.length - 2]!, result[result.length - 1]!, p) <= 0) result.pop();
      result.push(p);
    }
    result.pop();
    return result;
  };
  const hull = [...half(points), ...half([...points].reverse())];
  const center: Point = [hull.reduce((n, p) => n + p[0], 0) / hull.length, hull.reduce((n, p) => n + p[1], 0) / hull.length];
  const shore = hull.map(([x, y]): Point => {
    const dx = x - center[0], dy = y - center[1], length = Math.hypot(dx, dy);
    return [x + dx / length * 28, y + dy / length * 28];
  });
  return shore.flatMap((a, index): Point[] => {
    const b = shore[(index + 1) % shore.length]!;
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
    const inlet = index % 3 === 0 ? 8 : -6;
    return [a, [(a[0] + b[0]) / 2 - dy / length * inlet, (a[1] + b[1]) / 2 + dx / length * inlet]];
  });
}
