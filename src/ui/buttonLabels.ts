import type {GameState} from '../core';
/** Display-only preference: never enters immutable match options or replay data. */
export type ButtonLabels='text'|'icons'|'auto';
export const BUTTON_LABELS_KEY='malpaco:button-labels';
export const BUTTON_LABELS_CHANGED='malpaco:button-labels-changed';
export function readButtonLabels():ButtonLabels {
 try{const value=localStorage.getItem(BUTTON_LABELS_KEY);return value==='icons'||value==='text'?value:'auto';}catch{return 'auto';}
}
export function effectiveButtonLabels(value:ButtonLabels,completedTurns:number):'text'|'icons' {return value==='auto'?(completedTurns>=2?'icons':'text'):value;}
/** A replayed turn-ended entry counts a personal turn, regardless of seeded round origin. */
export function completedPersonalTurns(state:GameState):number {
 const human=state.players.find(p=>p.kind==='human');return human?state.log.filter(e=>e.event==='turn_ended'&&e.player===human.id).length:0;
}
export function updateButtonLabelProgress(completed:number):void {
 const value=String(completed);if(document.body.dataset['personalTurnsCompleted']===value)return;
 document.body.dataset['personalTurnsCompleted']=value;window.dispatchEvent(new Event(BUTTON_LABELS_CHANGED));
}
export function saveButtonLabels(value:unknown):boolean {
 if(value!=='text'&&value!=='icons'&&value!=='auto')return false;
 try{localStorage.setItem(BUTTON_LABELS_KEY,value);}catch{return false;}
 window.dispatchEvent(new Event(BUTTON_LABELS_CHANGED));return true;
}
