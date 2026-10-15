import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "input/seed1994.json");
const output = process.argv[2] ? resolve(process.argv[2]) : null;
const map = JSON.parse(await readFile(source, "utf8"));

function graphOf(provinces) {
  const ids = provinces.map((p) => p.id);
  const allowed = new Set(ids);
  return new Map(provinces.map((p) => [p.id, p.borders.filter((id) => allowed.has(id))]));
}

function connected(graph) {
  const start = graph.keys().next().value;
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) for (const n of graph.get(queue.shift())) if (!seen.has(n)) {
    seen.add(n);
    queue.push(n);
  }
  return seen.size === graph.size;
}

function faceCount(graph, rotations) {
  const successor = new Map();
  for (const [from, neighbors] of graph) for (const to of neighbors) {
    const around = rotations.get(to);
    const reverseIndex = around.indexOf(from);
    const next = around[(reverseIndex + around.length - 1) % around.length];
    successor.set(`${from}>${to}`, `${to}>${next}`);
  }
  const visited = new Set();
  let faces = 0;
  for (const dart of successor.keys()) if (!visited.has(dart)) {
    faces++;
    let cursor = dart;
    while (!visited.has(cursor)) {
      visited.add(cursor);
      cursor = successor.get(cursor);
    }
    if (cursor !== dart) throw new Error("face permutation entered a prior cycle");
  }
  return faces;
}

function hasSphericalEmbedding(graph) {
  if (graph.size < 3 || !connected(graph)) return false;
  const variable = [...graph].filter(([, ns]) => ns.length === 3).map(([id]) => id);
  const cases = 2 ** variable.length;
  let eulerCases = 0;
  for (let mask = 0; mask < cases; mask++) {
    const base = new Map([...graph].map(([id, ns]) => [id, ns.slice()]));
    for (let bit = 0; bit < variable.length; bit++) {
      const id = variable[bit];
      const ns = base.get(id).slice();
      if ((mask >> bit) & 1) ns.reverse();
      base.set(id, ns);
    }
    const edges = [...graph.values()].reduce((sum, ns) => sum + ns.length, 0) / 2;
    if (graph.size - edges + faceCount(graph, base) === 2) eulerCases++;
  }
  return { planar: eulerCases > 0, rotationsTried: cases, eulerCases };
}

const islands = map.islands.map((island) => {
  const members = island.provinces.map((id) => map.provinces.find((p) => p.id === id));
  const graph = graphOf(members);
  const result = hasSphericalEmbedding(graph);
  return { island: island.name, vertices: graph.size,
    edges: [...graph.values()].reduce((sum, ns) => sum + ns.length, 0) / 2,
    ...result };
});

const makeGraph = (edges) => {
  const g = new Map();
  for (const [a, b] of edges) {
    if (!g.has(a)) g.set(a, []);
    if (!g.has(b)) g.set(b, []);
    g.get(a).push(b);
    g.get(b).push(a);
  }
  return g;
};
const controls = {
  K4: hasSphericalEmbedding(makeGraph([["a", "b"], ["a", "c"], ["a", "d"], ["b", "c"], ["b", "d"], ["c", "d"]])),
  K3_3: hasSphericalEmbedding(makeGraph([["a", "x"], ["a", "y"], ["a", "z"], ["b", "x"], ["b", "y"], ["b", "z"], ["c", "x"], ["c", "y"], ["c", "z"]])),
};
if (controls.K4.planar !== true || controls.K3_3.planar !== false) throw new Error("planarity controls failed");
const report = { method: "exhaustive cyclic rotations at degree-three vertices; spherical embedding iff a face permutation satisfies V-E+F=2", controls, islands };
const rendered = `${JSON.stringify(report, null, 2)}\n`;
if (output) await writeFile(output, rendered, { flag: "wx" });
process.stdout.write(rendered);
