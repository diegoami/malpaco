import fs from 'node:fs';
import path from 'node:path';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

// Parent preflight only: read the existing implementation without altering it.
const root = fileURLToPath(new URL('../../../../../../', import.meta.url));
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts') && !path.extname(specifier)) {
      return next(`${specifier}.ts`, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts')) return { format: 'module', source: stripTypeScriptTypes(fs.readFileSync(new URL(url), 'utf8')), shortCircuit: true };
    return next(url, context);
  },
});
const { generateBoardBody } = await import(new URL('src/core/board-gen.ts', `file://${root}/`));
const { DeterministicRng } = await import(new URL('src/core/rng.ts', `file://${root}/`));
const { layoutGeneratedBoard } = await import(new URL('src/ui/prototype/layout.ts', `file://${root}/`));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const records = [];
for (let seed = 0; seed < 100; seed++) {
  const start = performance.now();
  const result = generateBoardBody(new DeterministicRng(seed));
  if (!result.ok) { records.push({ seed, attempts: 1, generated: false, errors: result.errors, elapsedMs: performance.now() - start }); continue; }
  const map = result.map;
  const byId = new Map(map.provinces.map(p => [p.id, p]));
  const adjacency = map.islands.map(i => ({ id: i.id, neighbours: [...new Set(i.provinces.flatMap(id => byId.get(id).seaLanes.map(n => byId.get(n).island)))] }));
  const scene = layoutGeneratedBoard(map);
  const scale = Math.min(800 / scene.bounds.width, 460 / scene.bounds.height);
  let closest = Infinity, squareSeparation = Infinity;
  for (let a = 0; a < scene.provinces.length; a++) for (let b = a + 1; b < scene.provinces.length; b++) {
    const x = scene.provinces[a].labelAt, y = scene.provinces[b].labelAt;
    closest = Math.min(closest, Math.hypot(x[0]-y[0],x[1]-y[1]) * scale);
    squareSeparation = Math.min(squareSeparation, Math.max(Math.abs(x[0]-y[0]),Math.abs(x[1]-y[1])) * scale);
  }
  records.push({ seed, attempts: 1, generated: true, mapHash: hash(map), sceneHash: hash(scene),
    islandNeighbourMax: Math.max(...adjacency.map(i => i.neighbours.length)),
    approvedHubLimitFailures: adjacency.filter(i => i.neighbours.length > 4),
    closestLabelCss: closest, closestSquareSeparationCss: squareSeparation,
    elapsedMs: performance.now() - start });
}
console.log(JSON.stringify({ purpose: 'Existing generator/layout smoke; not the full T24 acceptance probe or a proof of joint infeasibility.',
  baseline: '469099e87a559c9ca43b63809571de73072f69e7', boardCss: [800,460], viewportCss: [800,540],
  samples: records.length, generated: records.filter(r=>r.generated).length,
  seedsViolatingApprovedHubLimit: records.filter(r=>r.approvedHubLimitFailures?.length).length,
  minimumLabelSeparationCss: Math.min(...records.filter(r=>r.generated).map(r=>r.closestLabelCss)),
  minimumSquareSeparationCss: Math.min(...records.filter(r=>r.generated).map(r=>r.closestSquareSeparationCss)), records }, null, 2));
