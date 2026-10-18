// Parent feasibility only: unchanged T34 reservations + integer conversion + existing deal.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {registerHooks,stripTypeScriptTypes} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root='/home/diego/projects/malpaco';
const parent=process.cwd();
const own=path.join(root,'.cache/t35-work/docs/prototypes/new-game/T35');
const out=fs.mkdtempSync(path.join(own,'evidence/current-parent-'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const hash=v=>sha(JSON.stringify(v));
const write=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:parent,encoding:'utf8'}).trim();
// Record the existing task parent without changing the geometry source.
const adapterOriginal=fs.readFileSync(path.join(own,'acceptance.mjs'),'utf8');
const adapter=adapterOriginal.replace("'../T62/contract.mjs'",JSON.stringify(pathToFileURL(path.join(parent,'docs/prototypes/new-game/T62/contract.mjs')).href))
 .replace("'../T24/parameters.mjs'",JSON.stringify(pathToFileURL(path.join(parent,'docs/prototypes/new-game/T24/parameters.mjs')).href));
fs.writeFileSync(path.join(out,'measured-acceptance.mjs'),adapter,{flag:'wx'});
const inputs=new Map();
for(const dir of ['src/core',...['T24','T62','T34'].map(t=>'docs/prototypes/new-game/'+t)]){
 for(const name of fs.readdirSync(path.join(parent,dir))){
  const relative=path.join(dir,name),p=path.join(parent,relative);
  if(fs.statSync(p).isFile())inputs.set('current-parent/'+relative,{path:p,bytes:fs.readFileSync(p)});
 }
}
for(const p of [path.join(own,'smoke.mjs'),path.join(own,'acceptance.mjs')])
 inputs.set('probe/'+path.basename(p),{path:p,bytes:fs.readFileSync(p)});
for(const [name,input]of inputs){const p=path.join(out,'sources',name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,input.bytes,{flag:'wx'});}
registerHooks({resolve(s,c,next){return next(s.startsWith('.')&&c.parentURL?.endsWith('.ts')&&!path.extname(s)?s+'.ts':s,c)},
 load(u,c,next){return u.endsWith('.ts')?{format:'module',source:stripTypeScriptTypes(fs.readFileSync(new URL(u),'utf8'),{mode:'transform'}),shortCircuit:true}:next(u,c)}});
const load=n=>import(pathToFileURL(path.join(parent,'src/core',n+'.ts')));
const {generateIslandGeography}=await load('island-geography');
const {DeterministicRng}=await load('rng');
const {createGameWithRng}=await load('setup');
const {defaultOptions}=await load('options');
const {victoryRules}=await load('state');
const {inspectBoard}=await import(pathToFileURL(path.join(out,'measured-acceptance.mjs')));
function convert(g){
 const provinces=g.provinces.map(p=>({...p,name:p.id,polygon:structuredClone(p.polygon),labelAt:[...p.labelAt],borders:[...p.borders],
  seaLanes:g.entranceReservations.flatMap(r=>r.from===p.id?[r.to]:r.to===p.id?[r.from]:[])}));
 return{id:'geographic-feasibility',name:'Diagnostic conversion',bounds:{...g.bounds},provinces,
  islands:g.islands.map(i=>({id:i.id,name:i.id,provinces:[...i.provinces],bonus:Math.max(2,Math.floor(i.provinces.length/2)+provinces.filter(p=>p.island===i.id&&p.seaLanes.length).length)}))};
}
const seeds=process.argv.includes('--wide')?Array.from({length:100},(_,i)=>i):[0,1,2,7,42,1994];
const records=[];
for(const seed of seeds){
 const result=generateIslandGeography(seed),errors=[];let map,game,gameReplay;
 if(result.ok){
  map=convert(result.geography);errors.push(...inspectBoard(map,result.geography));
  const opts={...defaultOptions(),seed};
  const deal=()=>createGameWithRng(opts,DeterministicRng.fromSnapshot(result.rng),()=>({ok:true,map}),victoryRules(opts));
  game=deal();gameReplay=deal();
  if(!game.ok)errors.push(...game.errors);
  if(hash(game)!==hash(gameReplay))errors.push('deal replay mismatch');
  if(game.ok&&game.state.productionCentres.length!==3)errors.push('missing centres');
 }
 const record={seed,success:result.ok&&errors.length===0,attempts:result.attempts,errors,
  mapHash:map?hash(map):null,dealHash:game?hash(game):null,rngHash:game?.ok?hash(game.state.rng):null};
 records.push(record);write(`seed-${seed}.json`,{...record,result,map,game});
 if(records.length%20===0)console.log(JSON.stringify({through:seed,successes:records.filter(r=>r.success).length}));
}
const sourcesUnchanged=[...inputs.values()].every(i=>sha(fs.readFileSync(i.path))===sha(i.bytes));
const successes=records.filter(r=>r.success).length;
const feasible=successes/seeds.length>=0.99&&records.every(r=>r.attempts<=50&&r.errors.length===0)&&sourcesUnchanged;
write('report.json',{scope:'Premerge numerical feasibility only. Unchanged approved T34 parent, existing reservations, integer map conversion and existing continuous post-geography deal. No T35 producer/shared-stream seam/replay identity/UI approval claimed.',
 sourceHead,seeds,successes,feasible,sourcesUnchanged,sourceHashes:Object.fromEntries([...inputs].map(([n,i])=>[n,sha(i.bytes)])),records,
 importAdaptation:'Two relative imports rewritten to pinned current-parent file URLs only; original and measured adapter preserved.'});
console.log(JSON.stringify({out,successes,total:seeds.length,feasible,sourcesUnchanged}));
if(!feasible)process.exitCode=1;
