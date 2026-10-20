#!/usr/bin/env node
// Stores artifacts (screenshots, logs, proof runs, builds) outside Git (docs/process.md §6).
//
//   node tools/artifacts.mjs drive <path>... [--to <subfolder>]   Google Drive, through rclone
//   node tools/artifacts.mjs release <tag> <file>...              a GitHub release's assets
//
// Drive: harness.json `artifacts` names the rclone remote and the shared folder's id; `rclone config`
// must have created a `drive` remote once (docs/process.md §6). Files land in <shared folder>/
// <subfolder>/, the subfolder defaulting to today's date. Release: the tag's release must exist (`gh release create`).
import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const [mode, ...rest] = process.argv.slice(2);
const die = (msg, code = 1) => { console.error(`artifacts: ${msg}`); process.exit(code); };
const run = (cmd, argv) => {
  const r = spawnSync(cmd, argv, { stdio: 'inherit' });
  if (r.error) die(`${cmd}: ${r.error.message}${r.error.code === 'ENOENT' ? ` (is ${cmd} installed?)` : ''}`, 3);
  if (r.status !== 0) die(`${cmd} ${argv.join(' ')} exited ${r.status}`);
};

if (mode === 'drive') {
  const i = rest.indexOf('--to');
  const sub = i >= 0 ? rest.splice(i, 2)[1] : new Date().toISOString().slice(0, 10);
  if (!rest.length) die('usage: drive <path>... [--to <subfolder>]', 2);
  const { rcloneRemote, driveFolderId, driveShareUrl } = JSON.parse(readFileSync('harness.json', 'utf8')).artifacts;
  const dest = `${rcloneRemote}${sub}`;
  for (const p of rest) {
    const target = statSync(p).isDirectory() ? `${dest}/${path.basename(p)}` : dest;
    run('rclone', ['copy', '--drive-root-folder-id', driveFolderId, p, target]);
  }
  console.log(`Uploaded to ${sub}/ in ${driveShareUrl}`);
} else if (mode === 'release') {
  const [tag, ...files] = rest;
  if (!tag || !files.length) die('usage: release <tag> <file>...', 2);
  run('gh', ['release', 'upload', tag, ...files, '--clobber']);
} else die('usage: drive <path>... [--to <subfolder>] | release <tag> <file>...', 2);
