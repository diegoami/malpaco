// Parent preflight: only run while the mock files are present.
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url)),output=mkdtempSync(resolve(root,'preflight/negative-'));
const hash=b=>createHash('sha256').update(b).digest('hex'),html=readFileSync(resolve(root,'preview.html'),'utf8');
const records=[],inputs=[];
const cases=[
 ['hidden-count','.count{font:', '.count{display:none;font:'],
 ['keyboard-disabled',"if(e.key==='Enter'||e.key===' ')", 'if(false)'],
 ['wrong-route','points="','points="0,0 '],
 ['neighbor-style','stroke:#f5dc82;stroke-width:1.9','stroke:transparent;stroke-width:1.9'],
 ['hidden-active-route','.lane.active{stroke:#fff7bf;', '.lane.active{opacity:0;stroke:#fff7bf;'],
 ['broken-export',"new XMLSerializer().serializeToString(document.querySelector('svg'))", "'<svg/>'"],
];
for(const [name,from,to] of cases){
 if(!html.includes(from))throw Error('Missing mock mutation anchor '+name);
 const file=name+'.html',bytes=html.replace(from,to);writeFileSync(resolve(output,file),bytes);inputs.push(file);
 const command=['docs/prototypes/new-game/T63/browser.mjs',resolve(output,file)],r=spawnSync('node',command,{encoding:'utf8'});
 records.push({name,command,exit:r.status,stdout:r.stdout,stderr:r.stderr,inputSha256:hash(bytes)});
 if(r.status!==1)throw Error('DOM mutation survived '+name);
}
const file=resolve(root,'audit.mjs'),original=readFileSync(file);
try{
 writeFileSync(file,original.toString().replace('constraints:inspect(board)','constraints:{}'));
 const command=['--test','docs/prototypes/new-game/T63/acceptance.test.mjs'],r=spawnSync('node',command,{encoding:'utf8'});
 records.push({name:'deleted-adopted-diagnostics',command,exit:r.status,stdout:r.stdout,stderr:r.stderr});
 if(r.status!==1)throw Error('Source guard deletion survived');
}finally{writeFileSync(file,original);}
const board=JSON.parse(readFileSync(resolve(root,'board.json')));board.provinces[0].armies++;
const bad='changed-opening.json';writeFileSync(resolve(output,bad),JSON.stringify(board));inputs.push(bad);
const command=['docs/prototypes/new-game/T63/verify.mjs',resolve(output,bad)],r=spawnSync('node',command,{encoding:'utf8'});records.push({name:'changed-opening',command,exit:r.status,stdout:r.stdout,stderr:r.stderr});if(r.status!==1)throw Error('Opening mutation survived');
const archive=spawnSync('tar',['-czf','inputs.tar.gz','--',...inputs],{cwd:output});if(archive.status!==0)throw Error('Input archive failed');
writeFileSync(resolve(output,'.gitignore'),'/*.html\n/changed-opening.json\n');
writeFileSync(resolve(output,'report.json'),JSON.stringify({records,restoredExactly:readFileSync(file).equals(original),sourceSha256:hash(original),archiveSha256:hash(readFileSync(resolve(output,'inputs.tar.gz')))},null,2)+'\n');
console.log(JSON.stringify({output,killed:records.length,restoredExactly:readFileSync(file).equals(original)},null,2));
