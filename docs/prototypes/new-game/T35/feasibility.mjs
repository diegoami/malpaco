// Diagnostic only: unchanged T34 geography and unchanged T62 constraints.
import fs from 'node:fs';import path from 'node:path';import{registerHooks,stripTypeScriptTypes}from'node:module';import{createHash}from'node:crypto';import{fileURLToPath}from'node:url';
import{diagnosticBoard}from'../T34/acceptance.mjs';import{inspect}from'../T62/contract.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(root,'../../../..'),out=fs.mkdtempSync(path.join(root,'evidence/feasibility-'));
const sha=b=>createHash('sha256').update(b).digest('hex'),write=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const files=[...fs.readdirSync(path.join(repo,'src/core')).filter(n=>n.endsWith('.ts')).map(n=>'src/core/'+n),...['T24','T62'].flatMap(t=>fs.readdirSync(path.join(root,'..',t)).filter(n=>n.endsWith('.mjs')).map(n=>`docs/prototypes/new-game/${t}/${n}`)),'docs/prototypes/new-game/T34/acceptance.mjs','docs/prototypes/new-game/T34/witness.json','docs/prototypes/new-game/T35/feasibility.mjs'];
const sourceHashes={};for(const n of files){const b=fs.readFileSync(path.join(repo,n));sourceHashes[n]=sha(b);const p=path.join(out,'sources',n);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});}
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&c.parentURL?.endsWith('.ts')&&!path.extname(s)?s+'.ts':s,c)},load(u,c,n){if(u.endsWith('.ts'))return{format:'module',source:stripTypeScriptTypes(fs.readFileSync(new URL(u),'utf8')),shortCircuit:true};return n(u,c)}});
const{generateIslandGeography}=await import('../../../../src/core/island-geography.ts');
const records=[];
for(const seed of [0,1,2,7,42,1994]){
 const result=generateIslandGeography(seed);write(`seed-${seed}-geography.json`,result);if(!result.ok)throw Error('T34 did not supply a candidate');
 let accepted=0;
 for(let remove=-1;remove<result.geography.entranceReservations.length;remove++){
  const g={...result.geography,entranceReservations:result.geography.entranceReservations.filter((_,i)=>i!==remove)},board=diagnosticBoard(g),groups=inspect(board),errors=Object.entries(groups).flatMap(([group,items])=>items.map(error=>({group,error}))),ok=errors.length===0;
  if(ok)accepted++;const record={seed,removed:remove,routeCount:board.routes.length,ok,errors};records.push(record);write(`seed-${seed}-remove-${remove}.json`,{...record,board});
 }
 console.log(JSON.stringify({seed,variants:16,accepted}));
}
const sourcesUnchanged=files.every(n=>sha(fs.readFileSync(path.join(repo,n)))===sourceHashes[n]),feasible=[0,1,2,7,42,1994].every(seed=>records.some(r=>r.seed===seed&&r.ok));write('report.json',{scope:'Constraint feasibility only; same narrow T34 candidate family. No T35 algorithm, deal, version identity, success-rate or generality claim.',sourceHead:'7f1860dac78932629340c561e8fae4cfcdf44589',sourceHashes,sourcesUnchanged,feasible,records});console.log(JSON.stringify({out,feasible,sourcesUnchanged}));if(!feasible||!sourcesUnchanged)process.exitCode=1;
