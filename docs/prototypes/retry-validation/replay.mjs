#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../");
const sourcePath = resolve(repo, "src/ui/generatedGame.ts");
const candidatePath = resolve(here, "generatedGame.candidate.ts");
const stamp = new Date().toISOString().replaceAll(":", "-");
const evidence = resolve(here, "evidence", `${stamp}-${process.pid}`);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

const args = process.argv.slice(2);
const mode = args.shift();
if (!["baseline", "mock"].includes(mode) || args.shift() !== "--") {
  console.error("Usage: node docs/prototypes/retry-validation/replay.mjs baseline|mock -- <command> [args...]");
  process.exit(2);
}
const [command, ...commandArgs] = args;
if (!command) {
  console.error("Replay command is required after --");
  process.exit(2);
}

await mkdir(dirname(evidence), { recursive: true });
await mkdir(evidence, { recursive: false });
const original = await readFile(sourcePath);
const record = {
  mode,
  command: [command, ...commandArgs],
  sourceBeforeSha256: hash(original),
  candidateSha256: hash(await readFile(candidatePath)),
  evidence,
  startedAt: new Date().toISOString(),
};
let exitCode = 1;
try {
  if (mode === "mock") await writeFile(sourcePath, await readFile(candidatePath));
  const result = spawnSync(command, commandArgs, {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, RETRY_VALIDATION_EVIDENCE_DIR: evidence },
    maxBuffer: 64 * 1024 * 1024,
  });
  exitCode = result.status ?? 1;
  record.exitCode = exitCode;
  record.signal = result.signal;
  record.stdout = result.stdout ?? "";
  record.stderr = result.stderr ?? "";
  if (result.error) record.spawnError = String(result.error);
} finally {
  await writeFile(sourcePath, original);
  const restored = await readFile(sourcePath);
  record.sourceAfterSha256 = hash(restored);
  record.sourceRestoredByteForByte = original.equals(restored);
  record.finishedAt = new Date().toISOString();
  await writeFile(resolve(evidence, "replay.json"), `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
  await writeFile(resolve(evidence, "stdout.txt"), record.stdout ?? "", { flag: "wx" });
  await writeFile(resolve(evidence, "stderr.txt"), record.stderr ?? "", { flag: "wx" });
}
console.log(`Evidence: ${evidence}`);
console.log(`Source before: ${record.sourceBeforeSha256}`);
console.log(`Source after:  ${record.sourceAfterSha256} (byte-for-byte restored: ${record.sourceRestoredByteForByte})`);
console.log(`Replay exit: ${exitCode}`);
process.exitCode = exitCode;
