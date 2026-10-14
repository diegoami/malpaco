// Run from the worktree root in the pinned Playwright image:
// node docs/prototypes/generated-board/preflight-20261014-b/replay.mjs <new-evidence-directory>
// Existing source is saved in memory and restored exactly in finally. A fresh
// directory is mandatory; tests/logs are never overwritten. No core/golden edits.
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, rmdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const out=process.argv[2];
if(!out || existsSync(out))throw new Error('Pass a new nonexisting evidence directory');
mkdirSync(out,{recursive:true});
const fixture='docs/prototypes/generated-board/preflight-20261014-b';
const files=['src/main.ts','src/ui/prototype/layout.ts','src/ui/prototype/preview.ts'];
const saved=new Map(files.map(f=>[f,existsSync(f)?readFileSync(f):null]));
const hash=v=>v===null?null:createHash('sha256').update(v).digest('hex');
const records=[];
function run(name,command,expected){
  const result=spawnSync('sh',['-c',command],{encoding:'utf8',env:{...process.env,GENERATED_EVIDENCE_DIR:out},maxBuffer:20*1024*1024});
  writeFileSync(join(out,name+'.txt'),(result.stdout??'')+(result.stderr??''),{flag:'wx'});
  records.push({name,command,exit:result.status});
  if((expected==='green')!==(result.status===0))throw new Error(`${name}: unexpected exit ${result.status}`);
}
const hadDirectory=existsSync('src/ui/prototype');
try {
  if(saved.get('src/ui/prototype/layout.ts')!==null || saved.get('src/ui/prototype/preview.ts')!==null)throw new Error('Mock replay refuses existing prototype implementation');
  mkdirSync('src/ui/prototype',{recursive:true});
  run('baseline-layout-missing','npx vitest run tests/ui/generated-board-layout.test.ts','red');
  run('baseline-route','npx playwright test tests/e2e/generated-board.spec.ts --workers=2 --grep-invert golden','red');
  writeFileSync('src/ui/prototype/layout.ts','import type { GameMap } from "../../core"; export const layoutGeneratedBoard=(map:GameMap):GameMap=>map;\n');
  run('baseline-layout-identity','npx vitest run tests/ui/generated-board-layout.test.ts','red');
  writeFileSync('src/ui/prototype/layout.ts',readFileSync(join(fixture,'layout.mock.txt')));
  writeFileSync('src/ui/prototype/preview.ts',readFileSync(join(fixture,'view.mock.txt')));
  const main=saved.get('src/main.ts').toString();
  writeFileSync('src/main.ts',main.replace('import "./styles.css";','import "./styles.css";\nimport { mockPreview } from "./ui/prototype/preview";').replace('start();','if(new URLSearchParams(location.search).get("view")==="generated-prototype") mockPreview(root); else start();'));
  run('mock-layout','npx vitest run tests/ui/generated-board-layout.test.ts','green');
  run('mock-ui','npx playwright test tests/e2e/generated-board.spec.ts --workers=2 --grep-invert golden','green');
  run('mock-build','npm run build','green');
  run('mock-full-unit','npm test','green');
  run('mock-legacy-ui','npx playwright test tests/e2e/slice.spec.ts tests/e2e/reinforcement.spec.ts --workers=2','green');
  const view=readFileSync('src/ui/prototype/preview.ts','utf8');
  try {
    writeFileSync('src/ui/prototype/preview.ts',view.replace('class:"country-shape",d:', 'class:"country-shape",opacity:p.id===map.provinces[0]!.id?"0":"1",d:'));
    run('mutant-unpainted','npx playwright test tests/e2e/generated-board.spec.ts --workers=2 --grep "46 countries"','red');
  } finally {writeFileSync('src/ui/prototype/preview.ts',view);}
  try {
    writeFileSync('src/ui/prototype/preview.ts',view.replace('seen.add(key);const q=', 'seen.add(key);if(kind==="sea" && seen.size===1)continue;const q='));
    run('mutant-missing-link','npx playwright test tests/e2e/generated-board.spec.ts --workers=2 --grep "all island bonuses"','red');
  } finally {writeFileSync('src/ui/prototype/preview.ts',view);}
  run('mock-restored-ui','npx playwright test tests/e2e/generated-board.spec.ts --workers=2 --grep-invert golden','green');
} finally {
  for(const[f,bytes]of saved){if(bytes!==null)writeFileSync(f,bytes);else if(existsSync(f))unlinkSync(f);}
  if(!hadDirectory)rmdirSync('src/ui/prototype');
  writeFileSync(join(out,'manifest.json'),JSON.stringify({records,restored:files.map(f=>({file:f,before:hash(saved.get(f)),after:hash(existsSync(f)?readFileSync(f):null)}))},null,2)+'\n',{flag:'wx'});
}
