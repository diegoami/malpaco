// Run once on merged T30 before production. Refuses to overwrite frozen data.
import { createServer } from "vite";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const root = resolve("docs/prototypes/new-game/T31"), output = resolve(root, "fixtures");
if (existsSync(output)) throw Error("Fixtures already frozen; preserve them instead of regenerating.");
const baseline = execFileSync("git", ["rev-parse", "0948871"], { encoding: "utf8" }).trim();
const runtimeDiff = execFileSync("git", ["diff", baseline, "--", "src/core", "tests/e2e/battle-fixture.ts", "tests/e2e/friendly-fixture.ts", "tests/e2e/victory-fixture.ts", "tests/core/victory-options-fixture.ts"], { encoding: "utf8" });
if (runtimeDiff) throw Error("Generate only with merged-T30 runtime and fixture inputs unchanged.");
const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: "custom" });
let generatePinned;
try { ({ generatePinned } = await server.ssrLoadModule("/tests/core/versioned-match-source.ts")); }
finally { await server.close(); }
const cases = generatePinned(); mkdirSync(output);
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const files = {};
function save(name, bytes) { writeFileSync(resolve(output, name), bytes, { flag: "wx" }); files[name] = sha(bytes); }
for (const fixture of cases) {
  const bytes = JSON.stringify(fixture, null, 2) + "\n";
  if (bytes.length < 24000) save(fixture.name + ".json", bytes);
  else {
    const parts = [];
    for (let i = 0; i < bytes.length; i += 24000) {
      const name = `${fixture.name}.part-${String(parts.length).padStart(3, "0")}.json`;
      save(name, JSON.stringify(bytes.slice(i, i + 24000)) + "\n"); parts.push(name);
    }
    save(fixture.name + ".json", JSON.stringify({ parts }, null, 2) + "\n");
  }
}
const inputs = ["tests/core/versioned-match-source.ts", "tests/core/versioned-match-fixture.ts", "tests/e2e/battle-fixture.ts", "tests/e2e/friendly-fixture.ts", "tests/e2e/victory-fixture.ts", "tests/core/victory-options-fixture.ts", "docs/prototypes/new-game/T63/board.json"];
writeFileSync(resolve(output, "manifest.json"), JSON.stringify({ baseline, inputs: Object.fromEntries(inputs.map(p => [p, sha(readFileSync(p))])), files }, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ baseline, cases: cases.map(c => ({ name: c.name, actions: c.actions.length, next: c.next?.action })) }, null, 2));
