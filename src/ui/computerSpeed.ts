/** Presentation preference only; never part of match options or replay data. */
export const COMPUTER_SPEEDS=['slow','normal','fast','very-fast'] as const;
export type ComputerSpeed=typeof COMPUTER_SPEEDS[number];
export const COMPUTER_SPEED_KEY='malpaco:computer-speed';
export const COMPUTER_SPEED_CHANGED='malpaco:computer-speed-changed';
export function readComputerSpeed():ComputerSpeed {
 try{const value=localStorage.getItem(COMPUTER_SPEED_KEY);return COMPUTER_SPEEDS.includes(value as ComputerSpeed)?value as ComputerSpeed:'normal';}catch{return 'normal';}
}
export function saveComputerSpeed(value:unknown):boolean {
 if(!COMPUTER_SPEEDS.includes(value as ComputerSpeed))return false;
 try{localStorage.setItem(COMPUTER_SPEED_KEY,value as ComputerSpeed);}catch{return false;}
 window.dispatchEvent(new Event(COMPUTER_SPEED_CHANGED));return true;
}
export function computerSpeedLabel(value:ComputerSpeed):string {return value==='very-fast'?'Very fast':value[0]!.toUpperCase()+value.slice(1);}
