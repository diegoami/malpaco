import {centresVisible,renderEventMark} from './eventMark';
import type {GameMap,Point} from '../core';
import type {IslandGeography} from '../core/island-geography';
import type {Presentation} from './generatedGeographyPresentation';
import type {MapHandlers,MapViewState} from './mapView';
import {s} from './dom';
import {badgeScale,countLabel,seatLook,seatName,TARGET_MARK} from './palette';
import {MapCamera} from './mapCamera';
import {NameLayer} from './nameLayer';

/** Render the prepared drawing; all interactive targets come from core state. */
export class GeographicMapView {
 readonly el:SVGSVGElement;
 readonly camera:MapCamera;
 private readonly names:NameLayer;
 constructor(map:GameMap,geography:IslandGeography,handlers:MapHandlers,presentation:Presentation){
  void geography;
  const q=1,b=presentation.bounds;
  const drawing=new Map(presentation.provinces.map(province=>[province.id,province]));
  const point=([x,y]:Point)=>`${x/q},${y/q}`;
  const ring=(points:readonly Point[])=>'M'+points.map(point).join('L')+'Z';
  this.el=s('svg',{id:'geographic-map',viewBox:`${b.x/q} ${b.y/q} ${b.width/q} ${b.height/q}`,'aria-label':'Generated island map',role:'group'},s('rect',{class:'water',x:b.x/q,y:b.y/q,width:b.width/q,height:b.height/q}));
  // Layered shoreline after the sketches: a dark shelf under the routes, then a light
  // coast whose outer half shows beyond the countries drawn over it.
  for(const i of presentation.islands)this.el.append(s('path',{class:'shelf',d:ring(i.polygon)}));
  for(const r of presentation.routes)this.el.append(s('polyline',{class:'lane','data-edge':[r.from,r.to].sort().join('|'),points:r.points.map(point).join(' ')}));
  for(const i of presentation.islands)this.el.append(s('path',{class:'coast',d:ring(i.polygon)}));
  const nodes=map.provinces.map(p=>{
   const display=drawing.get(p.id);if(!display)throw Error(`Missing drawing for ${p.id}`);
   const [x,y]=display.labelAt.map(v=>v/q) as [number,number];
   const node=s('g',{class:'country province','data-id':p.id,'data-country':p.id,'data-province':p.id,tabindex:0,role:'button','aria-label':p.name},s('title',{},p.name),s('path',{class:'cell country-shape',d:ring(display.polygon)}),s('path',{class:'ring',d:ring(display.polygon)}),s('g',{class:'country-label'},s('path',{class:'target-mark',d:TARGET_MARK,transform:`translate(${x} ${y})`}),s('path',{class:'badge'}),
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
  // Endpoint stems extend from the reserved sea port into its actual country.
  // Paint above the coast/cells so shore outlines cannot hide the connection.
  for(const route of presentation.routes){
   const edge=[route.from,route.to].sort().join('|');
   const names=[route.from,route.to].map(id=>map.provinces.find(p=>p.id===id)!.name);
   const ports=s('g',{class:'lane-ports','data-edge':edge,'aria-label':`Sea connection: ${names.join(' ↔ ')}`},s('title',{},names.join(' ↔ ')));
   for(const [id,port] of [[route.from,route.points[0]!],[route.to,route.points.at(-1)!]] as const){
    const centre=drawing.get(id)!.labelAt,dx=centre[0]-port[0],dy=centre[1]-port[1],distance=Math.hypot(dx,dy),fraction=Math.min(.45,24/Math.max(1,distance));
    const x=port[0]+dx*fraction,y=port[1]+dy*fraction;
    ports.append(s('line',{class:'lane-port-stem',x1:port[0],y1:port[1],x2:x,y2:y}),s('circle',{class:'lane-port','data-port-country':id,cx:x,cy:y,r:4}));
   }
   this.el.append(ports);
  }
  this.names=new NameLayer(nodes);this.el.append(this.names.el);
  this.el.onclick=e=>{if(!(e.target as Element).closest('[data-country]'))handlers.onBackground();};
  this.camera=new MapCamera(this.el,{x:b.x/q,y:b.y/q,width:b.width/q,height:b.height/q});
 }
 render(view:MapViewState){const{state}=view;
  for(const n of this.el.querySelectorAll<SVGGElement>('[data-country]')){
   const id=n.dataset['country']!,seat=state.players.findIndex(p=>p.id===state.ownerOf[id]),look=seatLook(seat);
   n.dataset['owner']=state.ownerOf[id]!;n.dataset['armies']=String(state.armies[id]);n.dataset['selected']=String(view.selected===id);n.dataset['target']=String(view.targets.includes(id));
   n.classList.toggle('selected',view.selected===id);n.classList.toggle('target',view.target===id&&view.selected!==id);
   // T82: a pending capture's two countries keep dashed badges until Confirm.
   n.classList.toggle('pending',!!state.pendingCapture&&(state.pendingCapture.from===id||state.pendingCapture.to===id));n.classList.toggle('neighbor',view.targets.includes(id));n.setAttribute('aria-pressed',String(view.selected===id));
   const description=`${state.map.provinces.find(p=>p.id===id)!.name}, ${seatName(state.players,state.ownerOf[id])}, ${state.armies[id]} armies`;
   n.setAttribute('aria-label',description);n.querySelector('title')!.textContent=description;
   if(state.rules.events)renderEventMark(n,view.eventMarks?.includes(id)??false);
   (n.querySelector('.cell') as SVGElement).style.fill=look.color;
   const count=n.querySelector<SVGTextElement>('.count')!,badge=n.querySelector<SVGPathElement>('.badge')!;count.textContent=countLabel(state.armies[id]!);badge.setAttribute('d',look.badge);badge.style.stroke=look.color;
   badge.setAttribute('transform',`translate(${count.getAttribute('x')},${Number(count.getAttribute('y'))-5}) scale(${badgeScale(count.getComputedTextLength())})`);
   (n.querySelector('.centre') as SVGElement).style.display=centresVisible(state)&&state.productionCentres.includes(id)?'':'none';
  }
  this.names.select(view.selected);
  this.el.dataset['choosing']=String(view.selected!==null);
  for(const route of this.el.querySelectorAll<SVGElement>('.lane, .lane-ports'))route.classList.toggle('active',route.dataset['edge']!.split('|').includes(view.selected??''));
 }
}
