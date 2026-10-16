import {area,edges,distance,intersectionParameters} from '../T24/geometry.mjs';
const pair=(a,b)=>[a,b].sort().join('|');
const pointSegment=(p,a,b)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1],norm=dx*dx+dy*dy;
  const t=norm?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/norm)):0;
  return distance(p,[a[0]+t*dx,a[1]+t*dy]);
};
const segmentGap=(a,b,c,d)=>intersectionParameters(a,b,c,d).length?0:Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b));
const routeSegments=r=>r.points.slice(1).map((p,j)=>[r.points[j],p]);
export function measure(board) {
  const byId=new Map(board.provinces.map(p=>[p.id,p]));
  const routes=board.routes.map(r=>{
    const segments=routeSegments(r),direct=distance(r.points[0],r.points.at(-1));
    const length=segments.reduce((n,[a,b])=>n+distance(a,b),0);
    const own=new Set([byId.get(r.from)?.island,byId.get(r.to)?.island]);
    const unrelated=board.islands.filter(i=>!own.has(i.id));
    const clearance=unrelated.length?Math.min(...unrelated.flatMap(i=>edges(i.polygon).flatMap(([c,d])=>segments.map(([a,b])=>segmentGap(a,b,c,d))))):null;
    const endpoints=[[r.from,r.points[0]],[r.to,r.points.at(-1)]].map(([id,point])=>{
      const country=byId.get(id),competitors=board.provinces.filter(p=>p.id!==id&&p.island===country?.island);
      const distances=competitors.map(p=>({id:p.id,name:p.name,distance:Math.min(...edges(p.polygon).map(([a,b])=>pointSegment(point,a,b)))})).sort((a,b)=>a.distance-b.distance);
      return {country:id,nearestCompetingRegion:distances[0]??null};
    });
    return {edge:pair(r.from,r.to),from:byId.get(r.from)?.name,to:byId.get(r.to)?.name,length,direct,detourRatio:direct?length/direct:null,bends:Math.max(0,r.points.length-2),unrelatedCoastClearance:clearance,endpoints};
  });
  const interactions=[];
  for(let a=0;a<board.routes.length;a++)for(let b=a+1;b<board.routes.length;b++){
    const x=board.routes[a],y=board.routes[b];let closest=Infinity;
    for(const [p,q] of routeSegments(x))for(const [r,s] of routeSegments(y))closest=Math.min(closest,segmentGap(p,q,r,s));
    interactions.push({routes:[pair(x.from,x.to),pair(y.from,y.to)],sharedCountry:[x.from,x.to].some(id=>id===y.from||id===y.to),closestDistance:closest});
  }
  return {units:'board coordinates; compare within the same 800x460 frame',limitations:'Distance and intersection proxies do not prove recognition or attractiveness. Shared-country route contacts may be intentional; inspect the pictures.',landArea:board.islands.reduce((n,i)=>n+area(i.polygon),0),routes,interactions,totalRouteLength:routes.reduce((n,r)=>n+r.length,0),totalBends:routes.reduce((n,r)=>n+r.bends,0)};
}
