import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const directory = path.join(root, 'docs/plans/new-game');
const target = path.join(directory, 'rules-inventory-core-rules-01.json');
const original = fs.readFileSync(target);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const command = () => spawnSync(process.execPath, ['docs/plans/new-game/verify-inventory.mjs'], { cwd: root, encoding: 'utf8' });
const results = [];
try {
  for (const [name, mutation] of [
    ['remove requirement', rows => rows.pop()],
    ['remove citation', rows => delete rows[0].citation],
    ['remove task mapping', rows => rows[0].tasks = []],
    ['duplicate requirement', rows => rows.push(structuredClone(rows[0]))],
  ]) {
    const rows = JSON.parse(original); mutation(rows);
    fs.writeFileSync(target, JSON.stringify(rows));
    const red = command();
    if (red.status === 0) throw new Error(`Surviving matrix mutation: ${name}`);
    results.push({ mutation: name, exit: red.status, diagnostic: red.stderr.trim() });
    fs.writeFileSync(target, original);
  }
} finally { fs.writeFileSync(target, original); }
const green = command();
if (green.status !== 0 || digest(fs.readFileSync(target)) !== digest(original)) throw new Error('Restoration failed');
const report = { command: 'node docs/plans/new-game/inventory-evidence/check-mutations.mjs',
  target: path.relative(root, target), before: digest(original), after: digest(fs.readFileSync(target)),
  results, restoredExit: green.status, restoredOutput: green.stdout.trim() };
console.log(JSON.stringify(report, null, 2));
