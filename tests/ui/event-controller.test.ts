import {expect,test} from 'vitest';
import {WorldEventController} from '../../src/ui/eventController';
import {BattleController} from '../../src/ui/battleController';
import {defaultOptions} from '../../src/core/options';
import {islandRules} from '../../src/core/state';
import {createReferenceGame} from '../../src/core/reference-game';
import {referenceMap} from '../../src/core/reference-map';
import type {GameState,WorldEvent} from '../../src/core';
function fixture(allComputers=false){
 const o={...defaultOptions(),seed:7,islandRules:1 as const};const r=createReferenceGame(referenceMap,o,islandRules(o));if(!r.ok)throw Error(r.errors.join());
 const s=r.state;s.phase='attack';s.currentPlayer=1;s.turnNumber=3;if(allComputers)s.players.forEach(p=>Object.assign(p,{kind:'computer'}));
 const id=s.productionCentres[0]!,event:WorldEvent={kind:'harvest',sequence:1,round:3,afterSeat:'seat1',changes:[{id,armiesBefore:2,armiesAfter:4,ownerBefore:s.ownerOf[id]!,ownerAfter:s.ownerOf[id]!,centreBefore:true,centreAfter:true}],centresBefore:s.productionCentres,centresAfter:s.productionCentres};s.events={sequence:1,cooldown:true,lastKind:'harvest',latest:event};
 const b=new BattleController(s,{schedule:()=>1,cancel:()=>{}});return {b,s,event};
}
test('a human event blocks ordinary and computer actions; folding does not acknowledge or mutate core state',()=>{
 const {b,s,event}=fixture(),before=JSON.stringify(s),c=new WorldEventController(b,'seat1');c.update();expect(b.cardAcknowledgmentPending).toBe(true);expect(c.view.event).toEqual(event);expect(c.view.requiresAck).toBe(true);
 expect(b.dispatchComputer({kind:'endTurn'})).toBe(false);expect(b.dispatch({kind:'endTurn'})).toBe(false);expect(c.fold()).toBe(true);expect(c.view.folded).toBe(true);expect(c.view.requiresAck).toBe(true);expect(JSON.stringify(b.state)).toBe(before);
 c.unfold();expect(c.view.folded).toBe(false);
});
test('card reward and event acknowledgement gates are independent',()=>{
 const {b}=fixture();b.setCardRewardPending(true);const c=new WorldEventController(b,'seat1');c.update(true);expect(c.view.event).toBeNull();expect(b.cardAcknowledgmentPending).toBe(true);
 b.setCardRewardPending(false);c.update();expect(c.view.requiresAck).toBe(true);b.setCardRewardPending(false);expect(b.cardAcknowledgmentPending).toBe(true);expect(c.acknowledge(1)).toBe(true);expect(b.cardAcknowledgmentPending).toBe(false);
});
test('acknowledgement persists progress without resuming an explicitly paused game or drawing effects again',()=>{
 const {b,s,event}=fixture(),saved:{ack:number;cleared:number}[]=[],before=JSON.stringify(s);b.pauseUntilExplicitResume();const c=new WorldEventController(b,'seat1',undefined,p=>saved.push(p));c.update();expect(c.acknowledge(99)).toBe(false);expect(c.acknowledge(1)).toBe(true);expect(c.acknowledge(1)).toBe(false);expect(saved.at(-1)).toEqual({ack:1,cleared:0});expect(b.playbackPaused).toBe(true);expect(JSON.stringify(b.state)).toBe(before);expect(c.view.marked).toEqual(event.changes.map(c=>c.id));
 const restored=new WorldEventController(b,'seat1',saved.at(-1));restored.update();expect(restored.view.event).toBeNull();expect(restored.view.marked).toHaveLength(1);
 b.state.currentPlayer=0;restored.update();expect(restored.view.marked).toEqual([]);
});
test('pending presentation restores, all-computer viewing is passive, and absent/defeated humans never gate AI',()=>{
 const human=fixture(),pending=new WorldEventController(human.b,'seat1',{ack:0,cleared:0});pending.update();expect(pending.view.requiresAck).toBe(true);
 const ai=fixture(true),passive=new WorldEventController(ai.b,'');passive.update();expect(passive.view.event?.sequence).toBe(1);expect(passive.view.requiresAck).toBe(false);expect(ai.b.cardAcknowledgmentPending).toBe(false);
 human.s.players[0]!.eliminated=true;pending.update();expect(pending.view.requiresAck).toBe(false);expect(human.b.cardAcknowledgmentPending).toBe(false);
});
test('replacement and disposal retire stale acknowledgements; malformed future progress cannot suppress later events',()=>{
 const {b}=fixture(),c=new WorldEventController(b,'seat1',{ack:99,cleared:99});c.update();expect(c.view.requiresAck).toBe(false);
 b.state.events={...b.state.events!,sequence:2,latest:{...b.state.events!.latest!,sequence:2}};c.update();expect(c.view.requiresAck).toBe(true);
 const next=fixture().s;delete next.events;b.replaceGame(next,'new-game');c.update();expect(c.view.event).toBeNull();expect(c.acknowledge(2)).toBe(false);c.dispose();expect(c.acknowledge(1)).toBe(false);expect(b.cardAcknowledgmentPending).toBe(false);
});

test('terminal results never wait behind a historical event acknowledgement',()=>{const {b}=fixture(),c=new WorldEventController(b,'seat1');c.update();b.state.phase='finished';c.update();expect(c.view.event).toBeNull();expect(c.view.marked).toEqual([]);expect(b.cardAcknowledgmentPending).toBe(false);expect(c.acknowledge(1)).toBe(false);b.state.players[0]!.eliminated=true;b.state.phase='cards';b.state.watchingComputers=true;c.update();expect(c.view.event).toBeNull();});

import {GameEventHistory} from '../../src/ui/gameEventLog';
import {apply} from '../../src/core/rules';
test('history separates a friendly transfer from a harvest occurring in the same action',()=>{
 const o={...defaultOptions(),seed:7,islandRules:1 as const,eventFrequency:'Often' as const},made=createReferenceGame(referenceMap,o,islandRules(o));if(!made.ok)throw Error(made.errors.join());
 const s=made.state;s.phase='attack';s.reinforcementPool=0;s.currentPlayer=0;s.turnNumber=3;
 const from=s.map.provinces[0]!.id,to=s.map.provinces[0]!.borders[0]!;s.ownerOf[from]=s.players[0]!.id;s.ownerOf[to]=s.players[0]!.id;s.armies[from]=8;s.armies[to]=3;s.productionCentres=[to,...s.map.provinces.filter(p=>p.id!==to).slice(0,2).map(p=>p.id)];
 for(let value=0;value<1000;value++){
  s.rng={seed:7,state:value};const r=apply(s,{kind:'friendlyMove',from,to,amount:1});if(!r.ok)throw Error(r.error);
  if(r.state.events?.latest?.kind==='harvest'){
   const rows=new GameEventHistory(o,s).append(r.state),notes=rows.at(-1)!.notes;
   expect(notes.some(n=>n.startsWith('Friendly transfer: 1 armies'))).toBe(true);expect(notes.some(n=>n.includes('World event: harvest'))).toBe(true);expect(r.state.armies[to]).toBe(8);return;
  }
 }
 throw Error('No legal transfer/harvest fixture');
});

import {CardController} from '../../src/ui/cardController';
test('a pending world event visibly disables card plays without blocking a preceding card reward',()=>{
 const {b}=fixture();b.state.currentPlayer=0;b.state.phase='cards';const hand=b.state.cards!.hands['seat1']!;
 for(let n=0;n<3;n++){const index=b.state.cards!.drawPile.indexOf('Anchor');hand.push(b.state.cards!.drawPile.splice(index,1)[0]!);}
 const cards=new CardController(b,'seat1');expect(cards.view.sets.length).toBeGreaterThan(0);const world=new WorldEventController(b,'seat1');world.update();expect(cards.view.blocked).toBe(true);expect(b.worldEventAcknowledgmentPending).toBe(true);expect(world.acknowledge(1)).toBe(true);expect(cards.view.blocked).toBe(false);
});

test('explicit notice dismissal acknowledges once, preserves the native pause and rejects stale closes',()=>{
 const {b,s}=fixture(),before=JSON.stringify(s),saved:{ack:number;cleared:number}[]=[],c=new WorldEventController(b,'seat1',undefined,p=>saved.push(p));
 b.pauseUntilExplicitResume();c.update();expect(c.dismiss(99)).toBe(false);expect(c.dismiss(1)).toBe(true);expect(c.view.event).toBeNull();expect(b.cardAcknowledgmentPending).toBe(false);expect(b.playbackPaused).toBe(true);expect(JSON.stringify(b.state)).toBe(before);expect(c.dismiss(1)).toBe(false);expect(saved.at(-1)?.ack).toBe(1);
 const reloaded=new WorldEventController(b,'seat1',saved.at(-1));reloaded.update();expect(reloaded.view.event).toBeNull();c.dispose();expect(c.dismiss(1)).toBe(false);
});
test('closing a passive notice hides it without introducing an AI acknowledgement gate',()=>{
 const {b}=fixture(true),c=new WorldEventController(b,'');c.update();expect(c.view.event).not.toBeNull();expect(c.dismiss(1)).toBe(true);c.update();expect(c.view.event).toBeNull();expect(b.cardAcknowledgmentPending).toBe(false);
});
