/** Display-only preference: never enters immutable match options or replay data. */
export type ButtonLabels='text'|'icons';
export const BUTTON_LABELS_KEY='malpaco:button-labels';
export const BUTTON_LABELS_CHANGED='malpaco:button-labels-changed';
export function readButtonLabels():ButtonLabels {
 try{return localStorage.getItem(BUTTON_LABELS_KEY)==='icons'?'icons':'text';}catch{return 'text';}
}
export function saveButtonLabels(value:unknown):boolean {
 if(value!=='text'&&value!=='icons')return false;
 try{localStorage.setItem(BUTTON_LABELS_KEY,value);}catch{return false;}
 window.dispatchEvent(new Event(BUTTON_LABELS_CHANGED));return true;
}
