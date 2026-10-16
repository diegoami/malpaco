import {describe,it,expect} from "vitest";
import {apply,activePlayer,DeterministicRng,friendlyMoveRules} from "../../src/core";
import type {Action,GameState} from "../../src/core";
import {position} from "./helpers";
import {frozen,total} from "./capture-choice-fixtures";
function step(s:GameState,a:Action){const r=apply(frozen(s),a);expect(r.ok).toBe(true);if(!r.ok)throw Error(r.error);return r.state;}

describe("friendly movement boundaries",()=>{
 it("defaults only an omitted quantity, refusing an explicit null",()=>{const s=position({sulo:["blue",5],frostkabo:["blue",3]},friendlyMoveRules()),before=structuredClone(s);expect(apply(frozen(s),{kind:"friendlyMove",from:"sulo",to:"frostkabo",amount:null} as unknown as Action).ok).toBe(false);expect(s).toEqual(before);});
 it("refuses an enemy source that has enough armies and a friendly adjacent destination",()=>{const s=position({sulo:["blue",5],frostkabo:["blue",3],longa_strando:["amber",5]},friendlyMoveRules()),before=structuredClone(s);expect(apply(frozen(s),{kind:"friendlyMove",from:"longa_strando",to:"sulo",amount:1}).ok).toBe(false);expect(s).toEqual(before);});
 it("finishes the transfer before conquest without advancing a seat or granting income",()=>{
  let s=position({sulo:["blue",5],frostkabo:["amber",1]},friendlyMoveRules(),0);for(const p of s.map.provinces)if(p.id!=="frostkabo")s.ownerOf[p.id]="blue";s.rng=new DeterministicRng(0).snapshot();
  s=step(s,{kind:"attack",from:"sulo",to:"frostkabo"});expect(s.players.find(p=>p.id==="amber")!.eliminated).toBe(true);s=step(s,{kind:"captureMove",amount:1});expect(s.winner).toBe("");const before=structuredClone(s);
  const done=step(s,{kind:"friendlyMove",from:"sulo",to:"frostkabo",amount:3});expect([done.armies["sulo"],done.armies["frostkabo"]]).toEqual([1,4]);expect(total(done)).toBe(total(before));expect(done.phase).toBe("finished");expect(done.winner).toBe("blue");expect(activePlayer(done)?.id).toBe("blue");expect(done.currentPlayer).toBe(before.currentPlayer);expect(done.turnNumber).toBe(before.turnNumber);expect(done.reinforcementPool).toBe(0);expect(done.rng).toEqual(before.rng);expect(done.log.filter(e=>e.event==="victory")).toHaveLength(1);expect(done.log.filter(e=>e.event==="turn_ended")).toHaveLength(0);
 });
});
