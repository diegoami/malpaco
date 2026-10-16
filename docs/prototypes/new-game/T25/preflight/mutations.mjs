import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root='docs/prototypes/new-game/T25',output=`${root}/preflight/mutations-a`;
mkdirSync(output);const original=readFileSync(`${root}/preflight/mock.html`);
const sha=b=>createHash('sha256').update(b).digest('hex'),results=[];
for(const [name,from,to,expected] of [
 ['keyboard',"if(e.key==='Enter'||e.key===' ')",'if(false)','Space selection missing'],
 ['neighbour',"n.classList.toggle('neighbor',neighbors.has(n.dataset.id))","n.classList.toggle('neighbor',false)",'click neighbours mismatch'],
 ['rendered-name','>River gate<','>Invented<','Rendered name changed'],
]) {
 let text=original.toString();
 // SVG splits names into words, so use the first name's independent text node.
 const marker=name==='rendered-name'?'>River<':from;
 if(!text.includes(marker))throw Error(`Missing mutation marker ${name}`);
 text=text.replace(marker,to);
 const path=`${output}/${name}.html`;writeFileSync(path,text,{flag:'wx'});
 const r=spawnSync(process.execPath,[`${root}/browser.mjs`,path],{encoding:'utf8',maxBuffer:32*1024*1024});
 writeFileSync(`${output}/${name}.stdout.txt`,r.stdout??'',{flag:'wx'});writeFileSync(`${output}/${name}.stderr.txt`,r.stderr??'',{flag:'wx'});
 results.push({name,exitCode:r.status,expectedFailureSeen:(r.stdout??'').includes(expected),mutantSha256:sha(Buffer.from(text))});
 console.log(`${name}: ${r.status}, expected assertion ${(r.stdout??'').includes(expected)}`);
}
const unchanged=original.equals(readFileSync(`${root}/preflight/mock.html`));
writeFileSync(`${output}/results.json`,JSON.stringify({results,originalSha256:sha(original),originalUnchanged:unchanged},null,2)+'\n',{flag:'wx'});
if(!unchanged||results.some(r=>r.exitCode!==1||!r.expectedFailureSeen))process.exitCode=1;
