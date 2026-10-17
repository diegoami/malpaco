// Disposable topology-preserving geographical embedding, not production code.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspect,pointSegmentGap} from '../T62/contract.mjs';
import {onSegment,location,edges,distance,simple} from '../T24/geometry.mjs';
import {html,svg} from '../T63/render.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const before=JSON.parse(fs.readFileSync(path.join(root,'../T63/board.json')));
const output=fs.mkdtempSync(path.join(root,'evidence/tutte-probe-'));
const key=p=>JSON.stringify(p),rounded=p=>p.map(v=>Math.round(v*1024)/1024);
const unique=points=>[...new Map(points.map(p=>[key(p),p])).values()];
const frames=[[410,82,91,66],[709,89,86,68],[133,248,87,69],[709,393,85,62],[420,245,111,70],[691,246,105,72],[144,393,132,65],[138,87,130,70],[447,393,156,64]];
function candidate(turn){
 const board=structuredClone(before),mappedByIsland=new Map(),placement=[];
 for(const island of before.islands){
  const index=Number(island.id.split('_').at(-1)),[cx,cy,rx,ry]=frames[index],phase=index*1.93+.013*before.seed;
  const countries=before.provinces.filter(p=>p.island===island.id);
  const anchors=before.routes.flatMap(r=>[r.points[0],r.points.at(-1)]).filter(p=>island.polygon.some((a,j)=>onSegment(p,a,island.polygon[(j+1)%island.polygon.length])));
  const vertices=unique([...island.polygon,...countries.flatMap(p=>p.polygon),...anchors]);
  const split=ring=>ring.flatMap((a,j)=>{
   const b=ring[(j+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],norm=dx*dx+dy*dy;
   return vertices.filter(p=>onSegment(p,a,b)&&distance(p,b)>1e-6)
    .map(p=>({p,t:((p[0]-a[0])*dx+(p[1]-a[1])*dy)/norm}))
    .sort((u,v)=>u.t-v.t).map(v=>v.p);
  });
  const coast=split(island.polygon),lengths=[0];
  for(let j=1;j<coast.length;j++)lengths.push(lengths.at(-1)+distance(coast[j-1],coast[j]));
  const total=lengths.at(-1)+distance(coast.at(-1),coast[0]),mapped=new Map();
  const junctions=coast.map((p,j)=>({p,j})).filter(({p})=>countries.filter(q=>q.polygon.some(v=>key(v)===key(p))).length>1).map(v=>v.j);
  if(junctions[0]!==0)throw Error('Expected original ring to start at a junction');
  for(let j=0;j<coast.length;j++){
   let part=junctions.findLastIndex(k=>k<=j),next=part+1<junctions.length?lengths[junctions[part+1]]:total;
   const fraction=(lengths[j]-lengths[junctions[part]])/(next-lengths[junctions[part]]);
   const theta=Math.PI+2*Math.PI*(part+fraction)/junctions.length+turn*[.15,-.18,.28,-.3,.1,-.12,.08,-.1,.02][index];
   const r=1+.024*Math.sin(theta*3+phase)+.008*Math.sin(theta*5-phase);
   mapped.set(key(coast[j]),[cx+rx*r*Math.cos(theta),cy+ry*r*Math.sin(theta)]);
  }
  const polygons=new Map(countries.map(p=>[p.id,split(p.polygon)])),neighbors=new Map();
  for(const ring of polygons.values())for(const[a,b]of edges(ring)){
   for(const[u,v]of[[a,b],[b,a]]){const k=key(u);if(!neighbors.has(k))neighbors.set(k,new Set());neighbors.get(k).add(key(v));}
  }
  const interior=[...neighbors.keys()].filter(k=>!mapped.has(k));
  for(const k of interior)mapped.set(k,[cx,cy]);
  for(let n=0;n<500;n++)for(const k of interior){
   const ns=[...neighbors.get(k)].map(k=>mapped.get(k));
   mapped.set(k,[ns.reduce((s,p)=>s+p[0],0)/ns.length,ns.reduce((s,p)=>s+p[1],0)/ns.length]);
  }
  // Equal-area relaxation is a disposable feasibility choice, not a rule value.
  const rings=[...polygons.values()].map(ring=>ring.map(key));
  const signed=ring=>ring.reduce((sum,k,j)=>{const a=mapped.get(k),b=mapped.get(ring[(j+1)%ring.length]);return sum+a[0]*b[1]-a[1]*b[0];},0)/2;
  const target=rings.reduce((sum,r)=>sum+signed(r),0)/rings.length;
  const energy=()=>rings.reduce((sum,r)=>sum+((signed(r)-target)/target)**2,0);
  for(let step=0;step<400;step++){
   const gradient=new Map(interior.map(k=>[k,[0,0]]));
   for(const ring of rings){const weight=2*(signed(ring)-target)/(target*target);
    for(let j=0;j<ring.length;j++){const g=gradient.get(ring[j]);if(!g)continue;
     const prev=mapped.get(ring[(j+ring.length-1)%ring.length]),next=mapped.get(ring[(j+1)%ring.length]);
     g[0]+=weight*(next[1]-prev[1])/2;g[1]+=weight*(prev[0]-next[0])/2;
    }
   }
   const old=new Map(interior.map(k=>[k,[...mapped.get(k)]])),initial=energy();
   let accepted=false;
   for(let rate=400;rate>.001;rate/=2){
    for(const[k,g]of gradient){const p=old.get(k),length=Math.hypot(...g),mult=Math.min(rate,length?2/length:rate);mapped.set(k,[p[0]-g[0]*mult,p[1]-g[1]*mult]);}
    if(energy()<initial&&rings.every(r=>signed(r)>0&&simple(r.map(k=>mapped.get(k))))){accepted=true;break;}
   }
   if(!accepted){for(const[k,p]of old)mapped.set(k,p);break;}
  }
  for(const[k,p]of mapped)mapped.set(k,rounded(p));
  mappedByIsland.set(island.id,mapped);
  board.islands.find(i=>i.id===island.id).polygon=coast.map(p=>mapped.get(key(p)));
  for(const p of countries){const q=board.provinces.find(q=>q.id===p.id);q.polygon=polygons.get(p.id).map(p=>mapped.get(key(p)));}
 }
 for(const r of board.routes){
  const a=before.provinces.find(p=>p.id===r.from),b=before.provinces.find(p=>p.id===r.to);
  r.points=[mappedByIsland.get(a.island).get(key(r.points[0])),mappedByIsland.get(b.island).get(key(r.points.at(-1)))];
 }
 for(const p of board.provinces){
  const ring=p.polygon,segments=edges(ring),xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),candidates=[];
  for(let x=Math.ceil(Math.min(...xs)+20);x<=Math.max(...xs)-20;x+=2)for(let y=Math.ceil(Math.min(...ys)+20);y<=Math.max(...ys)-20;y+=2){
   const center=[x,y];if(location(center,ring)!==1)continue;
   const gap=Math.min(...segments.map(([a,b])=>pointSegmentGap(center,a,b)));
   candidates.push({center,score:gap});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const selected=candidates.find(({center:[x,y]})=>[[-20,-20],[-20,20],[20,-20],[20,20]].every(([dx,dy])=>location([x+dx,y+dy],ring)>=0));
  if(selected)p.labelAt=selected.center;
  placement.push({id:p.id,reservationFound:!!selected});
 }
 return {board,placement};
}
const results=[];
for(const turn of [0,1]){
 const {board,placement}=candidate(turn),checks=inspect(board),name='turn-'+turn;
 fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(board,null,2)+'\n');
 fs.writeFileSync(path.join(output,name+'.svg'),svg(board));
 fs.writeFileSync(path.join(output,name+'.html'),html(board));
 results.push({turn,missingReservations:placement.filter(p=>!p.reservationFound),checks,accepted:Object.values(checks).every(list=>list.length===0)});
}
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(output,'probe-input.mjs'));
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({source:'immutable T63',purpose:'fixed-graph geographical embedding feasibility; not installed',results},null,2)+'\n');
console.log(JSON.stringify({output:path.relative(process.cwd(),output),results}));
