import {expect,test,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {activePlayer,victoryRules} from '../../src/core/state';
import {createReferenceGame} from '../../src/core/reference-game';
import {referenceMap} from '../../src/core/reference-map';
import {apply} from '../../src/core/rules';
import * as policy from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {baseline031} from '../../tools/arena/frozen-031';
import {deserializeVersionedMatch,serializeVersionedMatch,REFERENCE_MATCH_IDENTITY} from '../../src/core/match-save';
import type {Action,GameOptions} from '../../src/core';
type Witness={options:GameOptions;actions:Action[];expected:{actions:number;computerActions:number;humanActions:number;winner:string}};
const read=(path:string)=>JSON.parse(readFileSync(new URL('../../'+path,import.meta.url),'utf8'));
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
function canonical(value:unknown):unknown {
 return Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,canonical(v)])):value;
}
test('historical conquest still replays to its accepted 0.3.0 state without invoking current AI',()=>{
 const old=read('fixtures/new-game/T33/fixtures/conquest.json') as Witness,expected=read('fixtures/new-game/T128/historical-conquest-compat.json');
 const host=vi.spyOn(policy,'computerAction').mockImplementation(()=>{throw Error('Replay invoked live policy');});
 const decision=vi.spyOn(policy,'decideComputerAction').mockImplementation(()=>{throw Error('Replay invoked decision policy');});
 try{
  const wire=serializeVersionedMatch(old.options,old.actions,REFERENCE_MATCH_IDENTITY),loaded=deserializeVersionedMatch(wire);
  expect(hash(wire)).toBe(expected.wireSha256);expect(hash(JSON.stringify(canonical(loaded.state)))).toBe(expected.canonicalStateSha256);
  expect(loaded.state.history).toHaveLength(expected.actions);expect(loaded.state.winner).toBe('seat1');expect(loaded.state.result!.reason).toBe('conquest');
  expect(host).not.toHaveBeenCalled();expect(decision).not.toHaveBeenCalled();
 }finally{decision.mockRestore();host.mockRestore();}
});
test('the preserved released-policy witness keeps its original decisions and every complete-game feature',()=>{
 const fixture=read('fixtures/new-game/T128/live-conquest-031.json') as Witness;
 const made=createReferenceGame(referenceMap,fixture.options,victoryRules(fixture.options));if(!made.ok)throw Error(made.errors.join());
 let state=made.state,human=0,computer=0;const seen=new Set<string>();
 for(const action of fixture.actions){
  if(activePlayer(state)!.kind==='computer'){expect(baseline031(computerView(state))).toEqual(action);const future=policy.computerAction(state);expect(future).not.toBeNull();expect(apply(state,future!).ok).toBe(true);computer++;}
  else {human++;seen.add(action.kind);}
  const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;
 }
 expect(state.history).toHaveLength(fixture.expected.actions);expect({human,computer}).toEqual({human:fixture.expected.humanActions,computer:fixture.expected.computerActions});
 for(const kind of ['reinforce','attack','captureMove','friendlyMove'])expect(seen.has(kind)).toBe(true);
 expect(state.phase).toBe('finished');expect(state.winner).toBe('seat1');expect(state.result!.reason).toBe('conquest');
 expect(state.map.provinces.every(p=>state.ownerOf[p.id]==='seat1')).toBe(true);
 const wire=serializeVersionedMatch(fixture.options,fixture.actions,REFERENCE_MATCH_IDENTITY);expect(deserializeVersionedMatch(wire).state).toEqual(state);
});
