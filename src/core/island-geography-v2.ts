// T95 (#181): the second geography generator. Islands get irregular, elongated
// coasts and their countries are grown as organic regions, instead of the v1
// witness perturbation. Owner, 2026-10-21: island count and sizes may vary per
// seed; 46 countries, connectivity and the fairness rules stay.
//
// Method: a fine hex lattice (integer px corners) is the canvas. Each island is the
// connected set of hexes inside a noisy, rotated ellipse; its countries are grown
// from spread seeds, smallest region first, favouring compact growth. Region and
// coast outlines are traced on hex edges, then every shared chain between two
// junctions is corner-cut once, so both neighbours keep identical borders. All
// arithmetic is integer except Math.sqrt, which IEEE 754 rounds exactly.
import {DeterministicRng} from './rng';
import type {RngSnapshot} from './types';
import type {GeographyFailure, IslandGeography} from './island-geography';

export type Point = readonly [number, number];
export type GeographyV2Result =
  | {ok: true; geography: IslandGeography; attempts: number; failures: GeographyFailure[]; rng: RngSnapshot}
  | {ok: false; attempts: number; failures: GeographyFailure[]; rng: RngSnapshot};

/** Fixed point, as v1: 2048 units per CSS px. */
const Q = 2048;
/** [designed] Larger than v1's 800×460, for open sea around larger countries. */
const WIDTH = 920, HEIGHT = 540, MARGIN = 14;
/** [designed] Hex lattice: 14 px columns, 12 px rows, corners on integer px. */
const COL = 14, ROW = 12;
const CORNERS: readonly Point[] = [[0, -8], [7, -4], [7, 4], [0, 8], [-7, 4], [-7, -4]];
/** [designed] About 26 hexes (≈4400 px²) per country leaves room for the label square. */
const HEXES_PER_COUNTRY = 26;
/** [designed] 46 countries (35-of-46 domination); 7–10 islands of 3–10 countries. */
export const V2_COUNTRY_COUNT = 46;
const ISLANDS_MIN = 7, ISLANDS_MAX = 10, SIZE_MIN = 3, SIZE_MAX = 10;
/** v1's hit square: 40 px around each label, inside its country (checked again on the drawn map). */
const LABEL_SQUARE = 40;
/** v1 label spacing: ≥44 px apart in x or ≥47 px in y. */
const LABEL_GAP_X = 44, LABEL_GAP_Y = 47;
/** [designed] Sea between islands, in hexes, and the corner-cutting passes. */
const SEA_HEXES = 2, SMOOTHING = 6;
const MAX_ATTEMPTS = 40;
/** cos/sin × 1024 for 0°, 22.5°, … 157.5° (an ellipse repeats after 180°). */
const ROTATIONS: readonly Point[] = [[1024, 0], [946, 392], [724, 724], [392, 946], [0, 1024], [-392, 946], [-724, 724], [-946, 392]];

const COLS = Math.floor((WIDTH - 2 * MARGIN) / COL), ROWS = Math.floor((HEIGHT - 2 * MARGIN) / ROW);
const centre = (c: number, r: number): Point => [MARGIN + 7 + c * COL + (r % 2 ? 7 : 0), MARGIN + 8 + r * ROW];
const hexId = (c: number, r: number) => r * COLS + c;
const hexCol = (h: number) => h % COLS, hexRow = (h: number) => Math.floor(h / COLS);
/** Neighbour across edge k (from corner k to corner k+1), odd rows shifted right. */
function neighbour(h: number, k: number): number {
  const c = hexCol(h), r = hexRow(h), odd = r % 2;
  const [dc, dr] = ([[odd, -1], [1, 0], [odd, 1], [odd - 1, 1], [-1, 0], [odd - 1, -1]] as const)[k]!;
  const nc = c + dc, nr = r + dr;
  return nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS ? -1 : hexId(nc, nr);
}
/** Neighbour lists, computed once. */
const NEIGHBOURS: readonly (readonly number[])[] = Array.from({length: COLS * ROWS}, (_, h) => [0, 1, 2, 3, 4, 5].map(k => neighbour(h, k)).filter(n => n >= 0));
const neighbours = (h: number) => NEIGHBOURS[h]!;
const corner = (h: number, k: number): Point => {const [x, y] = centre(hexCol(h), hexRow(h)), [dx, dy] = CORNERS[k % 6]!; return [x + dx, y + dy];};
const pkey = (p: Point) => `${p[0]},${p[1]}`;

/** Value noise in [-512, 512] on a 1024-unit lattice of `cell` px, bilinear in integers. */
function noiseField(rng: DeterministicRng, cell: number) {
  const nx = Math.ceil(WIDTH / cell) + 2, ny = Math.ceil(HEIGHT / cell) + 2;
  const lattice = Array.from({length: nx * ny}, () => rng.nextInt(-512, 512));
  return ([x, y]: Point) => {
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell), fx = Math.floor(((x - gx * cell) * 1024) / cell), fy = Math.floor(((y - gy * cell) * 1024) / cell);
    const at = (i: number, j: number) => lattice[Math.min(ny - 1, j) * nx + Math.min(nx - 1, i)]!;
    const top = at(gx, gy) * (1024 - fx) + at(gx + 1, gy) * fx, bottom = at(gx, gy + 1) * (1024 - fx) + at(gx + 1, gy + 1) * fx;
    return Math.trunc((top * (1024 - fy) + bottom * fy) / (1024 * 1024));
  };
}

/** Sizes 3–10 summing to 46. */
function islandSizes(rng: DeterministicRng): number[] {
  const count = rng.nextInt(ISLANDS_MIN, ISLANDS_MAX), sizes = Array.from({length: count}, () => SIZE_MIN);
  for (let left = V2_COUNTRY_COUNT - count * SIZE_MIN; left > 0; left--) {
    const open = sizes.flatMap((s, i) => s < SIZE_MAX ? [i] : []);
    sizes[open[rng.nextInt(0, open.length - 1)]!]!++;
  }
  return sizes.sort((a, b) => b - a);
}

interface Blob {cx: number; cy: number; rx: number; ry: number; rot: Point}
/** Hexes inside a noisy rotated ellipse, scaled; `d²·1024² < (1024 + n·amp)²`. */
function shape(blob: Blob, scale: number, noise: (p: Point) => number, taken: Uint8Array): number[] {
  const rx = blob.rx * scale / 1024, ry = blob.ry * scale / 1024, reach = Math.max(rx, ry) * 1.6, out: number[] = [];
  const r0 = Math.max(0, Math.floor((blob.cy - reach - MARGIN) / ROW)), r1 = Math.min(ROWS - 1, Math.ceil((blob.cy + reach - MARGIN) / ROW));
  const c0 = Math.max(0, Math.floor((blob.cx - reach - MARGIN) / COL) - 1), c1 = Math.min(COLS - 1, Math.ceil((blob.cx + reach - MARGIN) / COL));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const [x, y] = centre(c, r), dx = x - blob.cx, dy = y - blob.cy;
    if (Math.abs(dx) > reach || Math.abs(dy) > reach || taken[hexId(c, r)]) continue;
    const u = (dx * blob.rot[0] + dy * blob.rot[1]) / 1024, v = (-dx * blob.rot[1] + dy * blob.rot[0]) / 1024;
    const d2 = (u * u) / (rx * rx) + (v * v) / (ry * ry), limit = 1 + (noise([x, y]) * 0.62) / 512;
    if (limit > 0 && d2 < limit * limit) out.push(hexId(c, r));
  }
  return out;
}

/** The connected component through the hex nearest the centre, opened, with enclosed lakes filled. */
function solidify(raw: number[], blob: Blob, taken: Uint8Array): number[] {
  // Opening (erode, then dilate within the shape) trims strands under three hexes wide.
  const all = new Set(raw), core = raw.filter(h => neighbours(h).length === 6 && neighbours(h).every(n => all.has(n)));
  const opened = new Set(core);
  for (const h of core) for (const n of neighbours(h)) if (all.has(n)) opened.add(n);
  const hexes = raw.filter(h => opened.has(h));
  if (!hexes.length) return [];
  const inside = new Set(hexes), dist = (h: number) => {const [x, y] = centre(hexCol(h), hexRow(h)); return (x - blob.cx) ** 2 + (y - blob.cy) ** 2;};
  const start = hexes.reduce((a, b) => dist(b) < dist(a) ? b : a), seen = new Set([start]), queue = [start];
  for (let qi = 0; qi < queue.length; qi++) for (const n of neighbours(queue[qi]!)) if (inside.has(n) && !seen.has(n)) {seen.add(n); queue.push(n);}
  // Sea reachable from the edge of the island's padded bounding box stays sea; anything enclosed becomes land.
  const rows = [...seen].map(hexRow), cols = [...seen].map(hexCol);
  const r0 = Math.min(...rows) - 1, r1 = Math.max(...rows) + 1, c0 = Math.min(...cols) - 1, c1 = Math.max(...cols) + 1;
  const within = (h: number) => hexRow(h) >= r0 && hexRow(h) <= r1 && hexCol(h) >= c0 && hexCol(h) <= c1;
  const sea = new Set<number>(), edge: number[] = [];
  for (let r = Math.max(0, r0); r <= Math.min(ROWS - 1, r1); r++) for (let c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++)
    if ((r === r0 || r === r1 || c === c0 || c === c1 || r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) && !seen.has(hexId(c, r))) {sea.add(hexId(c, r)); edge.push(hexId(c, r));}
  for (let qi = 0; qi < edge.length; qi++) for (const n of neighbours(edge[qi]!)) if (within(n) && !seen.has(n) && !sea.has(n)) {sea.add(n); edge.push(n);}
  const out: number[] = [];
  for (let r = Math.max(0, r0); r <= Math.min(ROWS - 1, r1); r++) for (let c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++) {const h = hexId(c, r); if (seen.has(h) || (!sea.has(h) && !taken[h])) out.push(h);}
  return out.filter(h => seen.has(h) || !taken[h]);
}

/**
 * Partitions `hexes` into `count` contiguous regions: a geodesic Voronoi diagram whose hex
 * costs carry fixed jitter (so borders wander), relaxed toward region centres, with an
 * additive weight per region that shrinks large regions and grows small ones.
 */
function grow(rng: DeterministicRng, hexes: number[], count: number): number[][] | null {
  const inside = new Set(hexes), jitter = new Map(hexes.map(h => [h, rng.nextInt(0, 7)]));
  const at = (h: number) => centre(hexCol(h), hexRow(h));
  let seeds = [hexes[rng.nextInt(0, hexes.length - 1)]!];
  const hops = (from: number[]) => {
    const d = new Map(from.map(h => [h, 0])), q = [...from];
    for (let qi = 0; qi < q.length; qi++) {const h = q[qi]!; for (const n of neighbours(h)) if (inside.has(n) && !d.has(n)) {d.set(n, d.get(h)! + 1); q.push(n);}}
    return d;
  };
  while (seeds.length < count) {const d = hops(seeds); seeds.push(hexes.reduce((a, b) => (d.get(b) ?? 0) > (d.get(a) ?? 0) ? b : a));}
  const weight = seeds.map(() => 0);
  let regions: number[][] = [];
  for (let round = 0; round < 10; round++) {
    // Multi-source Dijkstra in integers, on a binary heap of [cost, hex] (ties by hex id).
    const cost = new Map<number, number>(), owner = new Map<number, number>(), done = new Set<number>(), heap: [number, number][] = [];
    const less = (a: [number, number], b: [number, number]) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
    const push = (e: [number, number]) => {heap.push(e); for (let i = heap.length - 1; i > 0;) {const p = (i - 1) >> 1; if (!less(heap[i]!, heap[p]!)) break; [heap[i], heap[p]] = [heap[p]!, heap[i]!]; i = p;}};
    const pop = () => {const top = heap[0]!, last = heap.pop()!; if (heap.length) {heap[0] = last; for (let i = 0;;) {const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && less(heap[l]!, heap[m]!)) m = l; if (r < heap.length && less(heap[r]!, heap[m]!)) m = r; if (m === i) break; [heap[i], heap[m]] = [heap[m]!, heap[i]!]; i = m;}} return top;};
    seeds.forEach((h, i) => {cost.set(h, weight[i]!); owner.set(h, i); push([weight[i]!, h]);});
    while (heap.length) {
      const [c, best] = pop();
      if (done.has(best) || c !== cost.get(best)) continue;
      done.add(best);
      for (const n of neighbours(best)) if (inside.has(n) && !done.has(n)) {
        const next = c + 10 + jitter.get(n)!;
        if (!cost.has(n) || next < cost.get(n)!) {cost.set(n, next); owner.set(n, owner.get(best)!); push([next, n]);}
      }
    }
    regions = seeds.map((_, i) => hexes.filter(h => owner.get(h) === i));
    if (regions.some(r => !r.length)) return null;
    const mean = hexes.length / count;
    regions.forEach((r, i) => {weight[i] = weight[i]! + Math.round(((r.length - mean) * 24) / mean);});
    // Move each seed to the region hex nearest the region's centroid.
    seeds = regions.map(r => {
      const sx = r.reduce((t, h) => t + at(h)[0], 0), sy = r.reduce((t, h) => t + at(h)[1], 0);
      return r.reduce((a, b) => {const da = (at(a)[0] * r.length - sx) ** 2 + (at(a)[1] * r.length - sy) ** 2, db = (at(b)[0] * r.length - sx) ** 2 + (at(b)[1] * r.length - sy) ** 2; return db < da ? b : a;});
    });
  }
  return regions;
}

/** Directed boundary edges of a hex set, chained into rings (clockwise on screen). */
function rings(hexes: Set<number>): Point[][] {
  const next = new Map<string, Point>(), start: Point[] = [];
  for (const h of hexes) for (let k = 0; k < 6; k++) {
    const n = neighbour(h, k);
    if (n >= 0 && hexes.has(n)) continue;
    const a = corner(h, k), b = corner(h, k + 1);
    next.set(pkey(a), b); start.push(a);
  }
  const used = new Set<string>(), out: Point[][] = [];
  for (const s of start) {
    if (used.has(pkey(s))) continue;
    const ring: Point[] = [];
    for (let p: Point | undefined = s; p && !used.has(pkey(p)); p = next.get(pkey(p))) {used.add(pkey(p)); ring.push(p);}
    out.push(ring);
  }
  return out;
}

/**
 * Smooths an open chain with fixed ends: repeated neighbour averaging (1-2-1) erases the
 * hex-scale ripple and keeps the noise-scale shape, then one corner cut rounds the result.
 * Integer Q units throughout.
 */
function cut(chain: Point[]): Point[] {
  let pts = chain.map(p => [...p] as [number, number]);
  for (let pass = 0; pass < SMOOTHING; pass++)
    pts = pts.map((p, i) => i === 0 || i === pts.length - 1 ? p : [Math.round((pts[i - 1]![0] + 2 * p[0] + pts[i + 1]![0]) / 4), Math.round((pts[i - 1]![1] + 2 * p[1] + pts[i + 1]![1]) / 4)]);
  const out: Point[] = [pts[0]!];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!, b = pts[i + 1]!, near = (t: number): Point => [Math.round((a[0] * (4 - t) + b[0] * t) / 4), Math.round((a[1] * (4 - t) + b[1] * t) / 4)];
    if (i > 0) out.push(near(1));
    if (i < pts.length - 2) out.push(near(3));
  }
  out.push(pts.at(-1)!);
  // Drop repeats that rounding can leave.
  return out.filter((p, i) => i === 0 || pkey(p) !== pkey(out[i - 1]!));
}

const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
export function simple(poly: readonly Point[]): boolean {
  const n = poly.length;
  if (n < 3 || new Set(poly.map(pkey)).size !== n) return false;
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    if (segmentsCross(poly[i]!, poly[(i + 1) % n]!, poly[j]!, poly[(j + 1) % n]!)) return false;
  }
  return true;
}
/** Crossing-number point-in-polygon in integers (half-open rule). */
export function inside(p: Point, poly: readonly Point[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!, b = poly[j]!;
    if ((a[1] > p[1]) !== (b[1] > p[1]) && (p[0] - a[0]) * (b[1] - a[1]) * Math.sign(b[1] - a[1]) < (b[0] - a[0]) * (p[1] - a[1]) * Math.sign(b[1] - a[1])) hit = !hit;
  }
  return hit;
}
/** The square's outline at eight points per side, and its centre, all inside the polygon. */
const squareInside = (c: Point, half: number, poly: readonly Point[]) => {
  if (!inside(c, poly)) return false;
  for (let t = -half; t < half; t += half / 4)
    for (const p of [[c[0] + t, c[1] - half], [c[0] + half, c[1] + t], [c[0] - t, c[1] + half], [c[0] - half, c[1] - t]] as const) if (!inside(p, poly)) return false;
  return true;
};

interface Carved {id: string; island: string; hexes: Set<number>; polygon: Point[]; labelAt: Point; borders: Set<string>}
interface Built {islands: {id: string; hexes: number[]; regions: number[][]; coast: Point[]; provinces: Carved[]}[]}
const scaled = (p: Point): Point => [p[0] * Q, p[1] * Q];

/**
 * Traces one island's countries and coast on hex edges, smooths every chain between
 * junctions once (both neighbours share it), and finds each label: the deepest hex
 * nearest the centroid whose square fits and keeps the v1 spacing from `placed` labels.
 */
function carve(islandId: string, hexes: number[], regions: number[][], base: number, placed: Point[], failures: string[]): {coast: Point[]; provinces: Carved[]} | null {
  const provinces = regions.map((r, i) => ({id: `province_${base + i}`, hexes: new Set(r)}));
  // Edge owners: left = the province, right = its neighbour or the sea (`~`).
  const sideOf = (a: Point, b: Point) => `${pkey(a)}>${pkey(b)}`, owners = new Map<string, string>(), outline = new Map<string, Point[]>();
  for (const p of provinces) {
    const r = rings(p.hexes);
    if (r.length !== 1) {failures.push(`regions: ${p.id} is not a single simple ring`); return null;}
    outline.set(p.id, r[0]!);
    for (let i = 0; i < r[0]!.length; i++) owners.set(sideOf(r[0]![i]!, r[0]![(i + 1) % r[0]!.length]!), p.id);
  }
  const across = (a: Point, b: Point) => owners.get(sideOf(b, a)) ?? '~';
  // Junctions: vertices where the pair of owners changes along a ring.
  const pairAt = (ring: Point[], i: number, id: string) => `${id}|${across(ring[i]!, ring[(i + 1) % ring.length]!)}`;
  const junction = new Set<string>();
  for (const [id, ring] of outline) for (let i = 0; i < ring.length; i++) if (pairAt(ring, i, id) !== pairAt(ring, (i - 1 + ring.length) % ring.length, id)) junction.add(pkey(ring[i]!));
  // A chain is named by its ends and the two owners it separates (two chains may share both ends).
  const chainKey = (a: Point, b: Point, left: string, right: string) => `${pkey(a)}~${pkey(b)}~${left}|${right}`, smoothed = new Map<string, Point[]>();
  const assemble = (ring: Point[], left: (a: Point, b: Point) => string, right: (a: Point, b: Point) => string): Point[] | null => {
    const startAt = ring.findIndex(p => junction.has(pkey(p)));
    if (startAt < 0) return null;
    const turned = [...ring.slice(startAt), ...ring.slice(0, startAt)], out: Point[] = [];
    for (let i = 0; i < turned.length;) {
      let j = i + 1;
      while (j < turned.length && !junction.has(pkey(turned[j]!))) j++;
      const raw = [...turned.slice(i, j), turned[j % turned.length]!], a = raw[0]!, b = raw.at(-1)!, l = left(raw[0]!, raw[1]!), r = right(raw[0]!, raw[1]!);
      let chain = smoothed.get(chainKey(a, b, l, r));
      if (!chain) {const back = smoothed.get(chainKey(b, a, r, l)); chain = back ? [...back].reverse() : cut(raw.map(scaled)); smoothed.set(chainKey(a, b, l, r), chain);}
      out.push(...chain.slice(0, -1));
      i = j;
    }
    return simple(out) ? out : null;
  };
  const carved: Carved[] = [];
  for (const p of provinces) {
    const polygon = assemble(outline.get(p.id)!, () => p.id, across);
    if (!polygon) {failures.push(`polygons: ${p.id} is not simple`); return null;}
    carved.push({id: p.id, island: islandId, hexes: p.hexes, polygon, labelAt: [0, 0], borders: new Set()});
  }
  const coastRings = rings(new Set(hexes));
  // The coast reuses the same smoothed sea chains, so coast and countries agree exactly.
  const coast = coastRings.length === 1 ? assemble(coastRings[0]!, (a, b) => owners.get(sideOf(a, b))!, () => '~') : null;
  if (!coast) {failures.push(`coast: ${islandId} is not one simple ring`); return null;}
  for (const [side, id] of owners) {const [a, b] = side.split('>').map(t => t.split(',').map(Number) as unknown as Point); const other = across(a!, b!); if (other !== '~') carved.find(c => c.id === id)!.borders.add(other);}
  const half = (LABEL_SQUARE / 2) * Q, labels = [...placed];
  for (const c of carved) {
    const depth = new Map<number, number>(), q = [...c.hexes].filter(h => neighbours(h).length < 6 || neighbours(h).some(n => !c.hexes.has(n)));
    for (const h of q) depth.set(h, 0);
    for (let qi = 0; qi < q.length; qi++) {const h = q[qi]!; for (const n of neighbours(h)) if (c.hexes.has(n) && !depth.has(n)) {depth.set(n, depth.get(h)! + 1); q.push(n);}}
    const n = c.hexes.size, sx = [...c.hexes].reduce((t, h) => t + centre(hexCol(h), hexRow(h))[0], 0), sy = [...c.hexes].reduce((t, h) => t + centre(hexCol(h), hexRow(h))[1], 0);
    const spread = (h: number) => {const [x, y] = centre(hexCol(h), hexRow(h)); return (x * n - sx) ** 2 + (y * n - sy) ** 2;};
    // Interior hexes, nearest the centroid first, each tried at 4 px steps up to 12 px around its centre.
    const steps = [0, -4, 4, -8, 8, -12, 12], offsets = steps.flatMap(dx => steps.map(dy => [dx * Q, dy * Q] as const));
    const interior = [...c.hexes].filter(h => (depth.get(h) ?? 0) >= 1).sort((a, b) => spread(a) - spread(b) || a - b);
    let at: Point | undefined;
    for (const h of interior) {
      const [x, y] = scaled(centre(hexCol(h), hexRow(h)));
      at = offsets.map(([dx, dy]): Point => [x + dx, y + dy]).find(p => squareInside(p, half, c.polygon) &&
        labels.every(o => Math.abs(o[0] - p[0]) >= LABEL_GAP_X * Q || Math.abs(o[1] - p[1]) >= LABEL_GAP_Y * Q));
      if (at) break;
    }
    if (!at) {failures.push(`labels: ${c.id} has no ${LABEL_SQUARE} px square clear of other labels`); return null;}
    c.labelAt = at; labels.push(at);
  }
  return {coast, provinces: carved};
}

/** [designed] Regrowths per placement, and placements per island, before the whole attempt is abandoned. */
const ISLAND_TRIES = 8, PLACEMENTS = 3;

/** One attempt: sizes, placement, shapes, regions and their outlines. */
function build(rng: DeterministicRng, failures: string[]): Built | null {
  const sizes = islandSizes(rng), noise = noiseField(rng, 56), detail = noiseField(rng, 22), blocked = new Uint8Array(COLS * ROWS);
  const islands: Built['islands'] = [];
  let base = 0;
  for (const [i, size] of sizes.entries()) {
    const target = size * HEXES_PER_COUNTRY, area = target * COL * ROW, aspect = 1024 + rng.nextInt(200, 1700);
    const rx = Math.sqrt((area * aspect) / (1024 * 3.14159)), ry = (rx * 1024) / aspect, rot = ROTATIONS[rng.nextInt(0, ROTATIONS.length - 1)]!;
    const id = `island_${i}`, labels = islands.flatMap(x => x.provinces.map(p => p.labelAt)), field = (p: Point) => Math.trunc((noise(p) * 2 + detail(p)) / 3);
    let placed: number[] | null = null, done: {regions: number[][]; coast: Point[]; provinces: Carved[]} | null = null;
    // An island whose shape cannot host its countries' labels is placed afresh, up to PLACEMENTS times.
    for (let placement = 0; placement < PLACEMENTS && !done; placement++) {
      placed = null;
      for (let tries = 0; tries < 60 && !placed; tries++) {
        const blob: Blob = {cx: rng.nextInt(MARGIN + 30, WIDTH - MARGIN - 30), cy: rng.nextInt(MARGIN + 24, HEIGHT - MARGIN - 24), rx, ry, rot};
        let scale = 1024;
        for (let fit = 0; fit < 6; fit++) {
          const hexes = solidify(shape(blob, scale, field, blocked), blob, blocked);
          if (hexes.length >= target * 0.85 && hexes.length <= target * 1.2) {placed = hexes; break;}
          if (!hexes.length) break;
          scale = Math.round(scale * Math.sqrt(target / hexes.length));
        }
      }
      if (!placed) {failures.push(`placement: island ${i} of ${size} countries has no room`); return null;}
      for (let t = 0; t < ISLAND_TRIES && !done; t++) {
        const regions = grow(rng, placed, size);
        if (!regions || regions.some(r => r.length < HEXES_PER_COUNTRY * 0.6)) {failures.push(`regions: island ${i} grew an undersized country`); continue;}
        const carved = carve(id, placed, regions, base, labels, failures);
        if (carved) done = {regions, ...carved};
      }
    }
    if (!done || !placed) return null;
    // Keep a sea channel: block the island and SEA_HEXES rings around it for later islands.
    let ring = [...placed];
    for (const h of ring) blocked[h] = 1;
    for (let s = 0; s < SEA_HEXES; s++) {const next: number[] = []; for (const h of ring) for (const n of neighbours(h)) if (!blocked[n]) {blocked[n] = 1; next.push(n);} ring = next;}
    islands.push({id, hexes: placed, ...done});
    base += size;
  }
  return {islands};
}

/** [designed] The archipelago's bounding box plus 20 px of sea, inside the frame, so Fit centres the land. */
function landBounds(coasts: Point[][]) {
  const xs = coasts.flatMap(c => c.map(p => p[0])), ys = coasts.flatMap(c => c.map(p => p[1])), pad = 20 * Q;
  const x = Math.max(0, Math.min(...xs) - pad), y = Math.max(0, Math.min(...ys) - pad);
  return {x, y, width: Math.min(WIDTH * Q, Math.max(...xs) + pad) - x, height: Math.min(HEIGHT * Q, Math.max(...ys) + pad) - y};
}

/** Assembles a built attempt and reserves its sea lanes. */
function finish(rng: DeterministicRng, seed: number, built: Built, failures: string[]): IslandGeography | null {
  const provinces = built.islands.flatMap(i => i.provinces), ownerOf = new Map<number, string>();
  for (const p of provinces) for (const h of p.hexes) ownerOf.set(h, p.id);
  const polygonOf = new Map(provinces.map(p => [p.id, p.polygon])), islandPolygon = new Map(built.islands.map(i => [i.id, i.coast])), borders = new Map(provinces.map(p => [p.id, p.borders]));
  const lanes = reserve(rng, built, provinces, ownerOf, polygonOf, islandPolygon, borders, failures);
  if (!lanes) return null;
  const order = (s: Set<string>) => [...s].sort((a, b) => Number(a.slice(9)) - Number(b.slice(9)));
  return {
    version: 'island-geography-v2', seed, unitsPerPixel: Q, bounds: landBounds(built.islands.map(i => i.coast)),
    islands: built.islands.map(i => ({id: i.id, polygon: i.coast, provinces: i.provinces.map(p => p.id)})),
    provinces: provinces.map(p => ({id: p.id, island: p.island, polygon: p.polygon, labelAt: p.labelAt, borders: order(p.borders)})),
    entranceReservations: lanes,
  } as unknown as IslandGeography;
}

/**
 * Sea lanes: a minimum spanning tree over the islands (closest coastal hexes), then the
 * next shortest pairs up to 1.6 per island. Each lane is straight, at least 20 px, clear
 * of land and other lanes, ≤2 per country, and keeps v1's bonus headroom and fortress rules.
 */
function reserve(rng: DeterministicRng, built: Built, provinces: {id: string; island: string; hexes: Set<number>}[], ownerOf: Map<number, string>,
  polygonOf: Map<string, Point[]>, coasts: Map<string, Point[]>, borders: Map<string, Set<string>>, failures: string[]) {
  void rng;
  const shore = built.islands.map(i => i.hexes.filter(h => neighbours(h).length < 6 || neighbours(h).some(n => !ownerOf.has(n))));
  const pairs: {a: number; b: number; d: number; ha: number; hb: number}[] = [];
  for (let a = 0; a < shore.length; a++) for (let b = a + 1; b < shore.length; b++) {
    let best = {d: Infinity, ha: -1, hb: -1};
    for (const ha of shore[a]!) for (const hb of shore[b]!) {
      const [x1, y1] = centre(hexCol(ha), hexRow(ha)), [x2, y2] = centre(hexCol(hb), hexRow(hb)), d = (x1 - x2) ** 2 + (y1 - y2) ** 2;
      if (d < best.d) best = {d, ha, hb};
    }
    pairs.push({a, b, ...best});
  }
  pairs.sort((x, y) => x.d - y.d || x.a - y.a || x.b - y.b);
  const lanes: {from: string; to: string; points: Point[]}[] = [], count = new Map<string, number>();
  const sizeOf = (i: number) => built.islands[i]!.regions.length;
  const entrances = (i: number) => new Set(lanes.flatMap(l => [l.from, l.to]).filter(id => provinces.find(p => p.id === id)!.island === built.islands[i]!.id)).size;
  const endpoint = (province: string, toward: Point): Point => {
    // The coast vertex of this province nearest the other shore.
    const coast = new Set(coasts.get(provinces.find(p => p.id === province)!.island)!.map(pkey));
    return polygonOf.get(province)!.filter(p => coast.has(pkey(p))).reduce((m, p) => ((p[0] - toward[0]) ** 2 + (p[1] - toward[1]) ** 2 < (m[0] - toward[0]) ** 2 + (m[1] - toward[1]) ** 2 ? p : m));
  };
  const clear = (s: Point, t: Point) => {
    const length = Math.sqrt((t[0] - s[0]) ** 2 + (t[1] - s[1]) ** 2);
    if (length < 20 * Q) return false;
    for (let step = 10 * Q; step < length - 10 * Q; step += 4 * Q) {
      const p: Point = [Math.round(s[0] + ((t[0] - s[0]) * step) / length), Math.round(s[1] + ((t[1] - s[1]) * step) / length)];
      for (const coast of coasts.values()) if (inside(p, coast)) return false;
    }
    return lanes.every(l => !segmentsCross(s, t, l.points[0]!, l.points[1]!) && [l.points[0]!, l.points[1]!].every(e => Math.abs(e[0] - s[0]) + Math.abs(e[1] - s[1]) >= 10 * Q && Math.abs(e[0] - t[0]) + Math.abs(e[1] - t[1]) >= 10 * Q));
  };
  const tryLane = (pair: (typeof pairs)[number]) => {
    const from = ownerOf.get(pair.ha)!, to = ownerOf.get(pair.hb)!;
    if ((count.get(from) ?? 0) >= 2 || (count.get(to) ?? 0) >= 2) return false;
    if (lanes.some(l => (l.from === from && l.to === to) || (l.from === to && l.to === from))) return false;
    if (borders.get(from)!.size + (count.get(from) ?? 0) >= 5 || borders.get(to)!.size + (count.get(to) ?? 0) >= 5) return false;
    const ca = centre(hexCol(pair.ha), hexRow(pair.ha)), cb = centre(hexCol(pair.hb), hexRow(pair.hb));
    const s = endpoint(from, [cb[0] * Q, cb[1] * Q]), t = endpoint(to, [ca[0] * Q, ca[1] * Q]);
    if (!clear(s, t)) return false;
    lanes.push({from, to, points: [s, t]});
    // Bonus headroom (v1): max(2, ⌊n/2⌋ + entrances) ≤ n.
    for (const i of [pair.a, pair.b]) if (Math.max(2, Math.floor(sizeOf(i) / 2) + entrances(i)) > sizeOf(i)) {lanes.pop(); return false;}
    count.set(from, (count.get(from) ?? 0) + 1); count.set(to, (count.get(to) ?? 0) + 1);
    return true;
  };
  const group = built.islands.map((_, i) => i), find = (i: number): number => group[i] === i ? i : (group[i] = find(group[i]!));
  for (const pair of pairs) if (find(pair.a) !== find(pair.b) && tryLane(pair)) group[find(pair.a)] = find(pair.b);
  if (new Set(group.map((_, i) => find(i))).size > 1) {failures.push('lanes: the islands are not all connected'); return null;}
  // Extra lanes: first for fortress islands (one entry, ≥7 countries), then the shortest pairs.
  const degree = (i: number) => lanes.filter(l => [l.from, l.to].some(id => provinces.find(p => p.id === id)!.island === built.islands[i]!.id)).length;
  const wanted = Math.round(built.islands.length * 1.6);
  for (const pair of pairs.filter(p => (degree(p.a) === 1 && sizeOf(p.a) >= 7) || (degree(p.b) === 1 && sizeOf(p.b) >= 7))) tryLane(pair);
  for (const pair of pairs) {if (lanes.length >= wanted) break; tryLane(pair);}
  const single = built.islands.map((_, i) => i).filter(i => degree(i) === 1);
  if (single.some(i => sizeOf(i) >= 7) || single.length > 3) {failures.push('fairness: fortress islands with a single entry'); return null;}
  const bonus = (i: number) => Math.max(2, Math.floor(sizeOf(i) / 2) + entrances(i));
  if (single.reduce((t, i) => t + bonus(i), 0) * 4 > built.islands.reduce((t, _, i) => t + bonus(i), 0)) {failures.push('fairness: single-entry bonus concentration'); return null;}
  return lanes;
}

export function generateIslandGeographyV2WithRng(rng: DeterministicRng, options: {attempts?: number} = {}): GeographyV2Result {
  const requested = options.attempts ?? MAX_ATTEMPTS, budget = Number.isFinite(requested) ? Math.max(0, Math.min(MAX_ATTEMPTS, Math.floor(requested))) : 0;
  const failures: GeographyFailure[] = [];
  for (let attempt = 1; attempt <= budget; attempt++) {
    const reasons: string[] = [], built = build(rng, reasons), geography = built && finish(rng, rng.seed, built, reasons);
    if (geography) return {ok: true, geography, attempts: attempt, failures, rng: rng.snapshot()};
    failures.push({attempt, constraints: reasons, candidate: null} as unknown as GeographyFailure);
  }
  return {ok: false, attempts: budget, failures, rng: rng.snapshot()};
}

export function generateIslandGeographyV2(seed: number, options: {attempts?: number} = {}): GeographyV2Result {
  return generateIslandGeographyV2WithRng(new DeterministicRng(seed), options);
}
