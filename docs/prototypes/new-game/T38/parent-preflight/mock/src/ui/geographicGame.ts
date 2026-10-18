import {defaultOptions} from '../core';
import type {GameOptions,GameState} from '../core';
import {createGeographicGame} from '../core/geographic-game';
import type {GeographicGameResult} from '../core/geographic-game';
import {GEOGRAPHIC_MATCH_IDENTITY,REFERENCE_MATCH_IDENTITY} from '../core/match-save';
import type {LoadedVersionedMatch} from '../core/match-save';
import {GeographicMapView} from './geographicMapView';
import {ReferenceMapView} from './referenceMapView';
import {ReferenceBattleGame} from './referenceBattleGame';
import type {BattlePreferences} from './referenceBattleGame';
import {ReferenceMatchFiles} from './referenceMatchFiles';
import type {MatchPresentation} from './matchPresentation';
import {h} from './dom';

type Accepted=Extract<GeographicGameResult,{ok:true}>;
interface SetupDependencies {
 create:(options:GameOptions)=>GeographicGameResult;
 report:(result:Extract<GeographicGameResult,{ok:false}>)=>void;
 mount:(options:GameOptions,result:Accepted)=>void;
}
/** Shared by the mounted form and deterministic refusal/retry acceptance. */
export function createGeographicSetupController(dependencies:SetupDependencies){
 return {start(options:GameOptions){const result=dependencies.create(options);if(result.ok)dependencies.mount(options,result);else dependencies.report(result);}};
}

export function mountGeographicGame(root:HTMLElement,dependencies:{create?:SetupDependencies["create"];mountAccepted?:SetupDependencies["mount"]}={}){
 let seed=new URLSearchParams(location.search).get('seed')??'1994';
 const manual=new URLSearchParams(location.search).get('control')==='manual';
 let seats=manual?'2':'4';
 let controllers:('human'|'computer')[]=manual?['human','human','human','human']:['human','computer','computer','computer'];
 let dominationWin=true,roundLimit:20|30|40|null=null;
 const preferences:BattlePreferences={threshold:2,speed:'normal'};
 let current:ReferenceBattleGame|null=null,setupFiles:ReferenceMatchFiles|null=null;
 const dispose=()=>{setupFiles?.dispose();setupFiles=null;current?.dispose();current=null;};
 const mount=(options:GameOptions,state:GameState,presentation:MatchPresentation)=>{
  const app=new ReferenceBattleGame(state.map,options,()=>setup(),state,preferences,onLoad,!manual,presentation);
  dispose();seed=String(options.seed);seats=String(options.seats.length);controllers=Array.from({length:4},(_,i)=>options.seats[i]?.kind??'human');dominationWin=options.dominationWin;roundLimit=options.roundLimit;
  root.id='geographic-game';root.className='geographic-game-root';root.dataset['seats']=seats;current=app;app.mount(root);
 };
 const onLoad=(options:GameOptions,state:GameState,loaded?:LoadedVersionedMatch)=>{
  if(!loaded?.initialState)throw Error('Saved match has no supported replay origin. Use the legacy generated game route for v1 files.');
  const identity=loaded.identity;
  if(identity.boardGenerator.id==='geographic'){
   const geography=loaded.geography;if(!geography)throw Error('Saved geographic match has no reconstructed geography.');
   mount(options,state,{identity,label:'Generated islands',initialState:loaded.initialState,createMap:(map,handlers)=>new GeographicMapView(map,geography,handlers)});
  }else if(identity.boardGenerator.id==='fixed-reference'){
   mount(options,state,{identity,label:'Nine Isles',initialState:loaded.initialState,createMap:(map,handlers)=>new ReferenceMapView(map,handlers)});
  }else throw Error('Unsupported board identity. Use the legacy generated game route for v1 files.');
 };
 const setup=()=>{
  dispose();root.id='geographic-setup';root.className='reference-setup geographic-setup';
  const input=h('input',{id:'geographic-seed',type:'number',min:'0',max:'4294967295',required:'',value:seed});
  const count=h('select',{id:'geographic-seats'},...[2,3,4].map(n=>h('option',{value:String(n)},String(n))));count.value=seats;
  const fields=h('div',{class:'reference-controller-fields'});
  const draw=()=>fields.replaceChildren(...Array.from({length:Number(count.value)},(_,i)=>{
   const id=`geographic-control-${i+1}`,select=h('select',{id},h('option',{value:'human'},'Human'),h('option',{value:'computer'},'Computer'));
   select.value=controllers[i]!;select.onchange=()=>{controllers[i]=select.value as 'human'|'computer';};
   return h('div',{},h('label',{for:id},`Seat ${i+1} control`),select);
  }));count.onchange=draw;draw();
  const domination=h('input',{id:'geographic-domination',type:'checkbox'});domination.checked=dominationWin;
  const limit=h('select',{id:'geographic-round-limit'},h('option',{value:'off'},'Off'),...[20,30,40].map(n=>h('option',{value:String(n)},`${n} rounds`)));limit.value=String(roundLimit??'off');
  const victory=h('div',{class:'reference-victory-options'},h('div',{class:'reference-domination'},domination,h('label',{for:domination.id},'Domination win')),h('div',{},h('label',{for:limit.id},'Round limit'),limit));
  const alert=h('p',{role:'alert'});
  const controller=createGeographicSetupController({create:dependencies.create??createGeographicGame,report:result=>{alert.textContent=`This seed could not produce a valid board after ${result.attempts} attempts. Choose another seed and start again.`;},mount:dependencies.mountAccepted??((options,result)=>mount(options,result.state,{identity:GEOGRAPHIC_MATCH_IDENTITY,label:'Generated islands',initialState:result.state,createMap:(map,handlers)=>new GeographicMapView(map,result.geography,handlers)}))});
  const form=h('form',{class:'card setup-card victory-setup'},h('h1',{},'New geographic game'),h('p',{},manual?'Manual play on generated islands. Computer seats are driven manually.':'Play on generated islands against three Normal computers, or choose each seat’s controller. The seed fixes geography, deal and dice.'),h('label',{for:input.id},'Seed'),input,h('label',{for:count.id},'Seats'),count,fields,victory,h('button',{type:'submit',class:'primary'},'Start game'),alert);
  form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;
   try{seed=input.value;seats=count.value;dominationWin=domination.checked;roundLimit=limit.value==='off'?null:Number(limit.value) as 20|30|40;
    const kinds=Array.from({length:Number(seats)},(_,i)=>controllers[i]!);
    controller.start({...defaultOptions(),seed:Number(seed),seats:kinds.map(kind=>({kind})),computerStrengths:kinds.filter(kind=>kind==='computer').map(()=>'Normal' as const),dominationWin,roundLimit});
   }catch(error){alert.textContent=error instanceof Error?error.message:String(error);}
  };
  setupFiles=new ReferenceMatchFiles(onLoad,undefined,undefined,REFERENCE_MATCH_IDENTITY,true);form.append(setupFiles.el);root.replaceChildren(form);
 };
 setup();
}
