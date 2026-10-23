import {defaultOptions} from '../core/options';
import type {GameOptions} from '../core/options';
import {h} from './dom';

export const NEXT_GAME_SETTINGS_KEY='malpaco:next-game-settings';
export type ComputerOpponents=1|2|3;
/** [designed] T107 versioned presentation preferences, separate from any match.
 * Searched existing preferences/kept-game/scoreboard stores; the owner selected
 * Settings now, applied only at New game, with 1–3 Normal computer opponents.
 */
export interface NextGameSettings {readonly version:1;readonly computerOpponents:ComputerOpponents}
export interface NextGameStore {get():string|null;set(text:string):void}
const opponentCount=(value:unknown):value is ComputerOpponents=>value===1||value===2||value===3;
export const defaultNextGameSettings=():NextGameSettings=>({version:1,computerOpponents:3});
export function parseNextGameSettings(text:string|null):NextGameSettings {
 try{
  const value:unknown=text?JSON.parse(text):null;
  if(value&&typeof value==='object'&&!Array.isArray(value)){
   const v=value as Record<string,unknown>;
   if(v.version===1&&opponentCount(v.computerOpponents))return {version:1,computerOpponents:v.computerOpponents};
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
 try{store.set(JSON.stringify({version:1,computerOpponents:value}));return true;}catch{return false;}
}
/** Called only when constructing a fresh game, never when resuming or playing. */
export function nextGameOptions(seed:number,settings:NextGameSettings=readNextGameSettings()):GameOptions {
 return {...defaultOptions(),seed,
  seats:[{kind:'human'},...Array.from({length:settings.computerOpponents},()=>({kind:'computer' as const}))],
  computerStrengths:Array.from({length:settings.computerOpponents},()=> 'Normal' as const)};
}

export class NextGameSettingsDialog {
 readonly button=h('button',{id:'next-game-settings-button',type:'button','aria-label':'Settings for the next game'},'Settings');
 readonly dialog=h('dialog',{id:'next-game-settings-dialog',class:'game-help next-game-settings','aria-labelledby':'next-game-settings-title'});
 private readonly close=h('button',{id:'close-next-game-settings',type:'button'},'Close');
 private readonly opponents=h('select',{id:'next-game-opponents'},...[1,2,3].map(n=>h('option',{value:String(n)},String(n))));
 private readonly error=h('p',{role:'alert',class:'match-error'});
 constructor(private readonly store:NextGameStore=browserNextGames,onOpen?:()=>void,onClose?:()=>void){
  this.close.onclick=()=>this.dialog.close();
  this.dialog.append(h('header',{class:'game-help-head'},h('h2',{id:'next-game-settings-title'},'Settings'),this.close),
   h('p',{},'Applies to the next game.'),
   h('div',{class:'next-game-setting'},h('label',{for:this.opponents.id},'Computer opponents'),this.opponents),this.error);
  this.button.onclick=()=>{onOpen?.();this.opponents.value=String(readNextGameSettings(this.store).computerOpponents);this.error.textContent='';this.dialog.showModal();this.opponents.focus();};
  this.opponents.onchange=()=>{
   const before=readNextGameSettings(this.store),count=Number(this.opponents.value);
   if(saveNextGameSettings(count,this.store))this.error.textContent='';
   else{this.opponents.value=String(before.computerOpponents);this.error.textContent='Could not keep these settings on this device. Your current game is unchanged.';}
  };
  this.dialog.addEventListener('close',()=>onClose?.());
 }
 dispose():void {this.dialog.remove();}
}
