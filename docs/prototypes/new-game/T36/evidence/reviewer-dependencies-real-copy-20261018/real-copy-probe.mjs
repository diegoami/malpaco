import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { materializeReviewDependencies } from '../../../../../../tools/harness/lib/review-dependencies.mjs';

const evidence = path.dirname(new URL(import.meta.url).pathname);
const sourceArg = process.argv[2] ?? path.resolve('node_modules');
const source = fs.realpathSync(sourceArg);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 't36-private-dependency-copy-'));
const worktree = path.join(temp, 'review-worktree');
fs.mkdirSync(worktree);
const sha = (data) => crypto.createHash('sha256').update(data).digest('hex');
function inventory(root) {
  const rows = [];
  function walk(dir, rel = '') {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, item.name), name = rel ? `${rel}/${item.name}` : item.name;
      const st = fs.lstatSync(abs);
      if (st.isSymbolicLink()) rows.push({ path: name, kind: 'link', target: fs.readlinkSync(abs) });
      else if (st.isDirectory()) { rows.push({ path: name, kind: 'directory' }); walk(abs, name); }
      else if (st.isFile()) rows.push({ path: name, kind: 'file', bytes: st.size, sha256: sha(fs.readFileSync(abs)), inode: `${st.dev}:${st.ino}` });
      else rows.push({ path: name, kind: 'other' });
    }
  }
  walk(root); return rows.sort((a,b)=>a.path.localeCompare(b.path));
}
const startedUtc = new Date().toISOString(), started = performance.now();
const before = inventory(source);
const prepared = materializeReviewDependencies({ source, destination: path.join(worktree, 'node_modules'), ownedRoot: worktree });
const copied = inventory(prepared.destination);
const contentRows = (rows) => rows.map(({inode,...row})=>row);
const sameContent = JSON.stringify(contentRows(before)) === JSON.stringify(contentRows(copied));
const sourceFiles = new Map(before.filter(r=>r.kind==='file').map(r=>[r.path,r]));
const copiedFiles = copied.filter(r=>r.kind==='file');
const sourceInodes = new Set([...sourceFiles.values()].map(r=>r.inode));
const sharedInodes = copiedFiles.filter(r=>sourceInodes.has(r.inode)).map(r=>r.path);
const candidate = ['typescript/package.json', ...copiedFiles.map(r=>r.path)].find(p=>sourceFiles.has(p));
if (!candidate) throw new Error('No regular dependency file available for the mutation isolation probe.');
const sourceFile = path.join(source,candidate), copyFile = path.join(prepared.destination,candidate);
const originalCopy = fs.readFileSync(copyFile), sourceBefore = sha(fs.readFileSync(sourceFile));
fs.appendFileSync(copyFile, '\nT36 private-copy mutation probe\n');
const sourceAfterMutation = sha(fs.readFileSync(sourceFile));
fs.writeFileSync(copyFile, originalCopy);
const restoredCopy = sha(fs.readFileSync(copyFile)) === sha(originalCopy);
const sourceAfterRestore = sha(fs.readFileSync(sourceFile));
const treeHash = rows => sha(JSON.stringify(contentRows(rows)));
const manifestFiles = [
  ['source-tree.json.gz', gzipSync(JSON.stringify(before))],
  ['copy-tree.json.gz', gzipSync(JSON.stringify(copied))],
];
for (const [name,data] of manifestFiles) fs.writeFileSync(path.join(evidence,name),data);
const report = {
  startedUtc, endedUtc: new Date().toISOString(), durationSeconds: (performance.now()-started)/1000,
  source: prepared.source, destination: prepared.destination, retainedProbeDirectory: temp,
  sourceEntries: before.length, copiedEntries: copied.length,
  sourceRegularFiles: before.filter(r=>r.kind==='file').length, copiedRegularFiles: copiedFiles.length,
  sourceSymlinks: before.filter(r=>r.kind==='link').length, copiedSymlinks: copied.filter(r=>r.kind==='link').length,
  contentTreesEqual: sameContent, sourceTreeSha256: treeHash(before), copiedTreeSha256: treeHash(copied),
  sharedRegularFileInodes: sharedInodes, mutationTarget: candidate,
  sourceSha256Before: sourceBefore, sourceSha256AfterMutation: sourceAfterMutation,
  sourceSha256AfterRestore: sourceAfterRestore, copiedFileRestored: restoredCopy,
  sourceUnchanged: sourceBefore===sourceAfterMutation && sourceBefore===sourceAfterRestore,
  capturedInventories: Object.fromEntries(manifestFiles.map(([name,data])=>[name,{bytes:data.length,sha256:sha(data)}])),
};
fs.writeFileSync(path.join(evidence,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if (!sameContent || sharedInodes.length || !restoredCopy || !report.sourceUnchanged) process.exitCode=1;
