import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const evidence='docs/prototypes/ci/T91/implementation-01';
const names=['tools/ci/policy.mjs','tools/ci/plan.mjs','tools/ci/gate.mjs','.github/workflows/ci.yml'];
const saved=new Map(names.map(p=>[p,readFileSync(p,'utf8')]));
const backup=mkdtempSync(join(tmpdir(),'t91-mutation-backup-'));for(const [p,s]of saved)writeFileSync(join(backup,p.replaceAll('/','_')),s);
const cases=[
 ['missing-gate','tools/ci/gate.mjs',()=> 'process.exit(0);\n',['tests/tools/ci-cli.test.mjs']],
 ['missing-plan','tools/ci/plan.mjs',()=> 'console.log("deleted plan");\n',['tests/tools/ci-cli.test.mjs']],
 ['unknown-prose','tools/ci/policy.mjs',s=>s.replace('export function classifyChanges(input) {',"export function classifyChanges(input) { return 'docs';")],
 ['incomplete-diff','tools/ci/policy.mjs',s=>s.replace("input.complete !== true",'false')],
 ['truncated-diff','tools/ci/policy.mjs',s=>s.replace('input.files.length !== input.changedFiles','false')],
 ['deleted-prose','tools/ci/policy.mjs',s=>s.replace("['added', 'modified']","['added', 'modified', 'removed']")],
 ['previous-source','tools/ci/policy.mjs',s=>s.replace("Object.hasOwn(file, 'previous_filename')",'false')],
 ['failed-plan','tools/ci/policy.mjs',s=>s.replace("if (!input || input.classificationResult !== 'success') return false;",'if (!input) return false;')],
 ['skipped-full','tools/ci/policy.mjs',s=>s.replace("input.verificationResult === 'success'","['success','skipped'].includes(input.verificationResult)")],
 ['cancelled-full','tools/ci/policy.mjs',s=>s.replace("input.verificationResult === 'success'","['success','cancelled'].includes(input.verificationResult)")],
 ['unbound-event','tools/ci/plan.mjs',s=>s.replace('actual !== expected[0]','false')],
 ['unbound-base','tools/ci/plan.mjs',s=>s.replace('parents[0] !== expected[1]','false')],
 ['unbound-head','tools/ci/plan.mjs',s=>s.replace('parents[1] !== expected[2]','false')],
 ['source-unconditional','.github/workflows/ci.yml',s=>s.replace("        if: github.event_name == 'workflow_dispatch' && inputs.full_release\n",'')],
 ['gate-skipped','.github/workflows/ci.yml',s=>s.replace('    if: always()\n','')],
 ['cross-pr-cancel','.github/workflows/ci.yml',s=>s.replace('github.event.pull_request.number || github.run_id',"'all-prs'")],
 ['filter-override','.github/workflows/ci.yml',s=>s.replace('          sparse-checkout-cone-mode: false','          filter: blob:none\n          sparse-checkout-cone-mode: false')],
];
const results=[];
try {
 for(const [name,path,mutate,tests]of cases) {
  const original=saved.get(path),mutant=mutate(original);assert.notEqual(mutant,original,name+' applied');
  writeFileSync(path,mutant);
  try {
   const args=['--test',...(tests??['tests/tools/ci-policy.test.mjs','tests/tools/ci-plan.test.mjs','tests/tools/ci-workflow.test.mjs'])];
   const r=spawnSync(process.execPath,args,{encoding:'utf8'});
   writeFileSync(`${evidence}/mutation-${name}.txt`,(r.stdout??'')+(r.stderr??''),{flag:'wx'});
   results.push({name,exit:r.status,killed:r.status!==0});assert.notEqual(r.status,0,name+' must fail');
  } finally {writeFileSync(path,original);}
 }
} finally {
 for(const [p,s]of saved) {writeFileSync(p,s);assert.equal(readFileSync(p,'utf8'),s);}
 writeFileSync(`${evidence}/mutations.json`,JSON.stringify({results,restored:[...saved].map(([path,text])=>({path,sha256:createHash('sha256').update(text).digest('hex')})),backup},null,2)+'\n',{flag:'wx'});
}
console.log(`${results.length}/${cases.length} mutation controls killed; originals restored`);
