import {describe,it,expect} from "vitest";
import {core,initial,capture,act,pending,total,frozen} from "./capture-choice-fixtures";
import type {ChoiceAction} from "./capture-choice-fixtures";
import type {Action} from "../../src/core";

describe("explicit total move-in choice",()=>{
 it("captures with one provisional army before a free quantity choice",()=>{
  const before=initial();const next=capture(frozen(before));pending(next);
  expect([next.armies["sulo"],next.armies["frostkabo"]]).toEqual([4,1]);
  expect(next.ownerOf["frostkabo"]).toBe("blue");expect(total(next)).toBe(total(before)-1);
  expect(next.productionCentres).toEqual(before.productionCentres);
  expect(next.log.at(-1)).toMatchObject({event:"attack",captured:true,moved:1,attackerRolls:[3],defenderRolls:[2]});
 });
 for(const [name,amount,source,target] of [["minimum",1,4,1],["middle",2,3,2],["maximum",4,1,4],["default",undefined,1,4]] as const){
  it(`selects ${name} as the total quantity without extra dice or lost armies`,()=>{
   const s=capture();pending(s);const before=structuredClone(s);const done=act(frozen(s),amount===undefined?{kind:"captureMove"}:{kind:"captureMove",amount});
   expect(s).toEqual(before);expect([done.armies["sulo"],done.armies["frostkabo"]]).toEqual([source,target]);
   expect(total(done)).toBe(total(s));expect(done.phase).toBe("attack");expect(done.pendingCapture??null).toBeNull();
   expect(done.rng).toEqual(s.rng);expect(done.computerRngs).toEqual(s.computerRngs);expect(done.productionCentres).toEqual(s.productionCentres);
   expect(done.history.at(-1)).toEqual(amount===undefined?{kind:"captureMove"}:{kind:"captureMove",amount});
  });
 }
 for(const amount of [0,-1,1.5,5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]){
  it(`refuses invalid quantity ${String(amount)} without mutation`,()=>{
   const s=capture();pending(s);const before=structuredClone(s);const r=core.apply(frozen(s),{kind:"captureMove",amount} as unknown as Action);
   expect(r.ok).toBe(false);expect(s).toEqual(before);
  });
 }
 it("gates every unrelated command while pending, including another captureMove after completion",()=>{
  const s=capture();pending(s);
  const actions:ChoiceAction[]=[{kind:"reinforce",province:"sulo",amount:1},{kind:"endReinforcement"},{kind:"attack",from:"sulo",to:"longa_strando"},{kind:"endTurn"}];
  for(const a of actions){const before=structuredClone(s);expect(core.apply(frozen(s),a as Action).ok).toBe(false);expect(s).toEqual(before);}
  expect(core.attackTargets(s,"sulo")).toEqual([]);expect(core.legalAttacks(s)).toEqual([]);
  const done=act(s,{kind:"captureMove"});const before=structuredClone(done);
  expect(core.apply(frozen(done),{kind:"captureMove",amount:1} as unknown as Action).ok).toBe(false);expect(done).toEqual(before);
 });
 it("still requires a choice when only one army can move",()=>{
  const s=capture(initial(2));pending(s,1);expect([s.armies["sulo"],s.armies["frostkabo"]]).toEqual([1,1]);
  expect(act(s,{kind:"captureMove"}).phase).toBe("attack");
 });
 it("does not clip a stack above32bit or move all of it before the choice",()=>{
  const stack=4_294_967_300,s=capture(initial(stack));pending(s,stack-1);
  expect(s.armies["sulo"]).toBe(stack-1);expect(s.armies["frostkabo"]).toBe(1);
  const done=act(s,{kind:"captureMove",amount:stack-2});expect([done.armies["sulo"],done.armies["frostkabo"]]).toEqual([2,stack-2]);expect(total(done)).toBe(total(s));
 });
 it("chains captures from the completed target using the same RNG stream",()=>{
  const start=initial();const first=act(capture(start),{kind:"captureMove"});
  const second=act(first,{kind:"attack",from:"frostkabo",to:"longa_strando"});expect(second.phase).toBe("capture");
  expect(second.pendingCapture).toMatchObject({from:"frostkabo",to:"longa_strando",min:1,max:3,defaultAmount:3});
  expect(second.log.at(-1)).toMatchObject({attackerRolls:[5],defenderRolls:[1]});
  const done=act(second,{kind:"captureMove",amount:2});expect([done.armies["sulo"],done.armies["frostkabo"],done.armies["longa_strando"]]).toEqual([1,2,2]);expect(total(done)).toBe(total(start)-2);
 });
 it("eliminates at capture but declares conquest only at end-turn after movement",()=>{
  const s=capture(initial(5,true));pending(s);expect(s.players.find(p=>p.id==="amber")!.eliminated).toBe(true);
  expect(s.log.filter(e=>e.event==="eliminated")).toHaveLength(1);expect(s.winner).toBe("");expect(s.log.filter(e=>e.event==="victory")).toHaveLength(0);
  const chosen=act(s,{kind:"captureMove",amount:1});expect(chosen.phase).toBe("attack");expect(chosen.winner).toBe("");
  const done=act(chosen,{kind:"endTurn"});expect(done.phase).toBe("finished");expect(done.winner).toBe("blue");expect(done.currentPlayer).toBe(0);expect(done.turnNumber).toBe(1);
  expect(done.log.filter(e=>e.event==="eliminated")).toHaveLength(1);expect(done.log.filter(e=>e.event==="victory")).toHaveLength(1);expect(done.productionCentres).toEqual(s.productionCentres);
 });
});
