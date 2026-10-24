import {afterAll,expect,test} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {defaultOptions} from '../../src/core/options';
import type {GameOptions} from '../../src/core/options';
import {activePlayer,islandRules} from '../../src/core/state';
import {createGeographicGame} from '../../src/core/geographic-game';
import {apply} from '../../src/core/rules';
import {computerAction,decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {deserializeVersionedMatch,serializeVersionedMatch,GEOGRAPHIC_EVENT_MATCH_IDENTITY,GEOGRAPHIC_V3_EVENT_MATCH_IDENTITY} from '../../src/core/match-save';

function freeze(value:unknown):void {if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}}
const outcomes:unknown[]=[];
afterAll(()=>{const path=process.env['RESERVE_EVIDENCE_DIR']??'artifacts/T128/unit-matrix';mkdirSync(path,{recursive:true});writeFileSync(path+'/REPORT.json',JSON.stringify({budget:512,outcomes},null,2)+'\n');});
// [designed] A bounded regression diagnostic, not a game rule or finishing-rate claim.
for(const size of [46,72,96] as const)for(const opponents of [1,2,3])for(const seed of [0,7])test(`${size}/${opponents}/${seed}: legal immutable policy and exact saved continuation`,()=>{
 const options:GameOptions={...defaultOptions(),seed,islandRules:1,seats:[{kind:'human'},...Array.from({length:opponents},()=>({kind:'computer' as const}))],computerStrengths:Array.from({length:opponents},()=> 'Normal' as const),...(size===46?{}:{regionCount:size,names:'numbered'})};
 const made=createGeographicGame(options,islandRules(options),{},size===46?2:3);if(!made.ok)throw Error(made.errors.join());
 const identity=size===46?GEOGRAPHIC_EVENT_MATCH_IDENTITY:GEOGRAPHIC_V3_EVENT_MATCH_IDENTITY;
 let state=made.state,actions=0,transfers=0;
 try{
  while(actions<512&&!state.result){
   const view=computerView(state),before=JSON.stringify(view);freeze(view);
   const decision=decideComputerAction(view);expect(decideComputerAction(view)).toEqual(decision);expect(JSON.stringify(view)).toBe(before);expect(decision).not.toBeNull();
   if(activePlayer(state)?.kind==='computer')expect(computerAction(state)).toEqual(decision);else expect(computerAction(state)).toBeNull();
   if(decision!.kind==='friendlyMove'){
    expect(view.movePairs).toContainEqual(decision);transfers++;
    const source=view.countries.find(c=>c.id===decision!.from)!;
    expect(source.neighbours.every(id=>view.countries.find(c=>c.id===id)!.owner===view.playerId)).toBe(true);
   }
   const next=apply(state,decision!);if(!next.ok)throw Error(next.error);state=next.state;actions++;
   if(actions%128===0||state.result){
    const text=serializeVersionedMatch(options,state.history,identity),loaded=deserializeVersionedMatch(text);
    expect(loaded.state).toEqual(state);expect(serializeVersionedMatch(loaded.options,loaded.state.history,loaded.identity)).toBe(text);
    expect(decideComputerAction(computerView(loaded.state))).toEqual(decideComputerAction(computerView(state)));
   }
  }
 }finally{outcomes.push({size,opponents,seed,actions,transfers,status:state.phase==='finished'?'finished':state.phase==='human-loss'?'human-loss':'budget reached',turn:state.turnNumber,phase:state.phase});}
 const wire=serializeVersionedMatch(options,state.history,identity);expect(deserializeVersionedMatch(wire).state).toEqual(state);
},30000);
