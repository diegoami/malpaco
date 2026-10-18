import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {apply,deserializeVersionedMatch} from '../../../../../src/core';
const owned='docs/prototypes/new-game/issue180/preflight';
test('derive legal ordinary-action prefix fixtures',()=>{
 const records=[];
 for(const file of ['geographic-raid-pending-one-human.json','T39-legal-pending-raid.json','T40-geographic-after-skip.json']){
  const text=readFileSync('docs/prototypes/new-game/T40/fixtures/'+file,'utf8'),v=JSON.parse(text),loaded=deserializeVersionedMatch(text);let state=loaded.initialState!;const found=new Map<string,any>();
  for(let i=0;i<v.actions.length;i++){
   const a=v.actions[i],human=state.players[state.currentPlayer]!.kind==='human',hand=state.cards?.hands[state.players[state.currentPlayer]!.id]??[];
   if(human&&((state.phase==='attack'&&a.kind==='attack')||state.phase==='capture')){
    const key=(state.phase==='capture'?'capture':hand.length?'attack-hand':'attack-empty');
    if(!found.has(key)||i>found.get(key).index)found.set(key,{index:i,action:a,hand,log:state.log.length});
   }
   const r=apply(state,a);if(!r.ok)throw Error(r.error);if(human&&a.kind==='attack'&&r.state.phase==='attack'&&r.state.armies[a.from]>2&&hand.length&&state.log.length>30)found.set('attack-running',{index:i,action:a,hand,log:state.log.length});state=r.state;
  }
  for(const [kind,row] of found){const name=file.replace('.json','')+'-'+kind+'.json',value={...v,actions:v.actions.slice(0,row.index)};deserializeVersionedMatch(JSON.stringify(value));writeFileSync(owned+'/fixtures/'+name,JSON.stringify(value,null,2)+'\n');records.push({source:file,fixture:name,kind,...row});}
 }
 writeFileSync(owned+'/discovery.json',JSON.stringify(records,null,2)+'\n');expect(records.length).toBeGreaterThan(0);
});
