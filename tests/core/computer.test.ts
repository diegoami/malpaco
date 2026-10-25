import { expect, test } from "vitest";
import { computerAction } from "../../src/core/computer";
import { deserializeMatch, serializeMatch } from "../../src/core";
import { mixedOpening, mixedOptions, passive, step } from "../helpers/computer";
function freeze(v:unknown):void {if(v&&typeof v==="object"){Object.freeze(v);Object.values(v).forEach(freeze);}}
for(const seed of [1,42,1994])for(const seats of [2,3,4])test(`deterministic legal immutable bounded turns ${seed}/${seats}`,()=>{
 let s=mixedOpening(seed,seats);const seen=new Set<string>();let attacks=0,handoffs=0,reinforcements=0;
 for(let turns=0;turns<seats*3;turns++){
  const mover=s.players[s.currentPlayer]!;const beforePlayer=s.currentPlayer;let count=0;
  do {
   const original=JSON.stringify(s);freeze(s);
   const a=computerAction(s);expect(computerAction(s)).toEqual(a);expect(JSON.stringify(s)).toBe(original);
   expect(a===null).toBe(mover.kind!=="computer");
   const action=a??passive(s);s=step(s,action);count++;
   if(a){seen.add(mover.id);if(a.kind==="attack")attacks++;if(a.kind==="endTurn")handoffs++;if(a.kind==="reinforce")reinforcements++;}
   expect(count).toBeLessThanOrEqual(s.map.provinces.length+3);
  }while(s.phase!=="finished"&&s.currentPlayer===beforePlayer);
  if(s.phase==="finished")break;
 }
 expect(seen.size).toBe(seats-1);expect(attacks).toBeGreaterThan(0);expect(handoffs).toBeGreaterThan(0);expect(reinforcements).toBeGreaterThan(0);
});
test("humans, eliminated, missing player and finished games have no action",()=>{
 const s=mixedOpening();expect(computerAction({...s,currentPlayer:0})).toBeNull();
 const c=s.players.findIndex(p=>p.kind==="computer");
 expect(computerAction({...s,currentPlayer:c,players:s.players.map((p,i)=>i===c?{...p,eliminated:true}:p)})).toBeNull();
 expect(computerAction({...s,currentPlayer:99})).toBeNull();expect(computerAction({...s,currentPlayer:c,phase:"finished",winner:s.players[c]!.id})).toBeNull();
});
test("mixed action-only replay and subsequent decisions match through computer victory",()=>{
 const options=mixedOptions(1994,3);let s=mixedOpening(1994,3),restored=s;let n=0,attacks=0;
 while(s.phase!=="finished"&&n++<12000){
  const action=computerAction(s)??passive(s);expect(computerAction(restored)??passive(restored)).toEqual(action);
  s=step(s,action);restored=step(restored,action);if(action.kind==="attack")attacks++;
  if(n===1||n%43===0||s.phase==="finished")restored=deserializeMatch(serializeMatch(options,s.history)).state;
  expect(restored).toEqual(s);
 }
 expect(n).toBeLessThan(12000);expect(attacks).toBeGreaterThan(0);expect(s.phase).toBe("finished");expect(s.players.find(p=>p.id===s.winner)!.kind).toBe("computer");expect(computerAction(s)).toBeNull();
// [designed] Whole-game search+replay timing matches the existing reference-flow
// budget;the12000-action and per-turn exchange assertions stay unchanged.
},60000);
