// Acceptance-only replay in the pinned Playwright image. Existing production
// source is tested as-is; four independent actual-source bypasses must fail.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const out = process.argv[2];
if (!out || existsSync(out)) throw Error("Pass a fresh evidence directory");
mkdirSync(out, {recursive:true});
const file = "src/core/rules.ts", saved = readFileSync(file), records = [];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
function run(name,command,green=true) {
 const r=spawnSync("sh",["-c",command],{encoding:"utf8",maxBuffer:20e6,env:{...process.env,COMPLETE_EVIDENCE_DIR:out}});
 writeFileSync(`${out}/${name}.txt`,(r.stdout??"")+(r.stderr??""),{flag:"wx"});
 records.push({name,command,exit:r.status});console.log(name,r.status);
 if((r.status===0)!==green)throw Error(`${name}: unexpected exit ${r.status}`);
}
try {
 run("complete-unit","npx vitest run tests/core/complete-game.test.ts --silent=false --reporter=verbose");
 run("complete-browser","npx playwright test tests/e2e/complete-game.spec.ts --workers=2");
 run("all-unit","npm test");run("build","npm run build");run("all-browser","npx playwright test --workers=2");
 const mutations=[
  ["elimination","    checkElimination(state);","    // mutation: elimination omitted"],
  ["living-skip","    if (!activePlayer(state)?.eliminated) break;","    break; // mutation: includes eliminated seats"],
  ["victory","    if (checkVictory(state)) return { ok: true, state, outcome };","    // mutation: conquest completion omitted"],
  ["finished-rejection",'  if (state.phase === "finished") return { ok: false, error: "the game is over" };','  if (state.phase === "finished") return { ok: true, state: { ...cloneState(state), phase: "attack" }, outcome: null };'],
 ];
 for(const [name,before,after] of mutations) {
  if(saved.toString().split(before).length!==2)throw Error(`Ambiguous ${name} mutation`);
  try {
   writeFileSync(file,saved.toString().replace(before,after));
   run(`mutant-${name}`,"npx vitest run tests/core/complete-game.test.ts",false);
  }finally{writeFileSync(file,saved);}
 }
 run("restored-complete-unit","npx vitest run tests/core/complete-game.test.ts");
}finally {
 writeFileSync(file,saved);
 writeFileSync(`${out}/manifest.json`,JSON.stringify({source:file,before:hash(saved),after:hash(readFileSync(file)),records},null,2)+"\n",{flag:"wx"});
}
