import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const out = process.argv[2];
if (!out || existsSync(out)) throw new Error("Pass a fresh evidence directory");
mkdirSync(out, { recursive: true });
const suite = "npx playwright test tests/e2e/help.spec.ts --workers=2";
const files = ["src/ui/help.ts", "src/ui/generatedGame.ts", "src/ui/app.ts", "src/styles.css"];
const saved = new Map(files.map(path => [path, existsSync(path) ? readFileSync(path) : null]));
const records = [];
const hash = bytes => bytes === null ? null : createHash("sha256").update(bytes).digest("hex");
function run(name, command, expected) {
  const result = spawnSync("sh", ["-c", command], { encoding: "utf8", env: { ...process.env, HELP_EVIDENCE_DIR: out }, maxBuffer: 20_000_000 });
  const exit = result.status ?? 127;
  const output = (result.stdout ?? "") + (result.stderr ?? "") + (result.error ? `\nSpawn error: ${result.error.message}\n` : "");
  writeFileSync(`${out}/${name}.txt`, output, { flag: "wx" });
  records.push({ name, command, exit, spawnError: result.error?.message ?? null });
  console.log(`${name}: ${exit}`);
  if (exit !== expected) throw new Error(`${name}: expected exit ${expected}, got ${exit}`);
}
function restore(bytes) {
  for (const [path, content] of bytes) {
    if (content === null) { if (existsSync(path)) unlinkSync(path); }
    else writeFileSync(path, content);
  }
}

try {
  run("baseline", `${suite} --grep "setup help is reachable"`, 1);
  await import("./candidate.mjs");
  const candidate = new Map(files.map(path => [path, readFileSync(path)]));
  run("candidate-build", "npm run build", 0);
  run("candidate", suite, 0);

  const help = candidate.get("src/ui/help.ts").toString();
  const copyBefore = '...sections.map(([title, copy]) => h("section", {}, h("h3", {}, title), h("p", {}, copy))),';
  const copyAfter = '...sections.map(([title]) => h("section", {}, h("h3", {}, title), h("p", {}, ""))),';
  if (!help.includes(copyBefore)) throw new Error("Content mutation anchor missing");
  try {
    writeFileSync("src/ui/help.ts", help.replace(copyBefore, copyAfter));
    run("mutant-content", `${suite} --grep "setup help is reachable"`, 1);
  } finally { restore(candidate); }

  const app = candidate.get("src/ui/app.ts").toString();
  const pauseBefore = `  pauseForHelp(): void {
    if (this.disposed) return;
    this.helpPaused = true;
    if (this.computerTimer !== null) clearTimeout(this.computerTimer);
    this.computerTimer = null;
  }`;
  const pauseAfter = `  pauseForHelp(): void {
    if (this.disposed) return;
  }`;
  if (!app.includes(pauseBefore)) throw new Error("Pause mutation anchor missing");
  try {
    writeFileSync("src/ui/app.ts", app.replace(pauseBefore, pauseAfter));
    run("mutant-computer-pause", `${suite} --grep "computer help pauses"`, 1);
  } finally { restore(candidate); }
  run("restored-candidate", suite, 0);
} finally {
  restore(saved);
  const restored = [...saved].map(([file, before]) => ({ file, before: hash(before), after: hash(existsSync(file) ? readFileSync(file) : null) }));
  writeFileSync(`${out}/manifest.json`, JSON.stringify({ records, restored }, null, 2) + "\n", { flag: "wx" });
}
