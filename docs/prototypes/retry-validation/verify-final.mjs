#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../");
const sourcePath = resolve(repo, "src/ui/generatedGame.ts");
const stamp = new Date().toISOString().replaceAll(":", "-");
const evidence = resolve(here, "evidence", `final-${stamp}-${process.pid}`);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const focused = ["npx", "playwright", "test", "tests/e2e/retry-validation.spec.ts", "--workers=2"];
const mutationsOnly = process.argv.slice(2).includes("--mutations-only");
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

async function run(name, command, args, expectedExit, expectedFailureText) {
  const dir = resolve(evidence, name);
  await mkdir(dir, { recursive: false });
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, RETRY_VALIDATION_EVIDENCE_DIR: dir },
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
  if (expectedFailureText && !`${result.stdout ?? ""}\n${result.stderr ?? ""}`.includes(expectedFailureText)) {
    throw Error(`${name} failed without the expected acceptance assertion '${expectedFailureText}'. See ${dir}`);
  }
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

async function omittedFeedbackMutation() {
  try {
    const mutated = replaceOnce(
      original,
      'retryValidation.textContent = value.errors.join(" ");',
      'retryValidation.textContent = "";',
      "omitted-retry-feedback",
    );
    await writeFile(sourcePath, mutated);
      await run("omitted-feedback", focused[0], focused.slice(1), 1, "toBeVisible");
  } finally {
    await writeFile(sourcePath, original);
    const restored = await readFile(sourcePath);
    const restoredHash = hash(restored);
    records.push({ name: "omitted-feedback-restoration", sourceSha256: restoredHash, sourceRestoredByteForByte: original.equals(restored) });
    if (!original.equals(restored)) throw Error("Omitted-feedback mutation failed to restore src/ui/generatedGame.ts exactly");
  }
}

try {
  await run("focused", focused[0], focused.slice(1), 0);
  if (!mutationsOnly) {
    await run("unit", "npm", ["test"], 0);
    await run("build", "npm", ["run", "build"], 0);
    await run("full-browser", "npx", ["playwright", "test", "--workers=2"], 0);
  }
  await omittedFeedbackMutation();
  await run("focused-restored", focused[0], focused.slice(1), 0);
} finally {
  await writeFile(sourcePath, original);
  const restored = await readFile(sourcePath);
  const manifest = {
    startedAt: stamp,
    evidence,
    sourceBeforeSha256: originalHash,
    sourceAfterSha256: hash(restored),
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
