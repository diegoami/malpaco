// Disposable curve feasibility probe. The game does not import this module.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspect,pointSegmentGap,segmentGap} from '../T62/contract.mjs';
import {onSegment,distance,edges} from '../T24/geometry.mjs';
import {svg,html} from '../T64/render.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const input=JSON.parse(fs.readFileSync(path.join(root,'../T64/board.json')));
const output=fs.mkdtempSync(path.join(root,'evidence/curve-probe-'));
const point=p=>JSON.stringify(p),key=(a,b)=>[point(a),point(b)].sort().join('|');
const snap=p=>p.map(v=>Math.round(v*1024)/1024);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function canonical(board){
 const pieces=new Map(),rings=new Map();
 for(const p of board.provinces){
  const vertices=[...new Map(board.provinces.filter(q=>q.island===p.island).flatMap(q=>q.polygon).map(v=>[point(v),v])).values()];
  const ring=p.polygon.flatMap((a,j)=>{const b=p.polygon[(j+1)%p.polygon.length];return vertices.filter(v=>onSegment(v,a,b)&&distance(v,b)>1e-6).sort((u,v)=>distance(a,u)-distance(a,v));});
  rings.set(p.id,ring);
  for(const[a,b]of edges(ring)){
   const k=key(a,b);if(!pieces.has(k)){const ordered=point(a)<point(b)?[a,b]:[b,a];pieces.set(k,{a:ordered[0],b:ordered[1],owners:[]});}
   pieces.get(k).owners.push(p.id);
  }
 }
 return {pieces,rings};
}
function candidate(board,seed,maximum){
 const result=structuredClone(board),{pieces,rings}=canonical(board),all=[...pieces.values()],internal=all.filter(e=>e.owners.length===2),curves=new Map(),metrics=[];
 const pairs=new Set(internal.map(e=>[...e.owners].sort().join('|')));
 if(internal.length!==61||pairs.size!==61||all.some(e=>e.owners.length>2))throw Error('Unexpected reference shared-boundary structure');
 const ports=board.routes.flatMap(r=>[r.points[0],r.points.at(-1)]);
 const landings=board.routes.flatMap(r=>[[r.points[0],r.points[1]],[r.points.at(-1),r.points.at(-2)]]).map(([a,b])=>{const length=distance(a,b);return[a,[a[0]+12*(a[0]-b[0])/length,a[1]+12*(a[1]-b[1])/length]];});
 const rectGap=(p,c,hw,hh)=>Math.hypot(Math.max(0,Math.abs(p[0]-c[0])-hw),Math.max(0,Math.abs(p[1]-c[1])-hh));
 for(const e of internal){
  const length=distance(e.a,e.b),dx=(e.b[0]-e.a[0])/length,dy=(e.b[1]-e.a[1])/length;
  let hash=seed>>>0;for(const c of [...e.owners].sort().join('|'))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
  const phase=(hash&65535)/65536*Math.PI*2,sign=hash>>>31?-1:1,amplitude=Math.min(maximum,length*.08),count=Math.max(4,Math.ceil(length/6));
  const countries=e.owners.map(id=>board.provinces.find(p=>p.id===id)),curve=[e.a];let largest=0,requested=0;
  for(let j=1;j<count;j++){
   const t=j/count,base=[e.a[0]+dx*length*t,e.a[1]+dy*length*t];
   const labelGap=Math.min(...countries.flatMap(p=>[rectGap(base,p.labelAt,22,24),rectGap(base,[p.labelAt[0]-21,p.labelAt[1]-14.5],5,7.5)]));
   let displacement=sign*amplitude*Math.sin(Math.PI*t)*(.75+.25*Math.sin(2*Math.PI*t+phase))*smooth(labelGap/5);
   const otherGap=Math.min(...all.filter(other=>other!==e).map(other=>pointSegmentGap(base,other.a,other.b)));
   const portGap=Math.min(...ports.map(p=>Math.max(0,distance(base,p)-8)));
   const landingGap=Math.min(...landings.map(([a,b])=>pointSegmentGap(base,a,b)));
   const allowed=Math.min(labelGap*.75,otherGap*.2,portGap*.25,landingGap*.25);
   displacement=Math.sign(displacement)*Math.min(Math.abs(displacement),allowed);
   requested=Math.max(requested,Math.abs(displacement));
   const next=snap([base[0]-dy*displacement,base[1]+dx*displacement]);
   largest=Math.max(largest,pointSegmentGap(next,e.a,e.b));curve.push(next);
  }
  curve.push(e.b);const retained=requested<1/1024;curves.set(key(e.a,e.b),retained?[e.a,e.b]:curve);metrics.push({countries:e.owners,length,maxOffset:retained?0:largest,protectedStraight:retained});
 }
 for(const p of result.provinces)p.polygon=edges(rings.get(p.id)).flatMap(([a,b])=>{
  const curve=curves.get(key(a,b));if(!curve)return[a];
  const oriented=point(curve[0])===point(a)?curve:[...curve].reverse();return oriented.slice(0,-1);
 }).map(p=>[...p]);
 return {board:result,metrics};
}
const rows=[];
for(const maximum of [3,5,7])for(const seed of [1994,0,7,42,4294967295]){
 const {board,metrics}=candidate(input,seed,maximum),checks=inspect(board),name=`max-${maximum}-seed-${seed}`;
 fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(board,null,2)+'\n');
 if(seed===1994){fs.writeFileSync(path.join(output,name+'.svg'),svg(board));fs.writeFileSync(path.join(output,name+'.html'),html(board));}
 rows.push({maximum,seed,checks,metrics,accepted:Object.values(checks).every(list=>list.length===0)});
}
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(output,'script-input.mjs'));
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({input:'T64 board',rows},null,2)+'\n');
console.log(JSON.stringify({output:path.relative(process.cwd(),output),rows:rows.map(({metrics,...r})=>({...r,longNearlyStraight:metrics.filter(e=>e.length>=30&&e.maxOffset<.1).map(e=>e.countries),largestOffset:Math.max(...metrics.map(e=>e.maxOffset))}))}));
