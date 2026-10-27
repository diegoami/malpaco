import {h} from './dom';
import {glyph} from './icons';

/** What the selected country can do: fight from it, or move armies from it. */
export type ProvinceActionKind='fight'|'move';

/**
 * T103 (owner, 2026-10-22): as in the original's layout, the action sits on the country you
 * selected: Attack and Move are separate icons when both are possible. Attack is
 * armed by a press, then an enemy tap fights one round; Move selects a transfer source.
 * A move-only country keeps its single Move command. The corner controls
 * stay. It follows the country's count through pans, zooms and rotations, and hides when that is
 * off screen.
 */
export class ProvinceAction {
 readonly el=h('button',{id:'province-action-button',type:'button',class:'card-icon primary province-action',hidden:true});
 readonly moveEl=h('button',{id:'province-move-button',type:'button',class:'card-icon province-action',hidden:true,'data-kind':'move','aria-label':'Move armies from here',title:'Move armies from here'},glyph('move'));
 private country:string|null=null;
 private frame:number|null=null;
 private press:()=>void=()=>{};
 private move:(()=>void)|null=null;
 constructor(){this.el.addEventListener('click',e=>{e.stopPropagation();if(!this.el.disabled)this.press();});this.moveEl.addEventListener('click',e=>{e.stopPropagation();if(!this.moveEl.disabled)this.move?.();});}
 show(country:string,kind:ProvinceActionKind,enabled:boolean,pressed:boolean,press:()=>void,move:(()=>void)|null=null):void{
  const name=kind==='fight'?(pressed?'Attack: tap an enemy neighbour':'Attack'):(pressed?'Move: tap where to':'Move armies from here');
  this.el.setAttribute('aria-pressed',String(pressed));
  const both=kind==='fight'&&move!==null;
  if(this.el.dataset['kind']!==kind||this.el.dataset['both']!==String(both)){
   this.el.replaceChildren(both?glyph('attack'):document.createTextNode(kind==='fight'?'ATTACK':'MOVE'));
   this.el.dataset['kind']=kind;this.el.dataset['both']=String(both);
  }
  this.el.setAttribute('aria-label',name);this.el.title=name;this.el.disabled=!enabled;this.el.dataset['for']=country;
  this.press=press;
  this.move=move;this.moveEl.disabled=!enabled;this.moveEl.dataset['for']=country;
  if(!move)this.moveEl.hidden=true;
  if(this.country!==country){this.country=country;this.place();}
  if(this.frame===null)this.track();
 }
 hide():void{
  this.country=null;this.el.hidden=true;this.moveEl.hidden=true;this.move=null;delete this.el.dataset['for'];delete this.moveEl.dataset['for'];
  if(this.frame!==null){cancelAnimationFrame(this.frame);this.frame=null;}
 }
 private track():void{this.frame=requestAnimationFrame(()=>{this.frame=null;if(!this.country)return;this.place();this.track();});}
 /** Right of the country's count, or left of it near the right edge; hidden when the count is not on screen. */
 private place():void{
  const count=this.country?document.querySelector(`[data-country="${CSS.escape(this.country)}"] .count`):null;
  const box=count?.getBoundingClientRect();
  if(!box||!box.width||box.right<0||box.left>innerWidth||box.bottom<0||box.top>innerHeight){this.el.hidden=true;this.moveEl.hidden=true;return;}
  this.el.hidden=false;this.moveEl.hidden=!this.move;
  const primaryWidth=this.el.offsetWidth||120,moveWidth=this.move?this.moveEl.offsetWidth||48:0,gap=8;
  const width=primaryWidth+(this.move?moveWidth+gap:0),height=Math.max(this.el.offsetHeight||48,this.move?this.moveEl.offsetHeight:0);
  const candidates=[{x:box.right+gap,y:box.top+box.height/2-height/2},{x:box.left-gap-width,y:box.top+box.height/2-height/2},{x:box.left+box.width/2-width/2,y:box.bottom+gap},{x:box.left+box.width/2-width/2,y:box.top-gap-height}];
  const obstacles=[...document.querySelectorAll('[data-country] .count,#turn-tracker,.game-corner,.map-camera-controls,#game-focus-drawer:not([hidden])')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
  const fit=(p:{x:number;y:number})=>({x:Math.min(Math.max(4,p.x),innerWidth-width-4),y:Math.min(Math.max(4,p.y),innerHeight-height-4)});
  const score=(p:{x:number;y:number})=>obstacles.reduce((n,r)=>n+Math.max(0,Math.min(p.x+width,r.right)-Math.max(p.x,r.left))*Math.max(0,Math.min(p.y+height,r.bottom)-Math.max(p.y,r.top)),0);
  const fitted=candidates.map(fit),clear=fitted.filter(p=>p.x>=box.right||p.x+width<=box.left||p.y>=box.bottom||p.y+height<=box.top);
  const point=(clear.length?clear:fitted).sort((a,b)=>score(a)-score(b))[0]!;
  const moveFirst=!!this.move&&point.x+width<=box.left;
  this.el.style.left=`${Math.round(point.x+(moveFirst?moveWidth+gap:0))}px`;
  this.el.style.top=`${Math.round(point.y)}px`;
  this.moveEl.style.left=`${Math.round(point.x+(moveFirst?0:primaryWidth+gap))}px`;
  this.moveEl.style.top=this.el.style.top;
 }
 dispose():void{this.hide();this.el.remove();this.moveEl.remove();}
}
