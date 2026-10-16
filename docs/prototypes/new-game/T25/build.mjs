// [designed] One hand-arranged reference, not a seed generator or a rate claim.
// T22 supplies relative island placement; T24 supplies all rule/spacing limits.
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { source, opening, audit, failures } from './audit.mjs';
import { inspect } from '../T24/contract.mjs';
import { E, sharedLength, coastMidpoint, segmentPieces, location, distance, box, exposedSegments, onSegment } from '../T24/geometry.mjs';
import { parameters as P } from '../T24/parameters.mjs';
import { html, svg } from './render.mjs';
const root=dirname(fileURLToPath(import.meta.url));
mkdirSync(resolve(root,'evidence'),{recursive:true});const output=mkdtempSync(resolve(root,'evidence/build-'));
const placements={
 island_0:[315,25],island_1:[602,25],island_2:[24,188],island_3:[638,338],
 island_4:[310,182],island_5:[603,180],island_6:[24,297],island_7:[24,20],island_8:[290,297],
};
// Shared row boundaries create irregular 2/3/2 and 3/4/3 subdivisions without
// high-degree Voronoi vertices. Width 58 / row height 50 leaves real 40px hits.
const rows={3:[[1,1],[2]],5:[[1,1,1],[2,1]],7:[[1,2],[1,1,1],[2,1]],10:[[1,1,2],[1,1,1,1],[2,1,1]]};
const board={seed:1994,bounds:{x:0,y:0,width:800,height:460},provinces:[],islands:[],routes:[]};
function clip(poly,axis,value,less) {
 const result=[];
 for(let i=0;i<poly.length;i++) {
  const a=poly[i],b=poly[(i+1)%poly.length],u=(a[axis]-value)*(less?1:-1),v=(b[axis]-value)*(less?1:-1);
  if(u<=0)result.push(a);
  if((u<0&&v>0)||(u>0&&v<0)){const t=u/(u-v);result.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
 }
 return result;
}
for(const [index,original] of source.islands.entries()) {
 const layout=rows[original.provinces.length],width=layout[0].reduce((a,b)=>a+b)*58,height=layout.length*50,[x,y]=placements[original.id];
 const cut=8+(index%3)*2;
 const polygon=[[cut,0],[width-12,0],[width,10],[width,height-cut],[width-cut,height],[10,height],[0,height-12],[0,cut]];
 const transform=([u,v])=>[x+u+(v-height/2)/32,y+v+(u-width/2)/128];
 const island={...original,polygon:polygon.map(transform),bonus:0};board.islands.push(island);
 let j=0;
 for(const [r,row] of layout.entries()) {
  let left=0;
  for(const units of row) {
   const w=units*58,id=original.provinces[j++],p=source.provinces.find(p=>p.id===id);
   let cell=clip(clip(clip(clip(polygon,0,left,false),0,left+w,true),1,r*50,false),1,(r+1)*50,true);
   board.provinces.push({id,name:p.name,island:original.id,polygon:cell.map(transform),labelAt:transform([left+w/2,r*50+25]),
    borders:[],seaLanes:[],owner:opening.ownerOf[id],armies:opening.armies[id],production:opening.productionCentres.includes(id),hitSizeCss:P.hitSize,countTextCss:P.countTextMin,countContrast:P.contrastMin});
   left+=w;
  }
 }
}
for(const p of board.provinces)p.borders=board.provinces.filter(q=>q.id!==p.id&&q.island===p.island&&sharedLength(p.polygon,q.polygon)>E).map(q=>q.id);
const fixed=inspect(board),fixedErrors=['counts','degree','cells','borders','labels'].flatMap(k=>fixed[k].map(e=>`${k}: ${e}`));
if(fixedErrors.length) {
 writeFileSync(resolve(output,'fixed-geometry.json'),JSON.stringify({board,errors:fixedErrors},null,2)+'\n');
 console.log(JSON.stringify({accepted:false,fixedErrors,output},null,2));process.exit(1);
}

function clear(a,b) {
 if(distance(a,b)<=E)return false;
 for(const island of board.islands) {
  const parts=segmentPieces(a,b,island.polygon);
  if(parts.pieces.some(p=>p.where>=0))return false;
  if(parts.ts.some(t=>t>0&&t<1&&location([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],island.polygon)>=0))return false;
 }
 return true;
}
const corners=board.islands.flatMap(i=>{const [x,y,r,b]=box(i.polygon);return [[x-7,y-7],[r+7,y-7],[r+7,b+7],[x-7,b+7]];});
const adjacency=corners.map(()=>[]);
for(let a=0;a<corners.length;a++)for(let b=a+1;b<corners.length;b++)if(clear(corners[a],corners[b])){adjacency[a].push(b);adjacency[b].push(a);}
function waterPath(start,end) {
 if(clear(start,end))return [start,end];
 const nodes=[...corners,start,end],n=nodes.length,startIndex=n-2,endIndex=n-1,links=adjacency.map(ns=>[...ns]);links.push([],[]);
 for(const k of [startIndex,endIndex])for(let i=0;i<k;i++)if(clear(nodes[k],nodes[i])){links[k].push(i);links[i].push(k);}
 const costs=nodes.map(()=>Infinity),previous=[],done=new Set();costs[startIndex]=0;
 for(let step=0;step<n;step++) {
  let at=-1;for(let j=0;j<n;j++)if(!done.has(j)&&(at<0||costs[j]<costs[at]))at=j;
  if(at<0||!Number.isFinite(costs[at]))break;
  if(at===endIndex){const result=[];for(let k=at;k!==undefined;k=previous[k])result.unshift(nodes[k]);return result;}
  done.add(at);
  for(const j of links[at]){const next=costs[at]+distance(nodes[at],nodes[j]);if(next<costs[j]){costs[j]=next;previous[j]=at;}}
 }
 return null;
}
// [designed] Grid neighbours plus four perimeter links: 16 total, island degree
// at most four, and diameter at most four. Exact country pairs are disclosed.
const links=[[7,0],[0,1],[2,4],[4,5],[6,8],[8,3],[7,2],[2,6],[0,4],[4,8],[1,5],[5,3],[7,1],[6,3],[7,6],[1,3]];
const byId=new Map(board.provinces.map(p=>[p.id,p]));
const entrances=i=>i.provinces.filter(id=>byId.get(id).seaLanes.length);
let optionsTried=0;
const depthCounts={},routeFailures={},fullFailures=[];
// [designed] Represent ports on their exact exposed segment using binary-rational
// interpolation. This avoids roundoff slivers in intersection arithmetic while
// remaining far inside T24's existing 1px midpoint tolerance (<=0.03px here).
function port(p,destination) {
 const middle=coastMidpoint(p,board,destination);if(!middle)return null;
 const edge=exposedSegments(p,board).find(({a,b})=>onSegment(middle,a,b));if(!edge)return null;
 const {a,b}=edge,dx=b[0]-a[0],dy=b[1]-a[1],t=((middle[0]-a[0])*dx+(middle[1]-a[1])*dy)/(dx*dx+dy*dy);
 const u=Math.round(t*4096)/4096;
 return [a[0]+dx*u,a[1]+dy*u];
}
function assign(k) {
 depthCounts[k]=(depthCounts[k]??0)+1;
 if(k===links.length) {
  for(const i of board.islands)i.bonus=Math.max(2,Math.floor(i.provinces.length/2)+entrances(i).length);
  const errors=failures(audit(board));if(errors.length&&fullFailures.length<3)fullFailures.push(errors);
  return !errors.length;
 }
 if(optionsTried>1000)return false;
 const [ai,bi]=links[k],a=board.islands[ai],b=board.islands[bi];
 const choices=[];
 for(const id of a.provinces)for(const other of b.provinces) {
  const p=byId.get(id),q=byId.get(other);
  if(p.seaLanes.length>=P.countryCrossingMax||q.seaLanes.length>=P.countryCrossingMax||p.borders.length+p.seaLanes.length>=P.degreeMax||q.borders.length+q.seaLanes.length>=P.degreeMax)continue;
  if((!p.seaLanes.length&&entrances(a).length>=Math.ceil(a.provinces.length/2))||(!q.seaLanes.length&&entrances(b).length>=Math.ceil(b.provinces.length/2)))continue;
  const start=port(p,b),end=port(q,a);if(!start||!end)continue;
  const extra=(p,i)=>!p.seaLanes.length?(entrances(i).length<2?-70:70):25;
  const score=distance(start,end)+extra(p,a)+extra(q,b);
  choices.push({p,q,start,end,score});
 }
 choices.sort((a,b)=>a.score-b.score||a.p.id.localeCompare(b.p.id)||a.q.id.localeCompare(b.q.id));
 for(const {p,q,start,end} of choices) {
  if(optionsTried>1000)break;
  optionsTried++;const points=waterPath(start,end);if(!points){routeFailures[k]=(routeFailures[k]??0)+1;continue;}
  p.seaLanes.push(q.id);q.seaLanes.push(p.id);board.routes.push({from:p.id,to:q.id,points});
  if(assign(k+1))return true;
  board.routes.pop();p.seaLanes.pop();q.seaLanes.pop();
 }
 return false;
}
const accepted=assign(0),report={accepted,optionsTried,depthCounts,routeFailures,fullFailures,...audit(board)};
writeFileSync(resolve(output,'board.json'),JSON.stringify(board,null,2)+'\n');
writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(resolve(output,'preview.html'),html(board));writeFileSync(resolve(output,'map.svg'),svg(board));
console.log(JSON.stringify({accepted,optionsTried,failures:failures(report),output},null,2));
if(!accepted)process.exitCode=1;
