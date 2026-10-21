// Adapt the geographical drawing to stable canonical game-country IDs.
import drawing from "../../fixtures/new-game/T65/map.svg?raw";
import {s} from "./dom";
import {badgeScale,seatLook} from "./palette";
import {MapCamera} from "./mapCamera";
import type {GameMap} from "../core";
import type {MapHandlers,MapViewState} from "./mapView";
export class ReferenceMapView{
 readonly el:SVGSVGElement;
 readonly camera:MapCamera;
 constructor(_map:GameMap,handlers:MapHandlers){
  this.el=new DOMParser().parseFromString(drawing,"image/svg+xml").documentElement as unknown as SVGSVGElement;
  this.el.id="reference-map";this.el.setAttribute("aria-label","Nine Isles reference map");
  // The sketches' dark shelf under each island and its routes.
  const firstLane=this.el.querySelector(".lane");
  for(const coast of this.el.querySelectorAll(".coast"))this.el.insertBefore(s("path",{class:"shelf",d:coast.getAttribute("d")!}),firstLane);
  const nodes=[...this.el.querySelectorAll<SVGGElement>(".country")];
  for(const[j,n]of nodes.entries()){
   const id=n.dataset["id"]!;
   n.dataset["country"]=id;n.dataset["province"]=id;n.classList.add("province");
   n.querySelector(".cell")!.classList.add("country-shape");n.querySelector(".count")!.classList.add("army-count");
   // [designed] Reuse the score legend's ownership silhouettes within the existing label reservation.
   n.querySelector(".badge")!.replaceWith(s("path",{class:"badge"}));
   if(!n.querySelector(".centre"))n.append(s("text",{class:"centre",x:Number(n.querySelector(".count")!.getAttribute("x"))-25,y:Number(n.querySelector(".count")!.getAttribute("y"))-28},"★"));
   n.onclick=e=>handlers.onProvince(id,{inspect:e.shiftKey,repeat:false});n.onpointerenter=()=>handlers.onHover(id);n.onpointerleave=()=>handlers.onHover(null);
   n.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();handlers.onProvince(id,{inspect:e.shiftKey,repeat:e.repeat});}if(["ArrowRight","ArrowDown","ArrowLeft","ArrowUp"].includes(e.key)){e.preventDefault();nodes[(j+(["ArrowRight","ArrowDown"].includes(e.key)?1:nodes.length-1))%nodes.length]!.focus();}};
  }
  this.el.onclick=e=>{if(!(e.target as Element).closest(".country"))handlers.onBackground();};
  const[x,y,width,height]=this.el.getAttribute("viewBox")!.split(/[\s,]+/).map(Number) as [number,number,number,number];
  this.camera=new MapCamera(this.el,{x,y,width,height});
 }
 render(view:MapViewState){const{state}=view;
  for(const n of this.el.querySelectorAll<SVGGElement>(".country")){
   const id=n.dataset["country"]!,seat=state.players.findIndex(p=>p.id===state.ownerOf[id]);
   n.dataset["owner"]=state.ownerOf[id]!;n.dataset["armies"]=String(state.armies[id]);n.dataset["target"]=String(view.targets.includes(id));n.dataset["selected"]=String(view.selected===id);
   n.classList.toggle("selected",view.selected===id);
   // T82: a pending capture's two countries keep dashed badges until Confirm.
   n.classList.toggle("pending",!!state.pendingCapture&&(state.pendingCapture.from===id||state.pendingCapture.to===id));n.classList.toggle("neighbor",view.targets.includes(id));n.setAttribute("aria-pressed",String(view.selected===id));
   const description=`${state.map.provinces.find(p=>p.id===id)!.name}, Seat ${seat+1}, ${state.armies[id]} armies, ${state.players[seat]!.name}`;
   n.setAttribute("aria-label",description);n.querySelector("title")!.textContent=description;
   const badge=n.querySelector<SVGPathElement>(".badge")!,count=n.querySelector<SVGTextElement>(".count")!;
   badge.setAttribute("d",seatLook(seat).badge);badge.style.stroke=seatLook(seat).color;
   (n.querySelector(".cell") as SVGElement).style.fill=seatLook(seat).color;count.textContent=String(state.armies[id]);
   badge.setAttribute("transform",`translate(${count.getAttribute("x")},${Number(count.getAttribute("y"))-5}) scale(${badgeScale(count.getComputedTextLength())})`);
   (n.querySelector(".centre") as SVGElement).style.display=state.productionCentres.includes(id)?"":"none";
  }
  this.el.dataset["choosing"]=String(view.selected!==null);
  for(const r of this.el.querySelectorAll<SVGPolylineElement>(".lane"))r.classList.toggle("active",r.dataset["edge"]!.split("|").includes(view.selected??""));
 }
}
