import { expect, test } from "vitest";
import { activePlayer, apply, computerAction, defaultOptions, victoryRules } from "../../src/core";
import type { Action, GameState } from "../../src/core";
import { createReferenceGame } from "../../src/core/reference-game";
import { referenceMap } from "../../src/core/reference-map";
import { deserializeVersionedMatch, serializeVersionedMatch, REFERENCE_MATCH_IDENTITY } from "../../src/core/match-save";
import { pinned } from "./versioned-match-fixture";
function step(s: GameState, a: Action): GameState { const r=apply(s,a); expect(r.ok,JSON.stringify(a)).toBe(true); if(!r.ok)throw Error(r.error); return r.state; }
function freeze(v:unknown):void {if(v&&typeof v==="object"&&!Object.isFrozen(v)){Object.freeze(v);Object.values(v).forEach(freeze);}}
for(const seed of [1,42,1994])for(const seats of [2,3,4])test(`complete bounded deterministic reference turns ${seed}/${seats}`,()=>{
 const options={...defaultOptions(),seed,seats:Array.from({length:seats},(_,i)=>({kind:i===0?"human" as const:"computer" as const})),computerStrengths:Array.from({length:seats-1},()=>"Normal" as const),dominationWin:false,roundLimit:20 as const};
 const start=createReferenceGame(referenceMap,options,victoryRules(options));if(!start.ok)throw Error(start.errors.join());
 let s=start.state,restored=s,count=0,actions=0,captures=0,moves=0;let previous=s.currentPlayer;
 while(s.phase!=="finished"&&actions<12000){
  const before=JSON.stringify(s);freeze(s);const chosen=computerAction(s);expect(computerAction(s)).toEqual(chosen);expect(JSON.stringify(s)).toBe(before);
  expect(computerAction(restored)).toEqual(chosen);
  let a:Action;
  if(s.phase==="human-loss") {expect(chosen).toBeNull();a={kind:"watchComputers"};}
  else if(activePlayer(s)!.kind==="human") {expect(chosen).toBeNull();a=s.phase==="reinforce"?(s.reinforcementPool?{kind:"reinforce",province:s.map.provinces.find(p=>s.ownerOf[p.id]===activePlayer(s)!.id)!.id,amount:s.reinforcementPool}:{kind:"endReinforcement"}):{kind:"endTurn"};}
  else {expect(chosen).not.toBeNull();a=chosen!;}
  s=step(s,a);restored=step(restored,a);actions++;count++;
  expect(count).toBeLessThanOrEqual(2*s.map.provinces.length+3);
  if(a.kind==="captureMove")captures++;if(a.kind==="friendlyMove")moves++;
  if(s.currentPlayer!==previous||a.kind==="watchComputers"||a.kind==="endTurn"||a.kind==="friendlyMove"){count=0;previous=s.currentPlayer;}
  if(actions%71===0||s.phase==="capture"||s.phase==="finished")restored=deserializeVersionedMatch(serializeVersionedMatch(options,s.history,REFERENCE_MATCH_IDENTITY)).state;
  expect(restored).toEqual(s);
 }
 expect(actions).toBeLessThan(12000);expect(s.phase).toBe("finished");expect(captures).toBeGreaterThan(0);expect(moves).toBeGreaterThan(0);expect(computerAction(s)).toBeNull();
},60000);
test("computer pending choices use an ordinary capture action and loss waits for consent",()=>{
 const loss=deserializeVersionedMatch(pinned("human-loss").text).state;
 expect(computerAction(loss)).toBeNull();
 let s=deserializeVersionedMatch(serializeVersionedMatch(pinned("human-loss").options,[],REFERENCE_MATCH_IDENTITY)).state;
 for(const a of loss.history){s=step(s,a);if(s.phase==="capture"&&activePlayer(s)!.kind==="computer")break;}
 expect(s.phase).toBe("capture");expect(computerAction(s)).toEqual({kind:"captureMove"});expect(step(s,computerAction(s)!).pendingCapture).toBeUndefined();
});
// Controlled pure-core position isolates policy movement; browser fixtures use ordinary histories.
function interior(){
 const f=pinned("move-ready"),s=deserializeVersionedMatch(f.text).state,me=activePlayer(s)!.id,enemy=s.players.find(p=>p.id!==me)!.id;
 const near=(id:string)=>{const p=s.map.provinces.find(p=>p.id===id)!;return [...p.borders,...p.seaLanes];};
 for(const e of s.map.provinces)for(const t of near(e.id))for(const source of near(t))if(source!==e.id&&!near(source).includes(e.id)){
  const state:GameState={...s,phase:"attack",history:[],rules:victoryRules({dominationWin:false,roundLimit:null}),watchingComputers:true,players:s.players.map(p=>({...p,kind:"computer"})),ownerOf:Object.fromEntries(s.map.provinces.map(p=>[p.id,p.id===e.id?enemy:me])),armies:Object.fromEntries(s.map.provinces.map(p=>[p.id,p.id===source?5:p.id===e.id?1000:1]))};
  return {state,source,target:t,enemy:e.id};
 }throw Error("Map needs an interior-frontier chain");
}
test("useful adjacent move leaves one army and ends the turn",()=>{
 const {state,source}=interior();const a=computerAction(state);expect(a?.kind).toBe("friendlyMove");if(a?.kind!=="friendlyMove")throw Error("expected move");expect(a.from).toBe(source);
 const next=step(state,a);expect(next.armies[source]).toBe(1);expect(next.currentPlayer).not.toBe(state.currentPlayer);
});
test("policy attack budget does not cap engine attacks and resets after a friendly handoff",()=>{
 const f=interior();let s={...f.state,armies:{...f.state.armies,[f.target]:500}};
 for(let i=0;i<s.map.provinces.length;i++)s=step(s,{kind:"attack",from:f.target,to:f.enemy});
 expect(apply(s,{kind:"attack",from:f.target,to:f.enemy}).ok).toBe(true);
 const a=computerAction(s);expect(a?.kind).toBe("friendlyMove");if(!a)throw Error("missing move");s=step(s,a);
 while(s.phase==="reinforce"){const a=computerAction(s);if(!a)throw Error("missing placement");s=step(s,a);}
 expect(computerAction(s)?.kind).toBe("attack");
 // Continue both seats through ordinary policy actions until the original mover returns.
 let count=0;while(s.currentPlayer!==f.state.currentPlayer&&count++<100){const a=computerAction(s);if(!a)throw Error("missing action");s=step(s,a);}
 while(s.phase==="reinforce"){const a=computerAction(s);if(!a)throw Error("missing placement");s=step(s,a);}
 expect(computerAction(s)?.kind).toBe("attack");
});
