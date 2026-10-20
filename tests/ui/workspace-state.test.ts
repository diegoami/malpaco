import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import * as core from '../../src/core';
import type {GameState} from '../../src/core';
import {BattleController} from '../../src/ui/battleController';
import {CardController} from '../../src/ui/cardController';
import type {CardControllerView} from '../../src/ui/cardController';
import {Clock,deepFreeze} from './battle-fixtures';

// Main-authored boundary. Missing implementation exercises a no-op inherited
// adapter; red failures must describe behavior rather than module resolution.
interface Workspace {
 camera:{x:number;y:number;zoom:number};surface:string|null;
 histories:{battle:{scrollTop:number;followLatest:boolean};events:{scrollTop:number;followLatest:boolean}};
 drafts:{capture:string;move:string;threshold:string};focus:string|null;matchGeneration:number;
 attack:{from:string|null;to:string|null;confirmed:boolean};
}
interface Context {matchGeneration:number;from:string|null;to:string|null}
interface Projection {matchGeneration:number;revision:number;from:string|null;to:string|null;mode:string;phase:string;paused:boolean;speed:string;cards:CardControllerView}
interface Boundary {
 createWorkspaceState:()=>Workspace;
 updateWorkspaceState:(s:Workspace,p:Partial<Workspace>)=>Workspace;
 reconcileWorkspace:(s:Workspace,c:Context)=>Workspace;
 projectWorkspace:(b:BattleController,c:CardControllerView)=>Projection;
}
const defaults=():Workspace=>({camera:{x:0,y:0,zoom:1},surface:null,histories:{battle:{scrollTop:0,followLatest:true},events:{scrollTop:0,followLatest:true}},drafts:{capture:'',move:'',threshold:''},focus:null,matchGeneration:0,attack:{from:null,to:null,confirmed:false}});
const modules=import.meta.glob('../../src/ui/workspaceState.ts',{eager:true});
const inherited:Boundary={createWorkspaceState:defaults,updateWorkspaceState:s=>s,reconcileWorkspace:s=>s,projectWorkspace:()=>({matchGeneration:-1,revision:-1,from:null,to:null,mode:'',phase:'',paused:false,speed:'',cards:{} as CardControllerView})};
const api=(modules['../../src/ui/workspaceState.ts']??inherited) as Boundary;
const context=(from:string|null='province_1',to:string|null='province_2',matchGeneration=0):Context=>({from,to,matchGeneration});
function customized():Workspace{return {...defaults(),camera:{x:42,y:-18,zoom:2.5},surface:'cards',histories:{battle:{scrollTop:120,followLatest:false},events:{scrollTop:70,followLatest:false}},drafts:{capture:'-',move:'3e',threshold:'999999999999999999999'},focus:'attack-button',attack:{from:'province_1',to:'province_2',confirmed:true}};}
function raw(name:string){return JSON.parse(readFileSync(`fixtures/new-game/T40/fixtures/${name}.json`,'utf8')) as {actions:core.Action[]};}
function loaded(name:string){return core.deserializeVersionedMatch(JSON.stringify(raw(name))).state;}
function prefix(name:string,kind:string,include=false):GameState {
 const file=raw(name),i=file.actions.findIndex(a=>a.kind===kind);if(i<0)throw Error(`fixture missing ${kind}`);
 return core.deserializeVersionedMatch(JSON.stringify({...file,actions:file.actions.slice(0,i+(include?1:0))})).state;
}
function legalFixtures(){return [
 {name:'placement',state:loaded('geographic-income-after'),phase:'reinforce'},
 {name:'combat',state:prefix('T37-decisive-match','endReinforcement',true),phase:'attack'},
 {name:'capture',state:prefix('T37-decisive-match','captureMove'),phase:'capture'},
 {name:'friendly movement',state:prefix('T37-decisive-match','captureMove',true),phase:'attack',move:true},
 {name:'cards',state:loaded('T39-legal-before-trade'),phase:'cards'},
 {name:'result',state:loaded('T37-decisive-match'),phase:'finished',result:true},
 ];}

describe('T78 workspace state boundary',()=>{
 it('creates isolated defaults without game-state ownership',()=>{
  const a=api.createWorkspaceState(),b=api.createWorkspaceState();expect(a).toEqual(defaults());
  a.camera.x=9;a.histories.battle.scrollTop=20;a.drafts.move='-';expect(b).toEqual(defaults());
  expect(a).not.toHaveProperty('state');expect(a).not.toHaveProperty('history');expect(a).not.toHaveProperty('rng');
 });
 it('preserves invalid drafts, camera, histories and focus through surface/layout round trips',()=>{
  const input=deepFreeze(customized()),before=structuredClone(input);
  const hidden=api.updateWorkspaceState(input,{surface:null});expect(hidden.surface).toBeNull();
  const restored=api.updateWorkspaceState(hidden,{surface:'cards'});expect(restored).toEqual(before);expect(input).toEqual(before);
  expect(api.reconcileWorkspace(restored,context())).toEqual(before);
 });
 it('detaches patches and returned nested state instead of sharing mutable ownership',()=>{
  const original=customized(),patch={camera:{x:7,y:8,zoom:3},drafts:{capture:'NaN',move:'',threshold:'-'}};
  const next=api.updateWorkspaceState(original,patch);expect(next.camera).toEqual(patch.camera);expect(next.drafts).toEqual(patch.drafts);
  next.camera.x=900;next.histories.events.scrollTop=999;next.drafts.move='changed';
  expect(patch.camera.x).toBe(7);expect(patch.drafts.move).toBe('');expect(original).toEqual(customized());
 });
 for(const [label,c] of [['source',context('province_3')],['target',context('province_1','province_4')],['cleared source',context(null)],['cleared target',context('province_1',null)]] as const)
 it(`invalidates confirmation when ${label} changes without disturbing other same-match UI`,()=>{
  const s=deepFreeze(customized()),next=api.reconcileWorkspace(s,c);
  expect(next.attack).toEqual({from:c.from,to:c.to,confirmed:false});expect(next.camera).toEqual(s.camera);expect(next.drafts).toEqual(s.drafts);expect(s).toEqual(customized());
 });
 it('does not retain confirmation for an incomplete unchanged pair',()=>{
  const s={...customized(),attack:{from:'province_1',to:null,confirmed:true}};
  expect(api.reconcileWorkspace(s,context('province_1',null)).attack.confirmed).toBe(false);
 });
 it('clears stale match drafts and confirmation even when a replacement has the same pair',()=>{
  const s=deepFreeze(customized()),next=api.reconcileWorkspace(s,context('province_1','province_2',1));
  expect(next).toEqual({...defaults(),matchGeneration:1,attack:{from:'province_1',to:'province_2',confirmed:false}});
 });
 for(const fixture of legalFixtures())it(`round-trips ${fixture.name} from real versioned replay without changing core/history/RNG`,()=>{
  const {state}=fixture;expect(state.phase).toBe(fixture.phase);if(fixture.result)expect(state.result).toBeDefined();
  const clock=new Clock(),battle=new BattleController(state,clock),viewer=core.activePlayer(state)?.id??'',cards=new CardController(battle,viewer);
  if(fixture.move)expect(battle.startFriendlyMove()).toBe(true);
  const before=structuredClone(state),battleBefore=structuredClone(battle.view),cardBefore=cards.view;
  const projection=api.projectWorkspace(battle,cardBefore);
  expect(projection).toEqual({matchGeneration:battle.gameGeneration,revision:battle.view.revision,from:battle.view.from,to:battle.view.to,mode:battle.view.mode,phase:state.phase,paused:battle.playbackPaused,speed:battle.view.speed,cards:cardBefore});
  let ui=api.reconcileWorkspace(api.createWorkspaceState(),{matchGeneration:projection.matchGeneration,from:projection.from,to:projection.to});
  ui=api.updateWorkspaceState(ui,{camera:{x:20,y:30,zoom:2},surface:'events',drafts:{capture:'-',move:'3e',threshold:''}});
  ui=api.reconcileWorkspace(ui,{matchGeneration:projection.matchGeneration,from:projection.from,to:projection.to});
  expect(ui.drafts).toEqual({capture:'-',move:'3e',threshold:''});expect(ui.camera).toEqual({x:20,y:30,zoom:2});
  expect(battle.state).toBe(state);expect(state).toEqual(before);expect(state.history).toEqual(before.history);expect(state.rng).toEqual(before.rng);expect(battle.view).toEqual(battleBefore);expect(cards.view).toEqual(cardBefore);expect(clock.pending.size).toBe(0);
  cards.dispose();battle.dispose();
 });
 it('adapts selection, global pause, speed and generation without retaining the live core',()=>{
  const state=prefix('T37-decisive-match','captureMove',true),battle=new BattleController(state,new Clock()),cards=new CardController(battle,core.activePlayer(state)!.id);
  const source=core.friendlySources(state)[0]!;expect(source).toBeDefined();expect(battle.startFriendlyMove()).toBe(true);expect(battle.select(source,null)).toBe(true);
  battle.setPlaybackPaused(true);battle.setSpeed('very-slow');
  const p=api.projectWorkspace(battle,cards.view);expect(p.paused).toBe(true);expect(p.speed).toBe('very-slow');expect(p.from).toBe(source);expect(p.mode).toBe('move');
  expect(p).not.toHaveProperty('state');expect(p).not.toHaveProperty('history');expect(p).not.toHaveProperty('rng');
  expect(battle.replaceGame(structuredClone(state),'load')).toBe(true);expect(api.projectWorkspace(battle,cards.view).matchGeneration).toBe(battle.gameGeneration);expect(battle.gameGeneration).toBeGreaterThan(p.matchGeneration);
  cards.dispose();battle.dispose();
 });
 it('projects only public card fields and detaches nested offered sets and hand counts',()=>{
  const state=loaded('T39-legal-before-trade'),viewer=core.activePlayer(state)!.id,battle=new BattleController(state,new Clock()),cards=new CardController(battle,viewer);
  const forbidden=(value:core.CardKind[])=>new Proxy(value,{get(target,key,receiver){if(key===Symbol.iterator||typeof key==='string'&&/^\d+$/.test(key))throw Error('private contents read');return Reflect.get(target,key,receiver);}});
  for(const player of state.players)if(player.id!==viewer)state.cards!.hands[player.id]=forbidden(state.cards!.hands[player.id]!);
  state.cards!.drawPile=forbidden(state.cards!.drawPile);
  const publicView=cards.view;expect(publicView.sets.length).toBeGreaterThan(0);const before=structuredClone(publicView);
  const poisoned={...publicView};
  // Accessor is installed after copying so merely building the test value cannot trip it.
  Object.defineProperty(poisoned,'hidden',{enumerable:true,get(){throw Error('non-public field read');}});
  const p=api.projectWorkspace(battle,poisoned);expect(p.cards).toEqual(before);expect(p.cards).not.toHaveProperty('hidden');
  (p.cards.hand as core.CardKind[]).push('Squall');(p.cards.handCounts as Record<string,number>)[viewer]=999;
  (p.cards.sets[0]!.indices as [number,number,number])[0]=999;
  expect(publicView).toEqual(before);expect(cards.view).toEqual(before);cards.dispose();battle.dispose();
 });
});

describe('T78 additional ownership controls',()=>{
 it('detaches same-match reconciliation while retaining a complete confirmed pair',()=>{
  const original=deepFreeze(customized()),next=api.reconcileWorkspace(original,context());
  expect(next).toEqual(original);expect(next).not.toBe(original);
  next.camera.x=999;next.histories.battle.scrollTop=999;next.histories.events.followLatest=true;
  next.drafts.capture='changed';next.attack.confirmed=false;
  expect(original).toEqual(customized());
 });
 it('allowlists projection keys and nested offered-set fields from real controllers',()=>{
  const state=loaded('T39-legal-before-trade'),battle=new BattleController(state,new Clock()),cards=new CardController(battle,core.activePlayer(state)!.id);
  try {
   const view=cards.view;expect(view.sets.length).toBeGreaterThan(0);
   const sets=view.sets.map(set=>{
    const poisoned={...set};Object.defineProperty(poisoned,'hidden',{enumerable:true,get(){throw Error('non-public set field read');}});return poisoned;
   });
   const projection=api.projectWorkspace(battle,Object.freeze({...view,sets:Object.freeze(sets)}));
   expect(Object.keys(projection).sort()).toEqual(['matchGeneration','revision','from','to','mode','phase','paused','speed','cards'].sort());
   expect(Object.keys(projection.cards).sort()).toEqual(Object.keys(view).sort());
   expect(projection.cards).toEqual(view);
   expect(Object.keys(projection.cards.sets[0]!).sort()).toEqual(['indices','kind','effect'].sort());
  } finally {cards.dispose();battle.dispose();}
 });
});

describe('T78 confirmation prerequisite',()=>{
 it('keeps an unchanged complete staged pair unconfirmed',()=>{
  const state=deepFreeze({...customized(),attack:{from:'province_1',to:'province_2',confirmed:false}});
  expect(api.reconcileWorkspace(state,context()).attack).toEqual({from:'province_1',to:'province_2',confirmed:false});
 });
});
