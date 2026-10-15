#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../");
const sourcePath = resolve(repo, "src/main.ts");
const stamp = new Date().toISOString().replaceAll(":", "-");
const evidence = resolve(here, "evidence", `final-${stamp}-${process.pid}`);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const original = await readFile(sourcePath);
const manifest = {
  startedAt: new Date().toISOString(),
  sourceBeforeSha256: hash(original),
  steps: [],
};
let failed = false;

await mkdir(dirname(evidence), { recursive: true });
await mkdir(evidence, { recursive: false });

async function run(label, command, args, expected = "pass") {
  const folder = resolve(evidence, label);
  await mkdir(folder, { recursive: false });
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, DEFAULT_ENTRY_EVIDENCE_DIR: folder },
    maxBuffer: 64 * 1024 * 1024,
  });
  const exitCode = result.status ?? 127;
  const passed = expected === "pass" ? exitCode === 0 : result.status !== null && exitCode !== 0;
  const artifacts = [];
  async function collect(folderPath, prefix = "") {
    for (const entry of await readdir(folderPath, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const path = resolve(folderPath, entry.name);
      if (entry.isDirectory()) await collect(path, relative);
      else artifacts.push({ path: relative, sha256: hash(await readFile(path)) });
    }
  }
  await collect(folder);
  const step = {
    label,
    command: [command, ...args],
    expected,
    exitCode,
    signal: result.signal,
    spawnError: result.error ? String(result.error) : undefined,
    stdoutSha256: hash(Buffer.from(result.stdout ?? "")),
    stderrSha256: hash(Buffer.from(result.stderr ?? "")),
    artifacts,
    passed,
  };
  manifest.steps.push(step);
  await writeFile(resolve(folder, "stdout.txt"), result.stdout ?? "", { flag: "wx" });
  await writeFile(resolve(folder, "stderr.txt"), result.stderr ?? "", { flag: "wx" });
  await writeFile(resolve(folder, "run.json"), `${JSON.stringify(step, null, 2)}\n`, { flag: "wx" });
  console.log(`${label}: ${command} ${args.join(" ")} → exit ${exitCode} (expected ${expected}; ${passed ? "ok" : "FAILED"})`);
  if (!passed) failed = true;
  return exitCode;
}

function mutate(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one source match, found ${count}`);
  return source.replace(from, to);
}

async function actualSourceMutation(label, sourceText) {
  const changed = Buffer.from(sourceText);
  const before = await readFile(sourcePath);
  try {
    await writeFile(sourcePath, changed);
    const mutation = {
      label,
      sourceSha256: hash(changed),
      sourceRestoredSha256: null,
      sourceRestoredByteForByte: false,
    };
    manifest.steps.push(mutation);
    await run(`${label}-acceptance`, "npx", ["playwright", "test", "tests/e2e/entry.spec.ts", "--workers=2"], "fail");
  } finally {
    await writeFile(sourcePath, before);
    const restored = await readFile(sourcePath);
    const entry = manifest.steps.findLast(step => step.label === label);
    if (entry) {
      entry.sourceRestoredSha256 = hash(restored);
      entry.sourceRestoredByteForByte = before.equals(restored);
      if (!entry.sourceRestoredByteForByte) failed = true;
    }
  }
}

try {
  await run("dw1-entry", "npx", ["playwright", "test", "tests/e2e/entry.spec.ts", "--workers=2"]);
  await run("dw2-authored", "npx", ["playwright", "test", "tests/e2e/slice.spec.ts", "tests/e2e/reinforcement.spec.ts", "--workers=2"]);

  const current = (await readFile(sourcePath)).toString("utf8");
  const authoredDefault = mutate(
    current,
    "} else {\n  // Includes game-setup and unknown view values; both safely land on setup.\n  mountGameSetup(root);\n}",
    "} else {\n  startAuthoredGame();\n}",
    "authored-default",
  );
  await actualSourceMutation("authored-default", authoredDefault);

  const noAuthoredRoute = mutate(
    (await readFile(sourcePath)).toString("utf8"),
    'if (view === "authored-game")',
    'if (view === "removed-authored-game")',
    "remove-authored-route",
  );
  await actualSourceMutation("remove-authored-route", noAuthoredRoute);

  await run("dw3-unit", "npm", ["test"]);
  await run("dw3-build", "npm", ["run", "build"]);
  await run("dw4-full-browser", "npx", ["playwright", "test", "--workers=2"]);
} catch (error) {
  failed = true;
  manifest.error = String(error);
} finally {
  await writeFile(sourcePath, original);
  const restored = await readFile(sourcePath);
  manifest.sourceAfterSha256 = hash(restored);
  manifest.sourceRestoredByteForByte = original.equals(restored);
  manifest.finishedAt = new Date().toISOString();
  if (!manifest.sourceRestoredByteForByte) failed = true;
  await writeFile(resolve(evidence, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
}

console.log(`Evidence: ${evidence}`);
console.log(`Production source restored byte-for-byte: ${manifest.sourceRestoredByteForByte} (${manifest.sourceAfterSha256})`);
process.exitCode = failed ? 1 : 0;
