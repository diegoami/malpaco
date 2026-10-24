#!/usr/bin/env node
import {spawnSync,execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,readdirSync,existsSync,copyFileSync} from 'node:fs';
import {join,resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const {values}=parseArgs({options:{serial:{type:'string'}},allowPositionals:false});
if(!values.serial?.match(/^emulator-\d+$/))throw Error('Use --serial emulator-N on a dedicated booted test emulator.');
if(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim())throw Error('Commit the source before recording a native snapshot proof.');
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const out=join(root,'artifacts',`T122-native-${sourceCommit.slice(0,12)}-${Date.now()}`);mkdirSync(out,{recursive:true});
const local=join(root,'artifacts/android-toolchain'),sdk=process.env.ANDROID_HOME??join(local,'sdk');
const env={...process.env,ANDROID_HOME:sdk,GRADLE_USER_HOME:process.env.GRADLE_USER_HOME??join(local,'gradle')};delete env.ANDROID_SDK_ROOT;
env.JAVA_HOME??=join(local,'jdk',readdirSync(join(local,'jdk'),{withFileTypes:true}).find(x=>x.isDirectory())?.name??'missing');
env.NDK_HOME??=join(sdk,'ndk/29.0.14206865');env.PATH=join(env.JAVA_HOME,'bin')+':'+env.PATH;
const adb=join(sdk,'platform-tools/adb'),serial=values.serial;
const report={sourceCommit,serial,started:new Date().toISOString(),passed:false,steps:[],scope:'isolated native snapshot I/O; no frontend hydration or physical-device acceptance'};
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function run(label,command,args,allowFailure=false){
 const result=spawnSync(command,args,{cwd:root,env,encoding:'utf8',maxBuffer:64*1024*1024});
 const output=(result.stdout??'')+(result.stderr??'');writeFileSync(join(out,label+'.log'),output);
 report.steps.push({label,exit:result.status,log:label+'.log'});console.log(label,result.status,relative(root,out));
 if(result.error)throw result.error;if(result.status!==0&&!allowFailure)throw Error(`${label} failed; see ${out}/${label}.log`);return {result,output};
}
const device=(label,args,allowFailure=false)=>run(label,adb,['-s',serial,...args],allowFailure);
function apks(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?apks(join(dir,x.name)):x.name.endsWith('.apk')?[join(dir,x.name)]:[]);}
try{
 if(!existsSync(adb))throw Error('Install the pinned Android toolchain first (docs/android.md).');
 const state=device('device-state',['get-state']).result.stdout?.trim();if(state!=='device')throw Error('The dedicated emulator is not ready.');
 if(device('device-is-emulator',['shell','getprop','ro.kernel.qemu']).result.stdout?.trim()!=='1')throw Error('This test runner refuses physical devices.');
 if(device('device-boot',['shell','getprop','sys.boot_completed']).result.stdout?.trim()!=='1')throw Error('Boot the emulator before running the snapshot proof.');
 report.api=device('device-api',['shell','getprop','ro.build.version.sdk']).result.stdout?.trim();
 report.model=device('device-model',['shell','getprop','ro.product.model']).result.stdout?.trim();
 report.webView=device('device-webview',['shell','dumpsys','webviewupdate']).output;
 const build=run('build-debug',process.execPath,[join(root,'tools/android/build-debug.mjs'),'--target','x86_64']);
 const buildPath=build.output.match(/Android debug artifacts:\s*(.+)/)?.[1]?.trim();if(!buildPath)throw Error('The native build did not report its artifact directory.');
 const manifest=JSON.parse(readFileSync(join(buildPath,'BUILD.json'),'utf8'));if(manifest.sourceCommit!==sourceCommit||manifest.assetsBuild.sourceCommit!==sourceCommit)throw Error('Native source and packaged source disagree.');
 const appEntry=manifest.outputs.find(x=>x.file.startsWith('universal-debug-')&&x.file.endsWith('.apk'));if(!appEntry)throw Error('The requested debug APK is missing.');
 const app=join(buildPath,appEntry.file);
 const abis=run('app-abis','python3',['-c',"import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); print(','.join(sorted({p.split('/')[1] for p in z.namelist() if p.startswith('lib/') and p.endswith('.so')})))",app]).result.stdout.trim().split(',');
 if(abis.length!==1||abis[0]!=='x86_64')throw Error('The selected debug APK does not contain exactly the requested x86-64 ABI.');
 report.app={path:relative(root,app),sha256:hash(app),abis,assetsBuild:manifest.assetsBuild};
 const project=join(root,'src-tauri/gen/android');
 // The CLI above built the exact source's JNI payload. Avoid calling its ephemeral
 // Rust build server from this separate instrumentation-APK assembly.
 run('build-instrumentation',join(project,'gradlew'),['-p',project,'--no-daemon','--max-workers=2',':app:assembleUniversalDebugAndroidTest','-PabiList=x86_64','-ParchList=x86_64','-PtargetList=x86_64','-x',':app:rustBuildUniversalDebug','-x',':app:rustBuildX86_64Debug']);
 const builtTest=apks(join(project,'app/build/outputs/apk/androidTest')).find(p=>p.includes('/universal/debug/'));if(!builtTest)throw Error('The instrumentation APK for the requested flavor is missing.');
 const test=join(out,'instrumentation.apk');copyFileSync(builtTest,test);
 report.instrumentation={path:relative(root,test),sha256:hash(test)};
 // Never let Gradle connected-test cleanup uninstall the target application.
 // Explicit updates preserve existing debug-app data; test contexts use cache only.
 device('install-app',['install','-r',app]);device('install-instrumentation',['install','-r',test]);
 const proof=device('instrumentation',['shell','am','instrument','-w','-r','-e','class','io.github.diegoami.malpaco.NativeSnapshotStoreTest','io.github.diegoami.malpaco.debug.test/androidx.test.runner.AndroidJUnitRunner'],true);
 report.passed=proof.result.status===0&&/OK \(\d+ tests?\)/.test(proof.output)&&!/FAILURES!!!|INSTRUMENTATION_FAILED|Process crashed/.test(proof.output);
 report.tests=proof.output.match(/OK \((\d+) tests?\)/)?.[1]??proof.output.match(/Tests run: (\d+)/)?.[1]??null;
 if(!report.passed)process.exitCode=1;
}catch(error){report.error=String(error);process.exitCode=1;}
finally{report.finished=new Date().toISOString();writeFileSync(join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n');console.log('Native snapshot report:',join(out,'REPORT.json'));}
