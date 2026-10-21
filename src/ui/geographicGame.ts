import {defaultOptions,raidCardsRules} from '../core';
import type {GameOptions,GameState} from '../core';
import {createGeographicGame} from '../core/geographic-game';
import {NAME_THEMES,THEME_LABELS} from '../core/flavour-names';
import type {NameChoice} from '../core/flavour-names';
import type {IslandGeography} from '../core/island-geography';
import {createPresentationService} from './generatedGeographyPresentationService';
import type {MatchLoadContext} from './referenceMatchFiles';
import type {GeographicGameResult} from '../core/geographic-game';
import {GEOGRAPHIC_MATCH_IDENTITY,GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY,REFERENCE_MATCH_IDENTITY} from '../core/match-save';
import type {LoadedVersionedMatch,MatchIdentity} from '../core/match-save';
import {GeographicMapView} from './geographicMapView';
import {ReferenceMapView} from './referenceMapView';
import {ReferenceBattleGame} from './referenceBattleGame';
import type {BattlePreferences} from './referenceBattleGame';
import {ReferenceMatchFiles} from './referenceMatchFiles';
import type {MatchPresentation} from './matchPresentation';
import {h} from './dom';

/** Stage selection is shared by creation and its save/presentation identity.
 * Card hands currently support a spectator or one human. Shared human hands
 * keep the historical stage until the private handover workflow is available.
 */
export function geographicSetupIdentity(options:GameOptions,manual=false):MatchIdentity {
 const humanCount=options.seats.filter(seat=>seat.kind==='human').length;
 return !manual&&humanCount<=1?GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY:GEOGRAPHIC_MATCH_IDENTITY;
}
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
 let dominationWin=true,roundLimit:20|30|40|null=null,names:NameChoice='seed';
 const preferences:BattlePreferences={threshold:2,speed:'normal'};
 let current:ReferenceBattleGame|null=null,setupFiles:ReferenceMatchFiles|null=null;
 let closed=false,epoch=0,pending:AbortController|null=null;
 let setupStatus:HTMLElement|null=null;
 let service:ReturnType<typeof createPresentationService>|null=null;
 const cancel=()=>{epoch++;pending?.abort();pending=null;if(setupStatus)setupStatus.textContent='';};
 const prepare=async(geography:IslandGeography,context?:MatchLoadContext)=>{
  cancel();
  const own=epoch,request=new AbortController();pending=request;
  const abort=()=>request.abort();context?.signal.addEventListener('abort',abort,{once:true});
  if(context?.signal.aborted)request.abort();
  const active=()=>!closed&&epoch===own&&!request.signal.aborted&&(context?.isCurrent()??true);
  let worker:ReturnType<typeof createPresentationService>|null=null;
  try {
   worker=service??(service=createPresentationService());
   const drawing=await worker.request(geography,request.signal);
   return active()?{drawing,isCurrent:active}:null;
  } catch(error) {
   const aborted=error instanceof Error&&error.name==='AbortError';
   if(!aborted&&epoch===own&&worker&&service===worker){worker.dispose();service=null;}
   if(active()&&!aborted)throw Error('Could not prepare this map. Try again.',{cause:error});
   return null;
  } finally {
   context?.signal.removeEventListener('abort',abort);
   if(epoch===own)pending=null;
  }
 };
 const dispose=()=>{setupFiles?.dispose();setupFiles=null;current?.dispose();current=null;};
 const mount=(options:GameOptions,state:GameState,presentation:MatchPresentation)=>{
  const app=new ReferenceBattleGame(state.map,options,()=>setup(),state,preferences,onLoad,!manual,presentation);
  dispose();seed=String(options.seed);seats=String(options.seats.length);controllers=Array.from({length:4},(_,i)=>options.seats[i]?.kind??'human');dominationWin=options.dominationWin;roundLimit=options.roundLimit;names=options.names??'seed';
  root.id='geographic-game';root.className='geographic-game-root';root.dataset['seats']=seats;current=app;app.mount(root);
 };
 const onLoad=async(options:GameOptions,state:GameState,loaded?:LoadedVersionedMatch,context?:MatchLoadContext)=>{
  if(closed||context&&!context.isCurrent())return;
  if(!loaded?.initialState)throw Error('Saved match has no supported replay origin. Use the legacy generated game route for v1 files.');
  const identity=loaded.identity;
  if(identity.boardGenerator.id==='geographic'){
   const geography=loaded.geography;if(!geography)throw Error('Saved geographic match has no reconstructed geography.');
   const prepared=await prepare(geography,context);if(!prepared?.isCurrent())return;const drawing=prepared.drawing;
   mount(options,state,{identity,label:'Generated islands',initialState:loaded.initialState,createMap:(map,handlers)=>new GeographicMapView(map,geography,handlers,drawing)});
  }else if(identity.boardGenerator.id==='fixed-reference'){
   cancel();mount(options,state,{identity,label:'Nine Isles',initialState:loaded.initialState,createMap:(map,handlers)=>new ReferenceMapView(map,handlers)});
  }else throw Error('Unsupported board identity. Use the legacy generated game route for v1 files.');
 };
 const setup=()=>{
  cancel();dispose();root.id='geographic-setup';root.className='reference-setup geographic-setup';
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
  // T94: a regional theme names the islands and countries; By seed lets the seed choose one.
  const theme=h('select',{id:'geographic-names'},h('option',{value:'seed'},'By seed'),...NAME_THEMES.map(t=>h('option',{value:t},THEME_LABELS[t])));theme.value=names==='numbered'?'seed':names;
  const alert=h('p',{role:'alert'});
  const status=h('p',{role:'status',class:'match-error'});setupStatus=status;
  const mountAccepted=async(options:GameOptions,result:Accepted)=>{
   const own=epoch;alert.textContent='';
   try {
    const work=prepare(result.geography);status.textContent='Preparing game…';
    const prepared=await work;if(!prepared?.isCurrent())return;const drawing=prepared.drawing;
    mount(options,result.state,{identity:geographicSetupIdentity(options,manual),label:'Generated islands',initialState:result.state,createMap:(map,handlers)=>new GeographicMapView(map,result.geography,handlers,drawing)});
   }catch(error){if(!closed&&epoch===own+1)alert.textContent=error instanceof Error?error.message:String(error);}
   finally{if(epoch===own+1)status.textContent='';}
  };
  const controller=createGeographicSetupController({create:dependencies.create??(options=>createGeographicGame(options,geographicSetupIdentity(options,manual).rules.id==='cards'?raidCardsRules(options):undefined)),report:result=>{alert.textContent=`This seed could not produce a valid board after ${result.attempts} attempts. Choose another seed and start again.`;},mount:dependencies.mountAccepted??((options,result)=>{void mountAccepted(options,result);})});
  const form=h('form',{class:'card setup-card victory-setup'},h('h1',{},'New geographic game'),h('p',{},manual?'Manual play on generated islands. Computer seats are driven manually.':'Play on generated islands against three Normal computers, or choose each seat’s controller. The seed fixes geography, deal and dice. Cards are enabled with zero or one human seat. Games with two or more human seats play without cards.'),h('label',{for:input.id},'Seed'),input,h('label',{for:count.id},'Seats'),count,fields,victory,h('label',{for:theme.id},'Place names'),theme,h('button',{type:'submit',class:'primary'},'Start game'),status,alert);
  form.onsubmit=e=>{e.preventDefault();cancel();setupFiles?.cancelPending();if(closed||!form.reportValidity())return;
   try{seed=input.value;seats=count.value;dominationWin=domination.checked;roundLimit=limit.value==='off'?null:Number(limit.value) as 20|30|40;names=theme.value as NameChoice;
    const kinds=Array.from({length:Number(seats)},(_,i)=>controllers[i]!);
    controller.start({...defaultOptions(),seed:Number(seed),seats:kinds.map(kind=>({kind})),computerStrengths:kinds.filter(kind=>kind==='computer').map(()=>'Normal' as const),dominationWin,roundLimit,names});
   }catch(error){alert.textContent=error instanceof Error?error.message:String(error);}
  };
  setupFiles=new ReferenceMatchFiles(onLoad,undefined,undefined,REFERENCE_MATCH_IDENTITY,true,cancel);form.append(setupFiles.el);root.replaceChildren(form);
 };
 setup();
 return ()=>{if(closed)return;closed=true;cancel();dispose();service?.dispose();service=null;};
}
