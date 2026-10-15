import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, lstat, mkdir, readFile, readdir, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const stageDir = dirname(fileURLToPath(import.meta.url));
const checkout = resolve(stageDir, "../../../..");
const fixtures = join(stageDir, ".mockfixtures");
const evidenceBase = join(stageDir, "evidence");
const runId = `${new Date().toISOString().replaceAll(":", "-")}-${process.pid}`;
const evidence = join(evidenceBase, `replay-${runId}`);
const temp = await (await import("node:fs/promises")).mkdtemp(join(tmpdir(), "t21-playable-stage1-"));
const extraction = join(temp, "fresh-extraction");
const generatedRelease = join(checkout, "release");

function fail(message) { throw new Error(message); }
function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

async function exists(path) {
  try { await lstat(path); return true; } catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function record(name, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: checkout,
    encoding: "utf8",
    timeout: 3_600_000,
    env: process.env,
    ...options,
  });
  const output = [
    `$ ${command} ${args.join(" ")}`,
    `exit: ${result.status ?? "spawn-error"}`,
    "--- stdout ---",
    result.stdout ?? "",
    "--- stderr ---",
    result.stderr ?? result.error?.message ?? "",
  ].join("\n");
  await writeFile(join(evidence, `${name}.txt`), `${output}\n`);
  return result;
}

const targetNames = [
  "tools/release/package-playable.mjs",
  "tools/release/serve.mjs",
  "tools/release/PLAY.md",
  "playwright.release.config.ts",
  "docs/prototypes/playable/acceptance.mjs",
  "package.json",
];
const originals = new Map();
const generatedTargets = [
  ["tools/release/package-playable.mjs", "package-playable.mjs"],
  ["tools/release/serve.mjs", "serve.mjs"],
  ["tools/release/PLAY.md", "PLAY.md"],
  ["playwright.release.config.ts", "playwright.release.config.ts"],
  ["docs/prototypes/playable/acceptance.mjs", "acceptance.mjs"],
];

await mkdir(evidenceBase, { recursive: true });
await mkdir(evidence, { recursive: false });
for (const name of targetNames) {
  const path = join(checkout, name);
  originals.set(name, await exists(path) ? await readFile(path) : null);
}
if (await exists(generatedRelease)) fail("refusing to overwrite a pre-existing release/ directory");

let mutationOriginal;
let mutationPath;
let replayFailure;
try {
  await mkdir(extraction, { recursive: true });

  const acceptancePath = join(checkout, "docs/prototypes/playable/acceptance.mjs");
  await copyFile(join(fixtures, "acceptance.mjs"), acceptancePath);

  const absentBaseline = await record(
    "baseline-package-script-absent",
    process.execPath,
    ["docs/prototypes/playable/acceptance.mjs", extraction],
  );
  if (absentBaseline.status === 0 || !`${absentBaseline.stdout}\n${absentBaseline.stderr}`.includes('Missing script: "package:playable"')) {
    fail("acceptance did not fail at the missing package:playable baseline");
  }

  await mkdir(join(checkout, "tools/release"), { recursive: true });
  for (const [target, fixture] of generatedTargets) {
    if (target === "docs/prototypes/playable/acceptance.mjs") continue;
    const targetPath = join(checkout, target);
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(join(fixtures, fixture), targetPath);
  }
  const packagePath = join(checkout, "package.json");
  const packageJson = JSON.parse((await readFile(packagePath)).toString("utf8"));
  packageJson.scripts["package:playable"] = "node tools/release/package-playable.mjs";
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const candidateAcceptance = await record(
    "candidate-acceptance",
    process.execPath,
    ["docs/prototypes/playable/acceptance.mjs", extraction],
  );
  if (candidateAcceptance.status !== 0) fail("disposable actual-source candidate acceptance failed");

  const captureRoot = join(evidence, "captures");
  const env = {
    ...process.env,
    PLAYABLE_EXTRACTED_DIR: extraction,
    PLAYABLE_EVIDENCE_DIR: evidence,
    COMPLETE_EVIDENCE_DIR: captureRoot,
    COMPUTER_EVIDENCE_DIR: captureRoot,
    DEFAULT_ENTRY_EVIDENCE_DIR: captureRoot,
    FINISHED_COPY_EVIDENCE_DIR: captureRoot,
    SETUP_EVIDENCE_DIR: captureRoot,
    GENERATED_EVIDENCE_DIR: captureRoot,
    MATCH_SAVE_EVIDENCE_DIR: captureRoot,
    RETRY_VALIDATION_EVIDENCE_DIR: captureRoot,
    HELP_EVIDENCE_DIR: captureRoot,
  };
  const browser = await record(
    "release-browser",
    "npx",
    ["playwright", "test", "--config", "playwright.release.config.ts", "--workers=2"],
    { env },
  );
  if (browser.status !== 0) fail("artifact-only Playwright suite failed");

  const indexText = await readFile(join(extraction, "malpaco-playable", "index.html"), "utf8");
  const entry = /<script\b[^>]*\bsrc=["']([^"']+\.js)["']/i.exec(indexText)?.[1];
  if (!entry) fail("could not identify the packaged JavaScript entry in index.html");
  const entryUrl = new URL(entry, "http://127.0.0.1:4175/");
  mutationPath = join(extraction, "malpaco-playable", decodeURIComponent(entryUrl.pathname).replace(/^\/+/, ""));
  mutationOriginal = await readFile(mutationPath);
  await rm(mutationPath);
  const mutation = await record(
    "removed-entry-asset",
    process.execPath,
    ["docs/prototypes/playable/acceptance.mjs", "--verify-extracted", extraction],
  );
  if (mutation.status === 0 || !`${mutation.stdout}\n${mutation.stderr}`.includes(`asset check: GET ${entryUrl.pathname} returned HTTP 404`)) {
    fail("removed extracted JavaScript entry did not produce the expected HTTP 404 asset failure");
  }
} catch (error) {
  replayFailure = error;
  await writeFile(join(evidence, "replay-failure.txt"), `${error.stack ?? error.message}\n`);
} finally {
  if (mutationPath && mutationOriginal) {
    await writeFile(mutationPath, mutationOriginal);
    const restored = await readFile(mutationPath);
    if (hash(restored) !== hash(mutationOriginal)) fail("removed JavaScript entry was not restored byte for byte");
    await writeFile(join(evidence, "entry-restoration.txt"), `restored exact bytes\nsha256: ${hash(restored)}\n`);
  }
  for (const [name, bytes] of originals) {
    const path = join(checkout, name);
    if (bytes === null) await rm(path, { force: true });
    else await writeFile(path, bytes);
  }
  if (await exists(join(checkout, "tools/release"))) {
    const remaining = await readdir(join(checkout, "tools/release"));
    if (remaining.length === 0) await rmdir(join(checkout, "tools/release"));
  }
  if (await exists(generatedRelease)) await rm(generatedRelease, { recursive: true });
  const restorationLines = [];
  for (const [name, bytes] of originals) {
    const path = join(checkout, name);
    const restored = bytes === null ? !(await exists(path)) : (await exists(path) && hash(await readFile(path)) === hash(bytes));
    restorationLines.push(`${restored ? "RESTORED" : "MISMATCH"} ${name} ${bytes === null ? "(absent)" : hash(bytes)}`);
    if (!restored) replayFailure ??= new Error(`temporary fixture target was not restored exactly: ${name}`);
  }
  await writeFile(join(evidence, "temporary-source-restoration.txt"), `${restorationLines.join("\n")}\n`);
}
await writeFile(join(evidence, "replay-summary.txt"), [
  `baseline package script absent: ${replayFailure ? "see replay-failure.txt" : "red captured"}`,
  `candidate acceptance: ${replayFailure ? "see replay-failure.txt" : "green"}`,
  `artifact-only release browser suite: ${replayFailure ? "see replay-failure.txt" : "green"}`,
  `removed extracted entry asset: ${replayFailure ? "see replay-failure.txt" : "red with HTTP 404"}`,
  `extracted artifact retained at: ${extraction}`,
  `evidence directory: ${relative(checkout, evidence).split(sep).join("/")}`,
].join("\n") + "\n");

async function listFiles(dir, prefix = "") {
  const paths = [];
  for (const entry of await readdir(join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) paths.push(...await listFiles(dir, rel));
    else if (entry.isFile()) paths.push(rel);
  }
  return paths.sort();
}
const evidenceFiles = await listFiles(evidence);
const evidenceHashes = [];
for (const name of evidenceFiles) {
  const bytes = await readFile(join(evidence, name));
  evidenceHashes.push(`${hash(bytes)}  ${name}`);
}
await writeFile(join(evidence, "SHA256SUMS"), `${evidenceHashes.join("\n")}\n`);
console.log(`Stage 1 candidate replay evidence: ${relative(checkout, evidence)}`);
console.log(`Extracted artifact: ${extraction}`);
if (replayFailure) throw replayFailure;
