import {readFileSync} from 'node:fs';
import {expect} from '@playwright/test';
import * as c from '../../src/core';
import type {Action,GameState,LoadedVersionedMatch} from '../../src/core';
const root='docs/prototypes/new-game/T41/parent-acceptance/proposed-browser/fixtures';
export const input=(name:string)=>readFileSync(`${root}/${name}.json`,'utf8');
export const fixture=(name:string)=>c.deserializeVersionedMatch(input(name));
export function step(s:GameState,a:Action){const r=c.apply(s,a);if(!r.ok)throw Error(`Ordinary action rejected ${JSON.stringify(a)}: ${r.error}`);return r.state;}
export function prefix(loaded:LoadedVersionedMatch,count:number){return c.serializeVersionedMatch(loaded.options,loaded.state.history.slice(0,count),loaded.identity);}
/** Scan only recorded actions. No policy invocation or new play/search. */
function lastRecordedHumanHandoff(loaded:LoadedVersionedMatch){let s=loaded.initialState;expect(s).toBeDefined();let count=-1;
 for(let i=0;i<loaded.state.history.length;i++){const human=c.activePlayer(s!)!.kind==='human',after=step(s!,loaded.state.history[i]!);if(human&&c.activePlayer(after)?.kind==='computer')count=i+1;s=after;}
 expect(count).toBeGreaterThan(0);const text=prefix(loaded,count);return {loaded:c.deserializeVersionedMatch(text),text,known:loaded.state.history};}
export function lastHumanHandoff(){return {...lastRecordedHumanHandoff(fixture('policy-raid-before')),known:fixture('policy-raid-after').state.history};}
export function humanReturnHandoff(){return lastRecordedHumanHandoff(fixture('mixed-discardCard-607'));}
export function discardPrefix(){const loaded=fixture('mixed-discardCard-607');expect(loaded.state.history.at(-1)).toEqual({kind:'discardCard',handIndex:0});const text=prefix(loaded,loaded.state.history.length-1),pending=c.deserializeVersionedMatch(text);expect(pending.state.cards!.pendingDiscard).toBeDefined();expect(c.activePlayer(pending.state)!.kind).toBe('computer');return {loaded:pending,text};}
export function spectator(){const envelope=JSON.parse(input('policy-raid-pending'));expect(envelope.options.humanShare).toBe(0);envelope.options.seats=envelope.options.seats.map(()=>({kind:'computer'}));envelope.options.computerStrengths=['Normal','Normal','Normal','Normal'];const text=JSON.stringify(envelope);return {text,loaded:c.deserializeVersionedMatch(text)};}
/** Ordinary auto-pass that fixed-human CardController performs synchronously. */
export function settleNoSet(s:GameState):GameState{
 const own=c.activePlayer(s);if(own?.kind!=='human'||s.phase!=='cards'||s.cards?.pendingRaid||s.cards?.pendingDiscard)return s;
 const h=s.cards!.hands[own.id]!;
 for(let a=0;a<h.length;a++)for(let b=a+1;b<h.length;b++)for(let d=b+1;d<h.length;d++)if(c.apply(s,{kind:'tradeCards',handIndices:[a,b,d]}).ok)return s;
 return step(s,{kind:'skipCards'});
}
