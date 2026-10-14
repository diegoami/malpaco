// Run from task worktree in pinned Playwright image. Fresh evidence only.
// Production mutations always restore the exact saved contents in finally.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const out=process.argv[2];
if(!out || existsSync(out))throw new Error('Pass a new evidence directory');
mkdirSync(out,{recursive:true});
const file='src/ui/prototype/preview.ts', saved=readFileSync(file,'utf8');
const hash=v=>createHash('sha256').update(v).digest('hex');
const records=[];
function run(name,command,expected){
  const result=spawnSync('sh',['-c',command],{encoding:'utf8',env:{...process.env,GENERATED_EVIDENCE_DIR:out},maxBuffer:20*1024*1024});
  writeFileSync(join(out,name+'.txt'),(result.stdout??'')+(result.stderr??''),{flag:'wx'});
  records.push({name,command,exit:result.status});
  if((expected==='green')!==(result.status===0))throw new Error(`${name}: unexpected exit ${result.status}`);
}
const mutations=[
  {name:'unpainted-country', before:'s("path", { class: "country-shape", d:', after:'s("path", { class: "country-shape", opacity: p.id === map.provinces[0]!.id ? "0" : "1", d:'},
  {name:'missing-sea-link', before:'seen.add(key);', after:'seen.add(key);\n      if (kind === "sea" && seen.size === 1) continue;'},
];
try {
  for(const mutation of mutations){
    if(!saved.includes(mutation.before))throw new Error(`Mutation target missing: ${mutation.name}`);
    mutation.file=file;mutation.line=saved.slice(0,saved.indexOf(mutation.before)).split('\n').length;
    try {
      writeFileSync(file,saved.replace(mutation.before,mutation.after));
      run('mutant-'+mutation.name,'npx playwright test tests/e2e/generated-board.spec.ts --workers=2','red');
    } finally {writeFileSync(file,saved);}
  }
  run('layout','npx vitest run tests/ui/generated-board-layout.test.ts','green');
  run('unit','npm test','green');
  run('build','npm run build','green');
  run('prototype-ui','npx playwright test tests/e2e/generated-board.spec.ts --workers=2','green');
  run('full-ui','npx playwright test --workers=2','green');
} finally {
  writeFileSync(file,saved);
  writeFileSync(join(out,'manifest.json'),JSON.stringify({records,mutations,restored:{file,before:hash(saved),after:hash(readFileSync(file))}},null,2)+'\n',{flag:'wx'});
}
