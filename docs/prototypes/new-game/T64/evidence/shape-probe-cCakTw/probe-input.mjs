// Disposable visual feasibility probe; not used by the playable game.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspect,pointSegmentGap} from '../T62/contract.mjs';
import {onSegment,distance} from '../T24/geometry.mjs';
import {html,svg} from '../T63/render.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const original=JSON.parse(fs.readFileSync(path.join(root,'../T63/board.json')));
const out=fs.mkdtempSync(path.join(root,'evidence/shape-probe-'));
const key=p=>JSON.stringify(p);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function candidate(amplitude,outward){
 const board=structuredClone(original),moved=new Map();
 for(const island of original.islands){
  const ring=island.polygon;
  const anchors=original.routes.flatMap(r=>[r.points[0],r.points.at(-1)]).filter(p=>ring.some((a,j)=>onSegment(p,a,ring[(j+1)%ring.length])));
  const locked=new Set();
  for(let j=0;j<ring.length;j++)if(anchors.some(p=>onSegment(p,ring[j],ring[(j+1)%ring.length]))){locked.add(j);locked.add((j+1)%ring.length);}
  // Freeze internal-border/coast junctions: T64 does not change shared borders.
  const countries=original.provinces.filter(p=>p.island===island.id);
  for(let j=0;j<ring.length;j++)if(countries.filter(p=>p.polygon.some(q=>key(q)===key(ring[j]))).length>1)locked.add(j);
  const lengths=[0];for(let j=1;j<ring.length;j++)lengths.push(lengths.at(-1)+distance(ring[j-1],ring[j]));
  const total=lengths.at(-1)+distance(ring.at(-1),ring[0]);
  const phase=Number(island.id.split('_').at(-1))*1.93+original.seed*.013;
  for(let j=0;j<ring.length;j++){
   const p=ring[j],prev=ring[(j+ring.length-1)%ring.length],next=ring[(j+1)%ring.length];
   const dx=next[0]-prev[0],dy=next[1]-prev[1],norm=Math.hypot(dx,dy),angle=lengths[j]/total*Math.PI*2;
   const keep=locked.has(j)?0:smooth(Math.min(...anchors.map(a=>distance(a,p)))/28-.4);
   const wave=Math.sin(angle*3+phase)*.65+Math.sin(angle*7-phase)*.35;
   const frame=smooth(Math.min(p[0],800-p[0],p[1],460-p[1])/14);
   const shift=amplitude*keep*frame*(outward?(wave+1)/2:wave);
   // Ring order is clockwise in screen coordinates; right normal points out.
   moved.set(key(p),[p[0]+dy/norm*shift,p[1]-dx/norm*shift]);
  }
 }
 for(const p of [...board.islands,...board.provinces])p.polygon=p.polygon.map(v=>moved.get(key(v))??v);
 return board;
}
const results=[];
for(const outward of [false,true])for(const amplitude of [4,8,12]){
 const b=candidate(amplitude,outward),checks=inspect(b),errors=Object.values(checks).flat();
 const name=(outward?'outward-':'signed-')+'amplitude-'+amplitude;
 fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(b,null,2)+'\n');
 fs.writeFileSync(path.join(out,name+'.svg'),svg(b));
 fs.writeFileSync(path.join(out,name+'.html'),html(b));
 results.push({outward,amplitude,checks,accepted:errors.length===0});
}
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({purpose:'Disposable geometry/visual probe; no production change',results},null,2)+'\n');
console.log(JSON.stringify({output:path.relative(process.cwd(),out),results}));
