import {describe,it,expect} from "vitest";
import raw from "../../fixtures/new-game/T63/board.json";
import {createReferenceGame} from "../../src/core/reference-game";
import {apply,defaultOptions,reinforcementIncome,neighbours} from "../../src/core";
import type {GameMap,GameOptions,Province} from "../../src/core";
import {nextAction,policyFor,ACTION_BUDGET} from "../helpers/complete-game";
const fixture:GameMap={id:"reference-coast-first-a",name:"Nine Isles",bounds:raw.bounds,provinces:raw.provinces as unknown as readonly Province[],islands:raw.islands};
const options=(seed=1994):GameOptions=>({...defaultOptions(),seed,seats:[{kind:"human"},{kind:"human"}],computerStrengths:[]});
function frozen<T>(value:T):T{if(value&&typeof value==="object"){for(const child of Object.values(value))frozen(child);Object.freeze(value);}return value;}
function start(seed=1994){const r=createReferenceGame(fixture,options(seed));if(!r.ok)throw Error(r.errors.join(";"));return r.state;}
describe("approved A reference game",()=>{
 it("uses the supplied geometry/topology rather than generating another board",()=>{
  const state=start();expect(state.map).toEqual(fixture);expect(state.map.provinces).toEqual(raw.provinces);
  for(const p of state.map.provinces)expect(neighbours(p)).toEqual([...p.borders,...p.seaLanes]);
 });
 it("seeded deal is deterministic, balanced, repaired and uses the existing income rule",()=>{
  const a=start(),b=start();expect(a.map).toEqual(fixture);expect(a).toEqual(b);expect(start(1995).ownerOf).not.toEqual(a.ownerOf);
  for(const player of a.players){const ids=a.map.provinces.filter(p=>a.ownerOf[p.id]===player.id).map(p=>p.id);expect(ids).toHaveLength(23);expect(ids.reduce((n,id)=>n+a.armies[id]!,0)).toBe(46);}
  for(const i of a.map.islands)expect(new Set(i.provinces.map(id=>a.ownerOf[id])).size).toBeGreaterThan(1);
  expect(a.productionCentres).toHaveLength(3);expect(new Set(a.productionCentres).size).toBe(3);
  expect(a.reinforcementPool).toBe(reinforcementIncome(a,a.players[a.currentPlayer]!.id).total);
 });
 it("ordinary apply actions place income, attack, hand off and legally reach conquest without input mutation",()=>{
  const map=frozen(structuredClone(fixture)),opts=frozen(options()),before=JSON.stringify({map,opts});
  const r=createReferenceGame(map,opts);if(!r.ok)throw Error(r.errors.join(";"));
  expect(r.state.map).toEqual(map);
  const initial=frozen(r.state),initialBytes=JSON.stringify(initial),policy=policyFor(initial);
  let state=initial,actions=0,attacks=0,handoffs=0,placements=0,captures=0;
  while(state.phase!=="finished"&&actions<ACTION_BUDGET){
   const action=nextAction(state,policy),result=apply(state,action);expect(result.ok).toBe(true);if(!result.ok)throw Error(result.error);
   if(action.kind==="attack"){attacks++;if(result.outcome?.captured)captures++;}
   if(action.kind==="endTurn")handoffs++;if(action.kind==="reinforce")placements++;
   state=result.state;actions++;
  }
  console.log(JSON.stringify({seed:1994,actions,attacks,captures,handoffs,placements,winner:state.winner}));
  expect(actions).toBeLessThan(ACTION_BUDGET);expect(attacks).toBeGreaterThan(0);expect(captures).toBeGreaterThan(0);expect(handoffs).toBeGreaterThan(0);expect(placements).toBeGreaterThan(0);
  expect(state.phase).toBe("finished");expect(state.winner).toBe(policy.conqueror);expect(new Set(Object.values(state.ownerOf))).toEqual(new Set([state.winner]));
  expect(apply(state,{kind:"endTurn"}).ok).toBe(false);
  expect(JSON.stringify({map,opts})).toBe(before);expect(JSON.stringify(initial)).toBe(initialBytes);
 });
});
