// [designed] Diagnostic sample only; existing reference construction, no algorithm rewrite.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {coastPostprocess} from '../T64/layout.mjs';
import {naturalizeBorders} from '../T65/borders.mjs';
import {inspect} from '../T62/contract.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(root,'../../../..');
const output=fs.mkdtempSync(path.join(root,'evidence/feasibility-'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const sources=['docs/prototypes/new-game/T63/board.json',...['T24','T62'].flatMap(t=>fs.readdirSync(path.join(root,'..',t)).filter(n=>n.endsWith('.mjs')).map(n=>`docs/prototypes/new-game/${t}/${n}`)),'docs/prototypes/new-game/T64/layout.mjs','docs/prototypes/new-game/T65/borders.mjs','docs/prototypes/new-game/T34/feasibility-wide.mjs'];
const sourceHashes={};
for(const n of sources){const b=fs.readFileSync(path.join(repo,n));sourceHashes[n]=sha(b);const target=path.join(output,'sources',n);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b,{flag:'wx'});}
const reference=JSON.parse(fs.readFileSync(path.join(root,'../T63/board.json'))),records=[];
const write=(name,value)=>fs.writeFileSync(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
for(const seed of Array.from({length:100},(_,i)=>i)){
 let stage='coast',board,checks,error;
 try{board=coastPostprocess({...structuredClone(reference),seed});stage='border';board=naturalizeBorders(board,seed);stage='inspect';checks=inspect(board);}catch(e){error=String(e);}
 const accepted=!error&&Object.values(checks).every(a=>a.length===0);
 const record={seed,accepted,stage,checks,error,boardHash:board?sha(JSON.stringify(board)):null};records.push(record);write(`seed-${seed}.json`,{...record,board});
 console.log(JSON.stringify(record));
}
const stable=sources.every(n=>sha(fs.readFileSync(path.join(repo,n)))===sourceHashes[n]);
const report={kind:'existing fixed-reference construction feasibility smoke',seeds:Array.from({length:100},(_,i)=>i),attemptsPerSeed:1,accepted:records.filter(r=>r.accepted).length,records,sourceHashes,sourcesUnchanged:stable,targetRateEstablished:false,topologyVaried:false,constraintsRelaxed:false,limitations:'100 diagnostic seeds on one reference graph; not T34 implementation, 100-seed acceptance, or a demonstrated 99%/50-attempt generation target. Any failures are retained, never filtered.'};
write('report.json',report);console.log(JSON.stringify({output:path.relative(repo,output),accepted:report.accepted,total:records.length,sourcesUnchanged:stable,targetRateEstablished:false}));
if(!stable)process.exitCode=1;
