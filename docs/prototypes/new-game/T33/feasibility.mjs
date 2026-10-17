import {createServer} from "vite";
import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs";
import {join} from "node:path";
const server=await createServer({server:{middlewareMode:true}});
try {
const c=await server.ssrLoadModule('/src/core/index.ts');
const {referenceMap}=await server.ssrLoadModule('/src/ui/referenceData.ts');
const {createReferenceGame}=await server.ssrLoadModule('/src/core/reference-game.ts');
const results=[];
for(const seed of [1994,42,0,1,2,3,4,5,6,7,8,9]) {
 const options={...c.defaultOptions(),seed,seats:[{kind:'human'},{kind:'computer'}],computerStrengths:['Normal'],dominationWin:false,roundLimit:null};
 const opened=createReferenceGame(referenceMap,options,c.victoryRules(options));if(!opened.ok)throw Error(opened.errors.join(';'));
 let state=opened.state,moved=false,computerActions=0,humanActions=0;
 for(let n=0;n<6000 && state.phase!=='finished' && state.phase!=='human-loss';n++) {
  const player=c.activePlayer(state);let action;
  if(player.kind==='computer'){action=c.computerAction(state);computerActions++;}
  else {
   humanActions++;
   if(state.phase==='capture') action={kind:'captureMove',amount:state.pendingCapture.max};
   else if(state.phase==='reinforce') {
    const own=state.map.provinces.filter(p=>state.ownerOf[p.id]===player.id);
    const frontier=own.filter(p=>[...p.borders,...p.seaLanes].some(id=>state.ownerOf[id]!==player.id));
    const choices=frontier.length?frontier:own;choices.sort((a,b)=>state.armies[b.id]-state.armies[a.id]||a.id.localeCompare(b.id));
    action=state.reinforcementPool?{kind:'reinforce',province:choices[0].id,amount:1}:{kind:'endReinforcement'};
   } else if(!moved && c.friendlySources(state).length) {
    const from=c.friendlySources(state)[0],to=c.friendlyTargets(state,from)[0];action={kind:'friendlyMove',from,to,amount:1};moved=true;
   } else {
    const attacks=c.legalAttacks(state).filter(a=>a.kind==='attack');attacks.sort((a,b)=>state.armies[a.to]-state.armies[b.to]||state.armies[b.from]-state.armies[a.from]||a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
    action=attacks[0]??{kind:'endTurn'};
   }
  }
  if(!action)throw Error('No action '+state.phase);
  const next=c.apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;
 }
 const summary={seed,phase:state.phase,winner:state.winner,humanWin:state.winner==='seat1',actions:state.history.length,computerActions,humanActions,moved,eliminated:state.players.filter(p=>p.eliminated).map(p=>p.id)};
 results.push(summary);
 if(summary.humanWin&&moved){mkdirSync('docs/prototypes/new-game/T33/evidence',{recursive:true});const dir=mkdtempSync('docs/prototypes/new-game/T33/evidence/feasibility-');writeFileSync(join(dir,'report.json'),JSON.stringify({options,results,actions:state.history},null,2)+'\n');console.log(dir,JSON.stringify(results));break;}
}
console.log(JSON.stringify(results));
}finally{await server.close();}
