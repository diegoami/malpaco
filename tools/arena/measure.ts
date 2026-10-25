import {appendFileSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {scheduleArena,runArenaCase,summarizeArena} from './model';
import {decideArenaPolicy,POLICY_DESCRIPTORS} from './policies';
import type {ArenaConfig,ArenaRow} from './model';

const input=JSON.parse(process.argv[2]!) as {config:ArenaConfig;out:string};
const schedule=scheduleArena(input.config),out=input.out;
writeFileSync(`${out}/schedule.json`,JSON.stringify(schedule,null,2)+'\n');
writeFileSync(`${out}/policies.json`,JSON.stringify(POLICY_DESCRIPTORS,null,2)+'\n');
for(const file of ['proofs.jsonl','outcomes.jsonl','repeat.jsonl','costs.jsonl'])writeFileSync(`${out}/${file}`,'');
const first:ArenaRow[]=[];
// A reverse-order verification is retained separately, never counted as more games.
for(const repeat of [false,true]){
 const rows:ArenaRow[]=[];
 for(const c of repeat?[...schedule].reverse():schedule){
  const started=performance.now(),policyCosts:Record<string,{calls:number;ms:number}>={};
  const proof=runArenaCase(c,{decide:(id,view)=>{
   const before=performance.now();
   try{return decideArenaPolicy(id,view);}finally{const cost=policyCosts[id]??{calls:0,ms:0};cost.calls++;cost.ms+=performance.now()-before;policyCosts[id]=cost;}
  }});
  rows.push(proof.row);
  appendFileSync(`${out}/costs.jsonl`,JSON.stringify({id:c.id,repeat,totalMs:performance.now()-started,policyCosts})+'\n');
  if(!repeat){first.push(proof.row);appendFileSync(`${out}/proofs.jsonl`,JSON.stringify(proof)+'\n');}
  appendFileSync(`${out}/${repeat?'repeat':'outcomes'}.jsonl`,JSON.stringify(proof.row)+'\n');
  console.log(JSON.stringify({repeat,id:c.id,status:proof.row.status,actions:proof.row.actions,replay:proof.row.replayVerified}));
 }
 if(repeat){
  const sorted=(rs:ArenaRow[])=>[...rs].sort((a,b)=>a.case.id<b.case.id?-1:a.case.id>b.case.id?1:0);
  if(JSON.stringify(sorted(rows))!==JSON.stringify(sorted(first)))throw Error('Reverse-order deterministic records differ');
 }
}
const summary=summarizeArena(first);
writeFileSync(`${out}/summary.json`,JSON.stringify({...summary,reverseOrderRepeatMatches:true,independentDeals:new Set(schedule.map(c=>JSON.stringify([c.seed,c.regions,c.policies.length]))).size},null,2)+'\n');
console.log(JSON.stringify(summary));
if(summary.error||summary.refused||summary.replayFailures)process.exitCode=1;
