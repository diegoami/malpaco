import { parameters as P } from './parameters.mjs';
export const E=P.coordinateTolerance;
export const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export const edges=p=>p.map((a,i)=>[a,p[(i+1)%p.length]]);
export const signedArea=p=>edges(p).reduce((n,[a,b])=>n+a[0]*b[1]-b[0]*a[1],0)/2;
export const area=p=>Math.abs(signedArea(p));
export const box=p=>[Math.min(...p.map(p=>p[0])),Math.min(...p.map(p=>p[1])),Math.max(...p.map(p=>p[0])),Math.max(...p.map(p=>p[1]))];
const along=(p,a,b)=>((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/distance(a,b)**2;
const interpolate=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
export function onSegment(p,a,b) {
  const length=distance(a,b);
  if(length<=E)return distance(p,a)<=E;
  const t=along(p,a,b);
  return Math.abs(cross(a,b,p))/length<=E && t>=-E/length && t<=1+E/length;
}
export function intersectionParameters(a,b,c,d) {
  const rx=b[0]-a[0],ry=b[1]-a[1],sx=d[0]-c[0],sy=d[1]-c[1];
  const denom=rx*sy-ry*sx;
  if(Math.abs(denom)<=E*Math.max(distance(a,b),distance(c,d))) {
    if(distance(a,b)<=E||Math.abs(cross(a,b,c))/distance(a,b)>E)return [];
    return [along(c,a,b),along(d,a,b)].filter(t=>t>=0&&t<=1);
  }
  const t=((c[0]-a[0])*sy-(c[1]-a[1])*sx)/denom;
  const u=((c[0]-a[0])*ry-(c[1]-a[1])*rx)/denom;
  return t>=0&&t<=1&&u>=0&&u<=1?[t]:[];
}
// -1 outside, 0 boundary, 1 strictly inside.
export function location(p,polygon) {
  let inside=false;
  for(const [a,b] of edges(polygon)) {
    if(onSegment(p,a,b))return 0;
    if((a[1]>p[1])!==(b[1]>p[1]) && p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside?1:-1;
}
export function simple(p) {
  if(!Array.isArray(p)||p.length<3||!p.every(point)||area(p)<=E*E)return false;
  const e=edges(p);
  for(let i=0;i<e.length;i++) {
    if(distance(...e[i])<=E)return false;
    // A repeated vertex makes a pinched/disconnected cell, even if area > 0.
    for(let j=i+1;j<e.length;j++)if(distance(p[i],p[j])<=E)return false;
    for(let j=i+1;j<e.length;j++) {
      if(j===i+1||(i===0&&j===e.length-1))continue;
      if(intersectionParameters(...e[i],...e[j]).length||onSegment(e[i][0],...e[j])||onSegment(e[j][0],...e[i]))return false;
    }
  }
  return true;
}
export function segmentPieces(a,b,polygon) {
  const ts=[0,1,...edges(polygon).flatMap(([c,d])=>intersectionParameters(a,b,c,d))].sort((a,b)=>a-b);
  const unique=ts.filter((t,i)=>i===0||t-ts[i-1]>1e-12);
  return { ts:unique, pieces:unique.slice(1).map((t,i)=>({from:unique[i],to:t,where:location(interpolate(a,b,(unique[i]+t)/2),polygon)})) };
}
export function contained(polygon,container) {
  return polygon.every(p=>location(p,container)>=0) && edges(polygon).every(([a,b])=>segmentPieces(a,b,container).pieces.every(p=>p.where>=0));
}
function triangles(poly) {
  const p=(signedArea(poly)>0?poly:[...poly].reverse()).map(p=>[...p]);const result=[];
  while(p.length>3) {
    let found=false;
    for(let i=0;i<p.length;i++) {
      const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];
      if(cross(a,b,c)<=E*E)continue;
      if(p.some((v,j)=>j!==i&&j!==(i+p.length-1)%p.length&&j!==(i+1)%p.length&&location(v,[a,b,c])>=0))continue;
      result.push([a,b,c]);p.splice(i,1);found=true;break;
    }
    if(!found) {
      const collinear=p.findIndex((b,i)=>Math.abs(cross(p[(i+p.length-1)%p.length],b,p[(i+1)%p.length]))<=E*E);
      if(collinear<0)throw Error('Cannot triangulate simple polygon');p.splice(collinear,1);
    }
  }
  if(p.length===3)result.push(p);return result;
}
function clippedArea(subject,clip) {
  let out=subject;
  for(const [a,b] of edges(clip)) {
    const input=out;out=[];
    for(let i=0;i<input.length;i++) {
      const c=input[i],d=input[(i+1)%input.length],v=cross(a,b,c),w=cross(a,b,d);
      if(v>=0)out.push(c);
      if((v>=0)!==(w>=0))out.push(interpolate(c,d,v/(v-w)));
    }
  }
  return out.length>=3?area(out):0;
}
export function overlap(a,b) {
  const x=box(a),y=box(b);
  if(Math.min(x[2],y[2])<=Math.max(x[0],y[0])||Math.min(x[3],y[3])<=Math.max(x[1],y[1]))return false;
  for(const t of triangles(a))for(const u of triangles(b))if(clippedArea(t,u)>E*E)return true;
  return false;
}
export function sharedLength(a,b) {
  let total=0;
  for(const [u,v] of edges(a))for(const [w,z] of edges(b)) {
    const length=distance(u,v);
    if(length<=E||Math.abs(cross(u,v,w))/length>E||Math.abs(cross(u,v,z))/length>E)continue;
    total+=Math.max(0,Math.min(1,Math.max(along(w,u,v),along(z,u,v)))-Math.max(0,Math.min(along(w,u,v),along(z,u,v))))*length;
  }
  return total;
}
export function coastMidpoint(p,board,destination) {
  const own=board.islands.find(i=>i.id===p.island),ob=box(own.polygon),db=box(destination.polygon);
  const direction=[(db[0]+db[2]-ob[0]-ob[2])/2,(db[1]+db[3]-ob[1]-ob[3])/2];
  const clockwise=signedArea(p.polygon)<0?-1:1;
  const pieces=[];
  for(const [a,b] of edges(p.polygon)) {
    const length=distance(a,b);let intervals=[[0,1]];
    for(const other of board.provinces.filter(q=>q.island===p.island&&q.id!==p.id))for(const [c,d] of edges(other.polygon)) {
      if(Math.abs(cross(a,b,c))/length>E||Math.abs(cross(a,b,d))/length>E)continue;
      const lo=Math.max(0,Math.min(along(c,a,b),along(d,a,b))),hi=Math.min(1,Math.max(along(c,a,b),along(d,a,b)));
      if(hi<=lo)continue;
      intervals=intervals.flatMap(([x,y])=>hi<=x||lo>=y?[[x,y]]:[[x,Math.min(y,lo)],[Math.max(x,hi),y]].filter(([u,v])=>v>u));
    }
    const facing=clockwise*((b[1]-a[1])*direction[0]-(b[0]-a[0])*direction[1])>E*length;
    for(const [x,y] of intervals)pieces.push({a:interpolate(a,b,x),b:interpolate(a,b,y),facing});
  }
  const chains=[];
  for(const piece of pieces) {
    if(!piece.facing)continue;
    const last=chains.at(-1);
    if(last&&distance(last.at(-1).b,piece.a)<=E)last.push(piece);else chains.push([piece]);
  }
  if(chains.length>1&&distance(chains.at(-1).at(-1).b,chains[0][0].a)<=E)chains[0]=[...chains.pop(),...chains[0]];
  const length=c=>c.reduce((n,s)=>n+distance(s.a,s.b),0);
  chains.sort((a,b)=>length(b)-length(a)||a[0].a[0]-b[0].a[0]||a[0].a[1]-b[0].a[1]);
  if(!chains.length)return null;
  let remaining=length(chains[0])/2;
  for(const {a,b} of chains[0]){const len=distance(a,b);if(remaining<=len)return interpolate(a,b,remaining/len);remaining-=len;}
  return null;
}
