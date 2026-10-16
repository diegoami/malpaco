import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const root='docs/prototypes/new-game/T25',output=`${root}/preflight/attempt-a`;
mkdirSync(output);
const rows=[];
for(const [name,args,expected] of [
 ['g-static',[`${root}/verify.mjs`,`${root}/preflight/g-board.json`],1],
 ['mock-static',[`${root}/verify.mjs`,`${root}/preflight/mock-board.json`],0],
 ['acceptance-tests',['--test',`${root}/acceptance.test.mjs`],0],
 ['g-browser',[`${root}/browser.mjs`,`${root}/preflight/g.html`],1],
 ['mock-browser',[`${root}/browser.mjs`,`${root}/preflight/mock.html`],0],
]) {
 const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:32*1024*1024});
 writeFileSync(`${output}/${name}.stdout.txt`,r.stdout??'',{flag:'wx'});writeFileSync(`${output}/${name}.stderr.txt`,r.stderr??'',{flag:'wx'});
 rows.push({name,args,expected,exitCode:r.status,signal:r.signal});console.log(`${name}: ${r.status} expected ${expected}`);
}
writeFileSync(`${output}/results.json`,JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
if(rows.some(r=>r.exitCode!==r.expected))process.exitCode=1;
