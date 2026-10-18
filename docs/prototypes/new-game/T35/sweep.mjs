// Proposal: install at docs/prototypes/new-game/T35/sweep.mjs. UNEXECUTED.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registerHooks,stripTypeScriptTypes} from 'node:module';
import {createHash} from 'node:crypto';
import {inspectBoard} from './acceptance.mjs';
import {parameters as P} from '../T24/parameters.mjs';

const root=path.dirname(fileURLToPath(import.meta.url)), repo=path.resolve(root,'../../../..');
registerHooks({
  resolve(s,c,next) { return next(s.startsWith('.')&&c.parentURL?.endsWith('.ts')&&!path.extname(s)?s+'.ts':s,c); },
  load(u,c,next) { return u.endsWith('.ts')?{format:'module',source:stripTypeScriptTypes(fs.readFileSync(new URL(u),'utf8'),{mode:'transform'}),shortCircuit:true}:next(u,c); },
});
const {generateGeographicBoard}=await import(new URL('../../../../src/core/geographic-board.ts',import.meta.url));
const {createGeographicGame}=await import(new URL('../../../../src/core/geographic-game.ts',import.meta.url));
const {defaultOptions}=await import(new URL('../../../../src/core/options.ts',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const hash=value=>sha(JSON.stringify(value));
fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
const out=fs.mkdtempSync(path.join(root,'evidence/sweep-'));
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const inputs=['tests/core/geographic-board.test.ts'];
for(const dir of ['src/core',...['T24','T62','T34','T35'].map(t=>'docs/prototypes/new-game/'+t)]) {
  for(const name of fs.readdirSync(path.join(repo,dir)).sort()) {
    const relative=dir+'/'+name;
    if(fs.statSync(path.join(repo,relative)).isFile()) inputs.push(relative);
  }
}
const sourceHashes={};
for(const relative of inputs) {
  const bytes=fs.readFileSync(path.join(repo,relative));
  sourceHashes[relative]=sha(bytes);
  const target=path.join(out,'sources',relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,bytes,{flag:'wx'});
}
const records=[];
function budgetErrors(result,budget) {
  const errors=[];
  if(!Number.isInteger(result.attempts)||result.attempts<0||result.attempts>budget) errors.push('attempt budget');
  if(result.failures.length!==result.attempts-(result.ok?1:0)) errors.push('missing rejected attempts');
  for(const [i,f] of result.failures.entries()) {
    if(f.attempt!==i+1||!f.constraints?.length||!f.candidate) errors.push('incomplete failure record');
  }
  if(!result.ok&&('map' in result||'geography' in result)) errors.push('exhaustion published a board');
  return errors;
}
for(let seed=0;seed<100;seed++) {
  const opts={...defaultOptions(),seed};
  const result=generateGeographicBoard(seed,{attempts:P.attemptsMax});
  const replay=generateGeographicBoard(seed,{attempts:P.attemptsMax});
  const game=createGeographicGame(opts), gameReplay=createGeographicGame(opts);
  // Include bounded exhaustion even if all default-budget seeds happen to succeed.
  const bounded=generateGeographicBoard(seed,{attempts:1});
  const boundedReplay=generateGeographicBoard(seed,{attempts:1});
  const errors=[...budgetErrors(result,P.attemptsMax),...budgetErrors(bounded,1)];
  if(hash(result)!==hash(replay)||hash(bounded)!==hash(boundedReplay)||hash(game)!==hash(gameReplay)) errors.push('replay differs');
  if(result.ok) errors.push(...inspectBoard(result.map,result.geography));
  if(bounded.ok) errors.push(...inspectBoard(bounded.map,bounded.geography));
  if(!result.ok&&game.ok) errors.push('game published after board exhaustion');
  if(!game.ok&&'state' in game) errors.push('refusal published game state');
  if(game.ok) {
    errors.push(...inspectBoard(game.state.map,game.geography));
    if(result.ok&&(hash(result.map)!==hash(game.state.map)||hash(result.geography)!==hash(game.geography))) errors.push('board/game geography differs');
  }
  const record={seed,exported:result.ok,success:result.ok&&game.ok&&errors.length===0,
    attempts:result.attempts,errors,
    hashes:{result:hash(result),map:result.ok?hash(result.map):null,geography:result.ok?hash(result.geography):null,
      failures:hash(result.failures),boardRng:hash(result.rng),deal:game.ok?hash(game.state):null,
      gameRng:game.ok?hash(game.state.rng):null,bounded:hash(bounded)},
    boundedExhausted:!bounded.ok};
  records.push(record);
  write(`seed-${String(seed).padStart(2,'0')}.json`,{...record,result,game,bounded});
  if(seed%20===19) console.log(JSON.stringify({through:seed,successes:records.filter(r=>r.success).length}));
}
const zero=generateGeographicBoard(42,{attempts:0});
write('zero-budget.json',zero);
const sourcesUnchanged=inputs.every(relative=>sha(fs.readFileSync(path.join(repo,relative)))===sourceHashes[relative]);
const successes=records.filter(r=>r.success).length;
const targetMet=successes/100>=P.successTarget&&records.every(r=>r.errors.length===0)&&sourcesUnchanged
  &&!zero.ok&&zero.attempts===0&&zero.failures.length===0&&zero.rng.seed===42&&zero.rng.state===42
  &&!('map' in zero)&&!('geography' in zero);
const report={command:process.argv,seeds:100,successes,successTarget:P.successTarget,attemptsMax:P.attemptsMax,
  failingSeeds:records.filter(r=>!r.success).map(r=>r.seed),
  invalidSeeds:records.filter(r=>r.errors.length).map(r=>r.seed),
  boundedExhaustionSeeds:records.filter(r=>r.boundedExhausted).map(r=>r.seed),
  sourcesUnchanged,sourceHashes,targetMet,records};
write('report.json',report);
console.log(JSON.stringify({out,successes,failingSeeds:report.failingSeeds,invalidSeeds:report.invalidSeeds,targetMet}));
if(!targetMet) process.exitCode=1;
