import {build} from 'vite';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [outArg='artifacts/T111-probe',countArg='50']=process.argv.slice(2),out=resolve(outArg),count=Number(countArg);
if(!out.startsWith(resolve('artifacts')+'/')||!Number.isInteger(count)||count<1||count>1000)throw Error('Usage: node tools/maps/run.mjs artifacts/FRESH-DIR [1..1000 seeds]');
await mkdir(out); // Never overwrite a previous corpus.
const built=await build({configFile:false,logLevel:'warn',build:{write:false,minify:false,lib:{entry:'tools/maps/probe.ts',formats:['es']},rollupOptions:{external:[/^node:/]}}});
const chunks=(Array.isArray(built)?built:[built]).flatMap(b=>b.output);if(chunks.length!==1||chunks[0].type!=='chunk')throw Error('Expected one measurement bundle');
const bundle=chunks[0].code,hash=s=>createHash('sha256').update(s).digest('hex');
await writeFile(out+'/probe.mjs',bundle);
await writeFile(out+'/manifest.json',JSON.stringify({sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),trackedDiff:execFileSync('git',['diff','HEAD','--','src/core','tools/maps'],{encoding:'utf8'}),bundleSHA256:hash(bundle),node:process.version,seeds:count,command:process.argv},null,2)+'\n');
const run=spawnSync(process.execPath,[out+'/probe.mjs',out,String(count)],{stdio:'inherit'});console.log('Evidence: '+relative(process.cwd(),out));if(run.error)throw run.error;process.exitCode=run.status??1;
