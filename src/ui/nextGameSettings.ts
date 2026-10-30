import {defaultOptions} from '../core/options';
import type {GameOptions,StartingArmiesRange,EventFrequency} from '../core/options';
import {h} from './dom';
import {readButtonLabels,saveButtonLabels} from './buttonLabels';
export const NEXT_GAME_SETTINGS_KEY='malpaco:next-game-settings';
export type ComputerOpponents=1|2|3;
const RANGES:readonly StartingArmiesRange[]=['1-2','1-3','1-4'];
const FREQUENCIES:readonly EventFrequency[]=['Off','Rare','Normal','Often'];
export type CombatRulesChoice='defender'|'legacy';
const combatRules=(v:unknown):v is CombatRulesChoice=>v==='defender'||v==='legacy';
export interface NextGameSettings {readonly version:5;readonly combatRules:CombatRulesChoice;readonly mapSize:46|72|96;readonly computerOpponents:ComputerOpponents;readonly startingArmiesRange:StartingArmiesRange;readonly eventFrequency:EventFrequency}
export interface NextGameStore {get():string|null;set(text:string):void}
const mapSize=(v:unknown):v is 46|72|96=>v===46||v===72||v===96;
const opponents=(v:unknown):v is ComputerOpponents=>v===1||v===2||v===3;
export const defaultNextGameSettings=():NextGameSettings=>({version:5,combatRules:'defender',computerOpponents:3,startingArmiesRange:'1-3',eventFrequency:'Normal',mapSize:46});
export function parseNextGameSettings(text:string|null):NextGameSettings {
 try{
  const v:unknown=text?JSON.parse(text):null;
  if(v&&typeof v==='object'&&!Array.isArray(v)){
   const p=v as Record<string,unknown>;
   if(opponents(p.computerOpponents)){
    if(p.version===3&&mapSize(p.mapSize))return {...defaultNextGameSettings(),computerOpponents:p.computerOpponents,mapSize:p.mapSize};
    if(p.version===1||p.version===2)return {...defaultNextGameSettings(),computerOpponents:p.computerOpponents};
    const size=p.mapSize===undefined?46:p.mapSize;
    if((p.version===4||p.version===5&&combatRules(p.combatRules))&&mapSize(size)&&RANGES.includes(p.startingArmiesRange as StartingArmiesRange)&&FREQUENCIES.includes(p.eventFrequency as EventFrequency))return {version:5,combatRules:p.version===5?p.combatRules as CombatRulesChoice:'defender',mapSize:size,computerOpponents:p.computerOpponents,startingArmiesRange:p.startingArmiesRange as StartingArmiesRange,eventFrequency:p.eventFrequency as EventFrequency};
   }
  }
 }catch{/* Invalid preferences cannot invalidate a kept match. */}
 return defaultNextGameSettings();
}
export const browserNextGames:NextGameStore={get:()=>localStorage.getItem(NEXT_GAME_SETTINGS_KEY),set:text=>localStorage.setItem(NEXT_GAME_SETTINGS_KEY,text)};
export function readNextGameSettings(store:NextGameStore=browserNextGames):NextGameSettings {try{return parseNextGameSettings(store.get());}catch{return defaultNextGameSettings();}}
function save(change:Partial<NextGameSettings>,store:NextGameStore):boolean {try{store.set(JSON.stringify({...readNextGameSettings(store),...change}));return true;}catch{return false;}}
export function saveNextGameSettings(value:unknown,store:NextGameStore=browserNextGames):boolean {return opponents(value)&&save({computerOpponents:value},store);}
export function saveStartingArmySettings(value:unknown,store:NextGameStore=browserNextGames):boolean {return RANGES.includes(value as StartingArmiesRange)&&save({startingArmiesRange:value as StartingArmiesRange},store);}
export function saveEventFrequencySettings(value:unknown,store:NextGameStore=browserNextGames):boolean {return FREQUENCIES.includes(value as EventFrequency)&&save({eventFrequency:value as EventFrequency},store);}
export function saveMapSizeSettings(value:unknown,store:NextGameStore=browserNextGames):boolean {return mapSize(value)&&save({mapSize:value},store);}
export function saveCombatRulesSettings(value:unknown,store:NextGameStore=browserNextGames):boolean {return combatRules(value)&&save({combatRules:value},store);}
/** A snapshot only for a fresh game. Old saved options/rate identities remain untouched. */
export function nextGameOptions(seed:number,settings:NextGameSettings=readNextGameSettings()):GameOptions {
 return {...defaultOptions(),seed,...(settings.mapSize===46?{}:{regionCount:settings.mapSize,names:'numbered' as const}),islandRules:1,...(settings.combatRules==='defender'?{combatPreset:'defender-v1' as const}:{}),startingArmiesRange:settings.startingArmiesRange,eventFrequency:settings.eventFrequency,seats:[{kind:'human'},...Array.from({length:settings.computerOpponents},()=>({kind:'computer' as const}))],computerStrengths:Array.from({length:settings.computerOpponents},()=> 'Normal' as const)};
}
export class NextGameSettingsDialog {
 readonly button=h('button',{id:'next-game-settings-button',type:'button','aria-label':'Settings for the next game'},'Settings');
 readonly dialog=h('dialog',{id:'next-game-settings-dialog',class:'game-help next-game-settings','aria-labelledby':'next-game-settings-title'});
 private readonly close=h('button',{id:'close-next-game-settings',type:'button'},'Close');
 private readonly opponents=h('select',{id:'next-game-opponents'},...[1,2,3].map(n=>h('option',{value:String(n)},String(n))));
 private readonly starting=h('select',{id:'next-game-starting-armies'},...RANGES.map(v=>h('option',{value:v},v.replace('-','–'))));
 private readonly frequency=h('select',{id:'next-game-event-frequency'},...FREQUENCIES.map(v=>h('option',{value:v},v)));
 private readonly size=h('select',{id:'next-game-map-size'},...[46,72,96].map(n=>h('option',{value:String(n)},`${n} regions`)));
 private readonly combat=h('select',{id:'next-game-combat-rules','aria-describedby':'next-game-combat-note'},h('option',{value:'defender'},'Defender wins ties'),h('option',{value:'legacy'},'Legacy (reroll ties)'));
 private readonly error=h('p',{role:'alert',class:'match-error'});
 private readonly labels=h('select',{id:'button-labels','aria-describedby':'button-labels-note'},h('option',{value:'text'},'Text'),h('option',{value:'icons'},'Icons'));
 constructor(private readonly store:NextGameStore=browserNextGames,onOpen?:()=>void,onClose?:()=>void){
  this.close.onclick=()=>this.dialog.close();
  const field=(name:string,select:HTMLSelectElement)=>h('div',{class:'next-game-setting'},h('label',{for:select.id},name),select);
  this.dialog.append(h('header',{class:'game-help-head'},h('h2',{id:'next-game-settings-title'},'Settings'),this.close),field('Button labels',this.labels),h('p',{id:'button-labels-note',class:'card-note'},'Applies now and to future games. Map tools and amount controls keep their standard symbols.'),field('Computer opponents',this.opponents),field('Starting armies',this.starting),field('Disasters and production',this.frequency),field('Map size',this.size),field('Combat rules',this.combat),h('p',{id:'next-game-combat-note',class:'card-note'},'For new games. Kept games retain their combat rules.'),this.error);
  this.button.onclick=()=>{onOpen?.();this.refresh();this.dialog.showModal();this.opponents.focus();};
  const edited=(ok:boolean)=>{if(ok)this.error.textContent='';else{this.refresh();this.error.textContent='Could not keep these settings on this device. Your current game is unchanged.';}};
  this.opponents.onchange=()=>edited(saveNextGameSettings(Number(this.opponents.value),this.store));
  this.starting.onchange=()=>edited(saveStartingArmySettings(this.starting.value,this.store));
  this.size.onchange=()=>edited(saveMapSizeSettings(Number(this.size.value),this.store));
  this.combat.onchange=()=>edited(saveCombatRulesSettings(this.combat.value,this.store));
  this.frequency.onchange=()=>edited(saveEventFrequencySettings(this.frequency.value,this.store));
  this.labels.onchange=()=>{if(saveButtonLabels(this.labels.value))this.error.textContent='';else{this.labels.value=readButtonLabels();this.error.textContent='Could not keep the button display setting on this device.';}};
  this.dialog.addEventListener('close',()=>onClose?.());
 }
 inlineContent():HTMLElement {const content=h('div',{class:'next-game-settings'});for(const n of [...this.dialog.children])if(n.tagName!=='HEADER')content.append(n);this.refresh();return content;}
 refresh():void {const s=readNextGameSettings(this.store);this.labels.value=readButtonLabels();this.opponents.value=String(s.computerOpponents);this.starting.value=s.startingArmiesRange;this.frequency.value=s.eventFrequency;this.combat.value=s.combatRules;this.size.value=String(s.mapSize);this.error.textContent='';}
 dispose():void {this.dialog.remove();}
}
