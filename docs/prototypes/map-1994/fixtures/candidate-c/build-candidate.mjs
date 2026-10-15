import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const evidence = resolve(dir, "../../preflight-20261015-a/input");
const source = JSON.parse(await readFile(resolve(evidence, "seed1994.json"), "utf8"));
const state = JSON.parse(await readFile(resolve(evidence, "seed1994-state.json"), "utf8"));
const layout = {
  island_0: { x: 735, y: 165, rx: 110, ry: 75, phase: 1 },
  island_1: { x: 1280, y: 180, rx: 110, ry: 75, phase: 2 },
  island_2: { x: 425, y: 440, rx: 110, ry: 75, phase: 3 },
  island_3: { x: 620, y: 755, rx: 110, ry: 75, phase: 4 },
  island_4: { x: 780, y: 390, rx: 145, ry: 96, phase: 5 },
  island_5: { x: 1220, y: 460, rx: 140, ry: 95, phase: 6 },
  island_6: { x: 240, y: 690, rx: 165, ry: 112, phase: 7 },
  island_7: { x: 230, y: 190, rx: 165, ry: 112, phase: 8 },
  island_8: { x: 1010, y: 720, rx: 195, ry: 130, phase: 9 },
};
const TAU = Math.PI * 2;
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const area = (poly) => poly.reduce((sum, p, i) => sum + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0) / 2;
function hull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const half = [];
  for (const p of sorted) {
    while (half.length > 1 && cross(half.at(-2), half.at(-1), p) <= 0) half.pop();
    half.push(p);
  }
  const lower = half.length;
  for (const p of sorted.slice(0, -1).reverse()) {
    while (half.length > lower && cross(half.at(-2), half.at(-1), p) <= 0) half.pop();
    half.push(p);
  }
  half.pop();
  return half;
}
function clip(poly, a, b, c) {
  const result = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const fp = a * p[0] + b * p[1] - c, fq = a * q[0] + b * q[1] - c;
    if (fp <= 1e-7) result.push(p);
    if ((fp < -1e-7 && fq > 1e-7) || (fp > 1e-7 && fq < -1e-7)) {
      const t = fp / (fp - fq);
      result.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return result;
}
const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
function sharedLength(a, b) {
  let amount = 0;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    const p = a[i], q = a[(i + 1) % a.length], r = b[j], s = b[(j + 1) % b.length];
    if (Math.abs(cross(p, q, r)) > 1e-4 || Math.abs(cross(p, q, s)) > 1e-4) continue;
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (len < 1e-4) continue;
    const u = [(q[0] - p[0]) / len, (q[1] - p[1]) / len];
    const dot = (v) => v[0] * u[0] + v[1] * u[1];
    amount += Math.max(0, Math.min(Math.max(dot(p), dot(q)), Math.max(dot(r), dot(s))) - Math.max(Math.min(dot(p), dot(q)), Math.min(dot(r), dot(s))));
  }
  return amount;
}
function coastPoint(poly, toward) {
  return poly.flatMap((a, i) => {
    const b = poly[(i + 1) % poly.length];
    return [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]];
  }).sort((a, b) => dist2(a, toward) - dist2(b, toward))[0];
}
function onSegment(p, a, b) {
  return Math.abs(cross(a, b, p)) < 1e-4 && p[0] >= Math.min(a[0], b[0]) - 1e-4 && p[0] <= Math.max(a[0], b[0]) + 1e-4 && p[1] >= Math.min(a[1], b[1]) - 1e-4 && p[1] <= Math.max(a[1], b[1]) + 1e-4;
}
function touchesCoast(cell, point) {
  return cell.some((a, i) => onSegment(point, a, cell[(i + 1) % cell.length]));
}
function pair(a, b) { return [a, b].sort().join("--"); }
function inside(point, poly) {
  let result = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
}
function segmentsCross(a, b, c, d) {
  const first = cross(a, b, c), second = cross(a, b, d), third = cross(c, d, a), fourth = cross(c, d, b);
  return first * second < -1e-7 && third * fourth < -1e-7;
}
function clearToLand(point, polygon) {
  return polygon.some((a, i) => onSegment(point, a, polygon[(i + 1) % polygon.length]));
}
function safeCenter(poly) {
  let minX = Math.min(...poly.map((p) => p[0])), maxX = Math.max(...poly.map((p) => p[0]));
  let minY = Math.min(...poly.map((p) => p[1])), maxY = Math.max(...poly.map((p) => p[1]));
  let best = [0, 0], bestClearance = -1, step = Math.max(maxX - minX, maxY - minY) / 12;
  while (step > 0.75) {
    const x0 = bestClearance < 0 ? minX : Math.max(minX, best[0] - step * 3);
    const x1 = bestClearance < 0 ? maxX : Math.min(maxX, best[0] + step * 3);
    const y0 = bestClearance < 0 ? minY : Math.max(minY, best[1] - step * 3);
    const y1 = bestClearance < 0 ? maxY : Math.min(maxY, best[1] + step * 3);
    for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) if (inside([x, y], poly)) {
      let clearance = Infinity;
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dy = b[1] - a[1];
        const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
        clearance = Math.min(clearance, Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy));
      }
      if (clearance > bestClearance) { best = [x, y]; bestClearance = clearance; }
    }
    step /= 2;
  }
  return best;
}

const coastProfile = [
  [-0.18, -1], [-0.44, -0.86], [-0.62, -0.68], [-0.79, -0.48], [-0.72, -0.32],
  [-0.91, -0.13], [-0.78, 0.02], [-0.63, 0.16], [-0.82, 0.31], [-0.74, 0.52],
  [-0.55, 0.68], [-0.28, 0.84], [0.08, 1], [0.34, 0.82], [0.61, 0.70],
  [0.84, 0.51], [0.72, 0.32], [0.94, 0.12], [0.73, -0.04], [0.62, -0.22],
  [0.85, -0.40], [0.70, -0.62], [0.43, -0.82], [0.12, -0.95],
];

const islands = source.islands.map((sourceIsland) => {
  const cfg = layout[sourceIsland.id];
  const polygon = coastProfile.map(([x, y], i) => {
    const coast = 1 + 0.018 * Math.sin(i * 2.1 + cfg.phase) + 0.012 * Math.cos(i * 1.7 - cfg.phase);
    return [cfg.x + cfg.rx * x * coast, cfg.y + cfg.ry * y * coast];
  });
  if (area(polygon) < 0) polygon.reverse();
  const ids = sourceIsland.provinces;
  const rows = ids.length === 3 ? [1, 2] : ids.length === 5 ? [2, 3] : ids.length === 7 ? [3, 4] : [3, 4, 3];
  const fractions = rows.map((count) => count / ids.length);
  const minY = Math.min(...polygon.map((p) => p[1])), maxY = Math.max(...polygon.map((p) => p[1]));
  const cells = [];
  let first = 0, y0 = minY;
  for (let ri = 0; ri < rows.length; ri++) {
    const y1 = ri === rows.length - 1 ? maxY : y0 + (maxY - minY) * fractions[ri];
    const band = clip(clip(polygon, 0, -1, -y0), 0, 1, y1);
    const minX = Math.min(...band.map((p) => p[0])), maxX = Math.max(...band.map((p) => p[0]));
    for (let ci = 0; ci < rows[ri]; ci++) {
      const x0 = minX + (maxX - minX) * ci / rows[ri], x1 = minX + (maxX - minX) * (ci + 1) / rows[ri];
      const cell = clip(clip(band, -1, 0, -x0), 1, 0, x1);
      const id = ids[first + ci];
      cells.push({ id, polygon: cell, center: safeCenter(cell) });
    }
    first += rows[ri]; y0 = y1;
  }
  return { ...sourceIsland, polygon, cells };
});
const provinces = islands.flatMap((island) => island.cells.map((cell) => {
  const original = source.provinces.find((p) => p.id === cell.id);
  return { id: cell.id, name: original.name, island: island.id, polygon: cell.polygon, center: cell.center,
    owner: state.ownerOf[cell.id], armies: state.armies[cell.id], production: state.productionCentres.includes(cell.id) };
}));
const byId = new Map(provinces.map((p) => [p.id, p]));
for (const p of provinces) p.land = provinces.filter((q) => q.island === p.island && q.id !== p.id && sharedLength(p.polygon, q.polygon) > 1e-5).map((q) => q.id).sort();
const islandEdges = [];
const candidates = [];
for (let i = 0; i < islands.length; i++) for (let j = i + 1; j < islands.length; j++) {
  const a = islands[i], b = islands[j];
  candidates.push({ a, b, d: dist2([layout[a.id].x, layout[a.id].y], [layout[b.id].x, layout[b.id].y]) });
}
const connected = new Set([islands[0].id]);
while (connected.size < islands.length) {
  const edge = candidates.filter((e) => connected.has(e.a.id) !== connected.has(e.b.id)).sort((a, b) => a.d - b.d)[0];
  connected.add(edge.a.id); connected.add(edge.b.id);
  islandEdges.push(edge);
}
function routeFor({ a, b }) {
  const ca = [layout[a.id].x, layout[a.id].y], cb = [layout[b.id].x, layout[b.id].y];
  const sourcePoint = coastPoint(a.polygon, cb), targetPoint = coastPoint(b.polygon, ca);
  const from = a.cells.find((cell) => touchesCoast(cell.polygon, sourcePoint))?.id;
  const to = b.cells.find((cell) => touchesCoast(cell.polygon, targetPoint))?.id;
  if (!from || !to) throw new Error(`coastal route endpoint has no province: ${a.name}/${b.name}`);
  return { kind: "sea", from, to, islands: [a.id, b.id], path: [sourcePoint, targetPoint] };
}
function routeClear(route, previous) {
  for (const island of islands.filter((i) => !route.islands.includes(i.id))) for (let n = 1; n < 20; n++) {
    const t = n / 20, p = [route.path[0][0] + t * (route.path[1][0] - route.path[0][0]), route.path[0][1] + t * (route.path[1][1] - route.path[0][1])];
    if (inside(p, island.polygon)) return false;
  }
  for (const other of previous) {
    const shared = route.from === other.from || route.from === other.to || route.to === other.from || route.to === other.to;
    if (!shared && segmentsCross(route.path[0], route.path[1], other.path[0], other.path[1])) return false;
  }
  return true;
}
const routes = [];
for (const edge of islandEdges) {
  const route = routeFor(edge);
  routes.push(route);
}
for (const edge of candidates.filter((e) => !islandEdges.some((m) => pair(m.a.id, m.b.id) === pair(e.a.id, e.b.id))).sort((a, b) => a.d - b.d)) {
  if (routes.length >= 16) break;
  const route = routeFor(edge);
  if (routeClear(route, routes)) routes.push(route);
}
for (const p of provinces) p.sea = routes.flatMap((r) => r.from === p.id ? [r.to] : r.to === p.id ? [r.from] : []).sort();
const current = Object.fromEntries(source.provinces.map((p) => [p.id, { land: p.borders.slice().sort(), sea: p.seaLanes.slice().sort() }]));
const proposedAdjacency = Object.fromEntries(provinces.map((p) => [p.id, { land: p.land, sea: p.sea }]));
const names = new Map(source.provinces.map((p) => [p.id, p.name]));
const edges = (adj, kind) => [...new Set(Object.entries(adj).flatMap(([id, links]) => links[kind].map((to) => pair(id, to))))].sort();
const changes = {
  landAdded: edges(proposedAdjacency, "land").filter((p) => !edges(current, "land").includes(p)),
  landRemoved: edges(current, "land").filter((p) => !edges(proposedAdjacency, "land").includes(p)),
  seaAdded: edges(proposedAdjacency, "sea").filter((p) => !edges(current, "sea").includes(p)),
  seaRemoved: edges(current, "sea").filter((p) => !edges(proposedAdjacency, "sea").includes(p)),
};
for (const changeList of Object.values(changes)) changeList.sort((a, b) => a.localeCompare(b));
const currentSeaPairs = edges(current, "sea");
const currentRoutes = currentSeaPairs.map((edge) => {
  const [from, to] = edge.split("--"), a = source.provinces.find((p) => p.id === from), b = source.provinces.find((p) => p.id === to);
  const ca = a.labelAt, cb = b.labelAt;
  return { from, to, path: [coastPoint(a.polygon, cb), coastPoint(b.polygon, ca)] };
});
const currentLandRoutes = edges(current, "land").map((edge) => {
  const [from, to] = edge.split("--"), a = source.provinces.find((p) => p.id === from), b = source.provinces.find((p) => p.id === to);
  return { from, to, path: [a.labelAt, b.labelAt] };
});
const data = { bounds: { x: 0, y: 0, width: 1480, height: 860 }, islands: islands.map(({ cells, ...i }) => i), provinces, current, currentRoutes, currentLandRoutes, proposed: { adjacency: proposedAdjacency, routes, changes } };
const original = { ...source, bounds: { x: 0, y: 0, width: 1480, height: 860 }, provinces: source.provinces.map((p) => ({ ...p, owner: state.ownerOf[p.id], armies: state.armies[p.id], production: state.productionCentres.includes(p.id) })) };
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seed 1994 — geographic map study</title>
<style>
:root{color-scheme:dark;--ink:#e8eee9;--muted:#a7b9b0;--sea:#092c3b;--panel:#102d38;--line:#315260;--gold:#e8c483;--red:#cc8066;--seat1:#d99a62;--seat2:#6bb5b0}*{box-sizing:border-box}body{margin:0;background:#071f2a;color:var(--ink);font:15px/1.35 system-ui,-apple-system,Segoe UI,sans-serif}header{padding:16px 22px 12px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:16px}h1{font:600 20px/1.2 Georgia,serif;margin:0 0 3px;letter-spacing:.02em}.sub{color:var(--muted);font-size:12px}.stamp{font-weight:700;font-size:11px;letter-spacing:.09em;color:#f2c5a8;border:1px solid #805542;background:#30241f;padding:7px 10px;border-radius:5px;white-space:nowrap}main{padding:13px 18px 18px}.notice{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:10px;padding:8px 11px;border-left:3px solid var(--gold);background:#102f3a;color:#d7e2dd;font-size:12px}.notice strong{color:#f1d294}.layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:14px;align-items:stretch}.map-panel{position:relative;min-height:630px;border:1px solid #31505b;border-radius:8px;overflow:hidden;background:radial-gradient(ellipse at 52% 46%,#124659 0,#0b3547 52%,#092c3b 100%)}#map-board{width:100%;height:100%;min-height:630px;display:block}aside{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px;overflow:auto;max-height:calc(100vh - 170px)}h2{font:600 14px Georgia,serif;margin:0 0 7px;color:#f0d7a2}.group{margin-bottom:14px}.tools{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 9px}button{border:1px solid #53717a;border-radius:5px;background:#163b49;color:var(--ink);padding:7px 10px;font:600 12px system-ui;cursor:pointer}button:hover,button:focus-visible{outline:2px solid #e8c483;outline-offset:1px}button[aria-pressed=true]{background:#846d42;border-color:#e8c483;color:white}.small{font-size:11px;color:var(--muted)}.island-list,.diff-list{font-size:11px;color:#d1dcd6;line-height:1.5}.island-row{display:flex;justify-content:space-between;border-bottom:1px solid #24434d;padding:3px 0}.selected-title{font:600 14px Georgia,serif;color:#f0d7a2}.selected-meta{color:var(--muted);font-size:11px}.links{margin:4px 0 0;padding-left:17px;font-size:11px}.diff-list ul{padding-left:17px;margin:2px 0 8px}.key{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:#c2d0cb;margin-top:7px}.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px;background:var(--seat1)}.dot.s2{background:var(--seat2)}
svg text{font-family:system-ui,-apple-system,Segoe UI,sans-serif;pointer-events:none}.island-shape{fill:#184a43;stroke:#73a58b;stroke-width:5;stroke-linejoin:round;filter:drop-shadow(0 12px 8px #03172099)}.island-name{fill:#a3bea9;font:italic 18px Georgia,serif;letter-spacing:.12em;text-anchor:middle;opacity:.75}.province-shape{stroke:#d9cfaa;stroke-width:3;stroke-linejoin:round;cursor:pointer;transition:fill .15s,stroke .15s}.province:hover .province-shape{filter:brightness(1.17)}.province.is-selected .province-shape{stroke:#fff2c8;stroke-width:7;filter:drop-shadow(0 0 8px #ffe2a2)}.province.is-neighbor .province-shape{stroke:#f3d07e;stroke-width:5}.province-name{fill:#132a2c;font-size:26px;font-weight:650;text-anchor:middle;paint-order:stroke;stroke:#f4e6c8;stroke-width:3px;stroke-linejoin:round}.army-count{fill:#f9f0d7;font-size:19px;font-weight:750;text-anchor:middle}.owner-label{fill:#f8f1dd;font-size:12px;letter-spacing:.05em;text-anchor:middle;font-weight:800}.army-disc{stroke:#fff0cc;stroke-width:2}.production-mark{fill:#f5d685;stroke:#513e20;stroke-width:2}.sea-route{fill:none;stroke:#dbbd78;stroke-width:4;stroke-dasharray:10 8;opacity:.9}.sea-end{fill:#f5d18b;stroke:#0a3440;stroke-width:4}.current-grid .province-shape{stroke:#d9cfaa;stroke-width:4}.current-grid .island-shape{display:none}.route-label{fill:#f1d294;font-size:14px;font-weight:650;paint-order:stroke;stroke:#092c3b;stroke-width:5px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:1050px){.layout{grid-template-columns:minmax(0,1fr) 220px}.map-panel,#map-board{min-height:580px}aside{max-height:calc(100vh - 150px)}}@media(max-width:760px){header{align-items:flex-start;flex-direction:column}.layout{grid-template-columns:1fr}.map-panel,#map-board{min-height:560px}aside{max-height:none}}
</style></head><body>
<header><div><h1>Seed 1994 · The Nine Isles</h1><div class="sub">A designed geographic reading of the two-seat opening board</div></div><div class="stamp">VISUAL PROTOTYPE · NOT THE PLAYABLE GRAPH</div></header>
<main><div class="notice"><span><strong>Proposal:</strong> province boundaries and travel links follow this new geography. Existing rules remain represented by the Current view.</span><span>46 provinces · 9 islands</span></div>
<div class="layout"><section class="map-panel" id="map-board" aria-label="Interactive island map"></section><aside>
<div class="group"><h2>Map view</h2><div class="tools"><button id="proposed-button" aria-pressed="true">Proposed geography</button><button id="current-button" aria-pressed="false">Current generated map</button></div><div class="tools"><button id="export-svg">Export SVG</button></div><div class="key"><span><i class="dot"></i>Seat 1</span><span><i class="dot s2"></i>Seat 2</span><span>★ production centre</span></div></div>
<div class="group"><h2>Selected province</h2><div id="selection"><span class="small">Choose a province on the map.</span></div></div>
<div class="group"><h2>Nine islands</h2><div id="islands" class="island-list"></div></div>
<div class="group"><h2>Topology proposal</h2><div class="small">Every listed pair differs from the current rules graph. Land edges arise from shared country borders; sea lanes join coast to coast.</div><div id="diff" class="diff-list"></div></div>
</aside></div></main>
<script>window.T22_DATA=${JSON.stringify(data)};window.CURRENT_GEOMETRY=${JSON.stringify(original)};
(()=>{const D=window.T22_DATA,C=window.CURRENT_GEOMETRY,root=document.querySelector('#map-board');let mode='proposed',selected='';const NS='http://www.w3.org/2000/svg';const svgEl=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e};const pathD=p=>'M'+p.map(q=>q.join(',')).join('L')+'Z';const num=id=>Number(id.match(/_(\\d+)$/)?.[1]||0);const fill=p=>p.owner==='seat1'?'#d99a62':'#6bb5b0';const nlist=adj=>[...(adj.land[pick()]||[]),...(adj.sea[pick()]||[])];function pick(){return selected}function select(id){selected=id;const p=D.provinces.find(x=>x.id===id);const adj=D.proposed.adjacency[id];const links=[...adj.land,...adj.sea].map(x=>D.provinces.find(q=>q.id===x));document.querySelector('#selection').innerHTML='<div class="selected-title">'+p.name+'</div><div class="selected-meta">'+D.islands.find(i=>i.id===p.island).name+' · '+(p.owner==='seat1'?'Seat 1':'Seat 2')+' · '+p.armies+' armies'+(p.production?' · production centre':'')+'</div><div class="small">Proposed neighbours: '+links.map(x=>x.name).join(', ')+'</div>';draw()}function renderIslands(){document.querySelector('#islands').innerHTML=D.islands.map(i=>'<div class="island-row"><span>'+i.name+' · '+i.provinces.length+' countries</span><strong>+'+i.bonus+'</strong></div>').join('')}function renderDiff(){const d=D.proposed.changes;document.querySelector('#diff').innerHTML=Object.entries({"Land added":d.landAdded,"Land removed":d.landRemoved,"Sea lanes added":d.seaAdded,"Sea lanes removed":d.seaRemoved}).map(([name,items])=>'<div><strong>'+name+' ('+items.length+')</strong><ul>'+items.map(x=>'<li>'+x.replace('--',' ↔ ')+'</li>').join('')+'</ul></div>').join('')}function draw(){const src=mode==='proposed'?D:C;const b=src.bounds;const s=svgEl('svg',{viewBox:b.x+' '+b.y+' '+b.width+' '+b.height,role:'img','aria-label':mode==='proposed'?'Proposed contiguous island map':'Current generated map geometry'});const defs=svgEl('defs');defs.innerHTML='<style>.province-shape{stroke:#d9cfaa;stroke-width:3;stroke-linejoin:round}.province-name{fill:#132a2c;font:650 26px system-ui;text-anchor:middle;paint-order:stroke;stroke:#f4e6c8;stroke-width:3px;stroke-linejoin:round}.army-count{fill:#f9f0d7;font:750 19px system-ui;text-anchor:middle}.owner-label{fill:#f8f1dd;font:800 12px system-ui;letter-spacing:.05em;text-anchor:middle}.sea-route{fill:none;stroke:#dbbd78;stroke-width:4;stroke-dasharray:10 8}.sea-end{fill:#f5d18b;stroke:#0a3440;stroke-width:4}.island-shape{fill:#184a43;stroke:#73a58b;stroke-width:5;stroke-linejoin:round}</style>';s.append(defs);const bg=svgEl('rect',{x:b.x,y:b.y,width:b.width,height:b.height,fill:'#0b3445'});s.append(bg);if(mode==='proposed'){for(const i of D.islands){const shape=svgEl('path',{d:pathD(i.polygon),class:'island-shape'});s.append(shape);const t=svgEl('text',{x:i.polygon.reduce((a,p)=>a+p[0],0)/i.polygon.length,y:i.polygon.reduce((a,p)=>a+p[1],0)/i.polygon.length,class:'island-name'});t.textContent=i.name.toUpperCase();s.append(t)}for(const r of D.proposed.routes){const [a,b]=r.path;const p=svgEl('path',{d:'M'+a.join(',')+'L'+b.join(','),class:'sea-route'});s.append(p);for(const q of [a,b])s.append(svgEl('circle',{cx:q[0],cy:q[1],r:8,class:'sea-end'}))}}const nodes=src.provinces.map(p=>{const g=svgEl('g',{class:'province'+(p.id===selected?' is-selected':''),'data-province-id':p.id,'data-owner':p.owner,tabindex:'0',role:'button','aria-label':p.name+', '+(p.owner==='seat1'?'Seat 1':'Seat 2')+', '+p.armies+' armies'});const shape=svgEl('path',{d:pathD(p.polygon),class:'province-shape',fill:fill(p)});g.append(shape);if(mode==='proposed'){for(const neighbor of D.proposed.adjacency[p.id].land.concat(D.proposed.adjacency[p.id].sea)){if(neighbor===selected)g.classList.add('is-neighbor')}const c=p.center;const name=svgEl('text',{x:c[0],y:c[1]-7,class:'province-name'});const words=p.name.split(' ');if(words.length>1){const mid=Math.ceil(words.length/2);for(const [ix,text]of [words.slice(0,mid).join(' '),words.slice(mid).join(' ')].entries()){const t=svgEl('tspan',{x:c[0],dy:ix===0?'0':'1.05em'});t.textContent=text;name.append(t)}}else name.textContent=p.name;g.append(name);const cy=c[1]+30;g.append(svgEl('circle',{cx:c[0],cy,r:17,class:'army-disc',fill:p.owner==='seat1'?'#9c643a':'#387a77'}));const count=svgEl('text',{x:c[0],y:cy+7,class:'army-count'});count.textContent=p.armies;g.append(count);const owner=svgEl('text',{x:c[0],y:cy+26,class:'owner-label'});owner.textContent=p.owner==='seat1'?'SEAT 1':'SEAT 2';g.append(owner);if(p.production){g.append(svgEl('path',{d:'M'+(c[0]+23)+' '+(c[1]-28)+'l5 11 12 1-9 8 3 12-11-6-10 6 2-12-9-8 12-1z',class:'production-mark'}))}}else{const c=p.labelAt;const t=svgEl('text',{x:c[0],y:c[1],class:'province-name'});t.textContent=p.name;g.append(t);const army=svgEl('text',{x:c[0],y:c[1]+21,class:'army-count'});army.textContent=p.armies+' · '+(p.owner==='seat1'?'S1':'S2');g.append(army)}g.addEventListener('click',()=>select(p.id));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(p.id)}});return g});for(const n of nodes){if(mode==='proposed'&&selected){const id=n.dataset.provinceId;if(D.proposed.adjacency[selected].land.concat(D.proposed.adjacency[selected].sea).includes(id))n.classList.add('is-neighbor')}}for(const n of nodes)s.append(n);root.replaceChildren(s)}document.querySelector('#proposed-button').onclick=()=>{mode='proposed';document.querySelector('#proposed-button').setAttribute('aria-pressed','true');document.querySelector('#current-button').setAttribute('aria-pressed','false');draw()};document.querySelector('#current-button').onclick=()=>{mode='current';document.querySelector('#proposed-button').setAttribute('aria-pressed','false');document.querySelector('#current-button').setAttribute('aria-pressed','true');draw()};document.querySelector('#export-svg').onclick=()=>{draw();const source=new XMLSerializer().serializeToString(root.querySelector('svg'));const blob=new Blob([source],{type:'image/svg+xml'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='seed-1994-proposed-map.svg';a.click();URL.revokeObjectURL(a.href)};renderIslands();renderDiff();draw()})();</script></body></html>`;
const out = resolve(process.argv[2] ?? resolve(dir, "preview.html"));
const template = await readFile(resolve(dir, "template.html"), "utf8");
const renderedHtml = template.replace("__DATA__", JSON.stringify(data)).replace("__CURRENT__", JSON.stringify(original));
await writeFile(out, renderedHtml, { flag: "wx" });
process.stdout.write(`Created disposable candidate fixture ${out}\n`);
