import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const out = process.argv[2];
const updateGoldens = process.argv.includes("--update-goldens");
if (!out || existsSync(out)) throw new Error("Pass a fresh evidence directory");
mkdirSync(out, { recursive: true });

const focused = ["playwright", "test", "tests/e2e/help.spec.ts", "--workers=2"];
const suite = ["playwright", "test", "--workers=2"];
const generatedGoldenSuites = [
  "playwright", "test", "tests/e2e/game-setup.spec.ts", "tests/e2e/generated-game.spec.ts", "--workers=2",
];
const sources = ["src/ui/help.ts", "src/ui/app.ts"];
const original = new Map(sources.map(path => [path, readFileSync(path)]));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const records = [];

function run(name, command, args, expected = 0, env = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env: { ...process.env, HELP_EVIDENCE_DIR: out, ...env },
    maxBuffer: 40_000_000,
  });
  const exit = result.status ?? 127;
  const output = (result.stdout ?? "") + (result.stderr ?? "") + (result.error ? `\nSpawn error: ${result.error.message}\n` : "");
  writeFileSync(`${out}/${name}.txt`, output, { flag: "wx" });
  records.push({ name, command: [command, ...args].join(" "), exit, expected, spawnError: result.error?.message ?? null });
  console.log(`${name}: ${exit}`);
  if (exit !== expected) throw new Error(`${name}: expected exit ${expected}, got ${exit}`);
  return output;
}

function restore() {
  for (const [path, bytes] of original) writeFileSync(path, bytes);
}

try {
  run("focused", "npx", focused);
  run("unit", "npm", ["test"]);
  run("build", "npm", ["run", "build"]);
  if (updateGoldens) {
    run("browser-update-goldens", "npx", [...generatedGoldenSuites, "--update-snapshots"]);
  }
  run("browser", "npx", suite);

  const help = original.get("src/ui/help.ts").toString();
  const contentBefore = '...sections.map(([title, copy]) =>\n      h("section", {}, h("h3", {}, title), h("p", {}, copy)),\n    ),';
  const contentAfter = '...sections.map(([title]) =>\n      h("section", {}, h("h3", {}, title), h("p", {}, "")),\n    ),';
  if (!help.includes(contentBefore)) throw new Error("Actual help-content mutation anchor missing");
  try {
    writeFileSync("src/ui/help.ts", help.replace(contentBefore, contentAfter));
    const output = run("mutant-content", "npx", [...focused, "--grep", "setup help is reachable"], 1);
    if (!output.includes("Expected substring:")) throw new Error("Content mutation failed for an unexpected reason");
  } finally { restore(); }

  const app = original.get("src/ui/app.ts").toString();
  const pauseBefore = `  pauseForHelp(): void {
    if (this.disposed) return;
    this.helpPaused = true;
    if (this.computerTimer !== null) clearTimeout(this.computerTimer);
    this.computerTimer = null;
  }`;
  const pauseAfter = `  pauseForHelp(): void {
    if (this.disposed) return;
  }`;
  if (!app.includes(pauseBefore)) throw new Error("Actual computer-pause mutation anchor missing");
  try {
    writeFileSync("src/ui/app.ts", app.replace(pauseBefore, pauseAfter));
    const output = run("mutant-computer-pause", "npx", [...focused, "--grep", "computer help pauses"], 1);
    if (!output.includes("toBe(expected)") || !output.includes('"kind": "reinforce"')) {
      throw new Error("Pause mutation failed before proving an unpaused computer action");
    }
  } finally { restore(); }

  run("restored-focused", "npx", focused);
} finally {
  restore();
  const restored = [...original].map(([file, before]) => ({ file, before: hash(before), after: hash(readFileSync(file)) }));
  writeFileSync(`${out}/manifest.json`, JSON.stringify({ updateGoldens, records, restored }, null, 2) + "\n", { flag: "wx" });
}
