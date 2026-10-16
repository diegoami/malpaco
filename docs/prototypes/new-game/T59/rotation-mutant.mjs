import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url)),file=resolve(root,'rotation.mjs'),saved=readFileSync(file);
const output=mkdtempSync(resolve(root,'evidence/rotation-mutant-'));
const hash=b=>createHash('sha256').update(b).digest('hex'),results=[];
function run(name,expected) {
  const r=spawnSync(process.execPath,['--test',resolve(root,'rotation.test.mjs')],{encoding:'utf8'});
  writeFileSync(resolve(output,`${name}.stdout.txt`),r.stdout??'');writeFileSync(resolve(output,`${name}.stderr.txt`),r.stderr??'');
  results.push({name,expected,exit:r.status,passed:r.status===expected});
}
try {
  run('baseline',0);
  const marker='return [cx+(x-cx)*matrix.c-(y-cy)*matrix.s,cy+(x-cx)*matrix.s+(y-cy)*matrix.c];';
  if(!saved.toString().includes(marker))throw Error('Missing rotation mutation marker');
  writeFileSync(file,saved.toString().replace(marker,'return [x,y];'));run('rotation-deleted',1);
}finally{
  writeFileSync(file,saved);run('restored',0);
  const report={results,originalSha256:hash(saved),restoredSha256:hash(readFileSync(file))};
  report.passed=results.length===3&&results.every(r=>r.passed)&&report.originalSha256===report.restoredSha256;
  writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,output},null,2));if(!report.passed)process.exitCode=1;
}
