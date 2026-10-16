import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {parameters as P} from './parameters.mjs';
import {svg,html} from './render.mjs';
import {box,edges,distance,signedArea,contained,exposedSegments,segmentPieces,intersectionParameters,sharedLength} from '../T24/geometry.mjs';
const root=dirname(fileURLToPath(import.meta.url)),read=p=>JSON.parse(readFileSync(resolve(root,p)));
const reference=read('input/reference-board.json'),templates=read('input/contact-template-T25.json');
mkdirSync(resolve(root,'evidence'),{recursive:true});const output=mkdtempSync(resolve(root,'evidence/build-'));
const rel=p=>p.slice(root.length+1),clone=x=>structuredClone(x),round=x=>Math.round(x*P.round)/P.round;
const mean=ps=>[ps.reduce((n,p)=>n+p[0],0)/ps.length,ps.reduce((n,p)=>n+p[1],0)/ps.length];
const failures=[];
function labels(board,method) {
 const packed=[];
 for(const p of board.provinces) {
  const b=box(p.polygon),centre=mean(p.polygon);let best=null,score=Infinity;
  for(let y=Math.ceil(b[1]+20);y<=b[3]-20;y+=2)for(let x=Math.ceil(b[0]+20);x<=b[2]-20;x+=2) {
   if(packed.some(q=>Math.max(Math.abs(q[0]-x),Math.abs(q[1]-y))<44))continue;
   if(!contained([[x-22,y-23],[x+22,y-23],[x+22,y+23],[x-22,y+23]],p.polygon))continue;
   const s=(x-centre[0])**2+(y-centre[1])**2;if(s<score){score=s;best=[x,y];}
  }
  // A failed packing remains visibly present, and is disclosed by T24/summary.
  if(!best){best=centre.map(round);failures.push({method,country:p.name,kind:'No 44x46 label box found',fallback:best});}
  p.labelAt=best;packed.push(best);
 }
}
function template() {
 const b=clone(reference);b.routes=[];
 for(const [j,i]of b.islands.entries()) {
  const old=templates.islands.find(q=>q.id===i.id),ob=box(old.polygon),[x,y,w,h]=P.templateBoxes[j];
  // [designed] A gentle coherent warp retains template contacts exactly. Every
  // shared vertex receives the identical transform; there is no random jitter.
  const transform=([px,py])=>{const u=(px-ob[0])/(ob[2]-ob[0]),v=(py-ob[1])/(ob[3]-ob[1]),s=v<.5?.5*(2*v)**P.templateCoastPower:1-.5*(2*(1-v))**P.templateCoastPower;return [round(x+w*(u+.01*Math.sin(Math.PI*v)*Math.sin(2*Math.PI*u))),round(y+h*s+2*Math.sin(Math.PI*u)*Math.sin(2*Math.PI*v))];};
  i.polygon=old.polygon.map(transform);
  for(const id of i.provinces)b.provinces.find(p=>p.id===id).polygon=templates.provinces.find(p=>p.id===id).polygon.map(transform);
 }
 labels(b,'coast-first');return b;
}
function dual() {
 const b=clone(reference);b.routes=[];
 for(const [j,i]of b.islands.entries()) {
  const order=P.dualOrder[j].map(k=>i.provinces[k]),angles=P.dualAngles[j].map(a=>a*Math.PI/180),[x,y,w,h]=P.dualBoxes[j],n=order.length;
  const at=(a,scale=1)=>[round(x+w/2+w/2*scale*Math.cos(a)),round(y+h/2+h/2*scale*Math.sin(a))];
  const seeds=angles.map(a=>at(a,.76)),coast=angles.map(a=>at(a));
  const join=angles.map((a,k)=>{let next=angles[(k+1)%n];while(next<a)next+=2*Math.PI;return at((a+next)/2);});
  i.polygon=coast.flatMap((p,k)=>[p,join[k]]);
  const neighbours=order.map(id=>b.provinces.find(p=>p.id===id).borders.map(id=>order.indexOf(id)));
  const rotations=neighbours.map((ns,k)=>ns.slice().sort((a,c)=>Math.atan2(seeds[a][1]-seeds[k][1],seeds[a][0]-seeds[k][0])-Math.atan2(seeds[c][1]-seeds[k][1],seeds[c][0]-seeds[k][0])));
  const seen=new Set(),faces=[];
  for(let u=0;u<n;u++)for(const v of neighbours[u]) {
   if(seen.has(`${u}/${v}`))continue;
   let a=u,c=v;const face=[];
   for(let limit=0;limit<100;limit++) {
    seen.add(`${a}/${c}`);face.push(a);const around=rotations[c],next=around[(around.indexOf(a)+around.length-1)%around.length];a=c;c=next;
    if(a===u&&c===v)break;
   }
   if(signedArea(face.map(k=>seeds[k]))>0)faces.push({vertices:face,centre:mean(face.map(k=>seeds[k])).map(round)});
  }
  const hasEdge=(f,a,c)=>f.vertices.some((v,k)=>v===a&&f.vertices[(k+1)%f.vertices.length]===c||v===c&&f.vertices[(k+1)%f.vertices.length]===a);
  for(let v=0;v<n;v++) {
   const next=(v+1)%n,previous=(v+n-1)%n,incident=faces.filter(f=>f.vertices.includes(v));
   let f=incident.find(f=>hasEdge(f,v,next));const chain=[],visited=new Set();
   while(f&&!visited.has(f)){visited.add(f);chain.push(f.centre);if(hasEdge(f,v,previous))break;f=incident.find(g=>!visited.has(g)&&g.vertices.filter(q=>f.vertices.includes(q)).filter(q=>q!==v).length===1);}
   if(chain.length!==incident.length)throw Error(`Dual face chain failed ${i.name}/${order[v]}`);
   b.provinces.find(p=>p.id===order[v]).polygon=[join[previous],coast[v],join[v],...chain];
  }
 }
 labels(b,'contact-dual');return b;
}
function pointSegment(p,a,b) {const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return distance(p,[a[0]+t*dx,a[1]+t*dy]);}
function clear(board,a,b) {
 if(distance(a,b)<1)return false;
 for(const island of board.islands){const pieces=segmentPieces(a,b,island.polygon).pieces;if(pieces.some(p=>p.to-p.from>1e-8&&p.where>=0))return false;}
 return true;
}
function ports(board) {
 const byId=new Map(board.provinces.map(p=>[p.id,p])),chosen=[];
 const options=p=>exposedSegments(p,board).flatMap(({a,b})=>P.portFractions.map(t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])).map(point=>({point,margin:Math.min(...board.provinces.filter(q=>q.island===p.island&&q.id!==p.id).flatMap(q=>edges(q.polygon).map(([a,b])=>pointSegment(point,a,b))))}));
 for(const r of reference.routes) {
  const a=byId.get(r.from),b=byId.get(r.to),candidates=[];
  for(const p of options(a))for(const q of options(b))if(clear(board,p.point,q.point))candidates.push({from:r.from,to:r.to,points:[p.point,q.point],length:distance(p.point,q.point),margin:Math.min(p.margin,q.margin)});
  if(!candidates.length){failures.push({kind:'No direct route',from:a.name,to:b.name});board.routes.push(clone(r));continue;}
  let best=null,cost=Infinity;
  for(const c of candidates) {
   let score=c.length+Math.max(0,P.endpointMargin-c.margin)**2*5;
   for(const old of chosen) {
    if(intersectionParameters(...c.points,...old.points).length)score+=100000;
    for(const [id,p]of [[c.from,c.points[0]],[c.to,c.points[1]]])for(const [oid,q]of [[old.from,old.points[0]],[old.to,old.points[1]]])if(id===oid)score+=Math.max(0,P.routeSeparation-distance(p,q))**2*50;
   }
   if(score<cost){cost=score;best=c;}
  }
  chosen.push(best);board.routes.push({from:best.from,to:best.to,points:best.points});
 }
}
const boards=[{id:'baseline',title:'Baseline · T59',board:clone(reference),role:'baseline',method:'Pinned T59 geometry, identical renderer'},
 {id:'coast-first',title:'A · Coast-first templates',board:template(),role:'candidate',method:'Co-designed envelopes, existing contact template, direct separated ports'},
 {id:'contact-dual',title:'B · Graph contact dual',board:dual(),role:'candidate',method:'Planar graph faces → region junctions → entrance coast arcs'}];
boards.push({id:'ports-only',title:'D · Ports-only ablation',board:clone(reference),role:'ablation',method:'Unchanged baseline land and labels; replace only coast ports/routes'});
for(const entry of boards) {
 if(entry.role!=='baseline'){entry.board.routes=[];ports(entry.board);}
 entry.actualBorders=[];
 for(const p of entry.board.provinces){const actual=entry.board.provinces.filter(q=>q.id!==p.id&&q.island===p.island&&sharedLength(p.polygon,q.polygon)>1e-6).map(q=>q.id).sort();if(JSON.stringify(actual)!==JSON.stringify([...p.borders].sort()))entry.actualBorders.push({country:p.name,actual,expected:p.borders});}
 writeFileSync(resolve(output,`${entry.id}.json`),JSON.stringify(entry.board,null,2)+'\n');writeFileSync(resolve(output,`${entry.id}.svg`),svg(entry.board));writeFileSync(resolve(output,`${entry.id}.html`),html(entry.board,entry.title));
}
// Third approach is a deliberately schematic presentation variant, not a third
// independent geometry: pair-labelled shore gates on the contact-dual map.
writeFileSync(resolve(output,'gates.html'),html(boards[2].board,'C · Explicit paired shore gates',{gates:true}));
writeFileSync(resolve(output,'report.json'),JSON.stringify({failures,borders:boards.map(b=>({id:b.id,errors:b.actualBorders}))},null,2)+'\n');
for(const file of ['build.mjs','render.mjs','parameters.mjs'])writeFileSync(resolve(output,file+'.snapshot'),readFileSync(resolve(root,file)));
const study={approaches:[{id:'coast-first',description:boards[1].method},{id:'contact-dual',description:boards[2].method},{id:'explicit-gates',description:'Pair-labelled coast gates clarify route identity; same geometry as B; no geographic shortening claim'}],entries:boards.map(e=>({id:e.id,role:e.role,board:rel(resolve(output,e.id+'.json')),html:rel(resolve(output,e.id+'.html')),method:e.method})),gates:rel(resolve(output,'gates.html'))};
writeFileSync(resolve(output,'study.json'),JSON.stringify(study,null,2)+'\n');writeFileSync(resolve(root,'study.json'),JSON.stringify(study,null,2)+'\n');
const hashes=Object.fromEntries([...boards.flatMap(e=>[e.id+'.json',e.id+'.svg',e.id+'.html']),'gates.html','report.json','study.json','build.mjs.snapshot','render.mjs.snapshot','parameters.mjs.snapshot'].map(f=>[f,createHash('sha256').update(readFileSync(resolve(output,f))).digest('hex')]));
writeFileSync(resolve(output,'sha256.json'),JSON.stringify(hashes,null,2)+'\n');
console.log(JSON.stringify({output,failures,borders:boards.map(e=>({id:e.id,errors:e.actualBorders.length}))},null,2));
