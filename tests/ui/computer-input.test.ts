import { expect, test } from "vitest";
import { activePlayer, apply } from "../../src/core";
import type { Action, GameState } from "../../src/core";
import { BattleController } from "../../src/ui/battleController";
import type { BattleScheduler, BattleView } from "../../src/ui/battleController";
import { deserializeVersionedMatch, serializeVersionedMatch, REFERENCE_MATCH_IDENTITY } from "../../src/core/match-save";
import { pinned } from "../core/versioned-match-fixture";
const Guarded = BattleController as new (s:GameState,scheduler:BattleScheduler,change?: (v:BattleView)=>void,allow?: (s:GameState)=>boolean)=>BattleController & {dispatchComputer?: (a:Action,revision?:number)=>boolean};
const scheduler:BattleScheduler={schedule:()=>1,cancel:()=>{}};
const allow=(s:GameState)=>activePlayer(s)?.kind==="human"||s.phase==="human-loss";
function computerPending(){const f=pinned("human-loss");let s=deserializeVersionedMatch(serializeVersionedMatch(f.options,[],REFERENCE_MATCH_IDENTITY)).state;for(const a of f.actions){const r=apply(s,a);if(!r.ok)throw Error(r.error);s=r.state;if(s.phase==="capture"&&activePlayer(s)!.kind==="computer")return s;}throw Error("missing computer capture");}
test("computer capture rejects direct human and detached commands; ordinary automated action is exact",()=>{
 const s=computerPending(),c=new Guarded(s,scheduler,undefined,allow);
 expect(c.confirmCapture(s.pendingCapture!.defaultAmount)).toBe(false);
 expect(c.select(null,null)).toBe(false);expect(c.startFriendlyMove()).toBe(false);
 expect(c.dispatch({kind:"endTurn"})).toBe(false);expect(c.fightOn()).toBe(false);
 const a:Action={kind:"captureMove"},expected=apply(s,a);if(!expected.ok)throw Error(expected.error);
 expect(c.dispatchComputer?.(a,c.view.revision)).toBe(true);expect(c.state).toEqual(expected.state);
 expect(c.setSpeed("fast")).toBe(true);
 expect(c.replaceGame(deserializeVersionedMatch(pinned("placement").text).state,"load")).toBe(true);
 const province=c.state.map.provinces.find(p=>c.state.ownerOf[p.id]===activePlayer(c.state)!.id)!.id;
 expect(c.dispatch({kind:"reinforce",province,amount:1})).toBe(true);
 expect(c.dispatchComputer?.({kind:"endReinforcement"})).toBe(false);
 c.dispose();expect(c.dispatchComputer?.(a)).toBe(false);
});
