import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {islandRules} from '../../src/core/state';
import {apply} from '../../src/core/rules';
import {computerView} from '../../src/core/computer-view';
import {decideComputerAction} from '../../src/core/computer';
import {GEOGRAPHIC_EVENT_MATCH_IDENTITY,serializeVersionedMatch} from '../../src/core/match-save';
import type {GameState,WorldEventKind} from '../../src/core';
const found=new Map<WorldEventKind,{state:GameState;text:string}>();
export function eventFixture(kind:WorldEventKind){
 if(!found.size)for(let seed=0;seed<40&&found.size<4;seed++){
  const options={...defaultOptions(),seed,islandRules:1 as const,eventFrequency:'Often' as const},r=createGeographicGame(options,islandRules(options),{},2);if(!r.ok)continue;let state=r.state;
  for(let n=0;n<3500&&!state.result&&found.size<4;n++){
   const prior=state.events?.sequence??0,action=decideComputerAction(computerView(state));if(!action)throw Error('no legal policy action');const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;
   const e=state.events?.latest;
   if(e&&(e.kind!=='storm'||e.changes.some(c=>c.armiesAfter<c.armiesBefore))&&e.sequence>prior&&!found.has(e.kind)&&state.players[state.currentPlayer]!.kind==='computer'&&state.players.some(p=>p.kind==='human'&&!p.eliminated))found.set(e.kind,{state,text:serializeVersionedMatch(options,state.history,GEOGRAPHIC_EVENT_MATCH_IDENTITY)});
  }
 }
 const result=found.get(kind);if(!result)throw Error('No ordinary '+kind+' fixture');return result;
}
