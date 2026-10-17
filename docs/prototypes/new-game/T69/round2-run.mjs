// Historical focused dispatcher: rerunning bills MiniMax and posts a review. Do not rerun blindly.
import fs from 'node:fs';
import path from 'node:path';
import { runOpenCodeWatched, resolveOpenCode } from '../../../../tools/harness/lib/opencode.mjs';
import { sh, loadConfig, namedModel, reviewRefusal, prepareOpenCode, ocArgs } from '../../../../tools/harness/lib/common.mjs';
import { readReview, doneWhenCount } from '../../../../tools/harness/lib/chain.mjs';
import { planPost, publish } from '../../../../tools/harness/lib/post.mjs';
const top=process.cwd(), E=path.join(top,'docs/prototypes/new-game/T69'), workDir='/home/diego/projects/malpaco/.cache/t69-independent-review/156-review-daa78d1e';
const target=sh('git',['rev-parse','d40d24e']);
if(sh('git',['rev-parse','HEAD'],{cwd:workDir})!==target)throw Error('Wrong review HEAD');
if(sh('gh',['pr','view','156','--json','headRefOid','--jq','.headRefOid'])!==target)throw Error('Stale PR');
const config=loadConfig(top), key=namedModel(config,'mm-m3',{},(c,m)=>{throw Error(m)});
const why=reviewRefusal(config.models,key,[]);if(why)throw Error(why);
const model=config.models[key], opencode=resolveOpenCode();
const pre=await prepareOpenCode({opencode,chain:[key],models:config.models,env:process.env,cwd:top,log:console.log});
if(!pre.usable.length)throw Error(pre.problems.join('; '));
const prompt=fs.readFileSync(path.join(E,'minimax-round2-brief.md'),'utf8');
const started=Date.now();
const run=await runOpenCodeWatched({args:ocArgs(workDir,'reviewer156',model),prompt,workDir,title:'pr156-mm-m3-focused',resumeSessionId:'ses_eb5bb0c6cffepU1VXp0lAAw322',opencode,
 env:{...pre.env,OPENCODE_CONFIG_DIR:path.join(top,'.opencode'),OPENCODE_DISABLE_PROJECT_CONFIG:'1'},
 logDir:path.join(E,'review-final/round2-cli'),startupTimeoutMs:180000,idleTimeoutMs:600000,totalTimeoutMs:3600000,log:console.log});
const R=path.join(E,'review-final');
fs.writeFileSync(path.join(R,'round2-final.md'),run.stdout);
fs.writeFileSync(path.join(R,'round2-stderr.txt'),run.stderr);
fs.writeFileSync(path.join(R,'round2-receipt.json'),JSON.stringify({...run,stdout:undefined,stderr:undefined,output:undefined,startedEpoch:started,head:target},null,2)+'\n');
if(run.exitCode!==0||run.permissionRejected||run.agentFallback)throw Error('Focused review execution failed; read retained final');
const header=prompt.split('\n')[0], read=readReview(run.stdout,header);
if(read.kind==='none')throw Error(read.reason);
const plan=planPost({read,header,doneWhen:doneWhenCount(prompt),source:'tools/harness/review.mjs focused continuation',signature:'MiniMax M3, same-session focused round2 via shared review parser/poster'});
publish({plan,pr:156,issue:155,applyLabel:true,dryRun:false,top,say:console.log,die:(code,message)=>{console.error(message);process.exitCode=code;}});
