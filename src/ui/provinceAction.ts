import {h} from './dom';
import {glyph} from './icons';

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
  const name=kind==='fight'?(pressed?'Fight: tap an enemy neighbour':'Fight'):(pressed?'Move: tap where to':'Move armies from here');
  this.el.setAttribute('aria-pressed',String(pressed));
  if(this.el.dataset['kind']!==kind){this.el.replaceChildren(glyph(kind==='fight'?'attack':'move'));this.el.dataset['kind']=kind;}
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
  const size=44,gap=6,right=box.right+gap+size<=innerWidth-4;
  this.el.style.left=`${Math.round(right?box.right+gap:box.left-gap-size)}px`;
  this.el.style.top=`${Math.round(Math.min(Math.max(4,box.top+box.height/2-size/2),innerHeight-size-4))}px`;
  this.el.hidden=false;
 }
 dispose():void{this.hide();this.el.remove();}
}
