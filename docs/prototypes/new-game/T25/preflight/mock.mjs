// Disposable schematic only: prove the acceptance can pass, not the intended look.
import { witness } from '../../T24/witness.mjs';
import { source, opening } from '../audit.mjs';
import { writeFileSync } from 'node:fs';
const board=witness(),available=[...source.islands],ids=new Map();
for(const island of board.islands) {
  const target=available.find(i=>i.provinces.length===island.provinces.length);
  available.splice(available.indexOf(target),1);
  ids.set(island.id,target.id);
  island.provinces.forEach((id,j)=>ids.set(id,target.provinces[j]));
  island.name=target.name;
}
for(const p of board.provinces) {
  const id=ids.get(p.id),original=source.provinces.find(p=>p.id===id);
  Object.assign(p,{id,island:ids.get(p.island),name:original.name,owner:opening.ownerOf[id],armies:opening.armies[id],production:opening.productionCentres.includes(id),borders:p.borders.map(n=>ids.get(n)),seaLanes:p.seaLanes.map(n=>ids.get(n))});
}
for(const i of board.islands){i.id=ids.get(i.id);i.provinces=i.provinces.map(n=>ids.get(n));}
for(const r of board.routes){r.from=ids.get(r.from);r.to=ids.get(r.to);}
writeFileSync(new URL('./mock-board.json',import.meta.url),JSON.stringify(board,null,2)+'\n',{flag:'wx'});
