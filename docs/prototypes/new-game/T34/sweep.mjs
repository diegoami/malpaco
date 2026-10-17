import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {registerHooks,stripTypeScriptTypes} from 'node:module';import {createHash} from 'node:crypto';
import {inspectGeography} from './acceptance.mjs';import {parameters as P} from '../T24/parameters.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(root,'../../../..');
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&c.parentURL?.endsWith('.ts')&&!path.extname(s)?s+'.ts':s,c);},load(u,c,n){if(u.endsWith('.ts'))return {format:'module',source:stripTypeScriptTypes(fs.readFileSync(new URL(u),'utf8')),shortCircuit:true};return n(u,c);}});
const{generateIslandGeography}=await import(new URL('../../../../src/core/island-geography.ts',import.meta.url));
const out=fs.mkdtempSync(path.join(root,'evidence/sweep-')),sha=b=>createHash('sha256').update(b).digest('hex'),hash=v=>sha(JSON.stringify(v)),write=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const paths=[...fs.readdirSync(path.join(repo,'src/core')).filter(n=>n.endsWith('.ts')).map(n=>'src/core/'+n),'tests/core/island-geography.test.ts',...['T24','T62','T34'].flatMap(t=>fs.readdirSync(path.join(root,'..',t)).filter(n=>fs.statSync(path.join(root,'..',t,n)).isFile()).map(n=>`docs/prototypes/new-game/${t}/${n}`))];
const sourceHashes={};for(const n of paths){const b=fs.readFileSync(path.join(repo,n));sourceHashes[n]=sha(b);const p=path.join(out,'sources',n);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});}
const records=[],failureCounts={},geometryHashes=new Set(),topologyHashes=new Set();
for(let seed=0;seed<100;seed++){
 const result=generateIslandGeography(seed,{attempts:P.attemptsMax}),replay=generateIslandGeography(seed,{attempts:P.attemptsMax}),errors=result.ok?inspectGeography(result.geography):['No accepted subdivision'];
 for(const f of result.failures)for(const e of f.constraints){const group=e.split(':')[0];failureCounts[group]=(failureCounts[group]??0)+1;}
 const replayHash=hash(result),identical=replayHash===hash(replay),success=result.ok&&errors.length===0&&identical;
 if(result.ok){geometryHashes.add(hash(result.geography.provinces.map(p=>p.polygon)));topologyHashes.add(hash(result.geography.provinces.map(p=>[p.id,p.borders])));}
 const record={seed,success,attempts:result.attempts,replayHash,identical,errors};records.push(record);write(`seed-${String(seed).padStart(2,'0')}.json`,{...record,result});
 if(seed%20===19)console.log(JSON.stringify({through:seed,valid:records.filter(r=>r.success).length}));
}
const sourcesUnchanged=paths.every(n=>sha(fs.readFileSync(path.join(repo,n)))===sourceHashes[n]),successes=records.filter(r=>r.success).length;
const targetMet=successes/100>=P.successTarget&&records.every(r=>r.attempts<=P.attemptsMax&&r.identical)&&geometryHashes.size>1&&topologyHashes.size>1&&sourcesUnchanged;
write('report.json',{command:process.argv,seeds:100,successes,successTarget:P.successTarget,attemptsMax:P.attemptsMax,targetMet,failureCounts,geometryHashes:geometryHashes.size,topologyHashes:topologyHashes.size,sourceHashes,sourcesUnchanged,records,scope:'Witness-based seeded partial geography, two local T1 exchange sites and joint corridor/label/placement rejection. Not complete playable boards or arbitrary planar topology; T35 completes connectivity choices/fairness and T36 measures 1000 seeds with UI.'});
console.log(JSON.stringify({output:path.relative(repo,out),successes,targetMet,failureCounts,geometryHashes:geometryHashes.size,topologyHashes:topologyHashes.size}));if(!targetMet)process.exitCode=1;
