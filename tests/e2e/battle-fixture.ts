import {readFileSync} from "node:fs";
import {apply,captureChoiceRules,cloneState,defaultOptions,DeterministicRng,resolve,pairResults,parseMap,SCHEMA} from "../../src/core";
import {createReferenceGame} from "../../src/core/reference-game";
import type {Action,GameMap,GameState} from "../../src/core";
import type fixtureData from "../../docs/prototypes/new-game/T63/board.json";
const raw:typeof fixtureData=JSON.parse(readFileSync(new URL("../../docs/prototypes/new-game/T63/board.json",import.meta.url),"utf8"));
const parsed=parseMap({schema:SCHEMA,id:"reference-coast-first-a",name:"Nine Isles",bounds:raw.bounds,provinces:raw.provinces.map(({id,name,island,polygon,labelAt,borders,seaLanes})=>({id,name,island,polygon,label_at:labelAt,borders,sea_lanes:seaLanes})),islands:raw.islands.map(({id,name,bonus,provinces})=>({id,name,bonus,provinces}))});
if(!parsed.ok)throw Error(parsed.errors.join(";"));
export const map:GameMap=parsed.map;
export function step(s:GameState,a:Action){const r=apply(s,a);if(!r.ok)throw Error(r.error);return r.state;}
export function trace(s:GameState,from:string,to:string){
 const rng=DeterministicRng.fromSnapshot(s.rng),faces:number[]=[];
 const outcome=resolve(cloneState(s),from,to,{rollDie(n){const face=rng.rollDie(n);faces.push(face);return face;}});
 return {outcome,rolls:Array.from({length:faces.length/2},(_,i)=>({a:faces[i*2]!,d:faces[i*2+1]!,result:pairResults(s.rules.combat.ties,[faces[i*2]!],[faces[i*2+1]!])[0]!}))};
}
export function fixture(kind:"tie"|"loss"|"manual"|"capture"){
 for(let seed=0;seed<200;seed++){
  const opening=createReferenceGame(map,{...defaultOptions(),seed,seats:[{kind:"human"},{kind:"human"}],computerStrengths:[]},captureChoiceRules());if(!opening.ok)continue;
  const start=opening.state,mover=start.players[start.currentPlayer]!.id;
  for(const from of map.provinces.filter(p=>start.ownerOf[p.id]===mover))for(const to of [...from.borders,...from.seaLanes]){
   if(start.ownerOf[to]===mover||start.armies[to]!== (kind==="capture"?1:3))continue;
   let ready=start;const placements=ready.reinforcementPool;for(let n=0;n<placements;n++)ready=step(ready,{kind:"reinforce",province:from.id,amount:1});ready=step(ready,{kind:"endReinforcement"});
   const first=trace(ready,from.id,to);if(kind==="tie"&&!first.rolls.some(r=>r.result==="tie"))continue;if(kind==="loss"&&first.outcome.attackerLosses!==1)continue;
   if(kind==="capture"){
    let end=ready;for(let n=0;n<128&&end.phase==="attack"&&end.armies[from.id]!>1;n++)end=step(end,{kind:"attack",from:from.id,to});
    if(end.phase!=="capture"||end.pendingCapture!.max<2)continue;
   }
   return {seed,start,ready,placements,from:from.id,to,first};
  }
 }
 throw Error("No bounded legal battle fixture for "+kind);
}
