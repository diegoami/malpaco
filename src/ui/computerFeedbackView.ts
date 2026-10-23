import type {GameState} from '../core';
import type {FeedbackFrame} from './computerFeedback';
import {s} from './dom';
import {badgeScale,countLabel,seatLook} from './palette';
const classes=['computer-reinforce','computer-attacker','computer-defender','computer-hit','computer-moving','computer-shield'];
/** Repainted after the ordinary authoritative renderer; overlays never accept pointer input. */
export function paintComputerFeedback(svg:SVGSVGElement,state:GameState,frame:FeedbackFrame|null):void {
 svg.dataset['computerFeedback']=frame?.kind??'';
 const changes=new Map(frame?.changes.map(c=>[c.id,c])??[]);
 for(const node of svg.querySelectorAll<SVGGElement>('[data-country]')){
  const id=node.dataset['country']!,c=changes.get(id),moving=frame?.kind==='friendlyMove'||frame?.kind==='captureMove',fighting=frame?.kind==='attack'||frame?.kind==='raidTarget';
  const flags=[Boolean(frame?.kind==='reinforce'&&c),Boolean(fighting&&id===frame?.from),Boolean(fighting&&id===frame?.to),Boolean(fighting&&c&&c.after<c.before&&frame!.progress>=.3),Boolean(moving&&(id===frame?.from||id===frame?.to)),Boolean(frame?.shielded&&id===frame.to)];
  classes.forEach((name,i)=>node.classList.toggle(name,flags[i]!));
  if(!frame||!c)continue;
  const progress=frame.reduced?1:fighting?Math.max(0,(frame.progress-.3)/.7):frame.progress,n=Math.round(c.before+(c.after-c.before)*progress),owner=frame.progress<.7?c.ownerBefore:c.ownerAfter,look=seatLook(state.players.findIndex(p=>p.id===owner));
  const count=node.querySelector<SVGTextElement>('.count')!,badge=node.querySelector<SVGPathElement>('.badge')!;
  count.textContent=countLabel(n);badge.setAttribute('d',look.badge);badge.style.stroke=look.color;badge.setAttribute('transform',`translate(${count.getAttribute('x')},${Number(count.getAttribute('y'))-5}) scale(${badgeScale(count.getComputedTextLength())})`);
  (node.querySelector('.cell') as SVGElement).style.fill=look.color;
  node.dataset['feedbackBefore']=String(c.before);node.dataset['feedbackAfter']=String(c.after);node.dataset['feedbackProgress']=String(frame.progress);
 }
 let layer=svg.querySelector<SVGGElement>('.computer-action-layer');
 if(!frame||!frame.from||!frame.to||frame.reduced||!['captureMove','friendlyMove'].includes(frame.kind)){layer?.remove();return;}
 const world=svg.querySelector<SVGGElement>('.map-camera-content');if(!world)return;
 const a=svg.querySelector<SVGGraphicsElement>(`[data-country="${CSS.escape(frame.from)}"] .count`),b=svg.querySelector<SVGGraphicsElement>(`[data-country="${CSS.escape(frame.to)}"] .count`),matrix=world.getScreenCTM();if(!a||!b||!matrix)return;
 const point=(node:SVGGraphicsElement)=>{const r=node.getBoundingClientRect();return {x:r.x+r.width/2,y:r.top-12};},start=point(a),end=point(b),control={x:(start.x+end.x)/2,y:Math.min(start.y,end.y)-18},inverse=matrix.inverse();
 const convert=(p:{x:number;y:number})=>new DOMPoint(p.x,p.y).matrixTransform(inverse),p=convert(start),q=convert(end),r=convert(control),scale=Math.hypot(matrix.a,matrix.b);
 if(!layer){layer=s('g',{class:'computer-action-layer','aria-hidden':'true','pointer-events':'none'});world.append(layer);}
 const route=s('path',{class:'computer-transfer-trail',d:`M${p.x} ${p.y}Q${r.x} ${r.y} ${q.x} ${q.y}`,fill:'none','vector-effect':'non-scaling-stroke'});
 const dots=[0,.12,.24].map(offset=>{const t=Math.max(0,frame.progress-offset),x=(1-t)*(1-t)*p.x+2*(1-t)*t*r.x+t*t*q.x,y=(1-t)*(1-t)*p.y+2*(1-t)*t*r.y+t*t*q.y;return s('circle',{cx:x,cy:y,r:(4-offset*5)/scale,class:'computer-troop',opacity:1-offset*2});});
 layer.replaceChildren(route,...dots);
}
