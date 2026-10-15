import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const checkout = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const [requestedOutput] = process.argv.slice(2);
if (!requestedOutput || process.argv.length !== 3) {
  throw new Error("usage: node docs/prototypes/playable/verify-final.mjs <fresh-evidence-directory>");
}

const output = resolve(checkout, requestedOutput);
const outputRelative = relative(checkout, output);
if (outputRelative === ".." || outputRelative.startsWith(`..${sep}`) || resolve(output) === checkout) {
  throw new Error("evidence output must be inside the source checkout");
}
if (!outputRelative.startsWith(`docs${sep}prototypes${sep}playable${sep}`)) {
  throw new Error("evidence output must be under docs/prototypes/playable/");
}
try {
  await lstat(output);
  throw new Error(`evidence output already exists; choose a fresh path: ${output}`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await mkdir(output, { recursive: false });

const tempRoot = await mkdtemp(join(tmpdir(), "malpaco-t21-final-"));
const extracted = join(tempRoot, "fresh-extraction");
const packageDir = join(extracted, "malpaco-playable");
const mutationTemp = await mkdtemp(join(tmpdir(), "malpaco-t21-entry-"));
const runs = [];
let failure;

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function listFiles(root, prefix = "") {
  const files = [];
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(root, path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

async function command(label, program, args, env = process.env) {
  const result = spawnSync(program, args, {
    cwd: checkout,
    encoding: "utf8",
    timeout: 3_600_000,
    maxBuffer: 32 * 1024 * 1024,
    env,
  });
  const status = result.status ?? 1;
  const contents = [
    `$ ${program} ${args.join(" ")}`,
    `exit: ${status}`,
    "--- stdout ---",
    result.stdout ?? "",
    "--- stderr ---",
    result.stderr ?? result.error?.message ?? "",
  ].join("\n");
  const safeLabel = label.replace(/[^a-zA-Z0-9._-]/g, "-");
  const log = `${safeLabel}.txt`;
  await writeFile(join(output, log), `${contents}\n`);
  const record = { label, program, args, exitCode: status, log };
  runs.push(record);
  return { ...record, stdout: result.stdout ?? "", stderr: result.stderr ?? "", status };
}

function requirePass(result) {
  if (result.status !== 0) throw new Error(`${result.label} failed; see ${result.log}`);
}

async function verifyEntryMutation() {
  const index = await readFile(join(packageDir, "index.html"), "utf8");
  const entry = /<script\b[^>]*\bsrc=["']([^"']+\.js)["']/i.exec(index)?.[1];
  if (!entry) throw new Error("could not locate the packaged JavaScript entry in index.html");
  const entryUrl = new URL(entry, "http://127.0.0.1:4175/");
  const entryPath = resolve(packageDir, `.${decodeURIComponent(entryUrl.pathname)}`);
  const relativeEntry = relative(packageDir, entryPath);
  if (!relativeEntry || relativeEntry === ".." || relativeEntry.startsWith(`..${sep}`)) {
    throw new Error(`entry asset escaped extracted package: ${entry}`);
  }

  const saved = await readFile(entryPath);
  const savedPath = join(mutationTemp, "entry.js.saved");
  await writeFile(savedPath, saved);
  let mutation;
  try {
    await unlink(entryPath);
    mutation = await command(
      "removed-entry-asset",
      process.execPath,
      ["docs/prototypes/playable/acceptance.mjs", "--verify-extracted", extracted],
    );
  } finally {
    const exactBytes = await readFile(savedPath);
    await writeFile(entryPath, exactBytes);
    const restored = await readFile(entryPath);
    const restoredHash = hash(restored);
    await writeFile(join(output, "entry-restoration.txt"), [
      `asset: ${relativeEntry.split(sep).join("/")}`,
      `saved-sha256: ${hash(saved)}`,
      `restored-sha256: ${restoredHash}`,
      `byte-identical: ${restored.equals(saved)}`,
    ].join("\n") + "\n");
    if (!restored.equals(saved)) throw new Error("extracted JavaScript entry was not restored byte for byte");
  }
  const outputText = `${mutation.stdout}\n${mutation.stderr}`;
  if (mutation.status === 0 || !outputText.includes(`asset check: GET ${entryUrl.pathname} returned HTTP 404`)) {
    throw new Error("removing the extracted entry did not make acceptance fail on its HTTP 404 asset request");
  }
}

try {
  const fresh = await command("package-acceptance", process.execPath, [
    "docs/prototypes/playable/acceptance.mjs",
    extracted,
  ]);
  requirePass(fresh);

  const captures = join(output, "captures");
  const releaseEnv = {
    ...process.env,
    PLAYABLE_EXTRACTED_DIR: extracted,
    PLAYABLE_EVIDENCE_DIR: output,
    COMPLETE_EVIDENCE_DIR: captures,
    COMPUTER_EVIDENCE_DIR: captures,
    DEFAULT_ENTRY_EVIDENCE_DIR: captures,
    FINISHED_COPY_EVIDENCE_DIR: captures,
    SETUP_EVIDENCE_DIR: captures,
    GENERATED_EVIDENCE_DIR: captures,
    MATCH_SAVE_EVIDENCE_DIR: captures,
    RETRY_VALIDATION_EVIDENCE_DIR: captures,
    HELP_EVIDENCE_DIR: captures,
  };
  const artifactBrowser = await command("artifact-browser", "npx", [
    "playwright", "test", "--config", "playwright.release.config.ts", "--workers=2",
  ], releaseEnv);
  requirePass(artifactBrowser);

  await verifyEntryMutation();

  const restored = await command("restored-artifact-acceptance", process.execPath, [
    "docs/prototypes/playable/acceptance.mjs", "--verify-extracted", extracted,
  ]);
  requirePass(restored);

  const unit = await command("unit", "npm", ["test"]);
  requirePass(unit);

  const build = await command("build", "npm", ["run", "build"]);
  requirePass(build);

  const sourceCaptures = join(output, "source-captures");
  const sourceEnv = {
    ...process.env,
    COMPLETE_EVIDENCE_DIR: sourceCaptures,
    COMPUTER_EVIDENCE_DIR: sourceCaptures,
    DEFAULT_ENTRY_EVIDENCE_DIR: sourceCaptures,
    FINISHED_COPY_EVIDENCE_DIR: sourceCaptures,
    SETUP_EVIDENCE_DIR: sourceCaptures,
    GENERATED_EVIDENCE_DIR: sourceCaptures,
    MATCH_SAVE_EVIDENCE_DIR: sourceCaptures,
    RETRY_VALIDATION_EVIDENCE_DIR: sourceCaptures,
    HELP_EVIDENCE_DIR: sourceCaptures,
  };
  const fullBrowser = await command("source-browser", "npx", ["playwright", "test", "--workers=2"], sourceEnv);
  requirePass(fullBrowser);
} catch (error) {
  failure = error;
  await writeFile(join(output, "failure.txt"), `${error.stack ?? error.message}\n`);
} finally {
  await rm(mutationTemp, { recursive: true, force: true });
  await writeFile(join(output, "run.json"), `${JSON.stringify({
    createdAt: new Date().toISOString(),
    checkout,
    extractedArtifact: extracted,
    commands: runs.map(({ stdout, stderr, ...record }) => record),
    failure: failure?.message ?? null,
  }, null, 2)}\n`);
  const evidenceFiles = await listFiles(output);
  const sums = [];
  for (const path of evidenceFiles) {
    sums.push(`${hash(await readFile(join(output, path)))}  ${path}`);
  }
  await writeFile(join(output, "SHA256SUMS"), `${sums.join("\n")}\n`);
}

console.log(`Final T21 evidence: ${relative(checkout, output).split(sep).join("/")}`);
console.log(`Extracted artifact: ${extracted}`);
if (failure) throw failure;
