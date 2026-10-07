// Builds data/maps/archipelago.json, the game's one board (T03).
//
// Deterministic construction help: the committed JSON is the deliverable and the
// only source of truth; this script exists so the 46-province, 80-link topology
// with its exact degree histogram is authored once, checked here, and never
// hand-fudged. Same input tables, same output bytes (the only randomness is a
// seeded PRNG for placeholder polygon jitter; seed fixed below).
//
// Structure (traces to the promoted spec, behaviour and design only):
// - 46 provinces, 9 islands sized 3,5,5,10,3,7,3,7,3, each island a consecutive
//   range of the province order (C-BRD-03).
// - Every province at 2..5 neighbours; histogram exactly {2:8, 3:12, 4:22, 5:4};
//   exactly 16 inter-island sea lanes; the whole border-plus-sea-lane graph
//   connected (C-BRD-04). Degree = borders + sea lanes.
// - Island bonuses 2,4,4,8,2,5,2,5,3 in island order (C-BON-02).
// - Names, geometry and adjacency are ours ([designed]): no original name,
//   position or link enters (rule 19).
//
// Run: node tools/board/build-archipelago.mjs  (writes the JSON, then self-checks it)

import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT_PATH = fileURLToPath(new URL("../../data/maps/archipelago.json", import.meta.url));

// ---------------------------------------------------------------------------
// Design tables (hand-derived; the script only assembles and checks them).
// ---------------------------------------------------------------------------

const SEED = 20261007; // fixed: polygon jitter only, never structure
const BOUNDS = { x: 0, y: 0, width: 1920, height: 1080 };

// degrees: total neighbours per province (borders + sea lanes), island-local order.
// lanes:   how many of those are sea lanes; borders = degrees - lanes (2+ in
//          these tables, a [designed] choice — the task fixes only the
//          total-degree histogram).
const ISLANDS = [
  { id: "la_ankro", name: "La Ankro", bonus: 2, center: [300, 250], ring: 90,
    provinces: [
      { id: "ankra_promontoro", name: "Ankra Promontoro", degree: 2, lanes: 0 },
      { id: "katena_golfo", name: "Katena Golfo", degree: 3, lanes: 1 },
      { id: "drifta_kabo", name: "Drifta Kabo", degree: 3, lanes: 1 },
    ] },
  { id: "feria_bordo", name: "Feria Bordo", bonus: 4, center: [760, 210], ring: 130,
    provinces: [
      { id: "fera_kabo", name: "Fera Kabo", degree: 2, lanes: 0 },
      { id: "dunokampo", name: "Dunokampo", degree: 4, lanes: 1 },
      { id: "sableta_flanko", name: "Sableta Flanko", degree: 4, lanes: 1 },
      { id: "kristala_lageto", name: "Kristala Lageto", degree: 4, lanes: 1 },
      { id: "bronza_rifo", name: "Bronza Rifo", degree: 4, lanes: 1 },
    ] },
  { id: "la_du_golfoj", name: "La Du Golfoj", bonus: 4, center: [1250, 250], ring: 130,
    provinces: [
      { id: "norda_golfo", name: "Norda Golfo", degree: 2, lanes: 0 },
      { id: "suda_golfo", name: "Suda Golfo", degree: 3, lanes: 1 },
      { id: "kola_strando", name: "Kola Strando", degree: 3, lanes: 1 },
      { id: "rifokresto", name: "Rifokresto", degree: 4, lanes: 1 },
      { id: "marflusa_pinto", name: "Marflusa Pinto", degree: 4, lanes: 1 },
    ] },
  { id: "kroninsulo", name: "Kroninsulo", bonus: 8, center: [1000, 620], ring: 220,
    provinces: [
      { id: "kronurbo", name: "Kronurbo", degree: 5, lanes: 1 },
      { id: "regejo", name: "Regejo", degree: 5, lanes: 1 },
      { id: "standarda_turo", name: "Standarda Turo", degree: 5, lanes: 1 },
      { id: "ostobanko", name: "Ostobanko", degree: 5, lanes: 1 },
      { id: "kaverna_enirejo", name: "Kaverna Enirejo", degree: 4, lanes: 1 },
      { id: "olivvalo", name: "Olivvalo", degree: 4, lanes: 1 },
      { id: "pinaro", name: "Pinaro", degree: 4, lanes: 0 },
      { id: "salofanto", name: "Salofanto", degree: 4, lanes: 0 },
      { id: "kolonado", name: "Kolonado", degree: 4, lanes: 0 },
      { id: "krona_haveno", name: "Krona Haveno", degree: 4, lanes: 0 },
    ] },
  { id: "sudaj_rifoj", name: "Sudaj Rifoj", bonus: 2, center: [1650, 350], ring: 90,
    provinces: [
      { id: "rifohaveno", name: "Rifohaveno", degree: 2, lanes: 0 },
      { id: "koralvico", name: "Koralvico", degree: 2, lanes: 0 },
      { id: "suda_fajro", name: "Suda Fajro", degree: 4, lanes: 2 },
    ] },
  { id: "ventokruco", name: "Ventokruco", bonus: 5, center: [450, 700], ring: 170,
    provinces: [
      { id: "ventmuelejo", name: "Ventmuelejo", degree: 2, lanes: 0 },
      { id: "eklipsa_valo", name: "Eklipsa Valo", degree: 2, lanes: 0 },
      { id: "nebula_kresto", name: "Nebula Kresto", degree: 3, lanes: 1 },
      { id: "flagoturo", name: "Flagoturo", degree: 3, lanes: 1 },
      { id: "stelejo", name: "Stelejo", degree: 4, lanes: 1 },
      { id: "brulmontaro", name: "Brulmontaro", degree: 4, lanes: 1 },
      { id: "krestofluo", name: "Krestofluo", degree: 4, lanes: 0 },
    ] },
  { id: "la_perloj", name: "La Perloj", bonus: 2, center: [220, 900], ring: 90,
    provinces: [
      { id: "perlejado", name: "Perlejado", degree: 3, lanes: 1 },
      { id: "konkujo", name: "Konkujo", degree: 3, lanes: 1 },
      { id: "stelmano", name: "Stelmano", degree: 3, lanes: 1 },
    ] },
  { id: "nigra_arko", name: "Nigra Arko", bonus: 5, center: [1400, 830], ring: 170,
    provinces: [
      { id: "obsidiana_kolo", name: "Obsidiana Kolo", degree: 3, lanes: 1 },
      { id: "karbujo", name: "Karbujo", degree: 3, lanes: 1 },
      { id: "silenca_ravino", name: "Silenca Ravino", degree: 4, lanes: 1 },
      { id: "vesperejo", name: "Vesperejo", degree: 4, lanes: 1 },
      { id: "ombra_rando", name: "Ombra Rando", degree: 4, lanes: 0 },
      { id: "fajroturo", name: "Fajroturo", degree: 4, lanes: 0 },
      { id: "nokta_flanko", name: "Nokta Flanko", degree: 4, lanes: 0 },
    ] },
  { id: "fora_halo", name: "Fora Halo", bonus: 3, center: [1750, 650], ring: 90,
    provinces: [
      { id: "haloa_pinto", name: "Haloa Pinto", degree: 2, lanes: 0 },
      { id: "marmora_strando", name: "Marmora Strando", degree: 3, lanes: 1 },
      { id: "orienta_kabo", name: "Orienta Kabo", degree: 4, lanes: 2 },
    ] },
];

// The 16 sea lanes, island-level, in assignment order. Each island's incident
// count here must equal the sum of its provinces' `lanes` above:
//   la_ankro 2, feria_bordo 4, la_du_golfoj 4, kroninsulo 6, sudaj_rifoj 2,
//   ventokruco 4, la_perloj 3, nigra_arko 4, fora_halo 3  (total 32 = 16 links).
// The whole border-plus-lane graph's connectivity is checked on the written
// file below; nothing stronger is required.
const ISLAND_LINKS = [
  ["la_ankro", "feria_bordo"],
  ["feria_bordo", "la_du_golfoj"],
  ["la_du_golfoj", "kroninsulo"],
  ["kroninsulo", "ventokruco"],
  ["ventokruco", "nigra_arko"],
  ["nigra_arko", "fora_halo"],
  ["la_perloj", "nigra_arko"],
  ["kroninsulo", "sudaj_rifoj"],
  ["sudaj_rifoj", "la_ankro"],
  ["kroninsulo", "fora_halo"],
  ["kroninsulo", "feria_bordo"],
  ["kroninsulo", "la_du_golfoj"],
  ["feria_bordo", "ventokruco"],
  ["la_perloj", "la_du_golfoj"],
  ["ventokruco", "la_perloj"],
  ["nigra_arko", "fora_halo"],
];

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

/** Seeded PRNG (mulberry32): polygon jitter only; structure is table-driven. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);

const globalIndex = new Map(); // province id -> index in province order
{
  let next = 0;
  for (const island of ISLANDS) {
    for (const p of island.provinces) {
      if (globalIndex.has(p.id)) throw new Error(`duplicate province id ${p.id}`);
      globalIndex.set(p.id, next++);
    }
  }
}

/** Island-internal land borders: Havel–Hakimi over the island's border-degree
 *  table (borders = degree - lanes per province, all inside the island).
 *  Deterministic and free of any connectivity aim — the task asks only that
 *  the whole border-plus-sea-lane graph be connected, which the self-check
 *  below verifies on the written file. */
function islandBorders(island) {
  const n = island.provinces.length;
  const need = island.provinces.map((p) => p.degree - p.lanes);
  // Table guards: a plausible border-degree sequence (non-negative, even sum,
  // fits in the island). These tables also give every province 2+ borders — a
  // [designed] choice of the tables, not a task constant; the task fixes only
  // the total-degree histogram (C-BRD-04).
  if (need.some((b) => b < 0)) throw new Error(`${island.id}: a province would have negative borders`);
  if (need.reduce((a, b) => a + b, 0) % 2 !== 0) throw new Error(`${island.id}: odd border-degree sum`);
  const maxEdges = (n * (n - 1)) / 2;
  if (need.reduce((a, b) => a + b, 0) / 2 > maxEdges) throw new Error(`${island.id}: too many borders for its size`);

  // Repeatedly join the lowest-index province with the largest residual to the
  // next-lowest-index provinces with residual, one edge each.
  const residual = [...need];
  const edges = new Set();
  const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  for (;;) {
    const open = residual
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r > 0)
      .sort((a, b) => (b.r - a.r) || (a.i - b.i));
    if (open.length === 0) break;
    if (open[0].r > open.length - 1) throw new Error(`${island.id}: border table is not graphical`);
    const u = open[0].i;
    for (const { i: v } of open.slice(1, 1 + open[0].r)) {
      edges.add(key(u, v));
      residual[u]--;
      residual[v]--;
    }
  }
  return [...edges].map((k) => k.split("|").map((i) => island.provinces[Number(i)].id));
}

/** Sea lanes: walk ISLAND_LINKS in order, giving each island's end to its next
 *  province that still has lane quota. */
function seaLanes() {
  const quota = new Map();
  for (const island of ISLANDS) {
    for (const p of island.provinces) if (p.lanes > 0) quota.set(p.id, p.lanes);
  }
  const byIsland = new Map(ISLANDS.map((i) => [i.id, i]));
  const pointer = new Map(ISLANDS.map((i) => [i.id, 0]));
  const links = [];
  const used = new Set();
  for (const [aId, bId] of ISLAND_LINKS) {
    const pick = (islandId) => {
      const island = byIsland.get(islandId);
      const n = island.provinces.length;
      for (let step = 0; step < n; step++) {
        const p = island.provinces[(pointer.get(islandId) + step) % n];
        if ((quota.get(p.id) ?? 0) > 0) {
          pointer.set(islandId, (pointer.get(islandId) + step + 1) % n);
          return p.id;
        }
      }
      throw new Error(`${islandId}: no lane quota left for a promised link`);
    };
    const a = pick(aId);
    const b = pick(bId);
    const pairKey = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (used.has(pairKey)) throw new Error(`duplicate sea lane ${pairKey}`);
    used.add(pairKey);
    quota.set(a, quota.get(a) - 1);
    quota.set(b, quota.get(b) - 1);
    links.push([a, b]);
  }
  const leftover = [...quota.entries()].filter(([, q]) => q !== 0);
  if (leftover.length > 0) throw new Error(`unspent lane quota: ${JSON.stringify(leftover)}`);
  return links;
}

// Geometry: provinces sit on a ring around their island centre; the polygon is
// an irregular octagon around that point ([designed]: placeholder only).
function layout(island, provinceIndexInIsland) {
  const n = island.provinces.length;
  const angle = (2 * Math.PI * provinceIndexInIsland) / n + ISLANDS.indexOf(island) * 0.35;
  const cx = island.center[0] + island.ring * Math.cos(angle);
  const cy = island.center[1] + island.ring * Math.sin(angle);
  const polygon = [];
  for (let k = 0; k < 8; k++) {
    const a = angle + (2 * Math.PI * k) / 8;
    const r = 36 + 9 * rng();
    polygon.push([
      Math.round((cx + r * Math.cos(a)) * 10) / 10,
      Math.round((cy + r * Math.sin(a)) * 10) / 10,
    ]);
  }
  return { polygon, label: [Math.round(cx * 10) / 10, Math.round(cy * 10) / 10] };
}

// --- assemble ---
const borderEdges = ISLANDS.flatMap(islandBorders);
const laneEdges = seaLanes();

const bordersOf = new Map();
for (const id of globalIndex.keys()) bordersOf.set(id, []);
const lanesOf = new Map([...globalIndex.keys()].map((id) => [id, []]));
for (const [a, b] of borderEdges) { bordersOf.get(a).push(b); bordersOf.get(b).push(a); }
for (const [a, b] of laneEdges) { lanesOf.get(a).push(b); lanesOf.get(b).push(a); }

const provinces = [];
for (const island of ISLANDS) {
  island.provinces.forEach((p, k) => {
    const { polygon, label } = layout(island, k);
    provinces.push({
      id: p.id,
      name: p.name,
      island: island.id,
      borders: bordersOf.get(p.id),
      sea_lanes: lanesOf.get(p.id),
      polygon,
      label_at: label,
    });
  });
}

const map = {
  schema: 1,
  id: "arkipelago",
  name: "La Arkipelago",
  bounds: BOUNDS,
  islands: ISLANDS.map((i) => ({
    id: i.id,
    name: i.name,
    bonus: i.bonus,
    provinces: i.provinces.map((p) => p.id),
  })),
  provinces,
};

writeFileSync(OUT_PATH, JSON.stringify(map, null, 2) + "\n");
console.log(`wrote ${OUT_PATH}`);

// ---------------------------------------------------------------------------
// Self-checks (the test suite re-checks all of this against the written file)
// ---------------------------------------------------------------------------

const check = (ok, msg) => { if (!ok) throw new Error(`self-check failed: ${msg}`); };
const written = JSON.parse(readFileSync(OUT_PATH, "utf8"));

check(written.provinces.length === 46, "46 provinces");
check(written.islands.length === 9, "9 islands");
check(JSON.stringify(written.islands.map((i) => i.provinces.length)) === "[3,5,5,10,3,7,3,7,3]", "island sizes 3,5,5,10,3,7,3,7,3");
check(JSON.stringify(written.islands.map((i) => i.bonus)) === "[2,4,4,8,2,5,2,5,3]", "bonuses 2,4,4,8,2,5,2,5,3");

// Each island's list is a consecutive range of the province order (C-BRD-03).
{
  let cursor = 0;
  for (const island of written.islands) {
    for (const pid of island.provinces) {
      check(written.provinces[cursor].id === pid, `island ${island.id} consecutive at ${pid}`);
      cursor++;
    }
  }
  check(cursor === 46, "ranges tile the province order");
}

// Degree histogram (C-BRD-04): borders + sea lanes per province.
{
  const hist = {};
  for (const p of written.provinces) {
    const d = p.borders.length + p.sea_lanes.length;
    hist[d] = (hist[d] ?? 0) + 1;
  }
  check(JSON.stringify(hist) === JSON.stringify({ 2: 8, 3: 12, 4: 22, 5: 4 }), `degree histogram ${JSON.stringify(hist)}`);
}

// Sea lanes: 16 undirected, 32 directed, symmetric, cross-island only.
{
  const byId = new Map(written.provinces.map((p) => [p.id, p]));
  let directed = 0;
  const undirected = new Set();
  for (const p of written.provinces) {
    for (const t of p.sea_lanes) {
      directed++;
      const other = byId.get(t);
      check(other !== undefined && other.island !== p.island, `lane ${p.id}->${t} leaves its island`);
      check(other.sea_lanes.includes(p.id), `lane ${p.id}->${t} returned`);
      undirected.add(p.id < t ? `${p.id}|${t}` : `${t}|${p.id}`);
    }
    for (const t of p.borders) check(byId.get(t).island === p.island, `border ${p.id}->${t} stays on its island`);
  }
  check(directed === 32, `32 directed lane entries, got ${directed}`);
  check(undirected.size === 16, `16 undirected lanes, got ${undirected.size}`);
}

// Connectivity: one connected border-plus-lane graph. C-BRD-04 asks for the
// whole graph only; no per-island land-connectivity is required, so none is
// checked here or in the test suite.
{
  const byId = new Map(written.provinces.map((p) => [p.id, p]));
  const bfs = (start, edges) => {
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length > 0) {
      const cur = queue.shift();
      for (const t of edges(byId.get(cur))) if (!seen.has(t)) { seen.add(t); queue.push(t); }
    }
    return seen;
  };
  const all = bfs(written.provinces[0].id, (p) => [...p.borders, ...p.sea_lanes]);
  check(all.size === 46, `whole graph connected, reached ${all.size}`);
}

// Labels inside bounds; polygons have at least 3 points.
for (const p of written.provinces) {
  const [x, y] = p.label_at;
  check(x >= BOUNDS.x && x <= BOUNDS.x + BOUNDS.width && y >= BOUNDS.y && y <= BOUNDS.y + BOUNDS.height, `label of ${p.id} in bounds`);
  check(p.polygon.length >= 3, `polygon of ${p.id} has 3+ points`);
}

console.log("self-checks passed: 46 provinces, 9 islands, degrees {2:8,3:12,4:22,5:4}, 16 sea lanes, connected");
