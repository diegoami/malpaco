import {checkConstraint as legacy, constraints as legacyConstraints, boardScale} from '../T24/contract.mjs';
import {E,point,simple,edges,distance,location,segmentPieces,onSegment} from '../T24/geometry.mjs';
import {parameters as P} from './parameters.mjs';

export const constraints=['attachment','water','traceability','preserved'];
// Only the old midpoint/attachment and water groups are replaced. Everything
// else calls the legacy implementation with its original parameters unchanged.
export const preservedConstraints=legacyConstraints.filter(n=>!['coasts','intersections'].includes(n));
const pair=r=>[r.from,r.to].sort().join('|');
export const routeSegments=r=>r.points.slice(1).map((p,j)=>[r.points[j],p]);
export function pointSegmentGap(p,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],norm=dx*dx+dy*dy;
  const t=norm?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/norm)):0;
  return distance(p,[a[0]+t*dx,a[1]+t*dy]);
}
// Opposite-sided orientations detect transverse intersections; endpoint tests
// also cover a short segment wholly contained in a longer collinear segment.
export function segmentGap(a,b,c,d) {
  const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
  const u=cross(a,b,c),v=cross(a,b,d),w=cross(c,d,a),z=cross(c,d,b);
  if((u>0&&v<0||u<0&&v>0)&&(w>0&&z<0||w<0&&z>0))return 0;
  if(onSegment(a,c,d)||onSegment(b,c,d)||onSegment(c,a,b)||onSegment(d,a,b))return 0;
  return Math.min(pointSegmentGap(a,c,d),pointSegmentGap(b,c,d),pointSegmentGap(c,a,b),pointSegmentGap(d,a,b));
}
const routeGap=(a,b)=>Math.min(...routeSegments(a).flatMap(([p,q])=>routeSegments(b).map(([r,s])=>segmentGap(p,q,r,s))));
export {routeGap};
const validRoute=r=>Array.isArray(r.points)&&r.points.length>=2&&r.points.every(point);
function geometry(board) {
  if(!board.provinces?.length||!board.islands?.length||!Array.isArray(board.routes)||!board.provinces.every(p=>simple(p.polygon))||!board.islands.every(i=>simple(i.polygon)))throw Error('Missing/non-finite/non-simple land geometry');
  const scale=boardScale(board);
  if(!Number.isFinite(scale)||scale<=0)throw Error('Invalid compact coordinate frame');
  return {scale,byId:new Map(board.provinces.map(p=>[p.id,p]))};
}
export function checkConstraint(group,board) {
  if(!constraints.includes(group))throw Error(`Unknown constraint: ${group}`);
  if(group==='preserved')return preservedConstraints.flatMap(n=>legacy(n,board).map(e=>`${n}: ${e}`));
  const errors=[],fail=s=>errors.push(s);
  try {
    const {scale,byId}=geometry(board);
    for(const r of board.routes) {
      if(!validRoute(r)){fail('Missing/invalid finite route points');continue;}
      if(group==='attachment')for(const [id,end,next] of [[r.from,r.points[0],r.points[1]],[r.to,r.points.at(-1),r.points.at(-2)]]) {
        const p=byId.get(id),island=board.islands.find(i=>i.id===p?.island);
        if(!p||!island){fail(`Unknown endpoint country ${id}`);continue;}
        if(location(end,p.polygon)!==0||location(end,island.polygon)!==0)fail(`Endpoint not on intended exposed coast ${id}`);
        if(board.provinces.some(q=>q.id!==id&&location(end,q.polygon)>=0))fail(`Ambiguous endpoint ${id}`);
        const competitors=board.provinces.filter(q=>q.id!==id&&q.island===p.island);
        const margin=Math.min(...competitors.flatMap(q=>edges(q.polygon).map(([a,b])=>pointSegmentGap(end,a,b))))*scale;
        if(margin<P.competingCountryMarginCss)fail(`Competing-country margin below ${P.competingCountryMarginCss}px ${id}`);
        const length=distance(end,next),extension=P.inwardContinuationCss/scale;
        if(length<=E){fail(`No inward direction ${id}`);continue;}
        const inward=[end[0]+extension*(end[0]-next[0])/length,end[1]+extension*(end[1]-next[1])/length];
        if(location(inward,p.polygon)!==1||segmentPieces(end,inward,p.polygon).pieces.some(p=>p.where!==1))fail(`Inward ${P.inwardContinuationCss}px continuation leaves intended country ${id}`);
      }
      if(group==='water') {
        // The entire legacy no-land/no-touch test is retained below, including
        // source/destination re-entry, boundary following and isolated tangencies.
        const own=new Set([byId.get(r.from)?.island,byId.get(r.to)?.island]);
        for(const island of board.islands.filter(i=>!own.has(i.id))) {
          const gap=Math.min(...routeSegments(r).flatMap(([a,b])=>edges(island.polygon).map(([c,d])=>segmentGap(a,b,c,d))))*scale;
          if(gap<P.unrelatedCoastClearanceCss)fail(`Unrelated-coast clearance below ${P.unrelatedCoastClearanceCss}px ${pair(r)}/${island.id}`);
        }
      }
      if(group==='traceability') {
        if(distance(r.points[0],r.points.at(-1))*scale<P.endpointSpanCss)fail(`Endpoint span below ${P.endpointSpanCss}px ${pair(r)}`);
        const segments=routeSegments(r);
        for(let a=0;a<segments.length;a++) {
          const [p,q]=segments[a];
          if(distance(p,q)<=E)fail(`Zero-length segment ${pair(r)}`);
          for(let b=a+1;b<segments.length;b++) {
            const [s,t]=segments[b];
            if(b===a+1) {
              // Adjacent segments may share their common bend, but cannot
              // reverse over any positive length of the preceding segment.
              if(onSegment(t,p,q)||onSegment(p,s,t))fail(`Backtracking adjacent segments ${pair(r)}`);
            } else if(segmentGap(p,q,s,t)<=E)fail(`Self-contact ${pair(r)}`);
          }
        }
      }
    }
    if(group==='water')errors.push(...legacy('intersections',board));
    if(group==='traceability')for(let a=0;a<board.routes.length;a++)for(let b=a+1;b<board.routes.length;b++) {
      const x=board.routes[a],y=board.routes[b];
      if(validRoute(x)&&validRoute(y)&&routeGap(x,y)*scale<P.routeSeparationCss)fail(`Route separation below ${P.routeSeparationCss}px ${pair(x)}/${pair(y)}`);
    }
  } catch(error) {fail(`Malformed ${group} input: ${error.message}`);}
  return errors;
}
export const inspect=board=>Object.fromEntries(constraints.map(n=>[n,checkConstraint(n,board)]));
