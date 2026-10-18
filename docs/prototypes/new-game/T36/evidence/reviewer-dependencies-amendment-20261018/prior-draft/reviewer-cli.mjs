#!/usr/bin/env node
// Opt-in adapter for tools/harness/lib/claude.mjs. Claude's real CLI runs in
// the review worktree with an independent, verbatim copy of owned dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const passthrough = args.length === 1 && ['--version', '-v', '--help', '-h'].includes(args[0]);
const realExe = process.env.MALPACO_CLAUDE_REAL_EXE || 'claude';
const scriptExe = /\.m?js$/i.test(realExe);
const command = scriptExe ? process.execPath : realExe;
const commandArgs = scriptExe ? [realExe, ...args] : args;

function refuse(message) {
  process.stderr.write(`reviewer-cli: ${message}\n`);
  process.exitCode = 2;
}

function realDirectory(value, label, { noFinalSymlink = false, nonempty = false } = {}) {
  if (!value) throw new Error(`${label} is required.`);
  const absolute = path.resolve(value);
  let stat;
  try { stat = fs.lstatSync(absolute); }
  catch { throw new Error(`${label} must name an existing directory.`); }
  if (!stat.isDirectory() || (noFinalSymlink && stat.isSymbolicLink())) {
    throw new Error(`${label} must name a real directory.`);
  }
  const real = fs.realpathSync(absolute);
  if (!fs.statSync(real).isDirectory()) throw new Error(`${label} must name a real directory.`);
  if (nonempty && fs.readdirSync(real).length === 0) throw new Error(`${label} must be a nonempty dependency directory.`);
  return real;
}

function within(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function prepareDependencies() {
  const root = realDirectory(process.env.HARNESS_REVIEW_WORKTREE_ROOT, 'HARNESS_REVIEW_WORKTREE_ROOT');
  const cwd = fs.realpathSync(process.cwd());
  if (!within(root, cwd)) throw new Error('current directory is outside HARNESS_REVIEW_WORKTREE_ROOT.');

  const source = realDirectory(process.env.MALPACO_REVIEW_DEPENDENCIES, 'MALPACO_REVIEW_DEPENDENCIES', {
    noFinalSymlink: true,
    nonempty: true,
  });
  const destination = path.join(cwd, 'node_modules');
  if (within(source, destination) || within(destination, source)) {
    throw new Error('dependency source and review destination must be separate directories.');
  }
  try {
    fs.lstatSync(destination);
    throw new Error('review worktree already has node_modules; refusing to overwrite it.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  // mkdir claims the absent destination atomically. If another process wins the
  // race, fail; never merge into or replace its directory. Copy children with
  // verbatim symlinks so relative node_modules/.bin links still resolve locally.
  fs.mkdirSync(destination);
  for (const entry of fs.readdirSync(source)) {
    fs.cpSync(path.join(source, entry), path.join(destination, entry), {
      recursive: true,
      force: false,
      errorOnExist: true,
      dereference: false,
      verbatimSymlinks: true,
    });
  }
}

if (!passthrough) {
  try { prepareDependencies(); }
  catch (error) {
    refuse(error instanceof Error ? error.message : 'dependency preparation failed.');
    process.exit();
  }
}

const child = spawn(command, commandArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});
let spawnError = false;
child.once('error', (error) => {
  spawnError = true;
  process.stderr.write(`reviewer-cli: could not start the configured Claude CLI (${error.code || 'spawn error'}).\n`);
  process.exitCode = 127;
});
child.once('close', (code, signal) => {
  if (spawnError) return;
  if (signal) {
    try { process.kill(process.pid, signal); }
    catch { process.exitCode = 128; }
  } else {
    process.exitCode = code ?? 1;
  }
});
