#!/usr/bin/env node
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const args=process.argv.slice(2),config={apk:'',serial:'127.0.0.1:5555',out:join(root,'artifacts/T106-smoke-'+Date.now()),adb:join(process.env.ANDROID_HOME??join(root,'artifacts/android-toolchain/sdk'),'platform-tools/adb')};
for(let i=0;i<args.length;i+=2){
 if(!args[i+1]||!['--apk','--serial'].includes(args[i]))throw Error('Usage: node tools/android/smoke.mjs --apk PATH [--serial DEVICE]');
 config[args[i]==='--apk'?'apk':'serial']=args[i+1];
}
if(!config.apk)throw Error('--apk is required');
config.apk=resolve(config.apk);await mkdir(config.out,{recursive:true});
const built=await build({root,configFile:false,logLevel:'warn',build:{write:false,minify:false,lib:{entry:join(root,'tests/android/device-smoke.ts'),formats:['es']},rollupOptions:{external:[/^node:/,'@playwright/test']}}});
const outputs=(Array.isArray(built)?built:[built]).flatMap(r=>r.output),chunk=outputs.find(o=>o.type==='chunk'&&o.isEntry);
if(!chunk||outputs.length!==1)throw Error('Expected one smoke bundle');
const entry=join(config.out,'device-smoke.mjs');await writeFile(entry,chunk.code);
const run=spawnSync(process.execPath,[entry,JSON.stringify(config)],{cwd:root,stdio:'inherit'});
console.log('Device evidence:',config.out);
if(run.error)throw run.error;process.exitCode=run.status??1;
