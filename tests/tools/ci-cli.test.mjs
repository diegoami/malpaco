import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,renameSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const gate=fileURLToPath(new URL('../../tools/ci/gate.mjs',import.meta.url));
const plan=fileURLToPath(new URL('../../tools/ci/plan.mjs',import.meta.url));

test('gate CLI exits from actual classification, mode and verification conclusions',()=>{
 for(const [classificationResult,mode,verificationResult,exit] of [
  ['success','docs','skipped',0],['success','full','success',0],['failure','docs','skipped',1],
  ['success','full','skipped',1],['success','full','cancelled',1],['success','unknown','success',1],
 ]) {
  const r=spawnSync(process.execPath,[gate],{encoding:'utf8',env:{...process.env,CLASSIFICATION_RESULT:classificationResult,CI_MODE:mode,VERIFICATION_RESULT:verificationResult}});
  assert.equal(r.status,exit,r.stderr);assert.equal(JSON.parse(r.stdout).passed,exit===0);
 }
});

function fixture(path,operation='add') {
 const cwd=mkdtempSync(join(tmpdir(),'malpaco-ci-cli-'));
 const env={...process.env,GIT_AUTHOR_NAME:'CI fixture',GIT_AUTHOR_EMAIL:'ci@example.invalid',GIT_COMMITTER_NAME:'CI fixture',GIT_COMMITTER_EMAIL:'ci@example.invalid'};
 const git=(...args)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',env});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 git('init','-q');writeFileSync(join(cwd,'README.md'),'base');mkdirSync(join(cwd,'src'));writeFileSync(join(cwd,'src/source.ts'),'source');git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
 mkdirSync(dirname(join(cwd,path)),{recursive:true});
 if(operation==='rename')renameSync(join(cwd,'src/source.ts'),join(cwd,path));else if(operation==='delete')git('rm','README.md');else writeFileSync(join(cwd,path),'new');
 git('add','.');git('commit','-qm','feature');const head=git('rev-parse','HEAD');
 const merge=git('commit-tree','HEAD^{tree}','-p',base,'-p',head,'-m','merge');git('update-ref','HEAD',merge);
 const event=join(cwd,'event.json'),output=join(cwd,'output');writeFileSync(event,JSON.stringify({pull_request:{base:{sha:base},head:{sha:head}}}));
 return {cwd,env:{...env,GITHUB_EVENT_NAME:'pull_request',GITHUB_EVENT_PATH:event,GITHUB_OUTPUT:output,GITHUB_SHA:merge},output,event};
}
function mode(f){const r=spawnSync(process.execPath,[plan],{cwd:f.cwd,env:f.env,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return readFileSync(f.output,'utf8').trim();}

test('Git CLI uses NUL paths without executing shell syntax and refuses control characters',()=>{
 const shell=fixture('docs/plans/$(touch HACKED).md');assert.equal(mode(shell),'mode=docs');assert.equal(existsSync(join(shell.cwd,'HACKED')),false);
 assert.equal(mode(fixture('docs/plans/line\nbreak.md')),'mode=full');
});
test('Git CLI treats source-to-prose renames, deletions and malformed events conservatively',()=>{
 assert.equal(mode(fixture('docs/plans/moved.md','rename')),'mode=full');
 assert.equal(mode(fixture('README.md','delete')),'mode=full');
 const bad=fixture('docs/plans/plan.md');writeFileSync(bad.event,'{');assert.equal(mode(bad),'mode=full');
});
