import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(process.argv[2] ?? "");
const previewPath = resolve(root, "preview.html");
const evidence = resolve(root, "preflight-20261015-a/input");
const failures = [];
const requireThat = (condition, message) => { if (!condition) failures.push(message); };
if (!process.argv[2]) throw new Error("usage: node docs/prototypes/map-1994/verify.mjs <fresh-output>");
await mkdir(output, { recursive: false });

let html;
try { html = await readFile(previewPath, "utf8"); }
catch {
  const report = { accepted: false, reason: "preview.html missing", previewPath };
  await writeFile(resolve(output, "acceptance.json"), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  process.stderr.write("FAIL: prototype preview.html is missing\n");
  process.exit(1);
}
const [state, currentMap, feasibility] = await Promise.all([
  readFile(resolve(evidence, "seed1994-state.json"), "utf8").then(JSON.parse),
  readFile(resolve(evidence, "seed1994.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "preflight-20261015-a/rotation-results.json"), "utf8").then(JSON.parse),
]);
const browser = await chromium.launch({ headless: true });
const errors = [];
const captures = [];
let embedded;
try {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 1920, height: 1080 }]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (error) => errors.push(`${viewport.width}: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`${viewport.width}: ${message.text()}`); });
    await page.goto(pathToFileURL(previewPath).href);
    await page.locator("#map-board svg").waitFor();
    const status = await page.evaluate(() => ({
      data: window.T22_DATA,
      provinceCount: document.querySelectorAll("[data-province-id]").length,
      names: [...document.querySelectorAll("[data-province-id]")].map((node) => node.dataset.provinceId),
      visibleNames: [...document.querySelectorAll("[data-province-id]")].every((node) => node.querySelector(".province-name")?.textContent?.trim()),
      controls: [...document.querySelectorAll("button")].filter((b) => b.offsetParent !== null).map((b) => b.textContent.trim()),
      labels: [...document.querySelectorAll(".province-name")].map((node) => {
        const rect = node.getBoundingClientRect();
        return { id: node.closest("[data-province-id]")?.dataset.provinceId,
          x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom,
          fontSize: Number.parseFloat(getComputedStyle(node).fontSize), width: rect.width, height: rect.height };
      }),
      markerCount: document.querySelectorAll(".army-count").length,
      ownershipCount: document.querySelectorAll("[data-owner]").length,
      mapRect: document.querySelector("#map-board svg").getBoundingClientRect().toJSON(),
      bodyScroll: { width: document.body.scrollWidth, height: document.body.scrollHeight },
    }));
    requireThat(status.provinceCount === 46, `${viewport.width}: expected 46 selectable provinces, got ${status.provinceCount}`);
    requireThat(status.visibleNames, `${viewport.width}: one or more selectable provinces has no visible name`);
    requireThat(["Proposed geography", "Current generated map", "Export SVG"].every((name) => status.controls.includes(name)), `${viewport.width}: map view and export controls are not reachable`);
    requireThat(status.labels.length === 46 && status.labels.every((l) => l.fontSize >= 12), `${viewport.width}: every province label must be at least 12 screen pixels`);
    for (let i = 0; i < status.labels.length; i++) for (let j = i + 1; j < status.labels.length; j++) {
      const a = status.labels[i], b = status.labels[j];
      const intersects = a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
      requireThat(!intersects, `${viewport.width}: labels overlap: ${a.id} and ${b.id}`);
    }
    requireThat(status.markerCount === 46, `${viewport.width}: expected visible army counts for all provinces`);
    requireThat(status.ownershipCount === 46, `${viewport.width}: expected ownership cues for all provinces`);
    requireThat(status.data?.islands?.length === 9, `${viewport.width}: expected 9 islands in embedded geometry`);
    requireThat(status.mapRect.width > 0 && status.mapRect.height > 0, `${viewport.width}: map is not painted`);
    await page.getByRole("button", { name: "Current generated map" }).click();
    requireThat(await page.locator("#map-board svg").getAttribute("aria-label") === "Current generated map geometry", `${viewport.width}: current map toggle did not change geometry`);
    if (viewport.width === 1280) await page.screenshot({ path: resolve(output, "before-1280x800.png"), fullPage: true });
    await page.getByRole("button", { name: "Proposed geography" }).click();
    requireThat(await page.locator("#map-board svg").getAttribute("aria-label") === "Proposed contiguous island map", `${viewport.width}: proposed map toggle did not change geometry`);
    const svg = await page.locator("#map-board svg").evaluate((node) => new XMLSerializer().serializeToString(node));
    await writeFile(resolve(output, `map-${viewport.width}x${viewport.height}.svg`), svg, { flag: "wx" });
    await page.screenshot({ path: resolve(output, `after-${viewport.width}x${viewport.height}.png`), fullPage: true });
    if (viewport.width === 1280) {
      embedded = status.data;
      const provinces = await page.locator("[data-province-id]").all();
      for (const locator of provinces) {
        const id = await locator.getAttribute("data-province-id");
        await locator.click();
        const expected = [...(status.data.proposed.adjacency[id]?.land ?? []), ...(status.data.proposed.adjacency[id]?.sea ?? [])].sort();
        const actual = await page.locator("[data-province-id].is-neighbor").evaluateAll((nodes) => nodes.map((node) => node.dataset.provinceId).sort());
        requireThat(JSON.stringify(actual) === JSON.stringify(expected), `1280: selected-neighbour feedback mismatch for ${id}: expected ${expected.join(",")}, got ${actual.join(",")}`);
        requireThat(await locator.evaluate((node) => node.classList.contains("is-selected")), `1280: selected province ${id} has no selected state`);
      }
      const exportButton = page.getByRole("button", { name: /export svg/i });
      requireThat(await exportButton.count() === 1, "SVG export control is missing");
      if (await exportButton.count() === 1) {
        const [download] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);
        await download.saveAs(resolve(output, "prototype-export.svg"));
        const exported = await readFile(resolve(output, "prototype-export.svg"), "utf8");
        requireThat(exported.includes("<svg") && exported.includes("province-shape"), "SVG export is empty or not standalone SVG");
      }
    }
    await page.close();
  }
} finally { await browser.close(); }
requireThat(errors.length === 0, `browser errors: ${errors.join(" | ")}`);

function area(poly) {
  return Math.abs(poly.reduce((sum, [x, y], i) => {
    const [nx, ny] = poly[(i + 1) % poly.length];
    return sum + x * ny - nx * y;
  }, 0) / 2);
}
function cross(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
function samePoint(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-5; }
function sharedLength(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    const p = a[i], q = a[(i + 1) % a.length], r = b[j], s = b[(j + 1) % b.length];
    if (Math.abs(cross(p, q, r)) > 1e-5 || Math.abs(cross(p, q, s)) > 1e-5) continue;
    const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (length < 1e-5) continue;
    const ux = (q[0] - p[0]) / length, uy = (q[1] - p[1]) / length;
    const project = (v) => v[0] * ux + v[1] * uy;
    const lo = Math.max(Math.min(project(p), project(q)), Math.min(project(r), project(s)));
    const hi = Math.min(Math.max(project(p), project(q)), Math.max(project(r), project(s)));
    if (hi > lo + 1e-5) total += hi - lo;
  }
  return total;
}
function pointInPolygon(point, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function pointOnBoundary(point, poly) {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (Math.abs(cross(a, b, point)) < 1e-4 && point[0] >= Math.min(a[0], b[0]) - 1e-4 && point[0] <= Math.max(a[0], b[0]) + 1e-4 && point[1] >= Math.min(a[1], b[1]) - 1e-4 && point[1] <= Math.max(a[1], b[1]) + 1e-4) return true;
  }
  return false;
}
function properCross(a, b, c, d) {
  const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
  return abC * abD < -1e-8 && cdA * cdB < -1e-8;
}
if (embedded) {
  const ps = new Map(embedded.provinces.map((p) => [p.id, p]));
  requireThat(ps.size === 46 && currentMap.provinces.length === 46, "geometry/current map identity count mismatch");
  for (const p of embedded.provinces) {
    requireThat(p.polygon.length >= 3 && p.polygon.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)), `${p.id}: polygon has non-finite or missing coordinates`);
    requireThat(p.owner === state.ownerOf[p.id] && p.armies === state.armies[p.id] && p.production === state.productionCentres.includes(p.id), `${p.id}: opening owner, army or production marker differs from seed 1994`);
    requireThat(currentMap.provinces.some((source) => source.id === p.id && source.name === p.name), `${p.id}: province identity/name changed`);
  }
  const islandIdentity = (islands) => islands.map((i) => `${i.id}:${i.name}:${i.bonus}:${i.provinces.slice().sort().join(",")}`).sort().join("|");
  requireThat(islandIdentity(embedded.islands) === islandIdentity(currentMap.islands), "island identity, membership or bonus changed");
  for (const island of embedded.islands) {
    const members = island.provinces.map((id) => ps.get(id));
    requireThat(members.length > 0 && members.every((p) => p.island === island.id), `${island.id}: incoherent province membership`);
    const total = members.reduce((sum, p) => sum + area(p.polygon), 0);
    requireThat(Math.abs(total - area(island.polygon)) <= Math.max(0.1, area(island.polygon) * 1e-5), `${island.id}: province polygons do not tile island silhouette`);
    for (const p of members) for (const vertex of p.polygon) requireThat(pointInPolygon(vertex, island.polygon) || pointOnBoundary(vertex, island.polygon), `${island.id}: ${p.id} escapes its island silhouette`);
    for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) {
      const a = members[i].polygon, b = members[j].polygon;
      const crossings = a.some((p, ix) => b.some((q, jx) => properCross(p, a[(ix + 1) % a.length], q, b[(jx + 1) % b.length])));
      const contained = a.some((p) => pointInPolygon(p, b) && !pointOnBoundary(p, b)) || b.some((p) => pointInPolygon(p, a) && !pointOnBoundary(p, a));
      requireThat(!crossings && !contained, `${island.id}: positive-area polygon overlap ${members[i].id}/${members[j].id}`);
    }
    const graph = new Map(members.map((p) => [p.id, new Set()]));
    for (const a of members) for (const b of members) if (a !== b && sharedLength(a.polygon, b.polygon) > 1e-5) graph.get(a.id).add(b.id);
    const visited = new Set([members[0].id]), queue = [members[0].id];
    while (queue.length) for (const id of graph.get(queue.shift())) if (!visited.has(id)) { visited.add(id); queue.push(id); }
    requireThat(visited.size === members.length, `${island.id}: province tiling is disconnected`);
    for (const p of members) for (const id of graph.get(p.id)) requireThat(p.island === ps.get(id).island, `${p.id}: shared boundary leaves its island`);
  }
  const adjacency = embedded.proposed.adjacency;
  for (const p of embedded.provinces) {
    for (const id of adjacency[p.id].land) {
      requireThat(sharedLength(p.polygon, ps.get(id).polygon) > 1e-5, `${p.id}/${id}: proposed land edge has no shared boundary`);
      requireThat(adjacency[id].land.includes(p.id), `${p.id}/${id}: proposed land edge is not symmetric`);
    }
    for (const id of adjacency[p.id].sea) requireThat(adjacency[id].sea.includes(p.id), `${p.id}/${id}: proposed sea lane is not symmetric`);
  }
  for (const route of embedded.proposed.routes) {
    const a = ps.get(route.from), b = ps.get(route.to);
    if (route.kind === "sea") {
      requireThat(route.path.length >= 2, `${route.from}/${route.to}: sea route has no path`);
      const start = route.path[0], end = route.path.at(-1);
      requireThat(pointOnBoundary(start, a.polygon), `${route.from}/${route.to}: sea route start endpoint is not coastal`);
      requireThat(pointOnBoundary(end, b.polygon), `${route.from}/${route.to}: sea route end endpoint is not coastal`);
      for (const unrelated of embedded.provinces.filter((p) => p.id !== a.id && p.id !== b.id)) {
        let hit = route.path.some((pt) => pointInPolygon(pt, unrelated.polygon));
        for (let i = 0; i < route.path.length - 1; i++) for (let j = 0; j < unrelated.polygon.length; j++) hit ||= properCross(route.path[i], route.path[i + 1], unrelated.polygon[j], unrelated.polygon[(j + 1) % unrelated.polygon.length]);
        requireThat(!hit, `${route.from}/${route.to}: sea lane intersects unrelated land ${unrelated.id}`);
      }
      requireThat(end.every(Number.isFinite), `${route.from}/${route.to}: sea route endpoint is not finite`);
    }
  }
  const pairs = (adj, kind) => [...new Set(Object.entries(adj).flatMap(([id, links]) => links[kind].map((to) => [id, to].sort().join("--"))))].sort();
  const before = Object.fromEntries(currentMap.provinces.map((p) => [p.id, { land: p.borders, sea: p.seaLanes }]));
  const changes = { landAdded: pairs(adjacency, "land").filter((x) => !pairs(before, "land").includes(x)), landRemoved: pairs(before, "land").filter((x) => !pairs(adjacency, "land").includes(x)), seaAdded: pairs(adjacency, "sea").filter((x) => !pairs(before, "sea").includes(x)), seaRemoved: pairs(before, "sea").filter((x) => !pairs(adjacency, "sea").includes(x)) };
  requireThat(JSON.stringify(embedded.proposed.changes) === JSON.stringify(changes), "displayed topology diff does not exactly match current and proposed graphs");
  await writeFile(resolve(output, "topology-diff.json"), `${JSON.stringify(changes, null, 2)}\n`, { flag: "wx" });
  await writeFile(resolve(output, "geography.json"), `${JSON.stringify({ islands: embedded.islands, provinces: embedded.provinces, proposal: embedded.proposed }, null, 2)}\n`, { flag: "wx" });
}
const report = { accepted: failures.length === 0, viewportRuns: ["1280x800", "1920x1080"], provinceCount: embedded?.provinces?.length ?? null, islandCount: embedded?.islands?.length ?? null,
  feasibility, ambiguity: { ironPoint: { land: ["South rest", "High shore"], sea: ["Lower field", "Blue peak"] }, silverShore: { sea: [], finding: "no current sea lane; visual ambiguity only" } }, failures };
await writeFile(resolve(output, "acceptance.json"), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${report.accepted ? "PASS" : "FAIL"}: ${failures.length} acceptance findings; output ${output}\n`);
if (failures.length) { for (const issue of failures) process.stderr.write(`- ${issue}\n`); process.exit(1); }
