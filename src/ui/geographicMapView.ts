import type {GameMap,Point} from '../core';
import type {IslandGeography} from '../core/island-geography';
import type {Presentation} from './generatedGeographyPresentation';
import type {MapHandlers,MapViewState} from './mapView';
import {s} from './dom';
import {seatLook} from './palette';

/** Render the prepared drawing; all interactive targets come from core state. */
export class GeographicMapView {
 readonly el:SVGSVGElement;
 constructor(map:GameMap,geography:IslandGeography,handlers:MapHandlers,presentation:Presentation){
  void geography;
  const q=1,b=presentation.bounds;
  const drawing=new Map(presentation.provinces.map(province=>[province.id,province]));
  const point=([x,y]:Point)=>`${x/q},${y/q}`;
  const ring=(points:readonly Point[])=>'M'+points.map(point).join('L')+'Z';
  this.el=s('svg',{id:'geographic-map',viewBox:`${b.x/q} ${b.y/q} ${b.width/q} ${b.height/q}`,'aria-label':'Generated island map',role:'group'},s('rect',{class:'water',x:b.x/q,y:b.y/q,width:b.width/q,height:b.height/q}));
  for(const r of presentation.routes)this.el.append(s('polyline',{class:'lane','data-edge':[r.from,r.to].sort().join('|'),points:r.points.map(point).join(' ')}));
  for(const i of presentation.islands)this.el.append(s('path',{class:'coast',d:ring(i.polygon)}));
  const nodes=map.provinces.map(p=>{
   const display=drawing.get(p.id);if(!display)throw Error(`Missing drawing for ${p.id}`);
   const [x,y]=display.labelAt.map(v=>v/q) as [number,number];
   const node=s('g',{class:'country province','data-id':p.id,'data-country':p.id,'data-province':p.id,tabindex:0,role:'button','aria-label':p.name},s('title',{},p.name),s('path',{class:'cell country-shape',d:ring(display.polygon)}),s('g',{class:'country-label'},s('path',{class:'badge'}),
    // [designed] Existing reference badge dimensions and five-unit baseline offset.
    s('text',{class:'count army-count',x,y:y+5},'0'),s('text',{class:'name',x,y:y-18},p.name),s('text',{class:'centre',x:x-25,y:y-23},'★')));
   node.onclick=e=>handlers.onProvince(p.id,{inspect:e.shiftKey,repeat:false});
   node.onpointerenter=()=>handlers.onHover(p.id);node.onpointerleave=()=>handlers.onHover(null);
   return node;
  });
  nodes.forEach((node,index)=>{node.onkeydown=e=>{
   if(e.key==='Enter'||e.key===' '){e.preventDefault();handlers.onProvince(node.dataset['country']!,{inspect:e.shiftKey,repeat:e.repeat});}
   if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();nodes[(index+(['ArrowRight','ArrowDown'].includes(e.key)?1:nodes.length-1))%nodes.length]!.focus();}
  };this.el.append(node);});
  this.el.onclick=e=>{if(!(e.target as Element).closest('[data-country]'))handlers.onBackground();};
 }
 render(view:MapViewState){const{state}=view;
  for(const n of this.el.querySelectorAll<SVGGElement>('[data-country]')){
   const id=n.dataset['country']!,seat=state.players.findIndex(p=>p.id===state.ownerOf[id]),look=seatLook(seat);
   n.dataset['owner']=state.ownerOf[id]!;n.dataset['armies']=String(state.armies[id]);n.dataset['selected']=String(view.selected===id);n.dataset['target']=String(view.targets.includes(id));
   n.classList.toggle('selected',view.selected===id);n.classList.toggle('neighbor',view.targets.includes(id));n.setAttribute('aria-pressed',String(view.selected===id));
   const description=`${state.map.provinces.find(p=>p.id===id)!.name}, Seat ${seat+1}, ${state.armies[id]} armies, ${state.players[seat]!.name}`;
   n.setAttribute('aria-label',description);n.querySelector('title')!.textContent=description;
   (n.querySelector('.cell') as SVGElement).style.fill=look.color;
   const count=n.querySelector('.count')!,badge=n.querySelector('.badge')!;count.textContent=String(state.armies[id]);badge.setAttribute('d',look.badge);
   // [designed] Reference ownership shapes fit a 44 x 20 label reservation.
   const [width,height]=([[94,34],[76,34],[60,34],[76,38]] as const)[seat]!;
   badge.setAttribute('transform',`translate(${count.getAttribute('x')},${Number(count.getAttribute('y'))-5}) scale(${44/width},${20/height})`);
   (n.querySelector('.centre') as SVGElement).style.display=state.productionCentres.includes(id)?'':'none';
  }
  for(const route of this.el.querySelectorAll<SVGPolylineElement>('.lane'))route.classList.toggle('active',route.dataset['edge']!.split('|').includes(view.selected??''));
 }
}
