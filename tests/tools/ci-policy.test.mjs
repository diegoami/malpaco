import assert from 'node:assert/strict';
import {test} from 'node:test';
import {classifyChanges,gatePass} from '../../tools/ci/policy.mjs';
const change=(filename,status='modified',extra={})=>({filename,status,...extra});
const input=(files,extra={})=>({eventName:'pull_request',files,changedFiles:files.length,complete:true,...extra});
const classify=(files,extra={})=>classifyChanges(input(files,extra));

test('allowlist: known prose additions/modifications alone take lightweight validation',()=>{
 for(const p of ['README.md','RUN-NOTES.md','docs/ci-development.md','docs/tasks/T91.md','docs/plans/release-0.2.0.md','docs/plans/responsive-ui/DECISIONS.md'])
  for(const status of ['added','modified']) assert.equal(classify([change(p,status)]),'docs',p+status);
 assert.equal(classify([change('README.md'),change('docs/plans/plan.md')]),'docs');
});
test('protected: source, tests, workflow, dependencies, executable docs and machine inputs always verify',()=>{
 for(const p of ['src/ui/battleChrome.ts','src/core/bonuses.ts','tests/e2e/icon-actions.spec.ts','.github/workflows/ci.yml','tools/ci/policy.mjs','package.json','package-lock.json','vite.config.ts','docs/models.md','harness.json','AGENTS.md','CLAUDE.md','docs/prototypes/new-game/T63/board.json','docs/prototypes/new-game/T64/preview.html','docs/prototypes/new-game/T64/layout.mjs','docs/plans/run.sh','docs/tasks/run.js','docs/plans/fixture.json','docs/unknown.md','unknown','README.md.js','docs/plans/fake.md/run.sh','../docs/plans/escape.md','/docs/plans/absolute.md','docs/plans/../models.md','docs\\plans\\plan.md']){
  assert.equal(classify([change(p)]),'full',p);
  assert.equal(classify([change('README.md'),change(p)]),'full','mixed '+p);
 }
});
test('uncertain: missing, malformed, empty or truncated diffs never bypass verification',()=>{
 for(const value of [undefined,null,{},[],{eventName:'pull_request'},{...input([])},{...input([change('README.md')]),complete:false},{...input([change('README.md')]),complete:undefined},{...input([change('README.md')]),changedFiles:2},{...input([change('README.md')]),changedFiles:'1'},{...input([change('README.md')]),files:null},{...input([change('README.md')]),files:[null]},{...input([change('README.md')]),files:[{}]}]) assert.equal(classifyChanges(value),'full',JSON.stringify(value));
 for(const eventName of ['push','workflow_dispatch','pull_request_target','unknown','']) assert.equal(classify([change('README.md')],{eventName}),'full',eventName);
 for(const status of ['removed','renamed','copied','changed','unknown',undefined]) assert.equal(classify([{filename:'README.md',status,previous_filename:'src/ui/battleChrome.ts'}]),'full',String(status));
 assert.equal(classify([change('README.md','modified',{previous_filename:'src/ui/battleChrome.ts'})]),'full');
});
test('required gate: docs requires successful classification and intentionally skipped verification',()=>{
 assert.equal(gatePass({classificationResult:'success',mode:'docs',verificationResult:'skipped'}),true);
 for(const classificationResult of ['failure','cancelled','skipped',undefined,'unknown']) assert.equal(gatePass({classificationResult,mode:'docs',verificationResult:'skipped'}),false,String(classificationResult));
 for(const verificationResult of ['failure','cancelled',undefined,'unknown']) assert.equal(gatePass({classificationResult:'success',mode:'docs',verificationResult}),false,String(verificationResult));
});
test('required gate: full requires both successes; failure/cancellation/unexpected skip cannot green ci',()=>{
 assert.equal(gatePass({classificationResult:'success',mode:'full',verificationResult:'success'}),true);
 for(const classificationResult of ['failure','cancelled','skipped',undefined]) for(const verificationResult of ['success','failure','cancelled','skipped',undefined]) assert.equal(gatePass({classificationResult,mode:'full',verificationResult}),false);
 for(const verificationResult of ['failure','cancelled','skipped',undefined,'unknown']) assert.equal(gatePass({classificationResult:'success',mode:'full',verificationResult}),false,String(verificationResult));
 for(const mode of [undefined,'unknown','',true]) assert.equal(gatePass({classificationResult:'success',mode,verificationResult:'success'}),false,String(mode));
 for(const value of [undefined,null,{}]) assert.equal(gatePass(value),false);
});

test('uncertain: deletion and unsupported statuses reject without relying on a previous filename',()=>{
 for(const status of ['removed','renamed','copied','changed','unknown',undefined]) assert.equal(classify([{filename:'README.md',status}]),'full',String(status));
});
