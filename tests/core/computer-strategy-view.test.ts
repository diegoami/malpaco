import {expect,test} from 'vitest';
import * as core from '../../src/core';
import type {ComputerStrategicView} from '../../src/core/computer-view';
import {synthetic} from './computer-cards-fixtures';

const project=(state:core.GameState)=>core.computerView(state) as ComputerStrategicView;

test('strategic context contains only copied public rules, islands, capture and seat order',()=>{
 const initial=synthetic(['Anchor','Wild']);
 const state={...initial,rules:{...initial.rules,victoryOptions:{dominationWin:true,roundLimit:null}}};
 state.currentPlayer=2;state.roundOrigin=1;state.players[3]!.eliminated=true;
 state.phase='capture';state.pendingCapture={from:'province_1',to:'province_2',min:1,max:9,defaultAmount:9};
 state.capturedThisTurn=true;
 const context=project(state).strategy;
 expect(context).toBeDefined();
 expect(context).toEqual({
  islands:state.map.islands.map(i=>({id:i.id,bonus:i.bonus,provinces:[...i.provinces]})),
  combat:state.rules.combat,reinforcementDivisor:3,turnSequence:'reinforcement',
  turnOrder:[state.players[2]!.id,state.players[0]!.id,state.players[1]!.id],
  roundOrder:[state.players[1]!.id,state.players[2]!.id,state.players[3]!.id,state.players[0]!.id],
  round:state.turnNumber,roundLimit:state.rules.victoryOptions!.roundLimit,
  dominationTarget:35,capture:state.pendingCapture,capturedThisTurn:true,
 });
 const before=structuredClone(state);
 // Mutate every nested type added at the public boundary.
 const mutable=JSON.parse(JSON.stringify(context));
 // Use the real returned references, not a copied view, for the mutation proof.
 const actual=context as unknown as typeof mutable;
 actual.islands[0].provinces.push('changed');actual.islands[0].bonus=999;
 actual.combat.attackerDice.max=99;actual.combat.defenderDice.minus=99;
 actual.turnOrder.push('changed');actual.roundOrder.reverse();actual.capture.max=999;
 expect(state).toEqual(before);
});

test('legacy rules and missing mover normalize absent public context without inventing a victory option',()=>{
 const state={...synthetic([]),rules:core.classicRules()};delete state.pendingCapture;
 const context=project(state).strategy;
 expect(context).toBeDefined();
 expect(context).toMatchObject({turnSequence:'classic',reinforcementDivisor:3,roundLimit:null,dominationTarget:null,capture:null});
 expect(project({...state,currentPlayer:999}).strategy.turnOrder).toEqual([]);
});

for(const hidden of ['enemy-hand','draw-pile','game-rng','computer-rng','seat-kind'] as const)test(`${hidden} independently cannot change the strategic view or baseline decision`,()=>{
 const state=synthetic(['Anchor','Wild']);
 const own=core.activePlayer(state)!.id,enemy=state.players.find(p=>p.id!==own)!;
 state.cards!.hands[enemy.id]=['Compass'];
 const before=project(state),action=core.computerAction(state),changed=structuredClone(state);
 if(hidden==='enemy-hand')changed.cards!.hands[enemy.id]=['Lantern'];
 if(hidden==='draw-pile')changed.cards!.drawPile.reverse();
 if(hidden==='game-rng')changed.rng={seed:99,state:123};
 if(hidden==='computer-rng')for(const id of Object.keys(changed.computerRngs))changed.computerRngs[id]={seed:99,state:123};
 if(hidden==='seat-kind')changed.players.splice(0,changed.players.length,...changed.players.map(p=>p.id===own?p:{...p,kind:'human' as const}));
 expect(project(changed).strategy).toBeDefined();
 expect(project(changed)).toEqual(before);expect(core.computerAction(changed)).toEqual(action);
});

test('poisoned private contents, stream getters and other controller getters are never touched',()=>{
 const state=synthetic(['Compass','Compass','Compass']),own=core.activePlayer(state)!.id;
 const expected=project(state),action=core.computerAction(state);
 const contents=(cards:core.CardKind[])=>new Proxy(cards,{get(target,key,receiver){
  if(key===Symbol.iterator||typeof key==='string'&&/^\d+$/.test(key))throw Error('hidden contents read');
  return Reflect.get(target,key,receiver);
 }});
 state.cards!.drawPile=contents(state.cards!.drawPile);
 for(const p of state.players)if(p.id!==own){state.cards!.hands[p.id]=contents(state.cards!.hands[p.id]!);Object.defineProperty(p,'kind',{get(){throw Error('other controller read');}});}
 for(const key of ['rng','computerRngs'] as const)Object.defineProperty(state,key,{get(){throw Error('private stream read');}});
 expect(project(state).strategy).toBeDefined();expect(project(state)).toEqual(expected);expect(core.computerAction(state)).toEqual(action);
});

test('public rule context leaves the retained script fixed while informing improved placement',()=>{
 let state=synthetic([]);state.phase='reinforce';
 const action=core.decideComputerAction(project(state));
 state={...state,rules:{...state.rules,reinforcementDivisor:7,combat:{...state.rules.combat,ties:'defender'},victoryOptions:{dominationWin:false,roundLimit:20}}};
 expect(project(state).strategy).toBeDefined();
 expect(project(state).strategy).toMatchObject({reinforcementDivisor:7,combat:{ties:'defender'},dominationTarget:null,roundLimit:20});
 expect(core.decideComputerAction(project(state))).toEqual(action);
 expect(core.computerAction(state)).toEqual(core.decideTacticalAction(project(state)));
});
