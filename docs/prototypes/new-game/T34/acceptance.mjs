// Independent T34 acceptance delegates geometry and numeric limits unchanged.
import {inspect} from '../T62/contract.mjs';
import {parameters as P} from '../T24/parameters.mjs';
export function diagnosticBoard(g) {
 const q=g.unitsPerPixel;
 const point=p=>p.map(x=>x/q);
 return {seed:g.seed,bounds:Object.fromEntries(Object.entries(g.bounds).map(([k,v])=>[k,v/q])),
  provinces:g.provinces.map(p=>({...p,polygon:p.polygon.map(point),labelAt:point(p.labelAt),seaLanes:g.entranceReservations.flatMap(r=>r.from===p.id?[r.to]:r.to===p.id?[r.from]:[]),hitSizeCss:P.hitSize,countTextCss:P.countTextMin,countContrast:P.contrastMin})),
  islands:g.islands.map(i=>({...i,polygon:i.polygon.map(point),bonus:Math.max(2,Math.floor(i.provinces.length/2)+g.provinces.filter(p=>p.island===i.id&&g.entranceReservations.some(r=>r.from===p.id||r.to===p.id)).length)})),
  routes:g.entranceReservations.map(r=>({...r,points:r.points.map(point)}))};
}
export function inspectGeography(g) {
 const errors=[];
 if(g.version!=='island-geography-v1'||!Number.isInteger(g.unitsPerPixel)||g.unitsPerPixel<=0)errors.push('partial: invalid geometry version/units');
 if('routes'in g||g.provinces.some(p=>['owner','armies','production','seaLanes'].some(k=>k in p))||g.islands.some(i=>'bonus'in i))errors.push('partial: playable rules/state leaked');
 const ps=[...g.provinces.flatMap(p=>[p.labelAt,...p.polygon]),...g.islands.flatMap(i=>i.polygon),...g.entranceReservations.flatMap(r=>r.points)];
 if(ps.some(p=>p.length!==2||p.some(v=>!Number.isSafeInteger(v))))errors.push('coordinates: expected integer fixed-point values');
 for(const p of g.provinces){
  const slots=g.entranceReservations.filter(r=>r.from===p.id||r.to===p.id).length;
  if(p.borders.length<2||p.borders.length>4||p.borders.length+slots>P.degreeMax||slots>P.countryCrossingMax)errors.push('headroom: '+p.id);
 }
 if(errors.length)return errors;
 const board=diagnosticBoard(g),checks=inspect(board);
 for(const[group,messages]of Object.entries(checks))errors.push(...messages.map(m=>group+': '+m));
 // Existing native-space selected-label reservation, stronger than T24's 44px square gap.
 for(const[j,p]of board.provinces.entries())for(const other of board.provinces.slice(j+1))if(Math.abs(p.labelAt[0]-other.labelAt[0])<44&&Math.abs(p.labelAt[1]-other.labelAt[1])<47)errors.push('native-labels: selected-name overlap');
 return errors;
}
