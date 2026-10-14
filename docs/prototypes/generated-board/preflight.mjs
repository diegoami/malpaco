// T13 preflight: estimate collisions using the existing MapView label-box formula.
// This measures display placeholders, not geography or rule-graph correctness.
import { createServer } from 'vite';
import { writeFileSync } from 'node:fs';

const output = process.argv[2];
if (!output) throw new Error('Pass a new output JSON path; existing evidence is never overwritten.');
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { generateBoard } = await server.ssrLoadModule('/src/core/index.ts');
  const rows = [];
  for (const seed of [1, 2, 3, 7, 42, 1994]) {
    const result = generateBoard(seed);
    if (!result.ok) { rows.push({ seed, errors: result.errors }); continue; }
    const boxes = result.map.provinces.map((p) => ({
      id: p.id, x: p.labelAt[0], y: p.labelAt[1] + 5.5,
      hw: Math.max(42, 0.58 * 21 * p.name.length / 2 + 6), hh: 32.5,
    }));
    let labelBoxOverlaps = 0;
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.y - b.y) < a.hh + b.hh) labelBoxOverlaps++;
    }
    rows.push({
      seed, provinces: result.map.provinces.length, islands: result.map.islands.length,
      seaLanes: result.map.provinces.reduce((n, p) => n + p.seaLanes.length, 0) / 2,
      labelBoxOverlaps,
    });
  }
  const report = {
    sourceCommit: 'b6c0cae7dc6197b5acdc06f3857c05c1ded49902',
    method: 'Axis-aligned label-box overlap using src/ui/mapView.ts labelBox; no screenshot/pixel measurement.',
    rows,
  };
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(rows));
} finally { await server.close(); }
