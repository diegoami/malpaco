import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {inspect} from '../T24/contract.mjs';
import {measure} from './measure.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const read=path=>JSON.parse(readFileSync(path));
const signature=b=>JSON.stringify({countries:b.provinces.map(p=>({id:p.id,name:p.name,island:p.island,owner:p.owner,armies:p.armies,production:p.production,borders:[...p.borders].sort(),seaLanes:[...p.seaLanes].sort()})).sort((a,b)=>a.id.localeCompare(b.id)),islands:b.islands.map(i=>({id:i.id,name:i.name,provinces:[...i.provinces].sort(),bonus:i.bonus})).sort((a,b)=>a.id.localeCompare(b.id))});
const sha=value=>createHash('sha256').update(value).digest('hex');
const base=read(resolve(root,'input/reference-board.json')),expected=signature(base);
mkdirSync(resolve(root,'evidence'),{recursive:true});const output=mkdtempSync(resolve(root,'evidence/verify-'));
const failures=[],results=[];
try {
  const study=read(resolve(process.argv[2]??resolve(root,'study.json')));
  if(new Set(study.approaches?.map(a=>a.id)).size<3)failures.push('Need three distinct documented approaches');
  if(study.entries?.filter(e=>e.role==='candidate').length<2)failures.push('Need two candidate geometries');
  if(study.entries?.filter(e=>e.role==='baseline').length!==1)failures.push('Need exactly one baseline');
  const shapes=new Set();
  for(const e of study.entries??[]) {
    const board=read(resolve(root,e.board));
    if(signature(board)!==expected)failures.push(`${e.id}: pinned identities/graph/opening changed`);
    const geometry=sha(JSON.stringify({islands:board.islands.map(i=>i.polygon),countries:board.provinces.map(p=>p.polygon),routes:board.routes}));
    if(shapes.has(geometry))failures.push(`${e.id}: duplicate geometry`);shapes.add(geometry);
    const report={id:e.id,role:e.role,graphSha256:sha(signature(board)),geometrySha256:geometry,metrics:measure(board),constraints:inspect(board)};
    results.push(report);
  }
}catch(error){failures.push(error.message);}
const report={accepted:!failures.length,failures,results};
writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({accepted:report.accepted,failures,output},null,2));if(failures.length)process.exitCode=1;
