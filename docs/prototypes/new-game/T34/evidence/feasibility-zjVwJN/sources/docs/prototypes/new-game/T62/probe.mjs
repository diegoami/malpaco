import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {dirname,resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {inspect,checkConstraint,pointSegmentGap,routeGap,routeSegments,segmentGap,preservedConstraints} from './contract.mjs';
import {parameters as P} from './parameters.mjs';
import {inspect as legacyInspect,checkConstraint as legacy,boardScale} from '../T24/contract.mjs';
import {edges,distance,location,segmentPieces} from '../T24/geometry.mjs';
import {measure} from '../T60/measure.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const summarize=rows=>({evaluated:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows});
const criterion=(description,rows)=>({description,...summarize(rows)});
const results=['baseline','coast-first'].map(id=>{
 const input=resolve(root,`../T60/evidence/build-LrdPTV/${id}.json`),bytes=readFileSync(input),b=JSON.parse(bytes),scale=boardScale(b);
 const byId=new Map(b.provinces.map(p=>[p.id,p])),metrics=measure(b);
 const endpoints=b.routes.flatMap(r=>[[r.from,r.points[0],r.points[1]],[r.to,r.points.at(-1),r.points.at(-2)]].map(([id,p,q])=>{
  const country=byId.get(id),island=b.islands.find(i=>i.id===country.island),length=distance(p,q),extension=P.inwardContinuationCss/scale;
  const inward=[p[0]+extension*(p[0]-q[0])/length,p[1]+extension*(p[1]-q[1])/length];
  const margin=Math.min(...b.provinces.filter(c=>c.id!==id&&c.island===country.island).flatMap(c=>edges(c.polygon).map(([a,z])=>pointSegmentGap(p,a,z))))*scale;
  return {country:id,point:p,exposedUnique:location(p,country.polygon)===0&&location(p,island.polygon)===0&&!b.provinces.some(c=>c.id!==id&&location(p,c.polygon)>=0),competingCountryMarginCss:margin,
   inwardPoint:inward,wholeInwardSegmentInside:location(inward,country.polygon)===1&&segmentPieces(p,inward,country.polygon).pieces.every(p=>p.where===1)};
 }));
 const routes=b.routes.map(r=>{
  const own=new Set([byId.get(r.from).island,byId.get(r.to).island]);
  const clearance=Math.min(...b.islands.filter(i=>!own.has(i.id)).flatMap(i=>routeSegments(r).flatMap(([a,z])=>edges(i.polygon).map(([c,d])=>segmentGap(a,z,c,d)))))*scale;
  return {edge:[r.from,r.to].sort().join('|'),endpointSpanCss:distance(r.points[0],r.points.at(-1))*scale,unrelatedCoastClearanceCss:clearance,
   waterErrors:legacy('intersections',{...b,routes:[r]}),selfTraceErrors:checkConstraint('traceability',{...b,routes:[r]}).filter(e=>!e.startsWith('Endpoint span'))};
 });
 const interactions=[];
 for(let a=0;a<b.routes.length;a++)for(let z=a+1;z<b.routes.length;z++){
  const x=b.routes[a],y=b.routes[z];interactions.push({routes:[routes[a].edge,routes[z].edge],sharedCountry:[x.from,x.to].some(id=>id===y.from||id===y.to),gapCss:routeGap(x,y)*scale});
 }
 const legacyResults=legacyInspect(b);
 const criteria={
  exposedUnique:criterion('Endpoint on intended country and silhouette boundary; no other country contains/touches it (inherited 1e-6 board-unit geometry tolerance)',endpoints.map(e=>({...e,pass:e.exposedUnique}))),
  competingCountryMargin:criterion(`[designed] endpoint distance to every other same-island country >= ${P.competingCountryMarginCss} CSS px`,endpoints.map(e=>({country:e.country,value:e.competingCountryMarginCss,pass:e.competingCountryMarginCss>=P.competingCountryMarginCss}))),
  inwardContinuation:criterion(`[designed] entire reverse continuation of ${P.inwardContinuationCss} CSS px strictly inside intended country after boundary start`,endpoints.map(e=>({country:e.country,inwardPoint:e.inwardPoint,pass:e.wholeInwardSegmentInside}))),
  water:criterion('Unchanged T24 intersections: no land/coast contact except intended endpoint',routes.map(r=>({edge:r.edge,errors:r.waterErrors,pass:r.waterErrors.length===0}))),
  unrelatedCoastClearance:criterion(`[designed] full polyline distance from unrelated island coast >= ${P.unrelatedCoastClearanceCss} CSS px`,routes.map(r=>({edge:r.edge,value:r.unrelatedCoastClearanceCss,pass:r.unrelatedCoastClearanceCss>=P.unrelatedCoastClearanceCss}))),
  endpointSpan:criterion(`[designed] direct endpoint distance >= ${P.endpointSpanCss} CSS px; a long detour cannot substitute`,routes.map(r=>({edge:r.edge,value:r.endpointSpanCss,pass:r.endpointSpanCss>=P.endpointSpanCss}))),
  selfTrace:criterion('[designed] no zero-length segments, adjacent reversal, or nonadjacent self-contact',routes.map(r=>({edge:r.edge,errors:r.selfTraceErrors,pass:r.selfTraceErrors.length===0}))),
  routeSeparation:criterion(`[designed] all route pairs >= ${P.routeSeparationCss} CSS px apart, including endpoint and shared-country pairs`,interactions.map(i=>({...i,pass:i.gapCss>=P.routeSeparationCss}))),
  preserved:criterion('Every unaffected T24 category, original implementation and parameters',preservedConstraints.map(name=>({category:name,errors:legacyResults[name],pass:legacyResults[name].length===0}))),
 };
 return {id,input:relative(root,input),inputSha256:hash(bytes),scale,criteria,groupErrors:inspect(b),legacyErrors:legacyResults,metrics,
  extrema:{minEndpointSpanCss:Math.min(...routes.map(r=>r.endpointSpanCss)),minCompetingCountryMarginCss:Math.min(...endpoints.map(e=>e.competingCountryMarginCss)),minUnrelatedCoastClearanceCss:Math.min(...routes.map(r=>r.unrelatedCoastClearanceCss)),minRouteSeparationCss:Math.min(...interactions.map(i=>i.gapCss))}};
});
mkdirSync(resolve(root,'evidence'),{recursive:true});
const output=mkdtempSync(resolve(root,'evidence/probe-'));
const sources=['contract.mjs','parameters.mjs','probe.mjs','guards.test.mjs','contract.test.mjs','README.md','../T24/contract.mjs','../T24/geometry.mjs','../T24/parameters.mjs','../T60/measure.mjs'];
const fingerprints=Object.fromEntries(sources.map(name=>[name,hash(readFileSync(resolve(root,name)))]));
for(const name of ['contract.mjs','parameters.mjs','probe.mjs'])writeFileSync(resolve(output,`${name}.snapshot`),readFileSync(resolve(root,name)));
const report={proposal:'Reference A only; owner approval required before dependent work',parameters:P,units:'CSS px at compact 800x540 viewport with 800x460 usable board; scaled by unchanged T24 boardScale',
 limitations:'Geometry proxies cannot establish player comprehension, beauty or arbitrary-graph feasibility. No generator or 99%/50-attempt success claim. Legacy midpoint diagnostics remain disclosed, not silently waived.',fingerprints,results};
writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
const summary={output:relative(process.cwd(),output),results:results.map(({id,criteria,extrema,groupErrors,legacyErrors})=>({id,criteria:Object.fromEntries(Object.entries(criteria).map(([n,{evaluated,pass,fail}])=>[n,{evaluated,pass,fail}])),extrema,groupErrors:Object.fromEntries(Object.entries(groupErrors).map(([n,e])=>[n,e.length])),legacyMidpointErrors:legacyErrors.coasts.length}))};
writeFileSync(resolve(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
const a=results.find(r=>r.id==='coast-first');
if(Object.values(a.groupErrors).some(e=>e.length)||Object.values(a.criteria).some(c=>c.fail))process.exitCode=1;
