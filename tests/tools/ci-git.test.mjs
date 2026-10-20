import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, mkdirSync, copyFileSync, readFileSync, readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scopedGit} from '../../tools/ci/git.mjs';

test('verifier Git reads an ownership-mismatched checkout without trusting another checkout',()=>{
 const root=mkdtempSync(join(tmpdir(),'malpaco-ci-owned path-'));
 const other=mkdtempSync(join(tmpdir(),'malpaco-ci-untrusted-'));
 const git=(cwd,args)=>{
  const result=spawnSync('git',args,{cwd,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);return result.stdout;
 };
 for(const cwd of [root,other]){
  git(cwd,['init','-q']);writeFileSync(join(cwd,'fixture.txt'),'tracked fixture\n');
  git(cwd,['add','fixture.txt']);
  git(cwd,['-c','user.name=CI test','-c','user.email=ci@example.invalid','commit','-qm','fixture']);
 }
 // Reset inherited trust and ask real Git to enforce an ownership mismatch.
 const env={...process.env,GIT_TEST_ASSUME_DIFFERENT_OWNER:'1',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'safe.directory',GIT_CONFIG_VALUE_0:''};
 const denied=spawnSync('git',['ls-files'],{cwd:root,env,encoding:'utf8'});
 assert.equal(denied.status,128);assert.match(denied.stderr,/dubious ownership/);
 const expectedHead=git(root,['rev-parse','HEAD']).trim();
 const cases=[
  [['ls-files'],'fixture.txt\n'],
  [['rev-parse','HEAD'],expectedHead+'\n'],
  [['rev-parse','--show-object-format'],git(root,['rev-parse','--show-object-format'])],
  [['ls-tree','-rlz','HEAD'],git(root,['ls-tree','-rlz','HEAD'])],
  [['status','--short'],''],
 ];
 for(const [args,expected] of cases){
  const result=scopedGit(root,args,{env,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.equal(result.stdout,expected);
 }
 const unrelated=scopedGit(root,['-C',other,'ls-files'],{env,encoding:'utf8'});
 assert.equal(unrelated.status,128);assert.match(unrelated.stderr,/dubious ownership/);
});


test('actual verifier scopes every Git read and the final status capture under mismatched ownership',()=>{
 const root=mkdtempSync(join(tmpdir(),'malpaco-ci-verifier-owned-'));
 for(const dir of ['tools/ci','tests/tools','.github/workflows'])mkdirSync(join(root,dir),{recursive:true});
 for(const file of ['tools/ci/verify.mjs','tools/ci/git.mjs','.github/workflows/ci.yml']){
  copyFileSync(new URL('../../'+file,import.meta.url),join(root,file));
 }
 writeFileSync(join(root,'tests/tools/ci-fixture.test.mjs'),"import {test} from 'node:test'; test('fixture',()=>{});\n");
 const normalEnv={...process.env};delete normalEnv.GITHUB_SHA;delete normalEnv.NODE_TEST_CONTEXT;
 for(const args of [['init','-q'],['add','.'],['-c','user.name=CI test','-c','user.email=ci@example.invalid','commit','-qm','fixture']]){
  const r=spawnSync('git',args,{cwd:root,env:normalEnv,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 }
 const env={...normalEnv,GIT_TEST_ASSUME_DIFFERENT_OWNER:'1',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'safe.directory',GIT_CONFIG_VALUE_0:''};
 const r=spawnSync(process.execPath,['tools/ci/verify.mjs'],{cwd:root,env,encoding:'utf8'});
 const runs=join(root,'docs/prototypes/ci/T91/runs');
 const evidence=join(runs,readdirSync(runs)[0]);
 const receipt=JSON.parse(readFileSync(join(evidence,'receipt.json'),'utf8'));
 // This bounded fixture deliberately has no packaging implementation: every Git read must succeed first.
 assert.equal(r.status,1);assert.match(receipt.error,/package-acceptance failed/);
 for(const name of ['guard-files','head','object-format','tree']){
  const command=receipt.commands.find(c=>c.name===name);assert.ok(command,name);assert.equal(command.exit,0,name);
 }
 assert.match(readFileSync(join(evidence,'working-tree.txt'),'utf8'),/docs\//);
});
