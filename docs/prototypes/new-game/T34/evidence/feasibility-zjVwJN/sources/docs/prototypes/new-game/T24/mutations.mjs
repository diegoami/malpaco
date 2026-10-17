import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constraints } from './contract.mjs';
const directory=path.dirname(fileURLToPath(import.meta.url));
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const target=path.join(directory,'contract.mjs'),saved=fs.readFileSync(target,'utf8');
const digest=value=>createHash('sha256').update(value).digest('hex');
const outRoot=path.join(directory,'evidence','mutations');fs.mkdirSync(outRoot,{recursive:true});
const output=fs.mkdtempSync(path.join(outRoot,'run-'));
const records=[];
const scaleMarker='Math.max(Math.abs(u[0]-v[0]),Math.abs(u[1]-v[1]))*scale+E<P.labelGap';
const cases=[...constraints.map(constraint=>({constraint,pattern:constraint,
  marker:`if(name==='${constraint}')`,replacement:'if(false)'})),
  {constraint:'labels-scale',pattern:'labels',marker:scaleMarker,replacement:scaleMarker.replace('*scale','')}];
try {
  for(const {constraint,pattern,marker,replacement} of cases) {
    if(!saved.includes(marker))throw Error(`Missing mutation target ${constraint}`);
    fs.writeFileSync(target,saved.replace(marker,replacement));
    const run=spawnSync(process.execPath,['--test',`--test-name-pattern=${pattern}`,'docs/prototypes/new-game/T24/contract.test.mjs'],{cwd:root,encoding:'utf8'});
    fs.writeFileSync(path.join(output,`${constraint}.txt`),run.stdout+run.stderr,{flag:'wx'});
    if(run.status!==1||!run.stdout.includes('AssertionError'))throw Error(`Not a behavioural kill: ${constraint} / ${run.status}`);
    records.push({constraint,exit:run.status,behaviouralKill:true});
    fs.writeFileSync(target,saved);
  }
} finally {fs.writeFileSync(target,saved);}
if(digest(fs.readFileSync(target))!==digest(saved))throw Error('Restoration hash differs');
const restored=spawnSync(process.execPath,['--test','docs/prototypes/new-game/T24/contract.test.mjs'],{cwd:root,encoding:'utf8'});
fs.writeFileSync(path.join(output,'restored.txt'),restored.stdout+restored.stderr,{flag:'wx'});
if(restored.status!==0)throw Error('Restored checks failed');
const report={target:path.relative(root,target),before:digest(saved),after:digest(fs.readFileSync(target)),records,restoredExit:restored.status};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:path.relative(root,output),killed:records.length,total:cases.length,restoredExit:restored.status}));
