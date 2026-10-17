import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateClaudeEnvironment, readClaudeEvents, scopeProblems, runClaudeWatched, claudeSettings } from '../lib/claude.mjs';
import { readReview } from '../lib/chain.mjs';
import { planPost } from '../lib/post.mjs';
import { reviewRefusal, namedModel } from '../lib/common.mjs';
const id = 'claude-sonnet-5-5';
const init = { type: 'system', subtype: 'init', model: id, session_id: 'ours' };
const final = { type: 'result', subtype: 'success', is_error: false, session_id: 'ours', result: 'T69 review (Claude)\napprove\nDW1: ran check → passed\nFILE: src/a.ts\nSCOPE: complete\nFinal pass done\napprove', permission_denials: [] };
const encode = (events) => events.map((e) => JSON.stringify(e)).join('\n')+'\n';
test('actual selected model and real final required, not exit0 or quoted content', () => {
 assert.equal(readClaudeEvents(encode([init,final]), id, 'ours').review,final.result);
 for (const events of [[final],[init],[init,init,final],[init,final,final],[{...init,model:'glm-5.3'},final],[{...init,model:'claude-opus-5-5'},final],[{...init,session_id:'other'},final],[init,{...final,session_id:'other'}],[init,{...final,is_error:true}],[init,{...final,subtype:'error_max_turns'}],[init,{...final,permission_denials:[{tool_name:'Bash'}]}]]) assert.throws(()=>readClaudeEvents(encode(events),id,'ours'));
 assert.throws(()=>readClaudeEvents(encode([init,final])+'{',id,'ours'));
 assert.throws(()=>readClaudeEvents(encode([init,{type:'user',message:{content:[{type:'tool_result',content:'PreToolUse hook blocked this tool call',is_error:true}]}},final]),id,'ours'));
 assert.doesNotThrow(()=>readClaudeEvents(encode([init,{type:'assistant',message:{content:[{type:'text',text:'Permission to use Bash has been denied (quoted fixture)'}]}},final]),id,'ours'));
});
test('provider/remapped model cannot reach Claude billing; credentials not in errors',()=>{
 assert.doesNotThrow(()=>validateClaudeEnvironment({},id));
 assert.doesNotThrow(()=>validateClaudeEnvironment({ANTHROPIC_BASE_URL:'https://api.anthropic.com'},id));
 for(const env of [{ANTHROPIC_BASE_URL:'https://api.z.ai/api/anthropic?secret=REDACT'},{ANTHROPIC_BASE_URL:'https://api.anthropic.com.evil.test'},{ANTHROPIC_BASE_URL:'http://api.anthropic.com'},{ANTHROPIC_MODEL:'glm-5.3'},{ANTHROPIC_DEFAULT_SONNET_MODEL:'glm-5.3'},{CLAUDE_CODE_USE_BEDROCK:'1'},{CLAUDE_CODE_USE_VERTEX:'1'},{ANTHROPIC_AUTH_TOKEN:'REDACT',ANTHROPIC_BASE_URL:'invalid'}]) {
  assert.throws(()=>validateClaudeEnvironment(env,id),e=>!e.message.includes('REDACT'));
 }
 assert.throws(()=>validateClaudeEnvironment({},'sonnet'));
 const settings=claudeSettings('/trusted/guard.mjs');assert.ok(settings.hooks.PreToolUse.length);assert.deepEqual(settings.permissions.allow,['Bash','Read','Grep','Glob']);
});
test('coverage is explicit per changed file; generated evidence grouping cannot hide code',()=>{
 const files=['src/a.ts','docs/prototypes/T/report.json','docs/prototypes/T/check.py'];
 assert.equal(scopeProblems(final.result,files).length>0,true);
 const complete=final.result+'\nFILE: docs/prototypes/T/check.py\nEVIDENCE: docs/prototypes/T/';assert.deepEqual(scopeProblems(complete,files),[]);
 assert.ok(scopeProblems(complete.replace('SCOPE: complete','SCOPE: incomplete'),files).length);
 const config={models:{claude:{id:'anthropic/'+id,family:'claude',backend:'claude'}},blocked:[]};
 assert.equal(namedModel(config,'claude',{},()=>assert.fail()),'claude');
 assert.ok(reviewRefusal(config.models,'claude',[],{HARNESS_SESSION_FAMILY:'claude'}));
 assert.equal(reviewRefusal(config.models,'claude',[],{HARNESS_SESSION_FAMILY:'openai'}),null);
 config.blocked=['claude'];assert.throws(()=>namedModel(config,'claude',{},(c,m)=>{throw Error(m)}));
 const plan=planPost({read:readReview(final.result,'T69 review (Claude)'),header:'T69 review (Claude)',doneWhen:2,source:'test',signature:'test'});assert.equal(plan.code,4);assert.equal(plan.label,null);
});
test('watched subprocess retains success, failure and timeout evidence, kills its own group',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'claude-harness-'));
 const fake=path.join(root,'fake.mjs');
 fs.writeFileSync(fake,`import fs from 'node:fs'; const mode=process.env.FAKE_MODE; if(mode==='hang'){setInterval(()=>{},1000);}else{console.log(JSON.stringify(${JSON.stringify(init)})); console.log(JSON.stringify(${JSON.stringify(final)}));process.exitCode=mode==='fail'?7:0;}`);
 for(const mode of ['ok','fail','hang']){
  const evidenceDir=path.join(root,mode);const options={command:{exe:process.execPath,prefix:[fake]},args:[],workDir:root,evidenceDir,model:id,sessionId:'ours',env:{...process.env,FAKE_MODE:mode},startupTimeoutMs:1000,idleTimeoutMs:1000,totalTimeoutMs:mode==='hang'?150:3000,log:()=>{}};
  if(mode==='ok')assert.equal((await runClaudeWatched(options)).stdout,final.result);
  else await assert.rejects(runClaudeWatched(options));
  for(const name of ['stdout.jsonl','stderr.txt','receipt.json','final.md']) assert.ok(fs.existsSync(path.join(evidenceDir,name)),name);
  const receipt=JSON.parse(fs.readFileSync(path.join(evidenceDir,'receipt.json')));assert.equal(receipt.expectedModel,id);assert.ok(receipt.sha256['stdout.jsonl']);
  if(mode==='hang')assert.throws(()=>process.kill(receipt.pid,0));
 }
});
