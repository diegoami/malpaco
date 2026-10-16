import {describe,it,expect} from "vitest";
import {core,initial,capture,act,pending,total,frozen} from "./capture-choice-fixtures";
import type {Action} from "../../src/core";
import type {ChoiceAction,ChoiceState} from "./capture-choice-fixtures";

function replay(start:ChoiceState,actions:ChoiceAction[]){return JSON.parse(JSON.stringify(actions)).reduce((s:ChoiceState,a:ChoiceAction)=>act(s,a),start) as ChoiceState;}
describe("capture-choice action replay seam",()=>{
 it("refuses a tampered serialized quantity without accepting history or changing totals",()=>{
  const s=capture();pending(s);const before=structuredClone(s);
  const action=JSON.parse('{"kind":"captureMove","amount":5}') as Action;
  expect(core.apply(frozen(s),action).ok).toBe(false);expect(s).toEqual(before);expect(total(s)).toBe(total(before));
 });
 it("round-trips an action list ending in a pending choice",()=>{
  const start=initial(),a:ChoiceAction[]=[{kind:"attack",from:"sulo",to:"frostkabo"}];
  const expected=capture(start);pending(expected);expect(replay(frozen(start),a)).toEqual(expected);
  const restored=JSON.parse(JSON.stringify(expected)) as ChoiceState;expect(act(restored,{kind:"captureMove",amount:2})).toEqual(act(expected,{kind:"captureMove",amount:2}));
 });
 it("replays completed and chained choices exactly with hand-calculated conservation",()=>{
  const start=initial(),a:ChoiceAction[]=[{kind:"attack",from:"sulo",to:"frostkabo"},{kind:"captureMove"},{kind:"attack",from:"frostkabo",to:"longa_strando"},{kind:"captureMove",amount:2}];
  const live=a.reduce((s,a)=>act(s,a),start);expect(live.phase).toBe("attack");expect(live.history).toEqual(a);
  expect([live.armies["sulo"],live.armies["frostkabo"],live.armies["longa_strando"]]).toEqual([1,2,2]);expect(total(live)).toBe(total(start)-2);expect(replay(frozen(start),a)).toEqual(live);
 });
 it("retains decisive pending capture and final end-turn victory as separate replay actions",()=>{
  const start=initial(5,true),a:ChoiceAction[]=[{kind:"attack",from:"sulo",to:"frostkabo"},{kind:"captureMove",amount:1},{kind:"endTurn"}];
  const beforeEnd=replay(start,a.slice(0,2));expect(beforeEnd.winner).toBe("");expect(beforeEnd.phase).toBe("attack");
  const done=replay(start,a);expect(done.winner).toBe("blue");expect(done.phase).toBe("finished");expect(done.history).toEqual(a);expect(done.armies["sulo"]).toBe(4);expect(done.armies["frostkabo"]).toBe(1);
  expect(replay(JSON.parse(JSON.stringify(start)) as ChoiceState,JSON.parse(JSON.stringify(a)) as ChoiceAction[])).toEqual(done);
 });
});
