import {defaultOptions,parseReinforcementDivisor,REINFORCEMENT_DIVISORS} from '../core/options';
import type {GameOptions,ReinforcementDivisor} from '../core/options';
import {h} from './dom';

export const NEXT_GAME_SETTINGS_KEY='malpaco:next-game-settings';
export type ComputerOpponents=1|2|3;
/** [designed] T107 versioned presentation preferences, separate from any match.
 * Searched existing preferences/kept-game/scoreboard stores; the owner selected
 * Settings now, applied only at New game, with 1–3 Normal computer opponents.
 */
export interface NextGameSettings {readonly version:3;readonly mapSize:46|72|96;readonly computerOpponents:ComputerOpponents;readonly reinforcementDivisor:ReinforcementDivisor}
export interface NextGameStore {get():string|null;set(text:string):void}
const opponentCount=(value:unknown):value is ComputerOpponents=>value===1||value===2||value===3;
export const defaultNextGameSettings=():NextGameSettings=>({version:3,computerOpponents:3,reinforcementDivisor:3,mapSize:46});
export function parseNextGameSettings(text:string|null):NextGameSettings {
 try{
  const value:unknown=text?JSON.parse(text):null;
  if(value&&typeof value==='object'&&!Array.isArray(value)){
   const v=value as Record<string,unknown>;
   if(v.version===1&&opponentCount(v.computerOpponents))return {version:3,computerOpponents:v.computerOpponents,reinforcementDivisor:3,mapSize:46};
   if((v.version===2||v.version===3)&&opponentCount(v.computerOpponents)){
    const mapSize=v.version===2?46:v.mapSize;if(mapSize!==46&&mapSize!==72&&mapSize!==96)throw Error('Invalid map size');
    return {version:3,computerOpponents:v.computerOpponents,reinforcementDivisor:parseReinforcementDivisor(v.reinforcementDivisor),mapSize};
   }
  }
 }catch{/* A malformed preference cannot invalidate a kept game. */}
 return defaultNextGameSettings();
}
export const browserNextGames:NextGameStore={
 get:()=>localStorage.getItem(NEXT_GAME_SETTINGS_KEY),
 set:text=>localStorage.setItem(NEXT_GAME_SETTINGS_KEY,text),
};
export function readNextGameSettings(store:NextGameStore=browserNextGames):NextGameSettings {
 try{return parseNextGameSettings(store.get());}catch{return defaultNextGameSettings();}
}
export function saveNextGameSettings(value:unknown,store:NextGameStore=browserNextGames):boolean {
 if(!opponentCount(value))return false;
 try{store.set(JSON.stringify({...readNextGameSettings(store),computerOpponents:value}));return true;}catch{return false;}
}
export function saveReplenishmentSettings(value:unknown,store:NextGameStore=browserNextGames):boolean {
 try{const rate=parseReinforcementDivisor(value);store.set(JSON.stringify({...readNextGameSettings(store),reinforcementDivisor:rate}));return true;}catch{return false;}
}
export function saveMapSizeSettings(value:unknown,store:NextGameStore=browserNextGames):boolean {
 if(value!==46&&value!==72&&value!==96)return false;
 try{store.set(JSON.stringify({...readNextGameSettings(store),mapSize:value}));return true;}catch{return false;}
}
/** Called only when constructing a fresh game, never when resuming or playing. */
export function nextGameOptions(seed:number,settings:NextGameSettings=readNextGameSettings()):GameOptions {
 return {...defaultOptions(),seed,reinforcementDivisor:settings.reinforcementDivisor,
  ...(settings.mapSize===46?{}:{regionCount:settings.mapSize,names:'numbered' as const}),
  seats:[{kind:'human'},...Array.from({length:settings.computerOpponents},()=>({kind:'computer' as const}))],
  computerStrengths:Array.from({length:settings.computerOpponents},()=> 'Normal' as const)};
}

export class NextGameSettingsDialog {
 readonly button=h('button',{id:'next-game-settings-button',type:'button','aria-label':'Settings for the next game'},'Settings');
 readonly dialog=h('dialog',{id:'next-game-settings-dialog',class:'game-help next-game-settings','aria-labelledby':'next-game-settings-title'});
 private readonly close=h('button',{id:'close-next-game-settings',type:'button'},'Close');
 private readonly opponents=h('select',{id:'next-game-opponents'},...[1,2,3].map(n=>h('option',{value:String(n)},String(n))));
 private readonly rate=h('select',{id:'next-game-replenishment'},...REINFORCEMENT_DIVISORS.map(n=>h('option',{value:String(n)},`1 army per ${n} ${n===1?'region':'regions'}`)));
 private readonly size=h('select',{id:'next-game-map-size'},...[46,72,96].map(n=>h('option',{value:String(n)},`${n} regions${n===46?'':' (prototype)'}`)));
 private readonly error=h('p',{role:'alert',class:'match-error'});
 constructor(private readonly store:NextGameStore=browserNextGames,onOpen?:()=>void,onClose?:()=>void){
  this.close.onclick=()=>this.dialog.close();
  this.dialog.append(h('header',{class:'game-help-head'},h('h2',{id:'next-game-settings-title'},'Settings'),this.close),
   h('p',{},'Applies to the next game.'),
   h('div',{class:'next-game-setting'},h('label',{for:this.opponents.id},'Computer opponents'),this.opponents),h('div',{class:'next-game-setting'},h('label',{for:this.rate.id},'Replenishment'),this.rate),h('div',{class:'next-game-setting'},h('label',{for:this.size.id},'Map size'),this.size),h('p',{},'Larger maps add more islands and use numbered names during this prototype.'),h('p',{},'Minimum 2 base armies per turn. Island bonuses are added separately.'),this.error);
  this.button.onclick=()=>{onOpen?.();const settings=readNextGameSettings(this.store);this.opponents.value=String(settings.computerOpponents);this.rate.value=String(settings.reinforcementDivisor);this.size.value=String(settings.mapSize);this.error.textContent='';this.dialog.showModal();this.opponents.focus();};
  this.opponents.onchange=()=>{
   const before=readNextGameSettings(this.store),count=Number(this.opponents.value);
   if(saveNextGameSettings(count,this.store))this.error.textContent='';
   else{this.opponents.value=String(before.computerOpponents);this.error.textContent='Could not keep these settings on this device. Your current game is unchanged.';}
  };
  this.rate.onchange=()=>{const before=readNextGameSettings(this.store);if(saveReplenishmentSettings(Number(this.rate.value),this.store))this.error.textContent='';else{this.rate.value=String(before.reinforcementDivisor);this.error.textContent='Could not keep these settings on this device. Your current game is unchanged.';}};
  this.size.onchange=()=>{const before=readNextGameSettings(this.store);if(saveMapSizeSettings(Number(this.size.value),this.store))this.error.textContent='';else{this.size.value=String(before.mapSize);this.error.textContent='Could not keep these settings on this device. Your current game is unchanged.';}};
  this.dialog.addEventListener('close',()=>onClose?.());
 }
 /** Player Settings shares the ordinary floating card, without a second dialog. */
 inlineContent():HTMLElement {
  const content=h('div',{class:'next-game-settings'});
  for(const node of [...this.dialog.children])if(node.tagName!=='HEADER')content.append(node);
  this.refresh();return content;
 }
 refresh():void {const settings=readNextGameSettings(this.store);this.opponents.value=String(settings.computerOpponents);this.rate.value=String(settings.reinforcementDivisor);this.size.value=String(settings.mapSize);this.error.textContent='';}
 dispose():void {this.dialog.remove();}
}
