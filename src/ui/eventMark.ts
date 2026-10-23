import {s} from './dom';
import type {GameState} from '../core';
export const centresVisible=(state:GameState):boolean=>!state.rules.events||state.rules.events.frequency!=='Off';
export function renderEventMark(node:SVGGElement,shown:boolean):void {
 let mark=node.querySelector<SVGCircleElement>('.world-event-mark');
 if(!mark){const count=node.querySelector<SVGTextElement>('.count')!;mark=s('circle',{class:'world-event-mark',r:3,cx:Number(count.getAttribute('x'))+22,cy:Number(count.getAttribute('y'))+13,'aria-hidden':'true'});node.querySelector('.country-label')!.append(mark);}
 mark.style.display=shown?'':'none';node.classList.toggle('world-event-affected',shown);node.dataset['worldEvent']=String(shown);
}
