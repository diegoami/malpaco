// Disposable layout feasibility probe under the owner-amended T64 contract.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspect,pointSegmentGap} from '../T62/contract.mjs';
import {onSegment,location,edges,distance} from '../T24/geometry.mjs';
import {html,svg} from '../T63/render.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const before=JSON.parse(fs.readFileSync(path.join(root,'../T63/board.json')));
const output=fs.mkdtempSync(path.join(root,'evidence/geography-probe-'));
const key=p=>JSON.stringify(p);
const unique=points=>[...new Map(points.map(p=>[key(p),p])).values()];
function build(strength){
 const board=structuredClone(before),transforms=new Map();
 for(const island of before.islands){
  const xs=island.polygon.map(p=>p[0]),ys=island.polygon.map(p=>p[1]);
  const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  const rx=(Math.max(...xs)-Math.min(...xs))/2,ry=(Math.max(...ys)-Math.min(...ys))/2;
  const index=Number(island.id.split('_').at(-1)),phase=index*1.93+before.seed*.013;
  const angle=[-8,9,-12,10,-7,8,-8,-5,2][index]*Math.PI/180*strength;
  const transform=p=>{
   let x=(p[0]-cx)/rx,y=(p[1]-cy)/ry;
   const radius=Math.min(1,Math.hypot(x,y)),theta=Math.atan2(y,x);
   const ripple=1+strength*radius*radius*(.045*Math.sin(3*theta+phase)+.018*Math.sin(5*theta-phase));
   const a=(x*Math.sqrt(1-.32*strength*y*y)+.08*strength*y)*ripple;
   const b=(y*Math.sqrt(1-.25*strength*x*x)+.11*strength*Math.sin(Math.PI*x))*ripple;
   x=a*rx;y=b*ry;
   return [cx+x*Math.cos(angle)-y*Math.sin(angle),cy+x*Math.sin(angle)+y*Math.cos(angle)];
  };
  transforms.set(island.id,transform);
  const countries=before.provinces.filter(p=>p.island===island.id);
  const anchors=before.routes.flatMap(r=>[r.points[0],r.points.at(-1)]).filter(p=>island.polygon.some((a,j)=>onSegment(p,a,island.polygon[(j+1)%island.polygon.length])));
  const vertices=unique([...island.polygon,...countries.flatMap(p=>p.polygon),...anchors]);
  // Split at every existing shared vertex before warping: all copies agree.
  const polygon=ring=>ring.flatMap((a,j)=>{
   const b=ring[(j+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],norm=dx*dx+dy*dy;
   return vertices.filter(p=>onSegment(p,a,b)&&distance(p,b)>1e-6)
    .map(p=>({p,t:((p[0]-a[0])*dx+(p[1]-a[1])*dy)/norm}))
    .sort((u,v)=>u.t-v.t).map(v=>transform(v.p));
  });
  board.islands.find(i=>i.id===island.id).polygon=polygon(island.polygon);
  for(const p of countries){const result=board.provinces.find(q=>q.id===p.id);result.polygon=polygon(p.polygon);result.labelAt=transform(p.labelAt);}
 }
 for(const r of board.routes){
  const source=before.provinces.find(p=>p.id===r.from),target=before.provinces.find(p=>p.id===r.to);
  r.points=[transforms.get(source.island)(r.points[0]),transforms.get(target.island)(r.points.at(-1))];
 }
 // Find room for unchanged axis-aligned 40px reservations after the warp.
 const placement=[];
 for(const p of board.provinces){
  const ring=p.polygon,segments=edges(ring),xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),candidates=[];
  for(let x=Math.ceil(Math.min(...xs)+20);x<=Math.max(...xs)-20;x+=2)for(let y=Math.ceil(Math.min(...ys)+20);y<=Math.max(...ys)-20;y+=2){
   const center=[x,y];if(location(center,ring)!==1)continue;
   const gap=Math.min(...segments.map(([a,b])=>pointSegmentGap(center,a,b)));
   candidates.push({center,score:gap-.04*distance(center,p.labelAt)});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const selected=candidates.find(({center:[x,y]})=>[[-20,-20],[-20,20],[20,-20],[20,20]].every(([dx,dy])=>location([x+dx,y+dy],ring)>=0));
  if(selected)p.labelAt=selected.center;
  placement.push({id:p.id,reservationFound:!!selected});
 }
 return {board,placement};
}
const results=[];
for(const strength of [.4,.7,1]){
 const {board,placement}=build(strength),checks=inspect(board),name='strength-'+strength;
 fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(board,null,2)+'\n');
 fs.writeFileSync(path.join(output,name+'.svg'),svg(board));
 fs.writeFileSync(path.join(output,name+'.html'),html(board));
 results.push({strength,placement,checks,accepted:Object.values(checks).every(list=>list.length===0)});
}
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(output,'probe-input.mjs'));
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({source:'immutable T63',purpose:'geographical layout feasibility only; not installed',results},null,2)+'\n');
console.log(JSON.stringify({output:path.relative(process.cwd(),output),results}));
