// UNEXECUTED T36 proposal. Install as docs/prototypes/new-game/T36/sweep.mjs.
// Extends the T35 acceptance protocol to seeds 0..999 and one separate 1994 diagnostic.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registerHooks,stripTypeScriptTypes} from 'node:module';
import {createHash} from 'node:crypto';
import {inspectBoard} from '../T35/acceptance.mjs';
import {parameters as P} from '../T24/parameters.mjs';

const root=path.dirname(fileURLToPath(import.meta.url)), repo=path.resolve(root,'../../../..');
registerHooks({
  resolve(specifier,context,next) {
    return next(specifier.startsWith('.')&&context.parentURL?.endsWith('.ts')&&!path.extname(specifier)?specifier+'.ts':specifier,context);
  },
  load(url,context,next) {
    return url.endsWith('.ts')
      ? {format:'module',source:stripTypeScriptTypes(fs.readFileSync(new URL(url),'utf8'),{mode:'transform'}),shortCircuit:true}
      : next(url,context);
  },
});
const {generateGeographicBoard}=await import(new URL('../../../../src/core/geographic-board.ts',import.meta.url));
const {createGeographicGame}=await import(new URL('../../../../src/core/geographic-game.ts',import.meta.url));
const {defaultOptions}=await import(new URL('../../../../src/core/options.ts',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const hash=value=>sha(JSON.stringify(value));
fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
const out=fs.mkdtempSync(path.join(root,'evidence/sweep-'));
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});

// Match T35's source fingerprint and snapshot convention. Include the T36 producer,
// acceptance imports, core, relevant frozen contracts, and the independently authored board tests.
const inputs=['src/main.ts','src/styles.css','tests/core/geographic-board.test.ts',
  'tests/e2e/geographic-board.spec.ts','tests/ui/geographic-game.test.ts',
  'docs/prototypes/new-game/T65/map.svg','docs/prototypes/new-game/T34/witness.json',
  'docs/prototypes/new-game/T63/board.json','package.json','package-lock.json','playwright.config.ts','playwright.release.config.ts','vite.config.ts'];
function addTree(dir) {
  for(const item of fs.readdirSync(path.join(repo,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    const relative=dir+'/'+item.name;
    if(item.isDirectory())addTree(relative);else if(item.isFile())inputs.push(relative);
  }
}
for(const dir of ['src/core','src/ui'])addTree(dir);
// Follow the actual acceptance import graph, including older contract helpers;
// a fixed directory list can silently omit T60/T61 dependencies.
const visited=new Set();
function addModule(relative) {
  if(visited.has(relative))return;visited.add(relative);inputs.push(relative);
  const source=fs.readFileSync(path.join(repo,relative),'utf8');
  for(const match of source.matchAll(/(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]/g)) {
    const target=path.posix.normalize(path.posix.join(path.posix.dirname(relative),match[1]));
    if(!fs.existsSync(path.join(repo,target)))throw Error('Missing acceptance dependency '+target);
    if(target.endsWith('.mjs'))addModule(target);else inputs.push(target);
  }
}
addModule('docs/prototypes/new-game/T36/sweep.mjs');
addModule('docs/prototypes/new-game/T35/sweep.mjs');
const sourceHashes={};
for(const relative of [...new Set(inputs)].sort()) {
  const bytes=fs.readFileSync(path.join(repo,relative)); sourceHashes[relative]=sha(bytes);
  const target=path.join(out,'sources',relative);
  fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,bytes,{flag:'wx'});
}

function budgetErrors(result,budget) {
  const errors=[];
  if(!Number.isInteger(result.attempts)||result.attempts<0||result.attempts>budget) errors.push('attempt budget');
  if(!Array.isArray(result.failures)||result.failures.length!==result.attempts-(result.ok?1:0)) errors.push('missing rejected attempts');
  for(const [i,f] of (result.failures??[]).entries()) {
    if(f.attempt!==i+1||!f.constraints?.length||!f.candidate) errors.push('incomplete failure record');
  }
  if(!result.ok&&('map' in result||'geography' in result)) errors.push('exhaustion published a board');
  return errors;
}
function optionsFor(seed) { return {...defaultOptions(),seed}; }
const shapeMetrics=(map,geography)=>{
  const q=geography.unitsPerPixel;
  const area=points=>Math.abs(points.reduce((sum,p,i)=>{const n=points[(i+1)%points.length];return sum+p[0]*n[1]-n[0]*p[1];},0))/(2*q*q);
  const provinces=map.provinces;
  const pairGaps=[];
  for(let a=0;a<provinces.length;a++)for(let b=a+1;b<provinces.length;b++) {
    const u=provinces[a].labelAt,v=provinces[b].labelAt;
    pairGaps.push(Math.max(Math.abs(u[0]-v[0]),Math.abs(u[1]-v[1]))/q);
  }
  const outlines=geography.islands.map(island=>island.polygon.length);
  const routes=geography.entranceReservations;
  return {
    countries:provinces.length,islands:geography.islands.length,
    minDegree:Math.min(...provinces.map(p=>p.borders.length+p.seaLanes.length)),
    maxDegree:Math.max(...provinces.map(p=>p.borders.length+p.seaLanes.length)),
    seaEdges:provinces.reduce((n,p)=>n+p.seaLanes.length,0)/2,
    countryVertices:provinces.reduce((n,p)=>n+p.polygon.length,0),
    maxCountryVertices:Math.max(...provinces.map(p=>p.polygon.length)),
    minimumCountryAreaCss:Math.min(...provinces.map(p=>area(p.polygon))),
    minimumLabelGapCss:Math.min(...pairGaps),
    islandOutlineVertices:outlines.reduce((a,b)=>a+b,0),
    maximumRouteBends:Math.max(...routes.map(r=>Math.max(0,r.points.length-2))),
    smallestIslandAreaCss:Math.min(...geography.islands.map(i=>area(i.polygon))),
  };
};
function budgetRecord(seed,budget) {
  const opts=optionsFor(seed);
  const result=generateGeographicBoard(seed,{attempts:budget});
  const game=createGeographicGame(opts,undefined,{attempts:budget});
  const gameReplay=createGeographicGame(opts,undefined,{attempts:budget});
  const errors=[...budgetErrors(result,budget),...budgetErrors(game,budget)];
  if(hash(game)!==hash(gameReplay)) errors.push('replay differs');
  if(result.ok) errors.push(...inspectBoard(result.map,result.geography));
  if(game.ok) errors.push(...inspectBoard(game.state.map,game.geography));
  if(!result.ok&&game.ok) errors.push('game published after board exhaustion');
  if(!game.ok&&'state' in game) errors.push('refusal published game state');
  if(result.ok&&game.ok&&(hash(result.map)!==hash(game.state.map)||hash(result.geography)!==hash(game.geography))) errors.push('board/game geography differs');
  const failedAttempts=result.failures??[];
  // Game replay regenerates geography twice and compares the entire state, metadata,
  // failures and RNG. A fourth unchanged standalone board generation is redundant.
  const record={seed,budget,success:result.ok&&game.ok&&errors.length===0,refused:!result.ok||!game.ok,attempts:result.attempts,
    refusalClasses:[...new Set(failedAttempts.flatMap(f=>f.constraints??[]))].sort(),refusalMessages:game.ok?[]:game.errors,errors,
    hashes:{result:hash(result),map:result.ok?hash(result.map):null,geography:result.ok?hash(result.geography):null,
      failures:hash(failedAttempts),boardRng:hash(result.rng),game:hash(game),deal:game.ok?hash(game.state):null,
      gameRng:game.ok?hash(game.state.rng):null},
    metrics:result.ok?shapeMetrics(result.map,result.geography):null};
  return {record,result,game};
}
const chooseCorpus=rows=>{
  const successes=rows.filter(row=>row.record.success);
  const chosen=[],used=new Set();
  const add=(row,purpose)=>{if(!row||used.has(row.record.seed))return false;used.add(row.record.seed);chosen.push({seed:row.record.seed,purpose,mapHash:row.record.hashes.map,geographyHash:row.record.hashes.geography,metrics:row.record.metrics});return true;};
  const required=rows.find(row=>row.record.seed===1994);
  add(required,'required extra diagnostic seed 1994');
  const extrema=[
    ['minimum accepted label clearance','minimumLabelGapCss',1],
    ['smallest country area / tightest hit geometry','minimumCountryAreaCss',1],
    ['most country outline vertices','countryVertices',-1],
    ['most route bends','maximumRouteBends',-1],
  ];
  for(const [purpose,key,direction] of extrema) {
    const sorted=[...successes].sort((a,b)=>direction*(a.record.metrics[key]-b.record.metrics[key])||a.record.seed-b.record.seed);
    for(const row of sorted)if(add(row,purpose))break;
  }
  // The chosen rows are only a bounded visual/interaction corpus. Every seed remains
  // in the sweep and every refusal remains in its per-seed record and report.
  return chosen;
};

const rows=[];
const refusalClassCounts={};
function retain(row,file){
  write(file,{...row.record,result:row.result,game:row.game});
  for(const failure of row.result.failures??[])for(const klass of failure.constraints??[])refusalClassCounts[klass]=(refusalClassCounts[klass]??0)+1;
  return {record:row.record}; // Full candidates/maps exist on disk only, never in the 1000-row array.
}
for(let seed=0;seed<1000;seed++) {
  const row=budgetRecord(seed,P.attemptsMax);
  rows.push(retain(row,`seed-${String(seed).padStart(4,'0')}.json`));
  if(seed%100===99)console.log(JSON.stringify({through:seed,successes:rows.filter(r=>r.record.success).length}));
}
// T24 already covers 0..999, so this diagnostic is explicitly extra and excluded from the rate.
const diagnostic=retain(budgetRecord(1994,P.attemptsMax),'seed-1994-diagnostic.json');
const zero=generateGeographicBoard(42,{attempts:0}); write('zero-budget.json',zero);
const sourcesUnchanged=Object.entries(sourceHashes).every(([relative,digest])=>sha(fs.readFileSync(path.join(repo,relative)))===digest);
const successes=rows.filter(r=>r.record.success).length;
const corpusRows=[...rows,diagnostic];
const corpus=chooseCorpus(corpusRows);
const refusalSeeds=rows.filter(row=>row.record.refused).map(row=>({seed:row.record.seed,
  errors:row.record.errors,refusalClasses:row.record.refusalClasses,recordFile:`seed-${String(row.record.seed).padStart(4,'0')}.json`}));

const targetMet=successes/1000>=P.successTarget&&rows.every(r=>r.record.errors.length===0)
  &&diagnostic.record.success&&sourcesUnchanged&&corpus.length===5
  &&!zero.ok&&zero.attempts===0&&zero.failures.length===0&&zero.rng.seed===42&&zero.rng.state===42
  &&!('map' in zero)&&!('geography' in zero);
const report={command:process.argv,runtime:{node:process.version,platform:process.platform,arch:process.arch,versions:process.versions},seeds:1000,successes,successTarget:P.successTarget,attemptsMax:P.attemptsMax,
  diagnosticSeed:1994,diagnosticCountedInRate:false,diagnosticSuccess:diagnostic.record.success,
  failingSeeds:rows.filter(r=>!r.record.success).map(r=>r.record.seed),
  invalidSeeds:rows.filter(r=>r.record.errors.length).map(r=>r.record.seed),
  attemptCounts:rows.reduce((acc,row)=>(acc[row.record.attempts]=(acc[row.record.attempts]??0)+1,acc),{}),refusalClassCounts,corpus,sourceHashes,sourcesUnchanged,targetMet,
  records:rows.map(r=>r.record),diagnostic:diagnostic.record};
write('report.json',report);
write('corpus-selection.json',{measured:true,targetMet,reportFile:path.relative(repo,path.join(out,'report.json')),sourceHashes,selection:corpus,refusalSeeds});
console.log(JSON.stringify({out,seeds:1000,successes,failingSeeds:report.failingSeeds,invalidSeeds:report.invalidSeeds,
  diagnosticSeed:1994,diagnosticSuccess:report.diagnosticSuccess,corpus:corpus.map(({seed,purpose})=>({seed,purpose})),targetMet}));
if(!targetMet)process.exitCode=1;
