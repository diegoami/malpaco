import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL('../../tools/ci/plan.mjs',import.meta.url));
function fixture(path='docs/plans/plan.md'){
 const cwd=mkdtempSync(join(tmpdir(),'malpaco-t91-git-'));
 const git=(...args)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',env:{...process.env,GIT_AUTHOR_NAME:'CI fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',GIT_COMMITTER_NAME:'CI fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid'}});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 git('init','-q');writeFileSync(join(cwd,'README.md'),'base\n');git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
 mkdirSync(dirname(join(cwd,path)),{recursive:true});writeFileSync(join(cwd,path),'fixture\n');git('add','.');git('commit','-qm','feature');const head=git('rev-parse','HEAD');
 const merge=git('commit-tree','HEAD^{tree}','-p',base,'-p',head,'-m','merge');git('update-ref','HEAD',merge);
 return {cwd,base,head,merge};
}
function plan(f,extra={}){
 const event=join(f.cwd,'event.json'),output=join(f.cwd,'output-'+Math.random().toString(36).slice(2));
 writeFileSync(event,JSON.stringify(extra.event??{pull_request:{base:{sha:f.base},head:{sha:f.head}}}));
 const env={...process.env,GITHUB_EVENT_NAME:'pull_request',GITHUB_EVENT_PATH:event,GITHUB_SHA:f.merge,GITHUB_OUTPUT:output,...extra.env};
 const r=spawnSync(process.execPath,[cli],{cwd:f.cwd,env,encoding:'utf8'});assert.equal(r.status,0,r.stderr+'\n'+r.stdout);return readFileSync(output,'utf8').match(/^mode=(docs|full)$/m)?.[1];
}
test('pinned Git plan: complete prose-only merge diff can be light; executable changes verify',t=>{
 const prose=fixture();assert.equal(plan(prose),'docs');t.diagnostic('retained temporary Git fixture '+prose.cwd);
 assert.equal(plan(fixture('src/core/example.ts')),'full');assert.equal(plan(fixture('docs/plans/check.mjs')),'full');
});
test('pinned Git plan: mismatched event, merge or parent SHAs cannot bypass verification',()=>{
 const f=fixture();assert.equal(plan(f,{env:{GITHUB_SHA:f.head}}),'full');
 assert.equal(plan(f,{event:{pull_request:{base:{sha:f.head},head:{sha:f.head}}}}),'full');
 assert.equal(plan(f,{event:{pull_request:{base:{sha:f.base},head:{sha:f.base}}}}),'full');
 assert.equal(plan(f,{event:{}}),'full');assert.equal(plan(f,{env:{GITHUB_EVENT_PATH:join(f.cwd,'missing')}}),'full');
});
test('pinned Git plan: push/manual events always select full and do not trust prose PR metadata',()=>{
 const f=fixture();for(const event of ['push','workflow_dispatch','pull_request_target','unknown']) assert.equal(plan(f,{env:{GITHUB_EVENT_NAME:event}}),'full',event);
});
