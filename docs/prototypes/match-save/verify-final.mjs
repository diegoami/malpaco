import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const out = process.argv[2];
if (!out || existsSync(out)) throw Error("Pass a fresh evidence directory");
mkdirSync(out, { recursive: true });
const files = ["src/core/match-save.ts", "src/core/index.ts", "src/ui/app.ts", "src/ui/generatedGame.ts", "src/styles.css"];
const saved = new Map(files.map(file => [file, readFileSync(file)]));
const records = [];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
function run(name, command, green) {
  const r = spawnSync("sh", ["-c", command], { encoding: "utf8", env: { ...process.env, MATCH_SAVE_EVIDENCE_DIR: out }, maxBuffer: 20e6 });
  writeFileSync(`${out}/${name}.txt`, (r.stdout ?? "") + (r.stderr ?? ""), { flag: "wx" });
  records.push({ name, command, exit: r.status });
  console.log(name, r.status);
  if ((r.status === 0) !== green) throw Error(`${name}: unexpected ${r.status}`);
}
const unit = "npx vitest run tests/core/match-save.test.ts";
const browser = "npx playwright test tests/e2e/match-save.spec.ts --workers=2";
try {
  run("unit", unit, true);
  run("browser", browser, true);
  run("build", "npm run build", true);
  run("all-unit", "npm test", true);
  if (process.argv.includes("--update-goldens")) run("affected-goldens", "npx playwright test tests/e2e/generated-game.spec.ts tests/e2e/game-setup.spec.ts --workers=2 --update-snapshots", true);
  run("all-browser", "npx playwright test --workers=2", true);
  const path = "src/core/match-save.ts", original = saved.get(path);
  for (const [name, old, next] of [
    ["replay-omitted", "state = result.state;", "// replay state omitted"],
    ["illegal-accepted", "if (!result.ok) throw new SaveFormatError(`Cannot replay action ${i + 1}: ${result.error}. Choose an intact game file.`, `actions[${i}]`);", "if (!result.ok) continue;"],
  ]) {
    if (!original.toString().includes(old)) throw Error(`mutation missing ${name}`);
    try {
      writeFileSync(path, original.toString().replace(old, next));
      run(`mutant-${name}`, unit, false);
    } finally { writeFileSync(path, original); }
  }
  // Reproduce the previous right-aligned alert to prove the nonoverlap check.
  const css = "src/styles.css", originalCss = saved.get(css);
  const position = "  left:20px;\n  right:auto;";
  if (!originalCss.toString().includes(position)) throw Error("alert position mutation missing");
  try {
    writeFileSync(css, originalCss.toString().replace(position, "  left:auto;\n  right:20px;"));
    run("mutant-alert-title", browser + ' --grep "2 humans"', false);
  } finally { writeFileSync(css, originalCss); }
  const game = "src/ui/generatedGame.ts", originalGame = saved.get(game);
  const actualOptions = "mountMatch(root, loaded.options, state);";
  if (!originalGame.toString().includes(actualOptions)) throw Error("actual options mutation missing");
  try {
    writeFileSync(game, originalGame.toString().replace(actualOptions, "mountMatch(root, generatedOptions(loaded.options.seed, loaded.options.seats.length), state);"));
    run("mutant-loaded-options", browser + ' --grep "finished legal history"', false);
  } finally { writeFileSync(game, originalGame); }
  if (!originalGame.toString().includes("current?.dispose();")) throw Error("dispose mutation missing");
  try {
    writeFileSync(game, originalGame.toString().replace("current?.dispose();", "// old controller leaked"));
    run("mutant-controller-leaked", browser + ' --grep "2 humans"', false);
  } finally { writeFileSync(game, originalGame); }
  run("restored-unit", unit, true);
  run("restored-browser", browser, true);
} finally {
  for (const [file, bytes] of saved) writeFileSync(file, bytes);
  writeFileSync(`${out}/manifest.json`, JSON.stringify({ records, restored: [...saved].map(([file, bytes]) => ({ file, before: hash(bytes), after: hash(readFileSync(file)) })) }, null, 2) + "\n", { flag: "wx" });
}
