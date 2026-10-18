// Measure ordinary-action interaction fixtures once; no algorithm/config changes.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registerHooks,stripTypeScriptTypes} from 'node:module';
const root=path.dirname(fileURLToPath(import.meta.url));
registerHooks({resolve(s,c,next){return next(s.startsWith('.')&&c.parentURL?.endsWith('.ts')&&!path.extname(s)?s+'.ts':s,c);},load(u,c,next){return u.endsWith('.ts')?{format:'module',source:stripTypeScriptTypes(fs.readFileSync(new URL(u),'utf8'),{mode:'transform'}),shortCircuit:true}:next(u,c);}});
const {createGeographicGame}=await import('../../../../src/core/geographic-game.ts');
const {defaultOptions}=await import('../../../../src/core/options.ts');
const {apply}=await import('../../../../src/core/rules.ts');
const {attackTargets,activePlayer}=await import('../../../../src/core/index.ts');
const options={...defaultOptions(),seed:1994,seats:[{kind:'human'},{kind:'human'}],computerStrengths:[]};
const game=createGeographicGame(options);if(!game.ok)throw Error(game.errors.join('; '));
const initial=game.state,player=activePlayer(initial),edges={},queued=[];
for(const source of initial.map.provinces.filter(p=>initial.ownerOf[p.id]===player.id)){
 let state=initial;const actions=[];
 if(state.reinforcementPool){const action={kind:'reinforce',province:source.id,amount:state.reinforcementPool};actions.push(action);const r=apply(state,action);if(!r.ok)throw Error(r.error);state=r.state;}
 actions.push({kind:'endReinforcement'});const ended=apply(state,actions.at(-1));if(!ended.ok)throw Error(ended.error);state=ended.state;
 const legal=attackTargets(state,source.id);
 for(const kind of ['borders','seaLanes'])if(!edges[kind]){const target=source[kind].find(id=>legal.includes(id));if(target)edges[kind]={from:source.id,to:target,actions,legal};}
 for(const target of legal){const action={kind:'attack',from:source.id,to:target},first=apply(state,action);if(!first.ok||first.state.phase!=='attack'||first.state.armies[source.id]<=1||!attackTargets(first.state,source.id).includes(target))continue;const second=apply(first.state,action);if(second.ok)queued.push({from:source.id,to:target,actions,firstPhase:first.state.phase,firstSourceArmies:first.state.armies[source.id],secondPhase:second.state.phase});}
}
if(!edges.borders||!edges.seaLanes||!queued.length)throw Error('Measured1994 lacks required edge/queued fixtures');
const out=fs.mkdtempSync(path.join(root,'evidence/fixture-probe-'));fs.writeFileSync(path.join(out,'fixtures.json'),JSON.stringify({seed:1994,attempts:game.attempts,edges,queued},null,2)+'\n');console.log(JSON.stringify({out,seed:1994,attempts:game.attempts,edges,queuedFirst:queued[0],queuedCount:queued.length}));
