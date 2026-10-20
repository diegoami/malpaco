#!/usr/bin/env node
// Optional review of one PR by another model, posted as one PR comment (docs/process.md §4).
//
//   node tools/review.mjs --pr 42 [--model KEY] [--brief task.md] [--checkout] [--dry-run]
//
// KEY is a harness.json `models` key; without it `review.default` runs. Any model may review any
// PR: there is no family rule. The review runs in this checkout. With --checkout the script first
// runs `gh pr checkout` (refused on a dirty tree), so the reviewer can build and test; without it
// the reviewer reads the PR head through git (`git show <sha>:<file>`) and says what it did not run.
// --brief adds a file (usually the task file) to the prompt. --dry-run prints instead of posting.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const flag = (name) => args.includes(name);
const die = (msg, code = 1) => { console.error(`review: ${msg}`); process.exit(code); };
const run = (cmd, argv, extra = {}) => {
  const r = spawnSync(cmd, argv, { encoding: 'utf8', maxBuffer: 64 << 20, ...extra });
  if (r.error) die(`${cmd}: ${r.error.message}`, 3);
  return r;
};
const must = (cmd, argv) => {
  const r = run(cmd, argv);
  if (r.status !== 0) die(`${cmd} ${argv.join(' ')} failed:\n${r.stderr}`);
  return r.stdout.trim();
};

const pr = opt('--pr');
if (!pr || !/^\d+$/.test(pr)) die('usage: --pr <number> [--model KEY] [--brief FILE] [--checkout] [--dry-run]', 2);
const harness = JSON.parse(readFileSync('harness.json', 'utf8'));
const key = opt('--model') ?? harness.review.default;
const model = harness.models[key];
if (!model) die(`unknown model key "${key}"; harness.json has: ${Object.keys(harness.models).join(', ')}`, 2);

if (flag('--checkout')) {
  if (must('git', ['status', '--porcelain'])) die('--checkout needs a clean working tree');
  must('gh', ['pr', 'checkout', pr]);
}
const view = JSON.parse(must('gh', ['pr', 'view', pr, '--json', 'headRefOid,title,body,baseRefName']));
must('git', ['fetch', '-q', 'origin', `pull/${pr}/head`, view.baseRefName]);
const sha = view.headRefOid;
const checkedOut = must('git', ['rev-parse', 'HEAD']) === sha;

const brief = opt('--brief') ? readFileSync(opt('--brief'), 'utf8') : '';
const prompt = [
  readFileSync('docs/review-pr.md', 'utf8'),
  `\n## This review\n\nPR #${pr} "${view.title}", head ${sha}, base origin/${view.baseRefName}.`,
  checkedOut
    ? 'The working tree is checked out at the head: build and run the tests.'
    : `The working tree is NOT at the head. Read files with \`git show ${sha}:<path>\` and the diff with \`git diff origin/${view.baseRefName}...${sha}\`; list what you could not run.`,
  `\n### PR description\n\n${view.body || '(none)'}`,
  brief && `\n### Brief\n\n${brief}`,
].filter(Boolean).join('\n');

const timeout = (harness.review.timeoutMin ?? 60) * 60_000;
const started = Date.now();
let r;
if (model.cli === 'opencode') {
  const id = model.variant ? `${model.id}#${model.variant}` : model.id;
  // stdin must be closed: `opencode run` reads a non-terminal stdin to its end before starting.
  r = run('opencode', ['run', '-m', id, '--agent', 'reviewer', prompt], { stdio: ['ignore', 'pipe', 'pipe'], timeout });
} else if (model.cli === 'claude') {
  r = run('claude', ['-p', '--model', model.id, '--allowedTools', 'Read', 'Grep', 'Glob', 'Bash',
    '--disallowedTools', 'Edit', 'Write', 'NotebookEdit', '--', prompt], { stdio: ['ignore', 'pipe', 'pipe'], timeout });
} else die(`model "${key}" has unknown cli "${model.cli}"`, 2);

const minutes = ((Date.now() - started) / 60_000).toFixed(1);
const text = (r.stdout || '').trim();
if (r.status !== 0 || !text) die(`no review from ${key} (exit ${r.status}, ${minutes} min):\n${(r.stderr || '').slice(-4000)}`, 3);

const body = `**Review by ${key}** (\`${model.id}\`) of ${sha.slice(0, 12)}, ${minutes} min, `
  + `${checkedOut ? 'checked out' : 'read through git'}.\n\n${text}\n`;
if (flag('--dry-run')) { console.log(body); process.exit(0); }
const file = path.join(mkdtempSync(path.join(tmpdir(), 'mlp-review-')), 'review.md');
writeFileSync(file, body);
console.log(must('gh', ['pr', 'comment', pr, '--body-file', file]));
