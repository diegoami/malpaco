#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../");
const sourcePath = resolve(repo, "src/ui/panel.ts");
const stamp = new Date().toISOString().replaceAll(":", "-");
const evidence = resolve(here, "evidence", `final-${stamp}-${process.pid}`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const focused = ["npx", "playwright", "test", "tests/e2e/finished-copy.spec.ts", "--workers=2"];
const records = [];

async function filesUnder(root, prefix = "") {
  const files = [];
  for (const entry of await readdir(resolve(root, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await filesUnder(root, relative));
    else files.push(relative);
  }
  return files;
}

await mkdir(dirname(evidence), { recursive: true });
await mkdir(evidence, { recursive: false });
const original = await readFile(sourcePath);
const originalHash = hash(original);

async function run(name, command, args, expectedExit) {
  const dir = resolve(evidence, name);
  await mkdir(dir, { recursive: false });
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, FINISHED_COPY_EVIDENCE_DIR: evidence },
    maxBuffer: 64 * 1024 * 1024,
  });
  const exitCode = result.status ?? 1;
  const record = {
    name,
    command: [command, ...args],
    expectedExit,
    exitCode,
    signal: result.signal,
    spawnError: result.error ? String(result.error) : undefined,
    sourceSha256: hash(await readFile(sourcePath)),
  };
  await writeFile(resolve(dir, "stdout.txt"), result.stdout ?? "", { flag: "wx" });
  await writeFile(resolve(dir, "stderr.txt"), result.stderr ?? "", { flag: "wx" });
  await writeFile(resolve(dir, "run.json"), `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
  records.push(record);
  if (exitCode !== expectedExit) throw Error(`${name} exited ${exitCode}; expected ${expectedExit}. See ${dir}`);
  return record;
}

function replaceOnce(bytes, oldText, newText, label) {
  const source = bytes.toString("utf8");
  const first = source.indexOf(oldText);
  if (first < 0 || source.indexOf(oldText, first + oldText.length) >= 0) {
    throw Error(`${label} mutation anchor must occur exactly once`);
  }
  return Buffer.from(source.slice(0, first) + newText + source.slice(first + oldText.length));
}

async function mutation(name, oldText, newText) {
  try {
    await writeFile(sourcePath, replaceOnce(original, oldText, newText, name));
    await run(name, focused[0], focused.slice(1), 1);
  } finally {
    await writeFile(sourcePath, original);
    const restored = await readFile(sourcePath);
    const restoredHash = hash(restored);
    records.push({ name: `${name}-restoration`, sourceSha256: restoredHash, sourceRestoredByteForByte: original.equals(restored) });
    if (!original.equals(restored)) throw Error(`${name} failed to restore src/ui/panel.ts exactly`);
  }
}

try {
  await run("focused", focused[0], focused.slice(1), 0);
  await run("unit", "npm", ["test"], 0);
  await run("build", "npm", ["run", "build"], 0);
  await run("full-browser", "npx", ["playwright", "test", "--workers=2"], 0);

  await mutation(
    "guidance-reversion",
    '"Choose New game to start another match."',
    '"Select one of your provinces to continue."',
  );
  await mutation(
    "subtitle-reversion",
    'finished ? "The game is over. Choose New game to play again." : computer ? "Computer · Normal · " : "",\n          ...(finished ? [] : [`Round ${state.turnNumber} · `, h("span", { id: "turn-phase" }, phase)])',
    'computer && !finished ? "Computer · Normal · " : "",\n          finished ? "The game is over." : `Round ${state.turnNumber} · `, h("span", { id: "turn-phase" }, phase)',
  );
  await run("focused-restored", focused[0], focused.slice(1), 0);
} finally {
  await writeFile(sourcePath, original);
  const restored = await readFile(sourcePath);
  const sourceAfterHash = hash(restored);
  const manifest = {
    startedAt: stamp,
    evidence,
    sourceBeforeSha256: originalHash,
    sourceAfterSha256: sourceAfterHash,
    sourceRestoredByteForByte: original.equals(restored),
    records,
  };
  await writeFile(resolve(evidence, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  const sums = [];
  for (const relative of await filesUnder(evidence)) {
    const bytes = await readFile(resolve(evidence, relative));
    sums.push(`${hash(bytes)}  ${relative}`);
  }
  await writeFile(resolve(evidence, "SHA256SUMS"), `${sums.join("\n")}\n`, { flag: "wx" });
  if (!original.equals(restored)) process.exitCode = 1;
}

console.log(`Evidence: ${evidence}`);
console.log(`Source before: ${originalHash}`);
console.log(`Source after:  ${hash(await readFile(sourcePath))} (byte-for-byte restored: ${original.equals(await readFile(sourcePath))})`);
console.log(`Commands and mutations recorded: ${records.length}`);
