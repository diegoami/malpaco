// Disposable dual subdivision of the existing outerplanar country graph.
// Original design: convex hinge lifting puts the dual junctions near each
// island's centre, giving geographical sectors while retaining every edge.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspect,pointSegmentGap,checkConstraint,routeGap} from '../T62/contract.mjs';
import {onSegment,location,edges,distance,segmentPieces} from '../T24/geometry.mjs';
import {html,svg} from '../T63/render.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const before=JSON.parse(fs.readFileSync(path.join(root,'../T63/board.json')));
const bent=JSON.parse(fs.readFileSync(path.join(root,'evidence/geography-probe-OLHnpv/strength-0.4.json')));
const output=fs.mkdtempSync(path.join(root,'evidence/dual-probe-'));
const key=p=>JSON.stringify(p),pair=(a,b)=>[a,b].sort().join('|');
const rounded=p=>p.map(v=>Math.round(v*1024)/1024);
const tau=2*Math.PI,angle=p=>(Math.atan2(p[1],p[0])+tau)%tau;
const unique=points=>[...new Map(points.map(p=>[key(p),p])).values()];
const frames=[[410,82,91,66],[709,86,86,66],[110,238,100,52],[709,393,85,63],[420,233,111,64],[691,238,105,66],[144,380,132,77],[138,87,132,84],[447,389,156,70]];
function candidate(spread){
 const board=structuredClone(before),coasts=new Map(),placement=[],labelCandidates=new Map();
 for(const island of before.islands){
  const index=Number(island.id.split('_').at(-1)),[cx,cy,rx,ry]=frames[index],phase=index*1.93+.013*before.seed;
  const countries=before.provinces.filter(p=>p.island===island.id),ring=island.polygon;
  if(countries.length===10){
   const source=bent.islands.find(i=>i.id===island.id);board.islands.find(i=>i.id===island.id).polygon=source.polygon;
   for(const p of countries){const drawing=bent.provinces.find(q=>q.id===p.id);board.provinces.find(q=>q.id===p.id).polygon=drawing.polygon;const coast=drawing.polygon.filter(v=>source.polygon.some(q=>key(q)===key(v)));coasts.set(p.id,coast);}
   continue;
  }
  const starts=ring.map((p,j)=>({p,j})).filter(({p})=>countries.filter(q=>q.polygon.some(v=>key(v)===key(p))).length>1).map(v=>v.j);
  const cycle=starts.map(j=>{
   const a=ring[j],b=ring[(j+1)%ring.length],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
   const found=countries.filter(p=>location(mid,p.polygon)>=0);
   if(found.length!==1)throw Error('Ambiguous country coast');return found[0].id;
  });
  if(new Set(cycle).size!==countries.length)throw Error('Expected one coast arc per country');
  const n=cycle.length;
  const weights=cycle.map(id=>1+.1*(4-countries.find(p=>p.id===id).borders.length)),total=weights.reduce((a,b)=>a+b,0);
  const site=new Map(cycle.map((id,j)=>{const theta=Math.PI+tau*(weights.slice(0,j).reduce((a,b)=>a+b,0)+weights[j]/2)/total+([-.8,0,0,0,0,0,0,.7,0][index]);return[id,[Math.cos(theta),Math.sin(theta)]];}));
  const outer=new Set(cycle.map((id,j)=>pair(id,cycle[(j+1)%n])));
  const chords=[...new Set(countries.flatMap(p=>p.borders.map(id=>pair(p.id,id))))].filter(k=>!outer.has(k)).map(k=>k.split('|'));
  let faces=[cycle];
  for(const[a,b]of chords){
   const f=faces.find(f=>f.includes(a)&&f.includes(b));if(!f)throw Error('Crossing chord');
   const i=f.indexOf(a),j=f.indexOf(b),lo=Math.min(i,j),hi=Math.max(i,j);
   faces=faces.filter(q=>q!==f).concat([f.slice(lo,hi+1),[...f.slice(hi),...f.slice(0,lo+1)]]);
  }
  const hinges=chords.map(([a,b])=>{const u=site.get(a),v=site.get(b),normal=[u[1]-v[1],v[0]-u[0]];return{normal,c:-normal[0]*u[0]-normal[1]*u[1]};});
  const centres=faces.map(face=>{
   const mean=[0,1].map(axis=>face.reduce((s,id)=>s+site.get(id)[axis],0)/face.length);
   return hinges.filter(h=>h.normal[0]*mean[0]+h.normal[1]*mean[1]+h.c>0).reduce((p,h)=>[p[0]+h.normal[0]*spread/2,p[1]+h.normal[1]*spread/2],[0,0]);
  });
  const offset=[0,1].map(axis=>(Math.min(...centres.map(p=>p[axis]))+Math.max(...centres.map(p=>p[axis])))/2);
  const vertices=centres.map(p=>[p[0]-offset[0],p[1]-offset[1]]);
  const coast=Array.from({length:36},(_,j)=>{
   const theta=tau*j/36,dx=Math.cos(theta),dy=Math.sin(theta);
   const desired=1+.055*Math.sin(theta*3+phase)+.025*Math.sin(theta*5-phase)+.018*(1+Math.sin(theta*4+phase));
   const limits=[dx>0?(797-cx)/(rx*dx):dx<0?(3-cx)/(rx*dx):Infinity,dy>0?(457-cy)/(ry*dy):dy<0?(3-cy)/(ry*dy):Infinity];
   const r=Math.min(desired,...limits);return[r*dx,r*dy];
  });
  const junctions=cycle.map((id,j)=>{
   const prev=cycle[(j+n-1)%n],face=faces.findIndex(f=>f.includes(id)&&f.includes(prev));
   const a=site.get(prev),b=site.get(id),direction=[b[1]-a[1],a[0]-b[0]],origin=vertices[face];
   const hits=[];
   for(const[u,v]of edges(coast)){
    const dx=v[0]-u[0],dy=v[1]-u[1],den=direction[0]*dy-direction[1]*dx;
    if(Math.abs(den)<1e-10)continue;
    const t=((u[0]-origin[0])*dy-(u[1]-origin[1])*dx)/den;
    const s=((u[0]-origin[0])*direction[1]-(u[1]-origin[1])*direction[0])/den;
    if(t>0&&s>=0&&s<=1)hits.push({t,point:[origin[0]+t*direction[0],origin[1]+t*direction[1]]});
   }
   hits.sort((a,b)=>a.t-b.t);if(!hits.length)throw Error('Missing exposed dual ray');return hits[0].point;
  });
  const physical=p=>rounded([cx+p[0]*rx,cy+p[1]*ry]);
  const outline=unique([...coast,...junctions]).sort((a,b)=>angle(a)-angle(b));
  board.islands.find(i=>i.id===island.id).polygon=unique(outline.map(physical));
  for(let j=0;j<n;j++){
   const id=cycle[j],start=junctions[j],end=junctions[(j+1)%n],span=(angle(end)-angle(start)+tau)%tau;
   const arc=outline.filter(p=>(angle(p)-angle(start)+tau)%tau<=span+1e-10);
   const points=unique([...arc,start,end,...faces.flatMap((f,k)=>f.includes(id)?[vertices[k]]:[])]);
   const mean=[0,1].map(axis=>points.reduce((s,p)=>s+p[axis],0)/points.length);
   points.sort((a,b)=>Math.atan2(a[1]-mean[1],a[0]-mean[0])-Math.atan2(b[1]-mean[1],b[0]-mean[0]));
   const p=board.provinces.find(p=>p.id===id);p.polygon=unique(points.map(physical));
   const chain=unique([start,...arc,end]).sort((a,b)=>(angle(a)-angle(start)+tau)%tau-(angle(b)-angle(start)+tau)%tau).map(physical);
   coasts.set(id,unique(chain.flatMap((p,j)=>j+1<chain.length?[p,[(p[0]+chain[j+1][0])/2,(p[1]+chain[j+1][1])/2]]:[p])));
  }
 }
 for(const p of board.provinces){
  const ring=p.polygon,segments=edges(ring),xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),candidates=[];
  for(let x=Math.ceil(Math.min(...xs)+20);x<=Math.max(...xs)-20;x+=2)for(let y=Math.ceil(Math.min(...ys)+20);y<=Math.max(...ys)-20;y+=2){
   const center=[x,y];if(location(center,ring)!==1)continue;
   const gap=Math.min(...segments.map(([a,b])=>((b[0]-a[0])*(center[1]-a[1])-(b[1]-a[1])*(center[0]-a[0]))/(Math.abs(b[0]-a[0])+Math.abs(b[1]-a[1]))));
   candidates.push({center,score:gap});
  }
  candidates.sort((a,b)=>b.score-a.score);
  for(const candidate of candidates.slice(0,5)){
   for(let dx=-1.75;dx<=1.75;dx+=.25)for(let dy=-1.75;dy<=1.75;dy+=.25){
    const center=[candidate.center[0]+dx,candidate.center[1]+dy];if(location(center,ring)!==1)continue;
    const score=Math.min(...segments.map(([a,b])=>((b[0]-a[0])*(center[1]-a[1])-(b[1]-a[1])*(center[0]-a[0]))/(Math.abs(b[0]-a[0])+Math.abs(b[1]-a[1]))));
    candidates.push({center,score});
   }
  }
  candidates.sort((a,b)=>b.score-a.score);
  const selected=candidates.find(({center:[x,y]})=>[[-20,-20],[-20,20],[20,-20],[20,20]].every(([dx,dy])=>location([x+dx,y+dy],ring)>=0));
  if(selected??candidates[0])p.labelAt=(selected??candidates[0]).center;
  labelCandidates.set(p.id,candidates.filter(({center:[x,y]})=>[[-20,-20],[-20,20],[20,-20],[20,20]].every(([dx,dy])=>location([x+dx,y+dy],ring)>=0)));
  placement.push({id:p.id,reservationFound:!!selected,largestSquareCss:candidates[0]?.score*2});
 }
 // Jointly respect the unchanged44px centre-spacing reservation.
 for(let pass=0;pass<46;pass++){
  const clashes=board.provinces.flatMap((p,j)=>board.provinces.slice(j+1).filter(q=>distance(p.labelAt,q.labelAt)<44).map(q=>[p,q]));
  if(!clashes.length)break;let changed=false;
  for(const pair of clashes)for(const p of pair){
   const selected=labelCandidates.get(p.id).find(c=>board.provinces.every(q=>q.id===p.id||distance(c.center,q.labelAt)>=44));
   if(selected){p.labelAt=selected.center;changed=true;break;}
  }
  if(!changed)break;
 }
 // Port candidate search is separated from layout, using unchanged T62 checks.
 const routed=[];const routing=[];
 for(const previous of board.routes){
  const a=board.provinces.find(p=>p.id===previous.from),b=board.provinces.find(p=>p.id===previous.to);
  const available=p=>coasts.get(p.id).filter(point=>board.provinces.filter(q=>q.island===p.island&&q.id!==p.id).every(q=>Math.min(...edges(q.polygon).map(([u,v])=>pointSegmentGap(point,u,v)))>=8));
  const pairs=available(a).flatMap(u=>available(b).map(v=>({points:[u,v],length:distance(u,v)}))).filter(r=>r.length>=20).sort((a,b)=>a.length-b.length);
  let chosen;
  for(const option of pairs){
   const r={from:a.id,to:b.id,points:option.points};
   if(routed.some(q=>routeGap(q,r)<10))continue;
   if(board.provinces.some(p=>segmentPieces(...r.points,p.polygon).pieces.some(piece=>piece.where>=0)))continue;
   if(checkConstraint('attachment',{...board,routes:[r]}).length)continue;
   chosen=r;break;
  }
  routed.push(chosen??previous);routing.push({from:a.id,to:b.id,found:!!chosen,candidates:pairs.length});
 }
 board.routes=routed;
 return {board,placement,routing};
}
const results=[];
for(const spread of [.02,.04]){
 const {board,placement,routing}=candidate(spread),checks=inspect(board),name='spread-'+spread;
 fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(board,null,2)+'\n');
 fs.writeFileSync(path.join(output,name+'.svg'),svg(board));
 fs.writeFileSync(path.join(output,name+'.html'),html(board));
 results.push({spread,missingReservations:placement.filter(p=>!p.reservationFound),routing,checks,accepted:Object.values(checks).every(list=>list.length===0)});
}
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(output,'probe-input.mjs'));
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({source:'immutable T63',purpose:'fixed-graph dual geographical feasibility; not installed',results},null,2)+'\n');
console.log(JSON.stringify({output:path.relative(process.cwd(),output),results:results.map(({routing,...r})=>({...r,unrouted:routing.filter(p=>!p.found)}))}));
