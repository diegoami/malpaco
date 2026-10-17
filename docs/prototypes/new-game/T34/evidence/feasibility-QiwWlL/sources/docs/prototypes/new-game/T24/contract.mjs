import { parameters as P } from './parameters.mjs';
import { E,point,simple,area,overlap,contained,sharedLength,coastMidpoint,exposedSegments,distance,location,segmentPieces } from './geometry.mjs';
export const constraints=['counts','symmetry','connectivity','degree','cells','borders','crossings','coasts','intersections','bonus','fortress','concentration','remoteness','crowding','labels'];
const key=(a,b)=>a<b?`${a}|${b}`:`${b}|${a}`;
function neighbours(p){return [...new Set([...p.borders,...p.seaLanes])];}
function reached(start,adj) {
  const seen=new Set([start]),queue=[start];
  for(const id of queue)for(const n of adj.get(id)||[])if(!seen.has(n)){seen.add(n);queue.push(n);}
  return seen;
}
function graph(board) {
  const byId=new Map(board.provinces.map(p=>[p.id,p]));
  const islandAdj=new Map(board.islands.map(i=>[i.id,new Set()]));
  for(const p of board.provinces)for(const n of p.seaLanes){const other=byId.get(n);if(other&&other.island!==p.island)islandAdj.get(p.island)?.add(other.island);}
  const entrances=new Map(board.islands.map(i=>[i.id,i.provinces.filter(id=>byId.get(id)?.seaLanes.some(n=>byId.get(n)?.island!==i.id)).length]));
  return {byId,islandAdj,entrances};
}
function validGeometry(board) {return board.provinces.length>0&&board.provinces.every(p=>simple(p.polygon))&&board.islands.every(i=>simple(i.polygon));}
export function checkConstraint(name,board) {
  if(!constraints.includes(name))throw Error(`Unknown constraint: ${name}`);
  const errors=[],fail=message=>errors.push(message);
  try {
    const {byId,islandAdj,entrances}=graph(board);
    if(name==='counts') {
      if(board.provinces.length!==P.countryCount||byId.size!==P.countryCount)fail('Expected 46 unique countries');
      if(new Set(board.islands.map(i=>i.id)).size!==9)fail('Expected nine unique islands');
      if(JSON.stringify(board.islands.map(i=>i.provinces.length).sort((a,b)=>a-b))!==JSON.stringify(P.islandSizes))fail('Wrong island sizes');
      const members=board.islands.flatMap(i=>i.provinces);
      if(new Set(members).size!==46||members.length!==46)fail('Partition is not one-to-one');
      for(const i of board.islands)for(const id of i.provinces)if(byId.get(id)?.island!==i.id)fail(`Wrong island membership ${id}`);
      for(const p of board.provinces)if(!members.includes(p.id))fail(`Country absent from partition ${p.id}`);
    }
    if(name==='symmetry')for(const p of board.provinces)for(const field of ['borders','seaLanes']) {
      if(new Set(p[field]).size!==p[field].length)fail(`Duplicate ${field} ${p.id}`);
      for(const n of p[field]) {
        const other=byId.get(n);
        if(!other||n===p.id||!other[field].includes(p.id))fail(`Invalid/asymmetric ${field} ${p.id}/${n}`);
        if(other&&((field==='borders')!==(other.island===p.island)))fail(`Wrong edge classification ${p.id}/${n}`);
      }
    }
    if(name==='connectivity') {
      const adj=new Map(board.provinces.map(p=>[p.id,neighbours(p)]));
      if(!board.provinces.length||reached(board.provinces[0].id,adj).size!==board.provinces.length)fail('Country graph disconnected');
      for(const i of board.islands){const a=new Map(i.provinces.map(id=>[id,(byId.get(id)?.borders||[]).filter(n=>i.provinces.includes(n))]));if(!i.provinces.length||reached(i.provinces[0],a).size!==i.provinces.length)fail(`Island land disconnected ${i.id}`);}
      if(!board.islands.length||reached(board.islands[0].id,islandAdj).size!==board.islands.length)fail('Island graph disconnected');
    }
    if(name==='degree')for(const p of board.provinces){const n=neighbours(p).length;if(n<P.degreeMin||n>P.degreeMax)fail(`Degree ${p.id}=${n}`);}
    if(name==='cells') {
      if(!validGeometry(board)){fail('Missing/non-finite/non-simple country or silhouette');return errors;}
      for(const i of board.islands) {
        const cells=i.provinces.map(id=>byId.get(id));
        if(cells.some(p=>!p||!contained(p.polygon,i.polygon)))fail(`Cell outside silhouette ${i.id}`);
        const areaMismatch=Math.abs(cells.reduce((n,p)=>n+area(p.polygon),0)-area(i.polygon))>P.areaTolerance;
        if(areaMismatch)fail(`Subdivision gap/area mismatch ${i.id}`);
        else for(const p of cells)if(exposedSegments(p,board).some(({a,b})=>segmentPieces(a,b,i.polygon).pieces.some(piece=>piece.where!==0)))fail(`Explicit interior gap boundary ${p.id}`);
      }
      for(let a=0;a<board.provinces.length;a++)for(let b=a+1;b<board.provinces.length;b++)if(overlap(board.provinces[a].polygon,board.provinces[b].polygon))fail(`Cell overlap ${board.provinces[a].id}/${board.provinces[b].id}`);
      for(let a=0;a<board.islands.length;a++)for(let b=a+1;b<board.islands.length;b++)if(overlap(board.islands[a].polygon,board.islands[b].polygon)||sharedLength(board.islands[a].polygon,board.islands[b].polygon)>E)fail(`Islands overlap/touch ${board.islands[a].id}/${board.islands[b].id}`);
    }
    if(name==='borders') {
      if(!validGeometry(board)){fail('Cannot establish boundaries from invalid geometry');return errors;}
      for(const p of board.provinces) {
        const actual=board.provinces.filter(q=>q.id!==p.id&&q.island===p.island&&sharedLength(p.polygon,q.polygon)>E).map(q=>q.id).sort();
        if(JSON.stringify([...p.borders].sort())!==JSON.stringify(actual))fail(`Declared/shared boundary mismatch ${p.id}`);
      }
    }
    if(name==='crossings') {
      const links=new Set(board.provinces.flatMap(p=>p.seaLanes.map(n=>key(p.id,n))));
      if(links.size<P.crossingMin||links.size>P.crossingMax)fail(`Crossing count ${links.size}`);
      const routes=board.routes.map(r=>key(r.from,r.to));
      if(routes.length!==links.size||new Set(routes).size!==routes.length||routes.some(r=>!links.has(r)))fail('Routes do not match sea edges one-to-one');
      for(const p of board.provinces)for(const n of p.seaLanes)if(!byId.has(n)||byId.get(n).island===p.island)fail('Sea edge is not between two known islands');
    }
    if(name==='coasts') {
      if(!validGeometry(board)){fail('Cannot establish coast from invalid geometry');return errors;}
      const scale=boardScale(board);
      if(!Number.isFinite(scale)||scale<=0){fail('Invalid coast coordinate frame');return errors;}
      for(const r of board.routes) {
        if(!Array.isArray(r.points)||r.points.length<2||!r.points.every(point)){fail('Missing/invalid route points');continue;}
        for(const [id,otherId,end] of [[r.from,r.to,r.points[0]],[r.to,r.from,r.points.at(-1)]]) {
          const p=byId.get(id),other=byId.get(otherId),destination=board.islands.find(i=>i.id===other?.island);
          if(!p||!destination){fail('Unknown coast endpoint');continue;}
          const middle=coastMidpoint(p,board,destination);
          if(!middle||location(end,p.polygon)!==0||distance(end,middle)*scale>P.coastToleranceCss)fail(`Wrong/off-centre coast ${id}`);
          // An internal border is also a cell boundary; demand exposed coast.
          if(board.provinces.some(q=>q.id!==id&&location(end,q.polygon)>=0))fail(`Ambiguous/unexposed endpoint ${id}`);
        }
      }
    }
    if(name==='intersections') {
      if(!validGeometry(board)){fail('Cannot establish route clearance from invalid geometry');return errors;}
      for(const r of board.routes) {
        if(!Array.isArray(r.points)||r.points.length<2||!r.points.every(point)){fail('Missing route geometry');continue;}
        if(location(r.points[0],byId.get(r.from).polygon)>0||location(r.points.at(-1),byId.get(r.to).polygon)>0){fail('Route endpoint lies inside a country');continue;}
        for(let j=0;j<r.points.length-1;j++)for(const p of board.provinces) {
          const a=r.points[j],b=r.points[j+1],parts=segmentPieces(a,b,p.polygon);
          if(distance(a,b)<=E){fail('Zero-length route segment');continue;}
          if(parts.pieces.some(piece=>piece.where>=0)){fail(`Route traverses land/coast ${p.id}`);continue;}
          for(const t of parts.ts) {
            const v=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
            if(location(v,p.polygon)<0)continue;
            if(j===0&&t===0&&p.id===r.from)continue;
            if(j===r.points.length-2&&t===1&&p.id===r.to)continue;
            fail(`Route touches unrelated coast ${p.id}`);
          }
        }
      }
    }
    if(name==='bonus')for(const i of board.islands){const expected=Math.max(2,Math.floor(i.provinces.length/2)+entrances.get(i.id));if(i.bonus!==expected||i.bonus>i.provinces.length)fail(`Invalid bonus ${i.id}`);}
    if(name==='fortress') {
      const singles=board.islands.filter(i=>entrances.get(i.id)===1);
      if(singles.length>3||singles.some(i=>i.provinces.length>=7))fail('Single-entrance fortress limits exceeded');
    }
    if(name==='concentration') {
      const total=board.islands.reduce((n,i)=>n+i.bonus,0),easy=board.islands.filter(i=>entrances.get(i.id)===1).reduce((n,i)=>n+i.bonus,0);
      if(easy*4>total)fail('Easy bonuses exceed quarter of all bonuses');
    }
    if(name==='remoteness')for(const i of board.islands) {
      if(islandAdj.get(i.id).size>P.islandDegreeMax)fail(`Island has more than four neighbours ${i.id}`);
      const queue=[i.id],dist=new Map([[i.id,0]]);
      for(const n of queue)for(const k of islandAdj.get(n)||[])if(!dist.has(k)){dist.set(k,dist.get(n)+1);queue.push(k);}
      if(dist.size!==board.islands.length||[...dist.values()].some(n=>n>P.islandDistanceMax))fail(`Island more than four hops away ${i.id}`);
    }
    if(name==='crowding')for(const p of board.provinces)if(p.seaLanes.length>P.countryCrossingMax)fail(`Crowded crossing ${p.id}`);
    if(name==='labels') {
      const scale=boardScale(board),half=P.hitSize/(2*scale);
      if(!Number.isFinite(scale)||scale<=0){fail('Invalid board frame');return errors;}
      for(const p of board.provinces) {
        if(!point(p.labelAt)||!simple(p.polygon)){fail(`Missing/non-finite label/country ${p.id}`);continue;}
        const [x,y]=p.labelAt;
        const hit=[[x-half,y-half],[x+half,y-half],[x+half,y+half],[x-half,y+half]];
        if(!contained(hit,p.polygon)||x-half<board.bounds.x-E||x+half>board.bounds.x+board.bounds.width+E||y-half<board.bounds.y-E||y+half>board.bounds.y+board.bounds.height+E)fail(`Hit square outside country/frame ${p.id}`);
        if(![p.hitSizeCss,p.countTextCss,p.countContrast].every(Number.isFinite)||!(p.hitSizeCss>=P.hitSize&&p.countTextCss>=P.countTextMin&&p.countContrast>=P.contrastMin))fail(`Hit/text/contrast specification too small ${p.id}`);
      }
      for(let a=0;a<board.provinces.length;a++)for(let b=a+1;b<board.provinces.length;b++) {
        const u=board.provinces[a].labelAt,v=board.provinces[b].labelAt;
        if(point(u)&&point(v)&&Math.max(Math.abs(u[0]-v[0]),Math.abs(u[1]-v[1]))*scale+E<P.labelGap)fail(`Labels too close ${board.provinces[a].id}/${board.provinces[b].id}`);
      }
    }
  } catch(error) { fail(`Malformed ${name} input: ${error.message}`); }
  return errors;
}
export function boardScale(board) {
  const b=board.bounds;
  if(!b||![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0)return NaN;
  return Math.min(P.viewportWidth/b.width,(P.viewportHeight-P.panelHeight)/b.height);
}
export const inspect=board=>Object.fromEntries(constraints.map(name=>[name,checkConstraint(name,board)]));
