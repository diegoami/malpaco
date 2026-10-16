import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { audit as originalAudit, failures as originalFailures, edges, pair } from '../T25/audit.mjs';
import { area, edges as segments, distance } from '../T24/geometry.mjs';
export { pair, diagnostics } from '../T25/audit.mjs';
export const baseline=JSON.parse(readFileSync(new URL('../T25/board.json',import.meta.url)));
const byName=name=>baseline.provinces.find(p=>p.name===name).id;
export const namedPair=(a,b)=>pair(byName(a),byName(b));
export const expected={
  added:[namedPair('South rest','Fort town'),namedPair('Rock bay','Upper ridge')].sort(),
  removed:[namedPair('South rest','Silver ford'),namedPair('Rock bay','Marsh keep'),namedPair('South fell','Marsh keep')].sort(),
};
const delta=(before,after)=>({added:after.filter(e=>!before.includes(e)),removed:before.filter(e=>!after.includes(e))});
function pointSegment(p,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],length2=dx*dx+dy*dy;
  const t=length2?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length2)):0;
  return distance(p,[a[0]+t*dx,a[1]+t*dy]);
}
function gap(a,b) {
  return Math.min(...segments(a).flatMap(([p,q])=>segments(b).map(([r,s])=>Math.min(pointSegment(p,r,s),pointSegment(q,r,s),pointSegment(r,p,q),pointSegment(s,p,q)))));
}
// A top-row shared boundary is vertical before rotation. Measure its actual
// rendered geometry, rather than trusting a declared angle or pose metadata.
export function measuredRotation(board,islandId) {
  const island=board.islands.find(i=>i.id===islandId);
  const [a,b]=island.provinces.slice(0,2).map(id=>board.provinces.find(p=>p.id===id));
  const shared=a.polygon.filter(p=>b.polygon.some(q=>distance(p,q)<1e-6)).sort((p,q)=>p[1]-q[1]);
  if(shared.length<2)throw Error(`Missing rotation landmark ${islandId}`);
  const first=shared[0],last=shared.at(-1);
  return Math.atan2(-(last[0]-first[0]),last[1]-first[1])*180/Math.PI;
}
export function comparison(board) {
  const routes=b=>b.routes.map(r=>({edge:pair(r.from,r.to),length:r.points.slice(1).reduce((n,p,j)=>n+distance(r.points[j],p),0),direct:distance(r.points[0],r.points.at(-1)),segments:r.points.length-1}));
  return {
    frame:{baseline:baseline.bounds,proposed:board.bounds},
    land:delta(edges(baseline,'borders'),edges(board,'borders')),
    sea:delta(edges(baseline,'seaLanes'),edges(board,'seaLanes')),
    rotations:{north:measuredRotation(board,'island_0'),cliff:measuredRotation(board,'island_7')},
    islands:board.islands.map(i=>{const old=baseline.islands.find(j=>j.id===i.id);return {id:i.id,name:i.name,beforeArea:area(old.polygon),afterArea:area(i.polygon),beforeBonus:old.bonus,afterBonus:i.bonus};}),
    waterGaps:board.islands.flatMap((i,j)=>board.islands.slice(j+1).map(k=>({islands:[i.id,k.id],before:gap(baseline.islands.find(x=>x.id===i.id).polygon,baseline.islands.find(x=>x.id===k.id).polygon),after:gap(i.polygon,k.polygon)}))),
    routes:{before:routes(baseline),after:routes(board)},
  };
}
export function audit(board) {
  const report=originalAudit(board),errors=[];
  try {
    const c=comparison(board);report.comparison=c;
    if(!isDeepStrictEqual(c.frame.baseline,c.frame.proposed))errors.push('Comparison frame changed');
    if(c.land.added.length||c.land.removed.length)errors.push('Land edges changed');
    if(!isDeepStrictEqual(c.sea,expected))errors.push('Sea changes differ from owner-approved replacements/removal');
    if(!(c.rotations.north<0&&c.rotations.north>=-10.5))errors.push('North must rotate anticlockwise at most about ten degrees');
    if(!(c.rotations.cliff>0&&c.rotations.cliff<=10.5))errors.push('Cliff must rotate clockwise at most about ten degrees');
  }catch(error){errors.push(error.message);}
  report.referenceErrors=errors;return report;
}
export const failures=report=>[...originalFailures(report),...report.referenceErrors];
