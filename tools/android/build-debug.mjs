#!/usr/bin/env node
import {spawnSync, execFileSync} from 'node:child_process';
import {mkdir, readFile, readdir, writeFile, cp, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const local=join(root,'artifacts/android-toolchain');
const args=process.argv.slice(2);
let targets=['aarch64','x86_64'];
if(args.length){
 if(args.length!==2||args[0]!=='--target'||!['aarch64','x86_64'].includes(args[1]))throw Error('Usage: npm run android:build:debug -- [--target aarch64|x86_64]');
 targets=[args[1]];
}
const env={...process.env};
env.ANDROID_HOME??=join(local,'sdk');
// Hosted runners may carry a different deprecated SDK root; Gradle rejects that conflict.
delete env.ANDROID_SDK_ROOT;
env.NDK_HOME??=join(env.ANDROID_HOME,'ndk/29.0.14206865');
if(!env.JAVA_HOME){
 const candidates=await readdir(join(local,'jdk'));
 env.JAVA_HOME=join(local,'jdk',candidates[0]);
}
for(const path of [join(env.JAVA_HOME,'bin/java'),join(env.NDK_HOME,'source.properties'),join(env.ANDROID_HOME,'platforms/android-36/android.jar')]){
 try{await access(path);}catch{throw Error(`Android toolchain missing: ${path}. See docs/android.md.`);}
}
env.PATH=join(env.JAVA_HOME,'bin')+':'+env.PATH;
env.GRADLE_USER_HOME??=join(local,'gradle');
env.CARGO_TARGET_DIR=join(root,'artifacts/T106-cargo-target');
const result=spawnSync(join(root,'node_modules/.bin/tauri'),['android','build','--debug','--apk','--target',...targets,'--ci'],{cwd:root,env,stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status??1);
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const out=join(root,'artifacts/T106-build',sha.slice(0,12)+'-'+Date.now());await mkdir(out,{recursive:true});
const outputs=[];
async function walk(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory())await walk(path);
  else if(entry.name.endsWith('.apk')){
   const bytes=await readFile(path),name=path.slice(join(root,'src-tauri/gen/android/app/build/outputs/apk').length+1).replaceAll('/','-');
   await cp(path,join(out,name));outputs.push({file:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  }
 }
}
await walk(join(root,'src-tauri/gen/android/app/build/outputs/apk'));
if(!outputs.length)throw Error('Build succeeded without an APK');
const manifest={sourceCommit:sha,targets,debug:true,applicationId:'io.github.diegoami.malpaco.debug',
 assetsBuild:JSON.parse(await readFile(join(root,'release/malpaco-playable/BUILD.json'),'utf8')),
 assetsSha256Sums:await readFile(join(root,'release/malpaco-playable/SHA256SUMS'),'utf8'),outputs};
await writeFile(join(out,'BUILD.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Android debug artifacts:',out);
