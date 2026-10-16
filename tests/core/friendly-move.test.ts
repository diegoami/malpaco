import {describe,it,expect} from "vitest";
import * as core from "../../src/core";
import type {Action,GameState,RuleSet} from "../../src/core";
import {position} from "./helpers";
import {frozen,total} from "./capture-choice-fixtures";

type Move={kind:"friendlyMove";from:string;to:string;amount?:number};
const api=core as typeof core & {friendlyMoveRules?:()=>RuleSet;friendlyTargets?:(s:GameState,from:string)=>string[]};
const rules=()=>api.friendlyMoveRules?.()??core.captureChoiceRules();
const move=(s:GameState,a:Move)=>core.apply(s,a as unknown as Action);
function initial(){return position({sulo:["blue",5],frostkabo:["blue",3],ventflanko:["blue",1],splito:["blue",2]},rules(),0);}
function valid(s=initial(),a:Move={kind:"friendlyMove",from:"sulo",to:"frostkabo",amount:1}){const r=move(frozen(s),a);expect(r.ok).toBe(true);if(!r.ok)throw Error(r.error);return r.state;}
const targets=(s:GameState,id:string)=>api.friendlyTargets?.(s,id)??[];

describe("one adjacent friendly move ending the turn",()=>{
 for(const [label,amount,source,target] of [["minimum",1,4,4],["middle",2,3,5],["maximum",4,1,7],["default",undefined,1,7]] as const)it(`moves ${label} and hands off exactly once`,()=>{
  const s=initial(),before=structuredClone(s),a:Move=amount===undefined?{kind:"friendlyMove",from:"sulo",to:"frostkabo"}:{kind:"friendlyMove",from:"sulo",to:"frostkabo",amount};
  const done=valid(s,a);expect(s).toEqual(before);expect([done.armies["sulo"],done.armies["frostkabo"]]).toEqual([source,target]);expect(total(done)).toBe(total(s));
  expect(done.ownerOf).toEqual(s.ownerOf);expect(done.rng).toEqual(s.rng);expect(done.computerRngs).toEqual(s.computerRngs);expect(done.productionCentres).toEqual(s.productionCentres);
  expect(core.activePlayer(done)?.id).toBe("amber");expect(done.phase).toBe("reinforce");expect(done.turnNumber).toBe(1);expect(done.reinforcementPool).toBe(core.reinforcementIncome(done,"amber").total);
  expect(done.history).toEqual([...s.history,a]);expect(done.log.filter(e=>e.event==="turn_ended")).toHaveLength(1);
  expect(move(done,a).ok).toBe(false);expect(core.apply(done,{kind:"attack",from:"sulo",to:"longa_strando"}).ok).toBe(false);
 });
 it("uses sea adjacency under exactly the same rule",()=>{const s=initial(),done=valid(s,{kind:"friendlyMove",from:"frostkabo",to:"splito",amount:2});expect([done.armies["frostkabo"],done.armies["splito"]]).toEqual([1,4]);expect(total(done)).toBe(total(s));});
 it("marks exactly owned neighbours with a movable source",()=>{valid();const s=initial();expect(targets(s,"sulo").sort()).toEqual(["frostkabo","ventflanko"]);expect(targets(s,"frostkabo").sort()).toEqual(["splito","sulo","ventflanko"].sort());expect(targets(s,"ventflanko")).toEqual([]);expect(targets(s,"longa_strando")).toEqual([]);expect(targets(s,"missing")).toEqual([]);});
 for(const amount of [0,-1,1.5,5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])it(`refuses quantity ${String(amount)} without state/RNG/history changes`,()=>{valid();const s=initial(),before=structuredClone(s);expect(move(frozen(s),{kind:"friendlyMove",from:"sulo",to:"frostkabo",amount}).ok).toBe(false);expect(s).toEqual(before);});
 for(const [from,to] of [["sulo","sulo"],["sulo","splito"],["sulo","longa_strando"],["ventflanko","sulo"],["longa_strando","sulo"],["missing","sulo"],["sulo","missing"]])it(`refuses ${from}→${to} including friendly paths without direct adjacency`,()=>{valid();const s=initial(),before=structuredClone(s);expect(move(frozen(s),{kind:"friendlyMove",from:from!,to:to!,amount:1}).ok).toBe(false);expect(s).toEqual(before);});
 for(const phase of ["reinforce","capture","redeploy","finished"] as const)it(`refuses during ${phase}`,()=>{valid();const s=initial();s.phase=phase;const before=structuredClone(s);expect(move(frozen(s),{kind:"friendlyMove",from:"sulo",to:"frostkabo",amount:1}).ok).toBe(false);expect(targets(s,"sulo")).toEqual([]);expect(s).toEqual(before);});
 it("requires capture confirmation before a newly captured country may move",()=>{
  valid();let s=position({sulo:["blue",5],frostkabo:["amber",1]},rules(),0);s.rng=new core.DeterministicRng(0).snapshot();const hit=core.apply(s,{kind:"attack",from:"sulo",to:"frostkabo"});expect(hit.ok).toBe(true);if(!hit.ok)throw Error(hit.error);s=hit.state;expect(s.phase).toBe("capture");
  expect(move(frozen(s),{kind:"friendlyMove",from:"sulo",to:"frostkabo",amount:1}).ok).toBe(false);
  const choice=core.apply(s,{kind:"captureMove",amount:2});if(!choice.ok)throw Error(choice.error);s=choice.state;
  const source=valid(s,{kind:"friendlyMove",from:"frostkabo",to:"sulo",amount:1});expect([source.armies["frostkabo"],source.armies["sulo"]]).toEqual([1,4]);
  const dest=valid(s,{kind:"friendlyMove",from:"sulo",to:"frostkabo",amount:1});expect([dest.armies["sulo"],dest.armies["frostkabo"]]).toEqual([2,3]);
 });
 it("preserves deterministic action replay",()=>{let s=initial();const a:Move={kind:"friendlyMove",from:"sulo",to:"frostkabo",amount:2};const done=valid(s,a);for(const action of done.history){const r=core.apply(s,action);if(!r.ok)throw Error(r.error);s=r.state;}expect(s).toEqual(done);});
 it("keeps movement opt-in and leaves old presets unchanged",()=>{valid();for(const preset of [core.classicRules(),core.malpacoRules(),core.captureChoiceRules()]){const s=position({sulo:["blue",5],frostkabo:["blue",3]},preset),before=structuredClone(s);expect(move(frozen(s),{kind:"friendlyMove",from:"sulo",to:"frostkabo",amount:1}).ok).toBe(false);expect(targets(s,"sulo")).toEqual([]);expect(s).toEqual(before);}});
 it("skips without moving armies or spending RNG",()=>{valid();const s=initial(),r=core.apply(frozen(s),{kind:"endTurn"});expect(r.ok).toBe(true);if(!r.ok)throw Error(r.error);expect(r.state.armies).toEqual(s.armies);expect(r.state.rng).toEqual(s.rng);expect(core.activePlayer(r.state)?.id).toBe("amber");expect(r.state.reinforcementPool).toBe(core.reinforcementIncome(r.state,"amber").total);});
 it("supports quantities above32bit without clipping",()=>{const s=initial();s.armies["sulo"]=4_294_967_300;const done=valid(s,{kind:"friendlyMove",from:"sulo",to:"frostkabo",amount:4_294_967_298});expect([done.armies["sulo"],done.armies["frostkabo"]]).toEqual([2,4_294_967_301]);expect(total(done)).toBe(total(s));});
});
