import {s} from './dom';

/**
 * The active country's name, drawn once more above every country: a name lives inside its own
 * country, so a country painted later (often the chosen target) could cover it. SVG has no
 * z-index, and moving the country to the end would change the keyboard order, so the copy is the
 * last group painted, and the camera grows and turns it upright with the labels.
 * Active means hovered, else focused, else selected. Presentation only; it takes no pointer.
 */
export class NameLayer {
 readonly el:SVGGElement;
 private readonly anchor:SVGTextElement;
 private readonly text:SVGTextElement;
 private hover:SVGGElement|null=null;
 private focus:SVGGElement|null=null;
 private selected:SVGGElement|null=null;
 constructor(private readonly nodes:readonly SVGGElement[]){
  // The camera places a label group by its count; this hidden count carries the active anchor.
  this.anchor=s('text',{class:'count',visibility:'hidden'});
  this.text=s('text',{class:'name'});
  this.el=s('g',{class:'name-top','aria-hidden':'true',display:'none'},this.anchor,this.text);
  for(const n of nodes){
   n.addEventListener('pointerenter',()=>{this.hover=n;this.sync();});
   n.addEventListener('pointerleave',()=>{if(this.hover===n){this.hover=null;this.sync();}});
   n.addEventListener('focus',()=>{this.focus=n;this.sync();});
   n.addEventListener('blur',()=>{if(this.focus===n){this.focus=null;this.sync();}});
  }
 }
 select(id:string|null){this.selected=this.nodes.find(n=>n.dataset['country']===id)??null;this.sync();}
 private sync(){
  const node=this.hover??this.focus??this.selected,label=node?.querySelector<SVGGElement>('.country-label'),name=label?.querySelector<SVGTextElement>('.name'),count=label?.querySelector<SVGTextElement>('.count');
  if(!label||!name||!count){this.el.setAttribute('display','none');return;}
  for(const a of ['x','y'])this.anchor.setAttribute(a,count.getAttribute(a)!),this.text.setAttribute(a,name.getAttribute(a)!);
  this.text.textContent=name.textContent;
  const transform=label.getAttribute('transform');
  if(transform)this.el.setAttribute('transform',transform);else this.el.removeAttribute('transform');
  this.el.removeAttribute('display');
 }
}
