// Run in the pinned Playwright image; every evidence directory is fresh.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const out = process.argv[2];
if (!out || existsSync(out)) throw new Error("Pass a fresh evidence directory");
mkdirSync(out, { recursive: true });
const files = ["src/main.ts", "src/ui/generatedGame.ts", "src/ui/palette.ts", "src/styles.css"];
const saved = new Map(files.map(file => [file, readFileSync(file)]));
const records = [];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const browser = "npx playwright test tests/e2e/game-setup.spec.ts --workers=2";

function run(name, command, green = true) {
  const result = spawnSync("sh", ["-c", command], {
    encoding: "utf8", maxBuffer: 20e6,
    env: { ...process.env, SETUP_EVIDENCE_DIR: out },
  });
  writeFileSync(`${out}/${name}.txt`, (result.stdout ?? "") + (result.stderr ?? ""), { flag: "wx" });
  records.push({ name, command, exit: result.status });
  console.log(name, result.status);
  if ((result.status === 0) !== green) throw new Error(`${name}: unexpected exit ${result.status}`);
}

try {
  // This spec owns only the four new setup/four-seat images.
  if (process.argv.includes("--update-goldens")) {
    run("new-goldens", browser + ' --grep "settings start exact 4" --update-snapshots');
  }
  run("setup-unit", "npx vitest run tests/ui/game-setup.test.ts");
  run("setup-browser", browser);
  run("all-unit", "npm test");
  run("build", "npm run build");
  run("all-browser", "npx playwright test --workers=2");

  const file = "src/ui/generatedGame.ts";
  const original = saved.get(file);
  const before = "const { seed, seats } = settings;";
  const mutations = [
    ["seed", "const { seats } = settings; const seed = 1994;"],
    ["seats", "const { seed } = settings; const seats = 2;"],
  ];
  if (original.toString().split(before).length !== 2) throw new Error("Ambiguous settings mutation");
  for (const [name, after] of mutations) {
    try {
      writeFileSync(file, original.toString().replace(before, after));
      run(`mutant-${name}`, browser + ' --grep "settings start exact"', false);
    } finally {
      writeFileSync(file, original);
    }
  }
  run("restored-setup-browser", browser);
} finally {
  for (const [file, bytes] of saved) writeFileSync(file, bytes);
  writeFileSync(`${out}/manifest.json`, JSON.stringify({ records,
    restored: [...saved].map(([file, bytes]) => ({ file, before: hash(bytes), after: hash(readFileSync(file)) })),
  }, null, 2) + "\n", { flag: "wx" });
}
