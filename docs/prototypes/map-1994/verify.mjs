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
async function checkSelection(page, locator, graph, mode) {
  const id = await locator.getAttribute("data-province-id");
  await locator.click();
  const expected = [...(graph[id]?.land ?? []), ...(graph[id]?.sea ?? [])].sort();
  const actual = await page.locator("[data-province-id].is-neighbor").evaluateAll((nodes) => nodes.map((node) => node.dataset.provinceId).sort());
  requireThat(JSON.stringify(actual) === JSON.stringify(expected), `selected-neighbour feedback mismatch in ${mode} mode for ${id}: expected ${expected.join(",")}, got ${actual.join(",")}`);
  requireThat(await locator.evaluate((node) => node.classList.contains("is-selected")), `selected province ${id} has no selected state in ${mode} mode`);
}
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
let labelBounds = [];
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
      visibleNames: [...document.querySelectorAll("[data-province-id]")].every((node) => document.querySelector(`[data-label-for="${node.dataset.provinceId}"] .province-name`)?.textContent?.trim()),
      controls: [...document.querySelectorAll("button")].filter((b) => b.offsetParent !== null).map((b) => b.textContent.trim()),
      labels: [...document.querySelectorAll("[data-province-id]")].map((group) => {
        const label = document.querySelector(`[data-label-for="${group.dataset.provinceId}"]`);
        const name = label?.querySelector(".province-name"), badge = label?.querySelector(".province-badge");
        if (!name || !badge) return { id: group.dataset.provinceId, namePx: 0, badgePx: 0, polygonBox: [] };
        const a = name.getBoundingClientRect(), b = badge.getBoundingClientRect();
        const ctm = name.getScreenCTM(), scale = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));
        const corners = [[Math.min(a.left,b.left)-2,Math.min(a.top,b.top)-2],[Math.max(a.right,b.right)+2,Math.min(a.top,b.top)-2],[Math.max(a.right,b.right)+2,Math.max(a.bottom,b.bottom)+2],[Math.min(a.left,b.left)-2,Math.max(a.bottom,b.bottom)+2]];
        const inverse = name.ownerSVGElement.getScreenCTM().inverse();
        const polygonBox = corners.map(([x,y]) => { const p = new DOMPoint(x,y).matrixTransform(inverse); return [p.x,p.y] });
        return { id: group.dataset.provinceId, x: Math.min(a.left,b.left), y: Math.min(a.top,b.top), right: Math.max(a.right,b.right), bottom: Math.max(a.bottom,b.bottom),
          namePx: Number.parseFloat(getComputedStyle(name).fontSize)*scale, badgePx: Number.parseFloat(getComputedStyle(badge).fontSize)*scale, polygonBox };
      }),
      markerCount: document.querySelectorAll(".province-badge").length,
      ownershipCount: document.querySelectorAll("[data-owner]").length,
      mapRect: document.querySelector("#map-board svg").getBoundingClientRect().toJSON(),
      boardRect: document.querySelector("#map-board").getBoundingClientRect().toJSON(),
      bodyScroll: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      inspectorInitiallyClosed: document.querySelector("#inspector").hidden,
      diffText: document.querySelector("#diff").textContent,
    }));
    requireThat(status.provinceCount === 46, `${viewport.width}: expected 46 selectable provinces, got ${status.provinceCount}`);
    requireThat(status.visibleNames, `${viewport.width}: one or more selectable provinces has no visible name`);
    requireThat(["Proposed geography", "Current map and routes", "Inspector", "Export SVG"].every((name) => status.controls.includes(name)), `${viewport.width}: map and inspector controls are not reachable`);
    requireThat(status.labels.length === 46 && status.labels.every((l) => l.namePx >= 12 && l.badgePx >= 12), `${viewport.width}: province names and army/seat badges must be at least 12 actual screen pixels`);
    requireThat(status.inspectorInitiallyClosed, `${viewport.width}: topology inspector must start closed`);
    requireThat(status.boardRect.width >= viewport.width - 4 && status.boardRect.height >= viewport.height - 60, `${viewport.width}: map does not fill the window below the toolbar`);
    requireThat(status.bodyScroll.width <= viewport.width && status.bodyScroll.height <= viewport.height, `${viewport.width}: map page exceeds viewport without a scrolling control`);
    for (let i = 0; i < status.labels.length; i++) for (let j = i + 1; j < status.labels.length; j++) {
      const a = status.labels[i], b = status.labels[j];
      const intersects = a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
      requireThat(!intersects, `${viewport.width}: province label/badge bounds overlap: ${a.id} and ${b.id}`);
    }
    requireThat(status.markerCount === 46, `${viewport.width}: expected visible army counts for all provinces`);
    requireThat(status.ownershipCount === 46, `${viewport.width}: expected ownership cues for all provinces`);
    requireThat(status.data?.islands?.length === 9, `${viewport.width}: expected 9 islands in embedded geometry`);
    requireThat(status.mapRect.width > 0 && status.mapRect.height > 0, `${viewport.width}: map is not painted`);
    await page.getByRole("button", { name: "Current map and routes" }).click();
    requireThat(await page.locator("#map-board svg").getAttribute("aria-label") === "Current generated map and current land and sea routes", `${viewport.width}: current map toggle did not render current geometry and routes`);
    const currentCounts = await page.evaluate(() => ({ land: document.querySelectorAll(".current-land").length, sea: document.querySelectorAll(".current-sea").length }));
    requireThat(currentCounts.land === status.data.currentLandRoutes.length && currentCounts.sea === status.data.currentRoutes.length, `${viewport.width}: current view omits or invents current land/sea connections`);
    if (viewport.width === 1280) await page.screenshot({ path: resolve(output, "before-1280x800.png"), fullPage: true });
    if (viewport.width === 1280) {
      const currentCountries = await page.locator("[data-province-id]").all();
      for (const locator of currentCountries) await checkSelection(page, locator, status.data.current, "current");
    }
    await page.getByRole("button", { name: "Proposed geography" }).click();
    requireThat(await page.locator("#map-board svg").getAttribute("aria-label") === "Proposed contiguous island map", `${viewport.width}: proposed map toggle did not change geometry`);
    const proposedCount = await page.locator(".sea-route").count();
    requireThat(proposedCount === status.data.proposed.routes.length, `${viewport.width}: proposed sea routes are missing or extra`);
    const svg = await page.locator("#map-board svg").evaluate((node) => new XMLSerializer().serializeToString(node));
    await writeFile(resolve(output, `map-${viewport.width}x${viewport.height}.svg`), svg, { flag: "wx" });
    await page.screenshot({ path: resolve(output, `after-${viewport.width}x${viewport.height}.png`), fullPage: true });
    if (viewport.width === 1280) {
      embedded = status.data;
      labelBounds = status.labels;
      const provinces = await page.locator("[data-province-id]").all();
      for (const locator of provinces) await checkSelection(page, locator, status.data.proposed.adjacency, "proposed");
      const panelButton = page.getByRole("button", { name: "Inspector" });
      await panelButton.click();
      requireThat(await page.locator("#inspector").isVisible(), "inspector did not open on request");
      const shownNeighbors = await page.locator("#selection .neighbors li").allTextContents();
      const lastId = await provinces.at(-1).getAttribute("data-province-id");
      const expectedNames = [...(status.data.proposed.adjacency[lastId].land), ...(status.data.proposed.adjacency[lastId].sea)].map((id) => currentMap.provinces.find((p) => p.id === id).name).sort();
      requireThat(JSON.stringify(shownNeighbors.map((name) => name.split(" (")[0]).sort()) === JSON.stringify(expectedNames), "inspector does not show the selected country's exact proposed neighbours by name");
      requireThat(!/province_\d+/.test(status.diffText), "topology diff UI displays raw province IDs instead of country names");
      await page.getByRole("button", { name: "Close inspector" }).click();
      requireThat(await page.locator("#inspector").isHidden(), "inspector close control did not close the panel");
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
    const dx=b[0]-a[0],dy=b[1]-a[1],length2=dx*dx+dy*dy;
    const t=Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/length2));
    if(Math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dy)<=1e-5)return true;
  }
  return false;
}
function properCross(a, b, c, d) {
  const abLength=Math.hypot(b[0]-a[0],b[1]-a[1]),cdLength=Math.hypot(d[0]-c[0],d[1]-c[1]);
  if(abLength<1e-12||cdLength<1e-12)return false;
  const abC=cross(a,b,c)/abLength,abD=cross(a,b,d)/abLength,cdA=cross(c,d,a)/cdLength,cdB=cross(c,d,b)/cdLength;
  const epsilon=1e-5;
  return (abC < -epsilon && abD > epsilon || abC > epsilon && abD < -epsilon) &&
    (cdA < -epsilon && cdB > epsilon || cdA > epsilon && cdB < -epsilon);
}
function positiveAreaOverlap(a,b){
  const crossing=a.some((p,ix)=>b.some((q,jx)=>properCross(p,a[(ix+1)%a.length],q,b[(jx+1)%b.length])));
  const contained=a.some(p=>pointInPolygon(p,b)&&!pointOnBoundary(p,b))||b.some(p=>pointInPolygon(p,a)&&!pointOnBoundary(p,a));
  return crossing||contained;
}
function rectangleContained(rect, poly) {
  if (!rect?.length || poly.length < 3) return false;
  const samples=[];
  for(let edge=0;edge<rect.length;edge++)for(let step=0;step<=12;step++){
    const a=rect[edge],b=rect[(edge+1)%rect.length],t=step/12;samples.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
  }
  return samples.every(point=>pointInPolygon(point,poly)||pointOnBoundary(point,poly));
}
const overlapControls={
  positive:positiveAreaOverlap([[0,0],[4,0],[4,4],[0,4]],[[3.5,1],[6,1],[6,3],[3.5,3]]),
  touching:positiveAreaOverlap([[0,0],[4,0],[4,4],[0,4]],[[4,0],[8,0],[8,4],[4,4]]),
  separated:positiveAreaOverlap([[0,0],[4,0],[4,4],[0,4]],[[5,0],[8,0],[8,4],[5,4]]),
};
requireThat(overlapControls.positive&&!overlapControls.touching&&!overlapControls.separated,"positive-area overlap predicate controls failed");
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
      requireThat(!positiveAreaOverlap(a,b), `${island.id}: positive-area polygon overlap ${members[i].id}/${members[j].id}`);
    }
    const graph = new Map(members.map((p) => [p.id, new Set()]));
    for (const a of members) for (const b of members) if (a !== b && sharedLength(a.polygon, b.polygon) > 1e-5) graph.get(a.id).add(b.id);
    const visited = new Set([members[0].id]), queue = [members[0].id];
    while (queue.length) for (const id of graph.get(queue.shift())) if (!visited.has(id)) { visited.add(id); queue.push(id); }
    requireThat(visited.size === members.length, `${island.id}: province tiling is disconnected`);
    for (const p of members) for (const id of graph.get(p.id)) requireThat(p.island === ps.get(id).island, `${p.id}: shared boundary leaves its island`);
  }
  for(let i=0;i<embedded.islands.length;i++)for(let j=i+1;j<embedded.islands.length;j++){
    const a=embedded.islands[i].polygon,b=embedded.islands[j].polygon;
    requireThat(!positiveAreaOverlap(a,b),`different island silhouettes overlap: ${embedded.islands[i].id}/${embedded.islands[j].id}`);
  }
  for(const label of labelBounds){
    const province=ps.get(label.id);
    requireThat(rectangleContained(label.polygonBox,province?.polygon??[]),`${label.id}: complete name/army label rectangle escapes its province cell`);
  }
  const adjacency = embedded.proposed.adjacency;
  for(const p of currentMap.provinces){
    const candidate=embedded.current[p.id];
    requireThat(candidate&&JSON.stringify(candidate.land.slice().sort())===JSON.stringify(p.borders.slice().sort())&&JSON.stringify(candidate.sea.slice().sort())===JSON.stringify(p.seaLanes.slice().sort()),`${p.id}: Current view graph differs from the source map`);
  }
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
      requireThat(route.islands?.[0]===a.island&&route.islands?.[1]===b.island,`${route.from}/${route.to}: sea route island identity differs from its endpoints`);
      requireThat(adjacency[route.from]?.sea.includes(route.to)&&adjacency[route.to]?.sea.includes(route.from),`${route.from}/${route.to}: sea route is missing from proposed adjacency`);
      requireThat(route.path.length >= 2, `${route.from}/${route.to}: sea route has no path`);
      const start = route.path[0], end = route.path.at(-1);
      requireThat(pointOnBoundary(start, a.polygon), `${route.from}/${route.to}: sea route start endpoint is not coastal`);
      requireThat(pointOnBoundary(end, b.polygon), `${route.from}/${route.to}: sea route end endpoint is not coastal`);
      const islandById=new Map(embedded.islands.map(island=>[island.id,island]));
      requireThat(pointOnBoundary(start,islandById.get(a.island)?.polygon??[]),`${route.from}/${route.to}: sea route start is not on its island coast`);
      requireThat(pointOnBoundary(end,islandById.get(b.island)?.polygon??[]),`${route.from}/${route.to}: sea route end is not on its island coast`);
      for (const unrelated of embedded.provinces.filter((p) => p.id !== a.id && p.id !== b.id)) {
        let hit = route.path.some((pt) => pointInPolygon(pt, unrelated.polygon));
        for (let i = 0; i < route.path.length - 1; i++) for (let j = 0; j < unrelated.polygon.length; j++) hit ||= properCross(route.path[i], route.path[i + 1], unrelated.polygon[j], unrelated.polygon[(j + 1) % unrelated.polygon.length]);
        requireThat(!hit, `${route.from}/${route.to}: sea lane intersects unrelated land ${unrelated.id}`);
      }
      requireThat(end.every(Number.isFinite), `${route.from}/${route.to}: sea route endpoint is not finite`);
    }
  }
  const islandGraph=new Map(embedded.islands.map(island=>[island.id,new Set()]));
  for(const route of embedded.proposed.routes){if(route.islands?.length===2){islandGraph.get(route.islands[0])?.add(route.islands[1]);islandGraph.get(route.islands[1])?.add(route.islands[0]);}}
  if(embedded.islands.length){const seen=new Set([embedded.islands[0].id]),queue=[embedded.islands[0].id];while(queue.length)for(const id of islandGraph.get(queue.shift())??[])if(!seen.has(id)){seen.add(id);queue.push(id);}requireThat(seen.size===embedded.islands.length,`proposed sea lanes do not connect all islands (${seen.size}/${embedded.islands.length})`);}
  const pairs = (adj, kind) => [...new Set(Object.entries(adj).flatMap(([id, links]) => links[kind].map((to) => [id, to].sort().join("--"))))].sort();
  const before = Object.fromEntries(currentMap.provinces.map((p) => [p.id, { land: p.borders, sea: p.seaLanes }]));
  const changes = { landAdded: pairs(adjacency, "land").filter((x) => !pairs(before, "land").includes(x)), landRemoved: pairs(before, "land").filter((x) => !pairs(adjacency, "land").includes(x)), seaAdded: pairs(adjacency, "sea").filter((x) => !pairs(before, "sea").includes(x)), seaRemoved: pairs(before, "sea").filter((x) => !pairs(adjacency, "sea").includes(x)) };
  requireThat(JSON.stringify(embedded.proposed.changes) === JSON.stringify(changes), "displayed topology diff does not exactly match current and proposed graphs");
  await writeFile(resolve(output, "topology-diff.json"), `${JSON.stringify(changes, null, 2)}\n`, { flag: "wx" });
  await writeFile(resolve(output, "geography.json"), `${JSON.stringify({ islands: embedded.islands, provinces: embedded.provinces, proposal: embedded.proposed }, null, 2)}\n`, { flag: "wx" });
}
const graphSummary = embedded ? (() => {
  const degree = (graph, id) => [...(graph[id]?.land ?? []), ...(graph[id]?.sea ?? [])].length;
  const currentLand = [...new Set(Object.entries(embedded.current).flatMap(([id, links]) => links.land.map(to => [id,to].sort().join("--"))))];
  const currentSea = [...new Set(Object.entries(embedded.current).flatMap(([id, links]) => links.sea.map(to => [id,to].sort().join("--"))))];
  const proposedLand = [...new Set(Object.entries(embedded.proposed.adjacency).flatMap(([id, links]) => links.land.map(to => [id,to].sort().join("--"))))];
  const proposedSea = [...new Set(Object.entries(embedded.proposed.adjacency).flatMap(([id, links]) => links.sea.map(to => [id,to].sort().join("--"))))];
  const islandDegree = Object.fromEntries(embedded.islands.map(island => [island.id, embedded.proposed.routes.filter(route => route.islands?.includes(island.id)).length]));
  return { current: { landEdges: currentLand.length, seaEdges: currentSea.length }, proposed: { landEdges: proposedLand.length, seaEdges: proposedSea.length, provinceDegree: Object.fromEntries(embedded.provinces.map(p => [p.id, degree(embedded.proposed.adjacency,p.id)])), islandSeaDegree: islandDegree } };
})() : null;
const report = { accepted: failures.length === 0, viewportRuns: ["1280x800", "1920x1080"], provinceCount: embedded?.provinces?.length ?? null, islandCount: embedded?.islands?.length ?? null, graphSummary,
  overlapControls, feasibility, ambiguity: { ironPoint: { land: ["South rest", "High shore"], sea: ["Lower field", "Blue peak"] }, silverShore: { sea: [], finding: "no current sea lane; visual ambiguity only" } }, failures };
await writeFile(resolve(output, "acceptance.json"), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${report.accepted ? "PASS" : "FAIL"}: ${failures.length} acceptance findings; output ${output}\n`);
if (failures.length) { for (const issue of failures) process.stderr.write(`- ${issue}\n`); process.exit(1); }
