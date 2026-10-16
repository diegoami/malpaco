import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { parameters as P } from './parameters.mjs';
import { inspect,constraints } from './contract.mjs';
import { witness } from './witness.mjs';
import { root,DeterministicRng,generateBoardBody,existingScene } from './existing.mjs';
const directory=path.dirname(fileURLToPath(import.meta.url));
const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const runRoot=path.join(directory,'evidence','runs');fs.mkdirSync(runRoot,{recursive:true});
const output=fs.mkdtempSync(path.join(runRoot,'run-'));
const write=(name,value)=>fs.writeFileSync(path.join(output,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const sourcePaths=['src/core/board-gen.ts','src/core/board-fairness.ts','src/core/rng.ts','src/ui/prototype/layout.ts','src/ui/prototype/preview.ts','src/styles.css',
  ...['parameters.mjs','geometry.mjs','contract.mjs','witness.mjs','existing.mjs','probe.mjs'].map(f=>`docs/prototypes/new-game/T24/${f}`)];
const sourceHashes=Object.fromEntries(sourcePaths.map(p=>[p,hash(fs.readFileSync(path.join(root,p),'utf8'))]));
const fixed=witness(),witnessChecks=inspect(fixed);
write('witness.json',fixed);
const failureCounts=Object.fromEntries(constraints.map(n=>[n,0]));
const records=[];
const start=performance.now();let successes=0,attemptsTotal=0;
for(let seed=0;seed<100;seed++) {
  const begin=performance.now(),rng=new DeterministicRng(seed),attempts=[];
  let accepted=false,firstFailure=null;
  for(let attempt=1;attempt<=P.attemptsMax;attempt++) {
    const before=performance.now(),generated=generateBoardBody(rng);
    const map=generated.ok?existingScene(generated.map):null;
    const checks=map?inspect(map):Object.fromEntries(constraints.map(n=>[n,['No candidate board']]));
    const failures=constraints.filter(n=>checks[n].length>0);
    for(const n of failures)failureCounts[n]++;
    attemptsTotal++;
    attempts.push({attempt,generated:generated.ok,mapHash:generated.ok?hash(generated.map):null,
      sceneHash:map?hash(map):null,failures,elapsedMs:performance.now()-before});
    if(firstFailure===null)firstFailure=checks;
    if(seed===0&&attempt===1)write('baseline-seed-0-attempt-1.json',{map,checks});
    if(!failures.length){accepted=true;successes++;break;}
    // Same retry boundary as the production generator: one continuous game
    // stream and one advance after a rejected candidate, not seed+attempt.
    rng.nextInt(0,0xffffffff);
  }
  const record={seed,accepted,attempts:attempts.length,elapsedMs:performance.now()-begin,
    firstFailure,records:attempts};
  write(`seed-${String(seed).padStart(2,'0')}.json`,record);
  records.push({seed,accepted,attempts:attempts.length,hash:hash(attempts.map(({elapsedMs,...r})=>r))});
  if(seed%20===19)console.log(`Measured seeds 0..${seed}; full-contract successes ${successes}/${seed+1}`);
}
if(sourcePaths.some(p=>hash(fs.readFileSync(path.join(root,p),'utf8'))!==sourceHashes[p]))throw Error('Source changed during measurement; retain this incomplete run and rerun');
const result={kind:'existing-implementation feasibility diagnostic',parameters:P,
  scope:'Seeds 0–99, existing generator body and existing layout. All candidate failures retained; no generator rewrite.',
  routeDiagnostic:'Existing quadratic sea paths sampled at 16 intervals. Exact centre endpoints already lie inside their own countries; positive curved-path clearance is not certified. Schematic witness routes are exact polylines.',
  sourceHashes,witness:{hash:hash(fixed),checks:witnessChecks,valid:constraints.every(n=>witnessChecks[n].length===0),
    interpretation:'One fixed schematic witness, not 100 generated boards, visual approval or a measured generator rate.'},
  seeds:100,successes,successRate:successes/100,targetMet:successes/100>=P.successTarget,
  attemptsTotal,failureCounts,records,reproducibilityHash:hash({parameters:P,sourceHashes,records,witness:hash(fixed)}),
  elapsedMs:performance.now()-start,
  conclusion:successes/100>=P.successTarget?'Existing implementation meets this sample target.':'Existing implementation does not meet the approved geographic target. Stop downstream generation changes pending owner review of this report; constraints are not weakened.'};
write('report.json',result);
write('witness.svg',svg(fixed));
console.log(JSON.stringify({output:path.relative(root,output),successes,seeds:100,attemptsTotal,witnessValid:result.witness.valid,targetMet:result.targetMet,reproducibilityHash:result.reproducibilityHash}));
// A diagnostic result is successful even when feasibility is not established;
// report targetMet=false explicitly. A broken positive control is a tool failure.
if(!result.witness.valid)process.exitCode=1;
function svg(board) {
  const colors=['#d5e7d1','#e1cda9','#c2d9ec','#dcc6e7'];
  const shapes=board.provinces.map((p,i)=>`<polygon points="${p.polygon.map(v=>v.join(',')).join(' ')}" fill="${colors[i%4]}" stroke="#345"/><text x="${p.labelAt[0]}" y="${p.labelAt[1]}" font-size="14" text-anchor="middle" dominant-baseline="central">${i+1}</text>`).join('');
  const routes=board.routes.map(r=>`<polyline points="${r.points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#284c70" stroke-dasharray="4 3"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="540" viewBox="0 0 800 540"><rect width="800" height="540" fill="#e6f3f7"/>${shapes}${routes}<text x="20" y="490" font-size="16">T24 schematic feasibility witness — not final map art</text><text x="20" y="515" font-size="14">46 countries · 9 islands · 16 crossings · coast-centred endpoints</text></svg>\n`;
}
