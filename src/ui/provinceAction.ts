import {h} from './dom';

/** What the selected country can do: fight from it, or move armies from it. */
export type ProvinceActionKind='fight'|'move';

/**
 * T103 (owner, 2026-10-22): as in the original's layout, the action sits on the country you
 * selected: Fight when it can attack (press it, then tap an enemy: one round; press again for
 * another), else Move when it can move armies (press it, then tap where to). The corner controls
 * stay. It follows the country's count through pans, zooms and rotations, and hides when that is
 * off screen.
 */
export class ProvinceAction {
 readonly el=h('button',{id:'province-action-button',type:'button',class:'card-icon primary province-action',hidden:true});
 private country:string|null=null;
 private frame:number|null=null;
 private press:()=>void=()=>{};
 constructor(){this.el.addEventListener('click',e=>{e.stopPropagation();if(!this.el.disabled)this.press();});}
 show(country:string,kind:ProvinceActionKind,enabled:boolean,pressed:boolean,press:()=>void):void{
  const name=kind==='fight'?(pressed?'Attack: tap an enemy neighbour':'Attack'):(pressed?'Move: tap where to':'Move armies from here');
  this.el.setAttribute('aria-pressed',String(pressed));
  if(this.el.dataset['kind']!==kind){this.el.textContent=kind==='fight'?'ATTACK':'MOVE';this.el.dataset['kind']=kind;}
  this.el.setAttribute('aria-label',name);this.el.title=name;this.el.disabled=!enabled;this.el.dataset['for']=country;
  this.press=press;
  if(this.country!==country){this.country=country;this.place();}
  if(this.frame===null)this.track();
 }
 hide():void{
  this.country=null;this.el.hidden=true;delete this.el.dataset['for'];
  if(this.frame!==null){cancelAnimationFrame(this.frame);this.frame=null;}
 }
 private track():void{this.frame=requestAnimationFrame(()=>{this.frame=null;if(!this.country)return;this.place();this.track();});}
 /** Right of the country's count, or left of it near the right edge; hidden when the count is not on screen. */
 private place():void{
  const count=this.country?document.querySelector(`[data-country="${CSS.escape(this.country)}"] .count`):null;
  const box=count?.getBoundingClientRect();
  if(!box||!box.width||box.right<0||box.left>innerWidth||box.bottom<0||box.top>innerHeight){this.el.hidden=true;return;}
  const width=this.el.offsetWidth||120,height=44,gap=8;
  const candidates=[{x:box.right+gap,y:box.top+box.height/2-height/2},{x:box.left-gap-width,y:box.top+box.height/2-height/2},{x:box.left+box.width/2-width/2,y:box.bottom+gap},{x:box.left+box.width/2-width/2,y:box.top-gap-height}];
  const obstacles=[...document.querySelectorAll('[data-country] .count,#turn-tracker,.game-corner,.map-camera-controls')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
  const fit=(p:{x:number;y:number})=>({x:Math.min(Math.max(4,p.x),innerWidth-width-4),y:Math.min(Math.max(4,p.y),innerHeight-height-4)});
  const score=(p:{x:number;y:number})=>obstacles.reduce((n,r)=>n+Math.max(0,Math.min(p.x+width,r.right)-Math.max(p.x,r.left))*Math.max(0,Math.min(p.y+height,r.bottom)-Math.max(p.y,r.top)),0);
  const point=candidates.map(fit).sort((a,b)=>score(a)-score(b))[0]!;
  this.el.style.left=`${Math.round(point.x)}px`;
  this.el.style.top=`${Math.round(point.y)}px`;
  this.el.hidden=false;
 }
 dispose():void{this.hide();this.el.remove();}
}
