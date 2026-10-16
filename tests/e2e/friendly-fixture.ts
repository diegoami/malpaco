import * as core from "../../src/core";
import type {Action,GameState,RuleSet} from "../../src/core";
import {createReferenceGame} from "../../src/core/reference-game";
import {map,fixture as battleFixture} from "./battle-fixture";
export {map};
export type Move={kind:"friendlyMove";from:string;to:string;amount?:number};
export const friendlyRules=()=> (core as typeof core & {friendlyMoveRules?:()=>RuleSet}).friendlyMoveRules?.()??core.captureChoiceRules();
export function step(s:GameState,a:Action|Move){const r=core.apply(s,a as Action);if(!r.ok)throw Error(r.error);return r.state;}
export function targets(s:GameState,from:string){const p=map.provinces.find(p=>p.id===from);return p&&s.armies[from]!>1?[...p.borders,...p.seaLanes].filter(id=>s.ownerOf[id]===s.players[s.currentPlayer]!.id):[];}
export function opening(seed:number){const r=createReferenceGame(map,{...core.defaultOptions(),seed,seats:[{kind:"human"},{kind:"human"}],computerStrengths:[]},friendlyRules());if(!r.ok)throw Error(r.errors.join(";"));return r.state;}
export function fixture(capture=false){
 if(capture){const b=battleFixture("capture"),start=opening(b.seed);let ready=start;for(let n=0;n<b.placements;n++)ready=step(ready,{kind:"reinforce",province:b.from,amount:1});ready=step(ready,{kind:"endReinforcement"});return {seed:b.seed,start,ready,placements:b.placements,from:b.from,to:b.to};}
 for(let seed=0;seed<64;seed++){
  const start=opening(seed),mover=start.players[start.currentPlayer]!.id;
  for(const from of map.provinces.filter(p=>start.ownerOf[p.id]===mover)){
   const to=[...from.borders,...from.seaLanes].find(id=>start.ownerOf[id]===mover);if(!to)continue;
   let ready=start;const placements=ready.reinforcementPool;for(let n=0;n<placements;n++)ready=step(ready,{kind:"reinforce",province:from.id,amount:1});ready=step(ready,{kind:"endReinforcement"});
   if(ready.armies[from.id]!>2)return {seed,start,ready,placements,from:from.id,to};
  }
 }
 throw Error("No bounded legal friendly pair");
}

/** [designed] Bounded search for a legal source with both own and enemy sea links. */
export function seaFixture(){
 for(let seed=0;seed<64;seed++){
  const start=opening(seed),mover=start.players[start.currentPlayer]!.id;
  for(const from of map.provinces.filter(p=>start.ownerOf[p.id]===mover)){
   const to=from.seaLanes.find(id=>start.ownerOf[id]===mover);if(!to||!from.seaLanes.some(id=>start.ownerOf[id]!==mover))continue;
   let ready=start;const placements=ready.reinforcementPool;for(let n=0;n<placements;n++)ready=step(ready,{kind:"reinforce",province:from.id,amount:1});ready=step(ready,{kind:"endReinforcement"});return {seed,start,ready,placements,from:from.id,to};
  }
 }
 throw Error("No bounded mixed-ownership sea source");
}
