import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const evidenceRoot = resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("usage: node docs/prototypes/map-1994/replay.mjs <fresh-evidence-directory>");
const previewPath = resolve(root, "preview.html");
const candidatePath = resolve(root, "fixtures/candidate-e/preview-e.html");
const verifyPath = resolve(root, "verify.mjs");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const statuses = {};
let candidateBytes;
let installed = false;
let changed = false;

await mkdir(evidenceRoot, { recursive: false });
if (await readFile(previewPath).then(() => true, () => false)) throw new Error("refusing to replay over an existing preview.html");
candidateBytes = await readFile(candidatePath);

function run(name) {
  const output = resolve(evidenceRoot, name);
  const result = spawnSync(process.execPath, [verifyPath, output], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  statuses[name] = { exitCode: result.status, signal: result.signal, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  return result;
}
async function preserve(name, result) {
  await writeFile(resolve(evidenceRoot, `${name}.stdout.txt`), result.stdout ?? "", { flag: "wx" });
  await writeFile(resolve(evidenceRoot, `${name}.stderr.txt`), result.stderr ?? "", { flag: "wx" });
}

try {
  const baseline = run("baseline-missing-preview");
  await preserve("baseline-missing-preview", baseline);
  statuses.baselineExpectedRed = baseline.status === 1 && (baseline.stderr ?? "").includes("preview.html is missing");

  await writeFile(previewPath, candidateBytes, { flag: "wx" });
  installed = true;
  const candidate = run("candidate-green");
  await preserve("candidate-green", candidate);
  statuses.candidateExpectedGreen = candidate.status === 0;

  const candidateText = candidateBytes.toString("utf8");
  const marker = "if(selected&&[...links.land,...links.sea].includes(selected))g.classList.add('is-neighbor')";
  const occurrences = candidateText.split(marker).length - 1;
  if (occurrences !== 1) throw new Error(`expected exactly one selected-neighbour feedback site, found ${occurrences}`);
  const mutated = Buffer.from(candidateText.replace(marker, "if(false)g.classList.add('is-neighbor')"), "utf8");
  await writeFile(previewPath, mutated);
  changed = true;
  statuses.mutationSha256 = sha256(mutated);
  const mutation = run("neighbor-feedback-removed");
  await preserve("neighbor-feedback-removed", mutation);
  statuses.mutationExpectedRed = mutation.status === 1 && (mutation.stderr ?? "").includes("selected-neighbour feedback mismatch");
} finally {
  if (installed) {
    if (changed) {
      await writeFile(previewPath, candidateBytes);
      changed = false;
    }
    const restored = await readFile(previewPath);
    statuses.restoredCandidateSha256 = sha256(restored);
    statuses.candidateBytesRestoredExactly = restored.equals(candidateBytes);
    await unlink(previewPath);
    installed = false;
  }
  statuses.finalPreviewAbsent = !(await readFile(previewPath).then(() => true, () => false));
  statuses.candidateSha256 = sha256(candidateBytes);
  await writeFile(resolve(evidenceRoot, "replay-result.json"), `${JSON.stringify(statuses, null, 2)}\n`, { flag: "wx" });
}

const passed = statuses.baselineExpectedRed && statuses.candidateExpectedGreen && statuses.mutationExpectedRed && statuses.candidateBytesRestoredExactly && statuses.finalPreviewAbsent;
process.stdout.write(`${passed ? "PASS" : "FAIL"}: baseline red=${statuses.baselineExpectedRed}, candidate green=${statuses.candidateExpectedGreen}, neighbor mutation red=${statuses.mutationExpectedRed}, exact restore=${statuses.candidateBytesRestoredExactly}, final preview absent=${statuses.finalPreviewAbsent}\n`);
if (!passed) process.exit(1);
