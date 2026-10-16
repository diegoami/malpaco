import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspect} from '../T24/contract.mjs';
import {measure} from './measure.mjs';
import {area,exposedSegments,segmentPieces,distance,location} from '../T24/geometry.mjs';
const root=dirname(fileURLToPath(import.meta.url)),study=JSON.parse(readFileSync(resolve(root,'study.json'))),output=mkdtempSync(resolve(root,'evidence/diagnose-'));
const results=study.entries.map(entry=>{
 const board=JSON.parse(readFileSync(resolve(root,entry.board))),metrics=measure(board),constraints=inspect(board),byId=new Map(board.provinces.map(p=>[p.id,p]));
 const endpoints=board.routes.flatMap(r=>[[r.from,r.points[0],r.points[1]],[r.to,r.points.at(-1),r.points.at(-2)]].map(([id,p,q])=>{
  const d=distance(p,q),inside=[p[0]+12*(p[0]-q[0])/d,p[1]+12*(p[1]-q[1])/d],country=byId.get(id);
  return {country:country.name,continuationDistance:12,insideIntendedCountry:location(inside,country.polygon)===1,point:inside};
 }));
 const residuals=board.provinces.flatMap(p=>{const island=board.islands.find(i=>i.id===p.island);return exposedSegments(p,board).flatMap(({a,b})=>segmentPieces(a,b,island.polygon).pieces.filter(piece=>piece.where!==0).map(piece=>({country:p.name,length:distance(a,b)*(piece.to-piece.from),where:piece.where})));});
 const lengths=metrics.routes.map(r=>r.length),margins=metrics.routes.flatMap(r=>r.endpoints.map(e=>e.nearestCompetingRegion.distance));
 return {id:entry.id,board:entry.board,totalRouteLength:metrics.totalRouteLength,minRouteLength:Math.min(...lengths),maxRouteLength:Math.max(...lengths),routeLengths:metrics.routes.map(r=>({from:r.from,to:r.to,length:r.length,detour:r.detourRatio})),bends:metrics.totalBends,
  crossingPairs:metrics.interactions.filter(i=>!i.sharedCountry&&i.closestDistance<1e-6).length,sharedCountryContacts:metrics.interactions.filter(i=>i.sharedCountry&&i.closestDistance<1e-6).length,
  nonincidentRouteClearance:Math.min(...metrics.interactions.filter(i=>!i.sharedCountry).map(i=>i.closestDistance)),
  minUnrelatedCoastClearance:Math.min(...metrics.routes.map(r=>r.unrelatedCoastClearance)),minCompetingCountryDistance:Math.min(...margins),
  inwardContinuation:endpoints,continuationFailures:endpoints.filter(e=>!e.insideIntendedCountry).length,
  areaResiduals:board.islands.map(i=>({island:i.name,residual:Math.abs(area(i.polygon)-i.provinces.reduce((n,id)=>n+area(byId.get(id).polygon),0))})),explicitBoundaryResiduals:residuals,
  constraintCounts:Object.fromEntries(Object.entries(constraints).map(([k,v])=>[k,v.length])),constraints};
});
const report={limitations:'Inward continuation, route contacts, distance and clearance are geometry proxies. They do not establish human recognition or visual approval. T24 is run unchanged; microscopic residuals are disclosed, not waived.',results};
writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,results:results.map(({id,totalRouteLength,minRouteLength,maxRouteLength,continuationFailures,constraintCounts})=>({id,totalRouteLength,minRouteLength,maxRouteLength,continuationFailures,constraintCounts}))},null,2));
