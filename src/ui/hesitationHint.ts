import {h} from './dom';

/** [designed] T103: how long the player may pause on their own turn before the hint shows. */
export const HESITATION_DELAY = 4000;

/**
 * T103: a pulsing arrow beside the control the player most likely needs, shown only after a pause
 * with no input. Any pointer or key input hides it and restarts the wait. Presentation only: the
 * arrow is hidden from assistive technology and takes no pointer; the control keeps its own label.
 */
export class HesitationHint {
 readonly el=h('div',{class:'hesitation-hint','aria-hidden':'true',hidden:true});
 private timer:number|null=null;
 private target:string|null=null;
 private readonly onInput=()=>{this.hide();this.arm();};
 constructor(){
  window.addEventListener('pointerdown',this.onInput,{capture:true});
  window.addEventListener('keydown',this.onInput,{capture:true});
  window.addEventListener('resize',this.onInput);
 }
 /** The control to point at (an element id), or null when nothing should be suggested now. */
 want(id:string|null):void{
  if(id===this.target)return;
  this.target=id;this.hide();this.arm();
 }
 private arm():void{
  if(this.timer!==null)window.clearTimeout(this.timer);
  this.timer=this.target?window.setTimeout(()=>{this.timer=null;this.show();},HESITATION_DELAY):null;
 }
 private show():void{
  const target=this.target?document.getElementById(this.target):null;
  const box=target?.getBoundingClientRect();
  if(!target||!box||!box.width||(target as HTMLButtonElement).disabled)return;
  // Beside the control when there is room on its left; else above it; else below it.
  const side=box.left>=56?'left':box.top>=56?'above':'below';
  const x=side==='left'?box.left-44:box.left+box.width/2-18,y=side==='left'?box.top+box.height/2-18:side==='above'?box.top-44:box.bottom+8;
  this.el.dataset['side']=side;this.el.dataset['for']=this.target!;
  this.el.style.left=`${Math.round(x)}px`;this.el.style.top=`${Math.round(y)}px`;
  this.el.hidden=false;
 }
 hide():void{this.el.hidden=true;}
 dispose():void{
  if(this.timer!==null)window.clearTimeout(this.timer);
  window.removeEventListener('pointerdown',this.onInput,{capture:true});
  window.removeEventListener('keydown',this.onInput,{capture:true});
  window.removeEventListener('resize',this.onInput);
  this.el.remove();
 }
}
