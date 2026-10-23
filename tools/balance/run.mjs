#!/usr/bin/env node
import {build} from 'vite';
import {mkdir, readFile, writeFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {resolve, join, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), config = {dealSeeds: 500, gameSeeds: 200, out: 'artifacts/T105-comparison'};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i], value = args[i + 1];
  if (!value || !['--deal-seeds', '--game-seeds', '--out'].includes(key)) throw Error('Usage: node tools/balance/run.mjs [--deal-seeds N] [--game-seeds N] [--out artifacts/DIR]');
  if (key === '--out') config.out = value;
  else {
    const count = Number(value);
    if (!Number.isSafeInteger(count) || count < 1 || count > 10000) throw Error('Seed counts must be integers 1..10000');
    config[key === '--deal-seeds' ? 'dealSeeds' : 'gameSeeds'] = count;
  }
}
const out = resolve(root, config.out), artifacts = resolve(root, 'artifacts');
if (!out.startsWith(artifacts + '/')) throw Error('Output must be under artifacts/');
await mkdir(dirname(out), {recursive: true});
// A fresh directory preserves every earlier run, including errors and partial results.
await mkdir(out);
config.out = out;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const files = [];
async function collect(dir) {
  for (const entry of (await readdir(join(root, dir), {withFileTypes: true})).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path);
    else files.push(path);
  }
}
await collect('src/core'); await collect('tools/balance');
files.push('package.json', 'package-lock.json', 'fixtures/new-game/T34/witness.json', 'fixtures/new-game/T63/board.json');
const sourceHashes = Object.fromEntries(await Promise.all(files.map(async file => [file, hash(await readFile(join(root, file)))])));
const results = await build({root, configFile: false, logLevel: 'warn', build: {write: false, minify: false,
  lib: {entry: join(root, 'tools/balance/measure.ts'), formats: ['es']}, rollupOptions: {external: [/^node:/]}}});
const outputs = (Array.isArray(results) ? results : [results]).flatMap(r => r.output);
const chunk = outputs.find(o => o.type === 'chunk' && o.isEntry);
if (!chunk || outputs.length !== 1) throw Error('Expected one self-contained measurement bundle');
const bundle = join(out, 'measure.mjs'); await writeFile(bundle, chunk.code);
const manifest = {sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
  trackedDiff: execFileSync('git', ['diff', 'HEAD', '--', 'src/core', 'tools/balance', 'package.json', 'package-lock.json'], {cwd: root, encoding: 'utf8'}),
  sourceHashes, sourceHash: hash(JSON.stringify(sourceHashes)), bundleHash: hash(chunk.code), node: process.version,
  command: ['node', 'tools/balance/run.mjs', ...args]};
await writeFile(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const run = spawnSync(process.execPath, [bundle, JSON.stringify(config)], {cwd: root, stdio: 'inherit'});
for (const name of ['deals.jsonl', 'games.jsonl', 'summary.json']) {
  try {manifest[name] = hash(await readFile(join(out, name)));} catch { /* Partial runs remain inspectable. */ }
}
await writeFile(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Evidence: ${relative(root, out)}`);
if (run.error) throw run.error;
process.exitCode = run.status ?? 1;
