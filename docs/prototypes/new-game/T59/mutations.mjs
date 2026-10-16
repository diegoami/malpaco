import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url));
mkdirSync(resolve(root,'evidence'),{recursive:true});const output=mkdtempSync(resolve(root,'evidence/mutations-'));
const preview=resolve(root,'preview.html'),data=resolve(root,'board.json'),savedHtml=readFileSync(preview),savedBoard=readFileSync(data);
const sha=b=>createHash('sha256').update(b).digest('hex'),results=[];
function run(name,file,expected,assertion='') {
 const args=[resolve(root,file)],r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:32*1024*1024});
 writeFileSync(resolve(output,`${name}.stdout.txt`),r.stdout??'',{flag:'wx'});writeFileSync(resolve(output,`${name}.stderr.txt`),r.stderr??'',{flag:'wx'});
 const passed=r.status===expected&&(!assertion||(r.stdout??'').includes(assertion));
 results.push({name,args,expected,assertion,exitCode:r.status,signal:r.signal,passed});console.log(`${name}: exit ${r.status}, expected ${expected}, ${passed?'PASS':'FAIL'}`);
}
try {
 run('baseline-static','verify.mjs',0);run('baseline-browser','browser.mjs',0);
 const route=savedHtml.toString().match(/(<polyline[^>]*points=")[^"]*"/);
 if(!route)throw Error('No rendered sea route to mutate');
 for(const [name,from,to,assertion] of [
  ['keyboard',"if(e.key==='Enter'||e.key===' ')",'if(false)','Space selection missing'],
  ['neighbour-style','.country.neighbor .cell{stroke:#f5dc82;stroke-width:1.9}', '.country.neighbor .cell{stroke:#244654;stroke-width:.8}', 'visible neighbour styling missing'],
  ['rendered-name','>River<','>Invented<','Rendered name changed'],
  ['rendered-route',route[0],route[1]+'0,0 1,1"','Rendered sea paths differ'],
 ]) {
  const text=savedHtml.toString();if(!text.includes(from))throw Error(`Missing mutation marker ${name}`);
  try{writeFileSync(preview,text.replace(from,to));run(name,'browser.mjs',1,assertion);}finally{writeFileSync(preview,savedHtml);}
 }
 for(const [name,change,assertion] of [
  ['identity',b=>b.provinces[0].name='Invented','Identity changed'],
  ['opening',b=>b.provinces[0].armies=99,'Opening state changed'],
  ['income',b=>b.islands[0].bonus++,'Invalid bonus'],
  ['unapproved-link',b=>{b.provinces[0].seaLanes.push(b.provinces[1].id);b.provinces[1].seaLanes.push(b.provinces[0].id);},'Sea changes differ'],
  ['rotation-removed',b=>{const old=JSON.parse(readFileSync(resolve(root,'../T25/board.json')));for(const id of ['island_0','island_7']){const i=b.islands.find(i=>i.id===id),previous=old.islands.find(i=>i.id===id);i.polygon=previous.polygon;for(const country of i.provinces){const p=b.provinces.find(p=>p.id===country),q=old.provinces.find(p=>p.id===country);p.polygon=q.polygon;p.labelAt=q.labelAt;}}},'North must rotate'],
 ]) {
  const board=JSON.parse(savedBoard);change(board);
  try{writeFileSync(data,JSON.stringify(board));run(name,'verify.mjs',1,assertion);}finally{writeFileSync(data,savedBoard);}
 }
} finally {
 writeFileSync(preview,savedHtml);writeFileSync(data,savedBoard);
 const restored={preview:readFileSync(preview).equals(savedHtml),board:readFileSync(data).equals(savedBoard)};
 run('restored-static','verify.mjs',0);run('restored-browser','browser.mjs',0);
 const report={results,restored,originalSha256:{preview:sha(savedHtml),board:sha(savedBoard)},restoredSha256:{preview:sha(readFileSync(preview)),board:sha(readFileSync(data))}};
 writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({passed:results.every(r=>r.passed)&&restored.preview&&restored.board,output},null,2));
 if(results.some(r=>!r.passed)||!restored.preview||!restored.board)process.exitCode=1;
}
