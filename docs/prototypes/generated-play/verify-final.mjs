// Run only in the pinned Playwright image. Every output directory is new.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const out = process.argv[2];
if (!out || existsSync(out)) throw new Error("Pass a fresh evidence directory");
mkdirSync(out, { recursive: true });
const files = ["src/ui/generatedMapView.ts", "src/ui/prototype/preview.ts", "src/ui/app.ts"];
const saved = new Map(files.map(file => [file, readFileSync(file)]));
const records = [];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const browser = "npx playwright test tests/e2e/generated-game.spec.ts --workers=2";

function run(name, command, green = true) {
  const result = spawnSync("sh", ["-c", command], {
    encoding: "utf8", maxBuffer: 20e6,
    env: { ...process.env, GENERATED_EVIDENCE_DIR: out },
  });
  writeFileSync(`${out}/${name}.txt`, (result.stdout ?? "") + (result.stderr ?? ""), { flag: "wx" });
  records.push({ name, command, exit: result.status });
  console.log(name, result.status);
  if ((result.status === 0) !== green) throw new Error(`${name}: unexpected exit ${result.status}`);
}

try {
  // Regenerate only this route's two new goldens, never existing routes.
  if (process.argv.includes("--update-goldens")) {
    run("new-goldens", browser + ' --grep "golden:" --update-snapshots');
  }
  run("generated-unit", "npx vitest run tests/ui/generated-game.test.ts");
  run("generated-browser", browser);
  run("all-unit", "npm test");
  run("build", "npm run build");
  run("all-browser", "npx playwright test --workers=2");

  const mutations = [
    { name: "fill", file: "src/ui/prototype/preview.ts", grep: "46 countries",
      before: 'class: "country-shape", d:',
      after: 'class: "country-shape", opacity: p.id === map.provinces[0]!.id ? 0 : 1, d:' },
    { name: "count", file: "src/ui/generatedMapView.ts", grep: "46 countries",
      before: 'class: "army-count", x:',
      after: 'class: "army-count", opacity: id === map.provinces[0]!.id ? 0 : 1, x:' },
    { name: "placement", file: "src/ui/app.ts", grep: "placement clicks",
      before: 'this.run({ kind: "reinforce", province: id, amount: 1 });',
      after: 'return; // mutation: placement handler removed' },
    { name: "connection", file: "src/ui/prototype/preview.ts", grep: "exact topology",
      before: "seen.add(key);",
      after: 'seen.add(key); if (kind === "border" && seen.size === 1) continue;' },
  ];
  for (const mutation of mutations) {
    const original = saved.get(mutation.file).toString();
    if (original.split(mutation.before).length !== 2) throw new Error(`Ambiguous mutation: ${mutation.name}`);
    try {
      writeFileSync(mutation.file, original.replace(mutation.before, mutation.after));
      run(`mutant-${mutation.name}`, `${browser} --grep "${mutation.grep}"`, false);
    } finally {
      writeFileSync(mutation.file, saved.get(mutation.file));
    }
  }
  run("restored-generated-browser", browser);
} finally {
  for (const [file, bytes] of saved) writeFileSync(file, bytes);
  writeFileSync(`${out}/manifest.json`, JSON.stringify({ records,
    restored: [...saved].map(([file, bytes]) => ({ file, before: hash(bytes), after: hash(readFileSync(file)) })),
  }, null, 2) + "\n", { flag: "wx" });
}
