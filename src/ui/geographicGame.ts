import {islandRules,configurableRaidCardsRules} from '../core/state';
import {createGame,defaultOptions,raidCardsRules} from '../core';
import type {GameOptions,GameState} from '../core';
import {createGeographicGame} from '../core/geographic-game';
import {NAME_THEMES,THEME_LABELS} from '../core/flavour-names';
import type {NameChoice} from '../core/flavour-names';
import type {IslandGeography} from '../core/island-geography';
import {createPresentationService} from './generatedGeographyPresentationService';
import type {MatchLoadContext} from './referenceMatchFiles';
import type {GeographicGameResult} from '../core/geographic-game';
import {deserializeVersionedMatch,GEOGRAPHIC_MATCH_IDENTITY,GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY,GEOGRAPHIC_V2_MATCH_IDENTITY,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY,GEOGRAPHIC_V2_CONFIGURABLE_CARD_MATCH_IDENTITY,GEOGRAPHIC_EVENT_MATCH_IDENTITY,REFERENCE_MATCH_IDENTITY} from '../core/match-save';
import type {LoadedVersionedMatch,MatchIdentity} from '../core/match-save';
import {GeographicMapView} from './geographicMapView';
import {GeneratedMapView} from './generatedMapView';
import {ReferenceMapView} from './referenceMapView';
import {ReferenceBattleGame} from './referenceBattleGame';
import type {BattlePreferences} from './referenceBattleGame';
import {ReferenceMatchFiles} from './referenceMatchFiles';
import type {MatchPresentation} from './matchPresentation';
import {h} from './dom';
import {addGame,browserScores,parseScoreboard,totalsLine} from './scoreboard';
import type {BattleSpeed} from './battleController';
import {nextGameOptions,readNextGameSettings} from './nextGameSettings';

/** Stage selection is shared by creation and its save/presentation identity.
 * Card hands currently support a spectator or one human. Shared human hands
 * keep the historical stage until the private handover workflow is available.
 */
export function geographicSetupIdentity(options:GameOptions,manual=false,generator:1|2=setupGenerator()):MatchIdentity {
 const humanCount=options.seats.filter(seat=>seat.kind==='human').length,raid=!manual&&humanCount<=1;
 if(generator===2&&raid&&options.islandRules===1)return GEOGRAPHIC_EVENT_MATCH_IDENTITY;
 if(generator===2&&raid&&options.reinforcementDivisor!==undefined)return GEOGRAPHIC_V2_CONFIGURABLE_CARD_MATCH_IDENTITY;
 return generator===2?(raid?GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY:GEOGRAPHIC_V2_MATCH_IDENTITY):(raid?GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY:GEOGRAPHIC_MATCH_IDENTITY);
}
/** New games grow their islands (T95, geographic/2); `?generator=1` keeps the frozen witness maps. */
export function setupGenerator():1|2 {
 return typeof location!=='undefined'&&new URLSearchParams(location.search).get('generator')==='1'?1:2;
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

/**
 * T96/T100: the player's current game, kept in this browser only; private modes simply do not
 * resume. A slot holds the versioned save text and, beside it, `{id,paused}` (the id records the
 * game on the scoreboard once). The root page has one slot, and each `?seed=N` its own.
 */
const STORED_GAME='malpaco:current-game';
interface Slot {readonly game:string;readonly meta:string}
interface GameMeta {id:string;paused:boolean;eventAck?:number;eventMarksCleared?:number}
const local={
 get:(key:string):string|null=>{try{return localStorage.getItem(key);}catch{return null;}},
 set:(key:string,text:string|null)=>{try{if(text===null)localStorage.removeItem(key);else localStorage.setItem(key,text);}catch{/* not kept */}},
};
const readMeta=(slot:Slot):GameMeta|null=>{try{const v=JSON.parse(local.get(slot.meta)??'null');return v&&typeof v.id==='string'&&v.id?{id:v.id,paused:v.paused===true,...(Number.isSafeInteger(v.eventAck)&&v.eventAck>=0?{eventAck:v.eventAck}:{}),...(Number.isSafeInteger(v.eventMarksCleared)&&v.eventMarksCleared>=0?{eventMarksCleared:v.eventMarksCleared}:{})}:null;}catch{return null;}};
/** T100: game speed, for every player game in this browser. */
const PREFERENCES='malpaco:preferences',SPEEDS:readonly BattleSpeed[]=['very-slow','slow','normal','fast'];
const keptSpeed=():BattleSpeed|null=>{try{const speed=JSON.parse(local.get(PREFERENCES)??'null')?.speed;return SPEEDS.includes(speed)?speed:null;}catch{return null;}};
const randomSeed=()=>crypto.getRandomValues(new Uint32Array(1))[0]!;
const newGameId=()=>`${Date.now().toString(36)}-${randomSeed().toString(36)}`;

export function mountGeographicGame(root:HTMLElement,dependencies:{create?:SetupDependencies["create"];mountAccepted?:SetupDependencies["mount"]}={}){
 const params=new URLSearchParams(location.search);
 let seed=params.get('seed')??'1994';
 const manual=params.get('control')==='manual';
 // T96: the player's page starts a game at once. `?setup` and `control=manual` keep the setup
 // screen and its files for tests and development.
 const instant=!manual&&!params.has('setup');
 const seedParam=params.get('seed');let fixedSeed=seedParam!==null&&/^\d+$/.test(seedParam)?Number(seedParam)>>>0:null;
 const seedSlot=(n:number):Slot=>({game:`malpaco:seed-game:${n}`,meta:`malpaco:seed-game-meta:${n}`});
 let slot:Slot|null=!instant?null:seedParam===null?{game:STORED_GAME,meta:`${STORED_GAME}-meta`}:fixedSeed!==null?seedSlot(fixedSeed):null;
 /** The kept meta of the game being resumed, consumed by the next mount. */
 let resuming:GameMeta|null=null;
 let seats=manual?'2':'4';
 let controllers:('human'|'computer')[]=manual?['human','human','human','human']:['human','computer','computer','computer'];
 let dominationWin=true,roundLimit:20|30|40|null=null,names:NameChoice='seed';
 const preferences:BattlePreferences={threshold:2,speed:(instant?keptSpeed():null)??'normal'};
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
 const mount=(options:GameOptions,state:GameState,given:MatchPresentation,loadedMatch=false)=>{
  // A version-1 game has no version-2 record to keep, and a `?seed` page never replaces the
  // player's kept game: it keeps its own game of that seed (T100).
  let presentation:MatchPresentation=given;
  if(instant&&given.identity.boardGenerator.id!=='generated'){
   const meta=resuming??{id:newGameId(),paused:false},keep=slot&&(seedParam===null||options.seed===fixedSeed)?slot:null;resuming=null;
   if(keep)local.set(keep.meta,JSON.stringify(meta));
   // The scoreboard counts geographic player games with one human; Nine Isles never.
   const counted=given.identity.boardGenerator.id==='geographic'&&options.seats.filter(s=>s.kind==='human').length===1;
   presentation={...given,player:{persist:keep?text=>local.set(keep.game,text):()=>{},paused:meta.paused,eventAck:meta.eventAck??0,eventMarksCleared:meta.eventMarksCleared??0,
    remember:change=>{
     if(change.speed)local.set(PREFERENCES,JSON.stringify({speed:change.speed}));
     if(keep&&(change.eventAck!==undefined||change.eventMarksCleared!==undefined)){if(change.eventAck!==undefined)meta.eventAck=change.eventAck;if(change.eventMarksCleared!==undefined)meta.eventMarksCleared=change.eventMarksCleared;local.set(keep.meta,JSON.stringify(meta));}
     if(change.paused!==undefined&&keep){meta.paused=change.paused;local.set(keep.meta,JSON.stringify(meta));}
    },
    ...(counted?{record:game=>{addGame(browserScores,{...game,id:meta.id,date:new Date().toISOString()});},totals:()=>totalsLine(parseScoreboard(browserScores.get()).totals)}:{})}};
  }
  const app=new ReferenceBattleGame(state.map,options,()=>{if(instant)void instantStart(true);else setup();},state,preferences,onLoad,!manual,presentation);
  dispose();seed=String(options.seed);seats=String(options.seats.length);controllers=Array.from({length:4},(_,i)=>options.seats[i]?.kind??'human');dominationWin=options.dominationWin;roundLimit=options.roundLimit;names=options.names??'seed';
  root.id='geographic-game';root.className='geographic-game-root';root.dataset['seats']=seats;current=app;app.mount(root);
  // A loaded match replaces the card that held the file input: focus returns to the menu icon (#195).
  if(loadedMatch)app.focusMenu();
 };
 const onLoad=async(options:GameOptions,state:GameState,loaded?:LoadedVersionedMatch,context?:MatchLoadContext)=>{
  if(closed||context&&!context.isCurrent())return;
  // A13: a version-1 save (the legacy generated board) continues here; its origin is rebuilt
  // from its options exactly as its replay was, and it saves back as version 1.
  if(loaded?.formatVersion===1){
   const origin=createGame(options);if(!origin.ok)throw Error(`Cannot generate this saved game: ${origin.errors.join('; ')}.`);
   cancel();mount(options,state,{identity:loaded.identity,label:'Generated board (version 1 save)',initialState:origin.state,acceptsVersion1:true,createMap:(map,handlers)=>new GeneratedMapView(map,handlers)},true);return;
  }
  if(!loaded?.initialState)throw Error('Saved match has no supported replay origin.');
  const identity=loaded.identity;
  if(identity.boardGenerator.id==='geographic'){
   const geography=loaded.geography;if(!geography)throw Error('Saved geographic match has no reconstructed geography.');
   const prepared=await prepare(geography,context);if(!prepared?.isCurrent())return;const drawing=prepared.drawing;
   mount(options,state,{identity,label:'Generated islands',initialState:loaded.initialState,acceptsVersion1:true,createMap:(map,handlers)=>new GeographicMapView(map,geography,handlers,drawing)},true);
  }else if(identity.boardGenerator.id==='fixed-reference'){
   cancel();mount(options,state,{identity,label:'Nine Isles',initialState:loaded.initialState,acceptsVersion1:true,createMap:(map,handlers)=>new ReferenceMapView(map,handlers)},true);
  }else throw Error('Unsupported board identity. Use the legacy generated game route for v1 files.');
 };
 const createMatch=(options:GameOptions)=>(dependencies.create??(o=>createGeographicGame(o,geographicSetupIdentity(o,manual).rules.id==='island'?islandRules(o):geographicSetupIdentity(o,manual).rules.id==='configurable-cards'?configurableRaidCardsRules(o):geographicSetupIdentity(o,manual).rules.id==='cards'?raidCardsRules(o):undefined,{},setupGenerator())))(options);
 /**
  * T96: a refresh resumes the player's game, then a new game starts on a random seed with one
  * human and three Normal computers, Domination on, no round limit, place names by seed.
  * `?seed=N` fixes the seed (a hidden route for tests and bug reports); T100 keeps it per seed.
  */
 const instantStart=async(fresh=false)=>{
  cancel();dispose();root.id='geographic-setup';root.className='reference-setup geographic-setup';
  const status=h('p',{role:'status',class:'match-error'},'Preparing game…');setupStatus=status;
  root.replaceChildren(h('div',{class:'card setup-card instant-start'},status));
  if(!fresh&&slot){
   const text=local.get(slot.game);
   if(text){
    try{const loaded=deserializeVersionedMatch(text);if(!loaded.state.result){resuming=readMeta(slot)??{id:newGameId(),paused:false};await onLoad(loaded.options,loaded.state,loaded);if(current)return;}}
    catch{/* A record this build cannot replay starts a new game. */}
    resuming=null;local.set(slot.game,null);
   }
  }
  const own=epoch,nextSettings=readNextGameSettings();
  for(let attempt=0;attempt<5&&!closed&&epoch===own;attempt++){
   let options=nextGameOptions(!fresh&&attempt===0&&/^\d+$/.test(params.get('seed')??'')?Number(params.get('seed'))>>>0:randomSeed(),nextSettings);
   if(setupGenerator()===1){const {reinforcementDivisor:_legacy,islandRules:_island,...old}=options;options=old;}
   const result=createMatch(options);if(!result.ok)continue;
   try{
    const prepared=await prepare(result.geography);if(!prepared?.isCurrent())return;const drawing=prepared.drawing;
    // #260: New game on a `?seed` page moves the page to the new seed, so that seed's own record
    // keeps the game and a reload resumes it; the root game's record stays untouched.
    if(fresh&&seedParam!==null){fixedSeed=options.seed;slot=seedSlot(options.seed);params.set('seed',String(options.seed));history.replaceState(history.state,'',`${location.pathname}?${params}${location.hash}`);}
    mount(options,result.state,{identity:geographicSetupIdentity(options,manual),label:'Generated islands',initialState:result.state,createMap:(map,handlers)=>new GeographicMapView(map,result.geography,handlers,drawing)});
   }catch(error){if(!closed)status.textContent=error instanceof Error?error.message:String(error);}
   return;
  }
  if(!closed&&epoch===own)status.textContent='Could not prepare a game. Reload the page to try again.';
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
    mount(options,result.state,{identity:geographicSetupIdentity(options,manual),label:'Generated islands',initialState:result.state,acceptsVersion1:true,createMap:(map,handlers)=>new GeographicMapView(map,result.geography,handlers,drawing)});
   }catch(error){if(!closed&&epoch===own+1)alert.textContent=error instanceof Error?error.message:String(error);}
   finally{if(epoch===own+1)status.textContent='';}
  };
  const controller=createGeographicSetupController({create:createMatch,report:result=>{alert.textContent=`This seed could not produce a valid board after ${result.attempts} attempts. Choose another seed and start again.`;},mount:dependencies.mountAccepted??((options,result)=>{void mountAccepted(options,result);})});
  const form=h('form',{class:'card setup-card victory-setup'},h('h1',{},'New geographic game'),h('p',{},manual?'Manual play on generated islands. Computer seats are driven manually.':'Play on generated islands against three Normal computers, or choose each seat’s controller. The seed fixes geography, deal and dice. Cards are enabled with zero or one human seat. Games with two or more human seats play without cards.'),h('label',{for:input.id},'Seed'),input,h('label',{for:count.id},'Seats'),count,fields,victory,h('label',{for:theme.id},'Place names'),theme,h('button',{type:'submit',class:'primary'},'Start game'),status,alert);
  form.onsubmit=e=>{e.preventDefault();cancel();setupFiles?.cancelPending();if(closed||!form.reportValidity())return;
   try{seed=input.value;seats=count.value;dominationWin=domination.checked;roundLimit=limit.value==='off'?null:Number(limit.value) as 20|30|40;names=theme.value as NameChoice;
    const kinds=Array.from({length:Number(seats)},(_,i)=>controllers[i]!);
    controller.start({...defaultOptions(),seed:Number(seed),seats:kinds.map(kind=>({kind})),computerStrengths:kinds.filter(kind=>kind==='computer').map(()=>'Normal' as const),dominationWin,roundLimit,names});
   }catch(error){alert.textContent=error instanceof Error?error.message:String(error);}
  };
  setupFiles=new ReferenceMatchFiles(onLoad,undefined,undefined,REFERENCE_MATCH_IDENTITY,true,cancel,true);form.append(setupFiles.el);root.replaceChildren(form);
 };
 if(instant)void instantStart();else setup();
 return ()=>{if(closed)return;closed=true;cancel();dispose();service?.dispose();service=null;};
}
