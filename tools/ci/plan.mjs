import {spawnSync} from 'node:child_process';
import {appendFileSync, readFileSync} from 'node:fs';
import {classifyChanges} from './policy.mjs';

function git(...args) {
  const result = spawnSync('git', args, {encoding:'utf8', maxBuffer:64 * 1024 * 1024});
  if (result.error || result.status !== 0) throw new Error('Git metadata unavailable');
  return result.stdout;
}
let mode = 'full';
let reason = 'Non-PR events require full verification';
let changedFiles;
try {
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const expected = [process.env.GITHUB_SHA, event.pull_request?.base?.sha, event.pull_request?.head?.sha];
    if (!expected.every(sha => typeof sha === 'string' && /^[0-9a-f]{40}$/.test(sha))) throw new Error('Missing or malformed event SHAs');
    const actual = git('rev-parse', 'HEAD').trim();
    if (actual !== expected[0]) throw new Error('HEAD differs from event SHA');
    // Raw commit parents remain visible even at a shallow boundary.
    const parents = [...git('cat-file', '-p', 'HEAD').matchAll(/^parent ([0-9a-f]{40})$/gm)].map(m => m[1]);
    if (parents.length !== 2 || parents[0] !== expected[1] || parents[1] !== expected[2]) throw new Error('Merge parents differ from event base/head');
    // A source-to-prose rename remains a deletion plus an addition.
    const diff = git('diff', '--no-ext-diff', '--no-renames', '--name-status', '-z', parents[0], actual, '--');
    if (!diff.endsWith('\0')) throw new Error('Missing or incomplete diff');
    const tokens = diff.slice(0, -1).split('\0');
    if (tokens.length % 2) throw new Error('Malformed diff records');
    const files = [];
    for (let i = 0; i < tokens.length; i += 2) {
      const status = {A:'added', M:'modified', D:'removed'}[tokens[i]];
      if (!status || !tokens[i + 1]) throw new Error('Unknown diff status or path');
      files.push({filename:tokens[i + 1], status});
    }
    changedFiles = files.length;
    mode = classifyChanges({eventName:'pull_request', files, changedFiles, complete:true});
    reason = mode === 'docs' ? 'Complete pinned diff contains only approved prose' : 'Pinned diff requires full verification';
  }
} catch (error) {
  reason = `Conservative full verification: ${error.message}`;
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `mode=${mode}\n`);
console.log(JSON.stringify({mode, reason, changedFiles}));
