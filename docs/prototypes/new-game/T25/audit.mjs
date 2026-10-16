import { readFileSync } from 'node:fs';
import { inspect } from '../T24/contract.mjs';

export const source = JSON.parse(readFileSync(new URL('../../map-1994/preflight-20261015-a/input/seed1994.json', import.meta.url)));
export const opening = JSON.parse(readFileSync(new URL('../../map-1994/preflight-20261015-a/input/seed1994-state.json', import.meta.url)));
export const pair = (a,b) => [a,b].sort().join('|');
export function edges(board, field) {
  return [...new Set(board.provinces.flatMap(p=>p[field].map(n=>pair(p.id,n))))].sort();
}
export function identityErrors(board) {
  const errors=[];
  for(const p of source.provinces) {
    const q=board.provinces.find(q=>q.id===p.id);
    if(!q || q.name!==p.name || q.island!==p.island)errors.push(`Identity changed ${p.id}`);
    if(q && (q.owner!==opening.ownerOf[p.id] || q.armies!==opening.armies[p.id] || q.production!==opening.productionCentres.includes(p.id)))errors.push(`Opening state changed ${p.id}`);
  }
  for(const i of source.islands) {
    const q=board.islands.find(q=>q.id===i.id);
    if(!q || q.name!==i.name || JSON.stringify([...q.provinces].sort())!==JSON.stringify([...i.provinces].sort()))errors.push(`Island identity changed ${i.id}`);
  }
  return errors;
}
function cuts(board,field) {
  const nodes=board.provinces.map(p=>p.id), links=edges(board,field);
  const components=(removedNode,removedEdge)=> {
    const left=new Set(nodes.filter(n=>n!==removedNode));let count=0;
    while(left.size) {
      count++;const queue=[left.values().next().value];left.delete(queue[0]);
      for(const n of queue)for(const e of links) {
        if(e===removedEdge)continue;
        const [a,b]=e.split('|'),other=a===n?b:b===n?a:null;
        if(other&&left.delete(other))queue.push(other);
      }
    }
    return count;
  };
  const baseline=components();
  return {articulationPoints:nodes.filter(n=>components(n)>baseline),bridges:links.filter(e=>components(null,e)>baseline)};
}
export function diagnostics(board) {
  const changes={};
  for(const field of ['borders','seaLanes']) {
    const before=edges(source,field),after=edges(board,field);
    changes[field]={current:before,proposed:after,added:after.filter(e=>!before.includes(e)),removed:before.filter(e=>!after.includes(e))};
  }
  const combined={provinces:board.provinces.map(p=>({...p,all:[...p.borders,...p.seaLanes]}))};
  return {changes,countries:board.provinces.map(p=>{const before=source.provinces.find(q=>q.id===p.id);return {id:p.id,name:p.name,currentDegree:before.borders.length+before.seaLanes.length,degree:p.borders.length+p.seaLanes.length,crossings:p.seaLanes.length};}),
    islands:board.islands.map(i=>({id:i.id,name:i.name,currentBonus:source.islands.find(q=>q.id===i.id).bonus,proposedBonus:i.bonus,
      entrances:i.provinces.filter(id=>board.provinces.find(p=>p.id===id).seaLanes.length),
      currentEntrances:source.islands.find(s=>s.id===i.id).provinces.filter(id=>source.provinces.find(p=>p.id===id).seaLanes.length),
      neighbours:[...new Set(i.provinces.flatMap(id=>board.provinces.find(p=>p.id===id).seaLanes).map(id=>board.provinces.find(p=>p.id===id).island))].sort(),
      currentLandCuts:cuts({provinces:source.provinces.filter(p=>p.island===i.id)},'borders'),
      proposedLandCuts:cuts({provinces:board.provinces.filter(p=>p.island===i.id)},'borders')})),
    currentCuts:cuts({provinces:source.provinces.map(p=>({...p,all:[...p.borders,...p.seaLanes]}))},'all'),
    proposedCuts:cuts(combined,'all')};
}
export function audit(board) {
  return {constraints:inspect(board),identity:identityErrors(board),diagnostics:diagnostics(board)};
}
export const failures = report => [...Object.entries(report.constraints).flatMap(([group,errors])=>errors.map(error=>`${group}: ${error}`)),...report.identity];
