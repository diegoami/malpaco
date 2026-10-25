#!/usr/bin/env node
import {build} from 'vite';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve,join,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const args=process.argv.slice(2);let configPath,outPath;
for(let i=0;i<args.length;i+=2){
 if(!args[i+1]||!['--config','--out'].includes(args[i]))throw Error('Usage: node tools/arena/run.mjs --config FILE --out artifacts/FRESH-DIRECTORY');
 if(args[i]==='--config'){if(configPath)throw Error('Duplicate config flag');configPath=args[i+1];}
 else {if(outPath)throw Error('Duplicate out flag');outPath=args[i+1];}
}
if(!configPath||!outPath)throw Error('Both --config and --out are required');
const out=resolve(root,outPath);
if(!out.startsWith(resolve(root,'artifacts')+'/'))throw Error('Output must be under artifacts/');
const config=JSON.parse(await readFile(resolve(root,configPath),'utf8'));
await mkdir(dirname(out),{recursive:true});await mkdir(out); // Never overwrite prior/partial evidence.
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=[];
async function collect(dir){for(const entry of (await readdir(join(root,dir),{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
 const file=join(dir,entry.name);if(entry.isDirectory())await collect(file);else files.push(file);
}}
await collect('src/core');await collect('tools/arena');files.push('package.json','package-lock.json','fixtures/arena/baseline-031.json');
const sourceHashes=Object.fromEntries(await Promise.all(files.map(async file=>[file,hash(await readFile(join(root,file)))])));
const result=await build({root,configFile:false,logLevel:'warn',build:{write:false,minify:false,
 lib:{entry:join(root,'tools/arena/measure.ts'),formats:['es']},rollupOptions:{external:[/^node:/]}}});
const outputs=(Array.isArray(result)?result:[result]).flatMap(r=>r.output);
if(outputs.length!==1||outputs[0].type!=='chunk')throw Error('Expected one self-contained arena bundle');
const bundle=join(out,'measure.mjs');await writeFile(bundle,outputs[0].code);
const manifest={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 trackedDiff:execFileSync('git',['diff','HEAD','--','src/core','tools/arena','fixtures/arena','package.json','package-lock.json'],{cwd:root,encoding:'utf8'}),
 gitStatus:execFileSync('git',['status','--porcelain','--','src/core','tools/arena','fixtures/arena','package.json','package-lock.json'],{cwd:root,encoding:'utf8'}),
 sourceHashes,sourceHash:hash(JSON.stringify(sourceHashes)),configHash:hash(JSON.stringify(config)),
 policySourceHashes:Object.fromEntries(['tools/arena/policies.ts','tools/arena/frozen-031.ts'].map(f=>[f,sourceHashes[f]])),
 bundleHash:hash(outputs[0].code),node:process.version,command:['node','tools/arena/run.mjs',...args],config};
await writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const run=spawnSync(process.execPath,[bundle,JSON.stringify({config,out})],{cwd:root,stdio:'inherit'});
manifest.exitCode=run.status;
try{const descriptors=JSON.parse(await readFile(join(out,'policies.json'),'utf8'));
 manifest.policyHashes=Object.fromEntries(Object.entries(descriptors).map(([id,descriptor])=>[id,hash(JSON.stringify({id,descriptor,sources:manifest.policySourceHashes}))]));
}catch{/* Preserve invalid-configuration/partial evidence too. */}
manifest.outputs=Object.fromEntries(await Promise.all((await readdir(out)).filter(f=>f!=='manifest.json').sort().map(async f=>[f,hash(await readFile(join(out,f)))])));
await writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Evidence: ${relative(root,out)}`);if(run.error)throw run.error;process.exitCode=run.status??1;
