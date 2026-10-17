import type { RngSnapshot } from "./types";
export type GeoPoint = [number, number];
export interface GeographyCountry { id: string; island: string; polygon: GeoPoint[]; labelAt: GeoPoint; borders: string[] }
export interface GeographyIsland { id: string; polygon: GeoPoint[]; provinces: string[] }
export interface GeographyCorridor { from: string; to: string; points: GeoPoint[] }
/** Partial construction only: no owners, armies, sea adjacency, bonuses or playable GameMap. */
export interface IslandGeography {
  version: "island-geography-v1";
  seed: number;
  unitsPerPixel: number;
  bounds: { x: number; y: number; width: number; height: number };
  islands: GeographyIsland[];
  provinces: GeographyCountry[];
  entranceReservations: GeographyCorridor[];
}
export interface GeographyFailure { attempt: number; constraints: string[]; candidate?: IslandGeography }
export type GeographyResult =
  | { ok: true; geography: IslandGeography; attempts: number; failures: GeographyFailure[]; rng: RngSnapshot }
  | { ok: false; attempts: number; failures: GeographyFailure[]; rng: RngSnapshot };

import { DeterministicRng } from "./rng";
import witness from "../../docs/prototypes/new-game/T34/witness.json" with { type: "json" };
type Ring = readonly GeoPoint[];
const Q = 2048; // [designed] Exact T64 coast/port precision; witness-provenance.json.
const MAX_ATTEMPTS = 50; // Owner-approved T24 attempt budget, parameters.mjs.
const key = (p: GeoPoint): string => `${p[0]},${p[1]}`;
const cross = (a: GeoPoint,b: GeoPoint,c: GeoPoint): number => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const equal = (a: GeoPoint,b: GeoPoint): boolean => a[0]===b[0]&&a[1]===b[1];
const dot = (a: GeoPoint,b: GeoPoint,c: GeoPoint): number => (c[0]-a[0])*(b[0]-a[0])+(c[1]-a[1])*(b[1]-a[1]);
const norm2 = (a: GeoPoint,b: GeoPoint): number => (a[0]-b[0])**2+(a[1]-b[1])**2;
function edges(ring:Ring): [GeoPoint,GeoPoint][] {return ring.map((p,j)=>[p,ring[(j+1)%ring.length]!] as [GeoPoint,GeoPoint]);}
function on(p:GeoPoint,a:GeoPoint,b:GeoPoint):boolean {return cross(a,b,p)===0&&dot(a,b,p)>=0&&dot(a,b,p)<=norm2(a,b);}
function meets(a:GeoPoint,b:GeoPoint,c:GeoPoint,d:GeoPoint):boolean {
 const u=cross(a,b,c),v=cross(a,b,d),w=cross(c,d,a),z=cross(c,d,b);
 return (u>0&&v<0||u<0&&v>0)&&(w>0&&z<0||w<0&&z>0)||on(a,c,d)||on(b,c,d)||on(c,a,b)||on(d,a,b);
}
function proper(a:GeoPoint,b:GeoPoint,c:GeoPoint,d:GeoPoint):boolean {
 const u=cross(a,b,c),v=cross(a,b,d),w=cross(c,d,a),z=cross(c,d,b);
 return (u>0&&v<0||u<0&&v>0)&&(w>0&&z<0||w<0&&z>0);
}
function locate(p:GeoPoint,ring:Ring):number {
 let winding=0;
 for(const[a,b]of edges(ring)){if(on(p,a,b))return 0;if(a[1]<=p[1]&&b[1]>p[1]&&cross(a,b,p)>0)winding++;if(a[1]>p[1]&&b[1]<=p[1]&&cross(a,b,p)<0)winding--;}
 return winding===0?-1:1;
}
function clean(ring:GeoPoint[]):GeoPoint[] {return ring.filter((p,j)=>!equal(p,ring[(j+ring.length-1)%ring.length]!));}
function simple(ring:Ring):boolean {
 if(ring.length<3)return false;const es=edges(ring);
 for(const[j,[a,b]]of es.entries()){if(equal(a,b))return false;for(let k=j+1;k<es.length;k++)if(k!==j+1&&!(j===0&&k===es.length-1)&&meets(a,b,...es[k]!))return false;}
 return true;
}
function shared(a:Ring,b:Ring):boolean {
 for(const[u,v]of edges(a))for(const[w,z]of edges(b)){
  if(cross(u,v,w)!==0||cross(u,v,z)!==0)continue;
  const axis=Math.abs(v[0]-u[0])>=Math.abs(v[1]-u[1])?0:1;
  if(Math.min(Math.max(u[axis],v[axis]),Math.max(w[axis],z[axis]))>Math.max(Math.min(u[axis],v[axis]),Math.min(w[axis],z[axis])))return true;
 }
 return false;
}
function derive(countries:GeographyCountry[]):void {
 for(const p of countries)p.borders=countries.filter(q=>q.id!==p.id&&q.island===p.island&&shared(p.polygon,q.polygon)).map(q=>q.id).sort();
}
function pointGap(p:GeoPoint,a:GeoPoint,b:GeoPoint,minimum:number):boolean {
 const n=norm2(a,b),t=dot(a,b,p),m2=minimum*minimum;
 if(n===0||t<=0)return norm2(p,a)>=m2;if(t>=n)return norm2(p,b)>=m2;
 return BigInt(cross(a,b,p))**2n>=BigInt(m2)*BigInt(n);
}
function segmentGap(a:GeoPoint,b:GeoPoint,c:GeoPoint,d:GeoPoint,minimum:number):boolean {
 return !meets(a,b,c,d)&&pointGap(a,c,d,minimum)&&pointGap(b,c,d,minimum)&&pointGap(c,a,b,minimum)&&pointGap(d,a,b,minimum);
}
function onlyEndpointContact(a:GeoPoint,b:GeoPoint,c:GeoPoint,d:GeoPoint,allowed:GeoPoint|undefined):boolean {
 if(!meets(a,b,c,d))return true;if(!allowed||!on(allowed,c,d)||!on(allowed,a,b))return false;
 const other=equal(a,allowed)?b:a;
 if(on(other,c,d))return false;
 for(const p of [c,d])if(on(p,a,b)&&!equal(p,allowed))return false;
 return !proper(a,b,c,d);
}
function lengthCeil(a:GeoPoint,b:GeoPoint):number {
 const square=norm2(a,b);let lo=0,hi=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
 while(lo<hi){const mid=Math.floor((lo+hi)/2);if(mid*mid>=square)hi=mid;else lo=mid+1;}return lo;
}
/** Integer nearest quotient, ties toward positive infinity like the witness quantization. */
function quotient(n:bigint,d:bigint):number {
 let q=n/d,r=n%d;if(r<0n){q--;r+=d;}return Number(q+(2n*r>=d?1n:0n));
}
function roundPoint(p: readonly number[]):GeoPoint {return [p[0]!,p[1]!];}
function newWitness(seed:number):IslandGeography {
 return {version:"island-geography-v1",seed,unitsPerPixel:Q,bounds:{...witness.bounds},islands:witness.islands.map(i=>({...i,polygon:i.polygon.map(roundPoint),provinces:[...i.provinces]})),provinces:witness.provinces.map(p=>({...p,polygon:p.polygon.map(roundPoint),labelAt:roundPoint(p.labelAt),borders:[]})),entranceReservations:witness.entranceReservations.map(r=>({...r,points:r.points.map(roundPoint)}))};
}
/** Local T1 exchange changes the subdivision graph without moving coast/labels/ports.
 * [designed] 1/4px half-edge, proved in retained flip-probe witnesses under unchanged T62.
 */
function flipSubdivisions(g:IslandGeography,rng:DeterministicRng):void {
 derive(g.provinces);
 const owners=new Map<string,string[]>(),all=new Map<string,{a:GeoPoint;b:GeoPoint;ids:string[]}>();
 for(const p of g.provinces)for(const[a,b]of edges(p.polygon)){
  const ak=key(a);owners.set(ak,[...(owners.get(ak)??[]),p.id]);
  const k=[key(a),key(b)].sort().join("|");if(!all.has(k))all.set(k,{a,b,ids:[]});all.get(k)!.ids.push(p.id);
 }
 const changed=new Set<string>();
 for(const e of rng.shuffled([...all.values()])){
  const {a,b,ids}=e;if(ids.length!==2||owners.get(key(a))!.length!==3||owners.get(key(b))!.length!==3)continue;
  const r=owners.get(key(a))!.find(id=>!ids.includes(id))!,s=owners.get(key(b))!.find(id=>!ids.includes(id))!;
  if(r===s)continue;
  const ps=[...ids,r,s].map(id=>g.provinces.find(p=>p.id===id)!);
  if(changed.has(ps[0]!.island))continue;
  const lanes=(id:string)=>g.entranceReservations.filter(r=>r.from===id||r.to===id).length;
  if(ps.slice(2).some(p=>p.borders.length>=4||p.borders.length+lanes(p.id)>=5)||rng.nextInt(0,1)===0)continue;
  const dx=b[0]-a[0],dy=b[1]-a[1],length=lengthCeil(a,b),half=Q/4;
  const mid:GeoPoint=[quotient(BigInt(a[0]+b[0]),2n),quotient(BigInt(a[1]+b[1]),2n)];
  const c:GeoPoint=[mid[0]+quotient(BigInt(-dy*half),BigInt(length)),mid[1]+quotient(BigInt(dx*half),BigInt(length))],d:GeoPoint=[mid[0]+quotient(BigInt(dy*half),BigInt(length)),mid[1]+quotient(BigInt(-dx*half),BigInt(length))];
  for(const p of ps){
   if(ids.includes(p.id)){const v=cross(a,b,p.labelAt)>0?c:d;let used=false;p.polygon=p.polygon.flatMap(q=>{if(!equal(q,a)&&!equal(q,b))return[q];if(used)return[];used=true;return[[...v] as GeoPoint];});}
   if(p.id===r||p.id===s){const old=p.id===r?a:b;p.polygon=p.polygon.flatMap(q=>equal(q,old)?(p.id===r?[d,c]:[c,d]).map(v=>[...v] as GeoPoint):[q]);}
  }
  changed.add(ps[0]!.island);
 }
 derive(g.provinces);
}
interface AxisWarp {old:number[];next:number[];offset:number}
function axisWarp(values:number[],limit:number,rng:DeterministicRng):AxisWarp {
 const lo=Math.min(...values),hi=Math.max(...values),old=Array.from({length:5},(_,j)=>lo+Math.floor((hi-lo)*j/4));
 const next=[lo];for(let j=1;j<5;j++)next.push(next[j-1]!+old[j]!-old[j-1]!+rng.nextInt(0,48*Q));
 // [designed] Four global warp intervals, up to48px sampled expansion; normalize the frame extent exactly.
 const extent=next[4]!-lo;for(let j=1;j<5;j++)next[j]=lo+quotient(BigInt(next[j]!-lo)*BigInt(hi-lo),BigInt(extent));const offset=0;
 return {old,next,offset};
}
function axisFraction(n:bigint,d:bigint,w:AxisWarp):number {
 let j=0;while(j<3&&n>BigInt(w.old[j+1]!)*d)j++;
 return w.next[j]!+quotient((n-BigInt(w.old[j]!)*d)*BigInt(w.next[j+1]!-w.next[j]!),d*BigInt(w.old[j+1]!-w.old[j]!))+w.offset;
}
function warp(g:IslandGeography,rng:DeterministicRng):void {
 const reflectX=rng.nextInt(0,1)!==0,reflectY=rng.nextInt(0,1)!==0;
 const xw=axisWarp(g.islands.flatMap(i=>i.polygon.map(p=>p[0])),g.bounds.width,rng),yw=axisWarp(g.islands.flatMap(i=>i.polygon.map(p=>p[1])),g.bounds.height,rng);
 for(const island of g.islands){
  const countries=g.provinces.filter(p=>p.island===island.id);
  const pointAt=(a:GeoPoint,b:GeoPoint,n:bigint,d:bigint):GeoPoint=>{
   const x=axisFraction(BigInt(a[0])*d+BigInt(b[0]-a[0])*n,d,xw),y=axisFraction(BigInt(a[1])*d+BigInt(b[1]-a[1])*n,d,yw);
   return[reflectX?g.bounds.width-x:x,reflectY?g.bounds.height-y:y];
  };
  const point=(p:GeoPoint):GeoPoint=>pointAt(p,p,0n,1n);
  const cache=new Map<string,GeoPoint[]>();
  const edge=(u:GeoPoint,v:GeoPoint):GeoPoint[]=>{
   const order=u[0]<v[0]||u[0]===v[0]&&u[1]<v[1],a=order?u:v,b=order?v:u,k=key(a)+"|"+key(b);
   if(!cache.has(k)){
    const ts:[bigint,bigint][]=[[0n,1n],[1n,1n]];
    for(const[dimension,w]of [[0,xw],[1,yw]] as const)if(b[dimension]!==a[dimension])for(const knot of w.old.slice(1,-1)){
     let n=BigInt(knot-a[dimension]),d=BigInt(b[dimension]-a[dimension]);if(d<0n){n=-n;d=-d;}if(n>0n&&n<d)ts.push([n,d]);
    }
    ts.sort((a,b)=>{const v=a[0]*b[1]-b[0]*a[1];return v<0n?-1:v>0n?1:0;});const points=ts.map(([n,d])=>pointAt(a,b,n,d));cache.set(k,points.filter((p,j)=>j===0||!equal(p,points[j-1]!)));
   }
   const points=cache.get(k)!;return order?points:[...points].reverse();
  };
  const ring=(r:Ring)=>clean(edges(r).flatMap(([a,b])=>edge(a,b).slice(0,-1)));
  island.polygon=ring(island.polygon);
  for(const p of countries){p.polygon=ring(p.polygon);p.labelAt=point(p.labelAt);}
  for(const r of g.entranceReservations){if(countries.some(p=>p.id===r.from))r.points[0]=point(r.points[0]!);if(countries.some(p=>p.id===r.to))r.points[r.points.length-1]=point(r.points.at(-1)!);}
 }
 derive(g.provinces);
}
function corridorErrors(g:IslandGeography,r:GeographyCorridor):string[] {
 const fail=new Set<string>(),countries=g.provinces,byId=new Map(countries.map(p=>[p.id,p]));
  const from=byId.get(r.from)!,to=byId.get(r.to)!,a=r.points[0]!,b=r.points.at(-1)!;
  if(norm2(a,b)<(20*Q)**2)fail.add("traceability: short corridor");
  for(const[p,end,next]of [[from,a,b],[to,b,a]] as const){
   const island=g.islands.find(i=>i.id===p.island)!;
   if(locate(end,p.polygon)!==0||locate(end,island.polygon)!==0)fail.add("attachment: endpoint not exposed");
   for(const q of countries.filter(q=>q.island===p.island&&q.id!==p.id))if(locate(end,q.polygon)>=0||edges(q.polygon).some(([u,v])=>!pointGap(end,u,v,8*Q)))fail.add("attachment: ambiguous/close competitor");
   const length=lengthCeil(end,next),inward:GeoPoint=[end[0]+quotient(BigInt(end[0]-next[0])*BigInt(12*Q),BigInt(length)),end[1]+quotient(BigInt(end[1]-next[1])*BigInt(12*Q),BigInt(length))];
   if(locate(inward,p.polygon)!==1||edges(p.polygon).some(([u,v])=>!onlyEndpointContact(end,inward,u,v,end)))fail.add("attachment: inward continuation leaves country");
  }
  for(const p of countries)for(const[u,v]of edges(p.polygon))if(!onlyEndpointContact(a,b,u,v,p===from?a:p===to?b:undefined))fail.add("water: corridor touches land");
  for(const island of g.islands.filter(i=>i.id!==from.island&&i.id!==to.island))if(edges(island.polygon).some(([u,v])=>!segmentGap(a,b,u,v,10*Q)))fail.add("water: unrelated coast margin");

 for(const other of g.entranceReservations)if(other!==r&&!segmentGap(r.points[0]!,r.points.at(-1)!,other.points[0]!,other.points.at(-1)!,10*Q))fail.add("traceability: corridors not separated");
 return [...fail];
}
/** Placement and port reservation are accepted together, never frozen independently. */
function candidateErrors(g:IslandGeography):string[] {
 const fail=new Set<string>(),countries=g.provinces,byId=new Map(countries.map(p=>[p.id,p]));
 const pairs=new Set<string>();for(const r of g.entranceReservations){const pair=[r.from,r.to].sort().join("|");if(pairs.has(pair))fail.add("crossings: duplicate reserved country pair");pairs.add(pair);}
 for(const island of g.islands){const entries=new Set(g.entranceReservations.flatMap(r=>[r.from,r.to]).filter(id=>byId.get(id)!.island===island.id));if(Math.floor(island.provinces.length/2)+entries.size>island.provinces.length)fail.add("crossings: insufficient bonus headroom");}
 const polygons=[...g.islands,...countries];
 for(const land of polygons){if(!simple(land.polygon))fail.add("cells: non-simple polygon");for(const[x,y]of land.polygon)if(x<0||x>g.bounds.width||y<0||y>g.bounds.height)fail.add("cells: outside frame");}
 for(const p of countries){
  const lanes=g.entranceReservations.filter(r=>r.from===p.id||r.to===p.id).length;
  if(p.borders.length<2||p.borders.length>4||p.borders.length+lanes>5||lanes>2)fail.add("degree: insufficient entrance headroom");
  const [x,y]=p.labelAt,half=20*Q,hit:GeoPoint[]=[[x-half,y-half],[x+half,y-half],[x+half,y+half],[x-half,y+half]];
  if(hit.some(q=>locate(q,p.polygon)<0)||edges(hit).some(([a,b])=>edges(p.polygon).some(([c,d])=>proper(a,b,c,d))))fail.add("labels: unusable hit reservation");
  if(countries.some(q=>q!==p&&Math.abs(p.labelAt[0]-q.labelAt[0])<44*Q&&Math.abs(p.labelAt[1]-q.labelAt[1])<47*Q))fail.add("labels: selected-name overlap");
 }
 for(let j=0;j<g.islands.length;j++)for(const other of g.islands.slice(j+1)){
  const p=g.islands[j]!.polygon,q=other.polygon;
  if(p.some(v=>locate(v,q)>=0)||q.some(v=>locate(v,p)>=0)||edges(p).some(([a,b])=>edges(q).some(([c,d])=>meets(a,b,c,d))))fail.add("cells: islands touch/overlap");
 }
 for(const r of g.entranceReservations)for(const e of corridorErrors(g,r))fail.add(e);
 for(const[j,r]of g.entranceReservations.entries())for(const other of g.entranceReservations.slice(j+1))if(!segmentGap(r.points[0]!,r.points.at(-1)!,other.points[0]!,other.points.at(-1)!,10*Q))fail.add("traceability: corridors not separated");
 return [...fail];
}
function repairLabels(g:IslandGeography):void {
 const half=20*Q;
 const hit=(v:GeoPoint,p:GeographyCountry):boolean=>{const[x,y]=v,box:GeoPoint[]=[[x-half,y-half],[x+half,y-half],[x+half,y+half],[x-half,y+half]];return !box.some(q=>locate(q,p.polygon)<0)&&!edges(box).some(([a,b])=>edges(p.polygon).some(([c,d])=>proper(a,b,c,d)));};
 const offsets:GeoPoint[]=[];for(let x=-24;x<=24;x++)for(let y=-24;y<=24;y++)offsets.push([x*Q,y*Q]);offsets.sort((a,b)=>norm2(a,[0,0])-norm2(b,[0,0])||a[0]-b[0]||a[1]-b[1]);
 for(let pass=0;pass<3;pass++)for(const p of g.provinces){
  const free=(v:GeoPoint)=>!g.provinces.some(q=>q!==p&&Math.abs(v[0]-q.labelAt[0])<44*Q&&Math.abs(v[1]-q.labelAt[1])<47*Q);
  if(hit(p.labelAt,p)&&free(p.labelAt))continue;
  const origin=p.labelAt;
  for(const o of offsets){const v:GeoPoint=[origin[0]+o[0],origin[1]+o[1]];if(free(v)&&hit(v,p)){p.labelAt=v;break;}}
 }
}
function repairLayoutReservations(g:IslandGeography,rng:DeterministicRng):void {
 const options=new Map<string,GeoPoint[]>();
 const ports=(id:string):GeoPoint[]=>{
  if(options.has(id))return options.get(id)!;
  const p=g.provinces.find(p=>p.id===id)!,island=g.islands.find(i=>i.id===p.island)!,others=g.provinces.filter(q=>q.island===p.island&&q.id!==id);
  const points=edges(p.polygon).flatMap(([a,b])=>{const x=a[0]+b[0],y=a[1]+b[1];return x%2===0&&y%2===0?[a,[x/2,y/2] as GeoPoint]:[a];});
  const available=[...new Map(points.map(v=>[key(v),v])).values()].filter(v=>locate(v,island.polygon)===0&&others.every(q=>locate(v,q.polygon)<0&&edges(q.polygon).every(([a,b])=>pointGap(v,a,b,8*Q))));
  options.set(id,available);return available;
 };

 for(let pass=0;pass<3;pass++)for(const r of rng.shuffled(g.entranceReservations)){
  const ids=(id:string)=>g.islands.find(i=>i.id===g.provinces.find(p=>p.id===id)!.island)!.provinces;
  const count=(id:string)=>g.entranceReservations.filter(q=>q!==r&&(q.from===id||q.to===id)).length;
  const available=(id:string)=>{const p=g.provinces.find(p=>p.id===id)!,island=g.islands.find(i=>i.id===p.island)!,used=new Set(g.entranceReservations.filter(q=>q!==r).flatMap(q=>[q.from,q.to]).filter(n=>g.provinces.find(p=>p.id===n)!.island===island.id));used.add(id);return count(id)<2&&p.borders.length+count(id)+1<=5&&used.size<=island.provinces.length-Math.floor(island.provinces.length/2);};
  if(corridorErrors(g,r).length===0&&available(r.from)&&available(r.to))continue;
  const previous={from:r.from,to:r.to,points:r.points},choices=ids(r.from).filter(available).flatMap(from=>ids(r.to).filter(available).flatMap(to=>ports(from).flatMap(a=>ports(to).filter(b=>norm2(a,b)>=(20*Q)**2).map(b=>({from,to,a,b,cost:norm2(a,previous.points[0]!)+norm2(b,previous.points.at(-1)!)}))))).sort((a,b)=>a.cost-b.cost);
  let accepted=false;
  for(const c of choices){if(g.entranceReservations.some(q=>q!==r&&(q.from===c.from&&q.to===c.to||q.from===c.to&&q.to===c.from)))continue;r.from=c.from;r.to=c.to;r.points=[[...c.a],[...c.b]];if(corridorErrors(g,r).length===0){accepted=true;break;}}
  if(!accepted){r.from=previous.from;r.to=previous.to;r.points=previous.points;}
 }
}
/** [designed] Three retained feasible placement plans, preserving the approved frame.
 * Entrance destinations follow spatial slots; actual countries/ports are reconstructed jointly.
 */
function placeLayout(g:IslandGeography,layout:number):void {
 if(layout===0)return;
 if(layout===1)g.entranceReservations.splice(4,1); // Approved14-route plan: omit one parallel island-pair crossing.
 const moving=layout===1?"island_0":"island_4",swap=new Map([[moving,"island_8"],["island_8",moving]]);
 for(const r of g.entranceReservations)for(const side of ["from","to"]as const){const old=g.provinces.find(p=>p.id===r[side])!.island,target=swap.get(old);if(target)r[side]=g.islands.find(i=>i.id===target)!.provinces[0]!;}
 const shifts:readonly [string,number,number][]=layout===1?[[moving,0,306*Q],["island_8",0,-303*Q]]:[[moving,26*Q,155*Q],["island_8",-75*Q,-167*Q]];
 for(const[id,dx,dy]of shifts){const move=(p:GeoPoint):GeoPoint=>[p[0]+dx,p[1]+dy],island=g.islands.find(i=>i.id===id)!;island.polygon=island.polygon.map(move);for(const p of g.provinces.filter(p=>p.island===id)){p.polygon=p.polygon.map(move);p.labelAt=move(p.labelAt);}}
}
export function generateIslandGeography(seed:number,options:{attempts?:number}={}):GeographyResult {
 const rng=new DeterministicRng(seed),raw=options.attempts??MAX_ATTEMPTS,budget=Number.isFinite(raw)?Math.max(0,Math.min(MAX_ATTEMPTS,Math.floor(raw))):0,failures:GeographyFailure[]=[];
 for(let attempt=1;attempt<=budget;attempt++){
  const geography=newWitness(rng.seed);flipSubdivisions(geography,rng);placeLayout(geography,rng.nextInt(0,2));warp(geography,rng);repairLabels(geography);repairLayoutReservations(geography,rng);const constraints=candidateErrors(geography);
  if(constraints.length===0)return {ok:true,geography,attempts:attempt,failures,rng:rng.snapshot()};
  failures.push({attempt,constraints,candidate:geography});
 }
 return {ok:false,attempts:budget,failures,rng:rng.snapshot()};
}
