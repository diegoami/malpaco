import * as core from "../../src/core";
import type {Action,AttackOutcome,GameState} from "../../src/core";
import {position} from "../core/helpers";

export type Speed="slow"|"normal"|"fast";
export interface Scheduler{schedule(callback:()=>void,delayMs:number):number;cancel(handle:number):void}
export interface Roll{attackerRolls:readonly number[];defenderRolls:readonly number[];results:readonly string[]}
export interface View{state:GameState;from:string|null;to:string|null;running:boolean;paused:boolean;threshold:number;effectiveThreshold:number;speed:Speed;revision:number;lastOutcome:AttackOutcome|null;rolls:readonly Roll[];ties:number;attackerWins:number;defenderWins:number;message:string}
export interface Controller{
 readonly state:GameState;readonly view:View;
 select(from:string|null,to:string|null,revision?:number):boolean;
 singleExchange(revision?:number):boolean;fightOn(revision?:number):boolean;stop(revision?:number):boolean;
 setThreshold(n:number,revision?:number):boolean;setSpeed(s:Speed,revision?:number):boolean;
 confirmCapture(n:number,revision?:number):boolean;dispatch(a:Action,revision?:number):boolean;
 replaceGame(s:GameState,reason:"load"|"new-game"):boolean;dispose():boolean;
}
export class Clock implements Scheduler{
 next=1;pending=new Map<number,{callback:()=>void;delay:number}>();
 schedule(callback:()=>void,delay:number){const id=this.next++;this.pending.set(id,{callback,delay});return id;}
 cancel(id:number){this.pending.delete(id);}
 tick(){const first=this.pending.entries().next().value as [number,{callback:()=>void;delay:number}]|undefined;if(!first)throw Error("no scheduled exchange");this.pending.delete(first[0]);first[1].callback();}
 flush(limit=1000){let n=0;while(this.pending.size){if(++n>limit)throw Error("timer did not terminate");this.tick();}}
}
export function battle(stack=20,defender=20,seed=0){const s=position({sulo:["blue",stack],frostkabo:["amber",defender]},core.captureChoiceRules(),seed);s.rng=new core.DeterministicRng(seed).snapshot();return s;}
export function deepFreeze<T>(o:T):T{if(o&&typeof o==="object"){Object.freeze(o);for(const v of Object.values(o))deepFreeze(v);}return o;}

// Preflight baseline: delegate a single exchange to the inherited engine. This
// deliberately has none of the missing battle automation/presentation behavior;
// it avoids treating a module-loader error as a behavioral negative.
class InheritedSingleExchange implements Controller{
 state:GameState;view:View;
 constructor(s:GameState,_clock:Scheduler,_onChange?:(v:View)=>void){this.state=s;this.view={state:s,from:null,to:null,running:false,paused:false,threshold:2,effectiveThreshold:1,speed:"normal",revision:0,lastOutcome:null,rolls:[],ties:0,attackerWins:0,defenderWins:0,message:""};}
 select(from:string|null,to:string|null){this.view={...this.view,from,to};return true;}
 singleExchange(){if(!this.view.from||!this.view.to)return false;return this.dispatch({kind:"attack",from:this.view.from,to:this.view.to});}
 fightOn(){return this.singleExchange();}stop(){return false;}
 setThreshold(_n:number){return false;}setSpeed(_s:Speed){return false;}confirmCapture(_n:number){return false;}
 dispatch(a:Action){const r=core.apply(this.state,a);if(!r.ok)return false;this.state=r.state;this.view={...this.view,state:r.state,lastOutcome:r.outcome};return true;}
 replaceGame(s:GameState,_reason:"load"|"new-game"){this.state=s;this.view={...this.view,state:s};return true;}dispose(){return false;}
}
const modules=import.meta.glob("../../src/ui/battleController.ts",{eager:true});
type Constructor=new(s:GameState,clock:Scheduler,onChange?:(v:View)=>void)=>Controller;
export const BattleController=((modules["../../src/ui/battleController.ts"] as {BattleController?:Constructor}|undefined)?.BattleController??InheritedSingleExchange) as Constructor;
export {core};
