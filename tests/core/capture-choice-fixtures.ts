import { expect } from "vitest";
import * as core from "../../src/core";
import type { Action, GameState, RuleSet } from "../../src/core";
import { position } from "./helpers";

export interface PendingCapture { from:string; to:string; min:number; max:number; defaultAmount:number }
export type ChoiceState = GameState & { pendingCapture?:PendingCapture|null };
export type ChoiceAction = Action | { kind:"captureMove"; amount?:number };

// The fallback makes preflight exercise the actual inherited automatic transfer,
// rather than failing merely because the new export has not been installed.
export function choiceRules():RuleSet {
 const api=core as typeof core & {captureChoiceRules?:()=>RuleSet};
 return api.captureChoiceRules?.()??core.malpacoRules();
}
export function initial(stack=5,decisive=false):ChoiceState {
 const s=position({sulo:["blue",stack],frostkabo:["amber",1]},choiceRules(),0);
 if(decisive)for(const p of s.map.provinces)s.ownerOf[p.id]=p.id==="frostkabo"?"amber":"blue";
 s.rng=new core.DeterministicRng(0).snapshot(); // First exchanges:3>2,5>1.
 s.productionCentres=["sulo","frostkabo","longa_strando"];
 return s;
}
export function act(s:ChoiceState,a:ChoiceAction):ChoiceState {
 const r=core.apply(s,a as Action);expect(r.ok).toBe(true);
 if(!r.ok)throw new Error(r.error);return r.state;
}
export function capture(s=initial()):ChoiceState {
 const before=structuredClone(s);const next=act(s,{kind:"attack",from:"sulo",to:"frostkabo"});
 expect(s).toEqual(before);return next;
}
export function pending(s:ChoiceState,max=4){
 expect(s.phase).toBe("capture");
 expect(s.pendingCapture).toMatchObject({from:"sulo",to:"frostkabo",min:1,max,defaultAmount:max});
}
export function total(s:GameState){return Object.values(s.armies).reduce((a,b)=>a+b,0);}
export function frozen<T>(value:T):T {
 if(value&&typeof value==="object"){Object.freeze(value);for(const child of Object.values(value))frozen(child);}return value;
}
export {core};
