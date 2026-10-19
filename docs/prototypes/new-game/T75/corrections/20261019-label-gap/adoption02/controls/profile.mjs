import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=path.dirname(new URL(import.meta.url).pathname),payload=await fs.readFile(path.join(base,'payload.json'));
const browser=await chromium.launch({headless:true});const all=[];
const save=(name,data)=>fs.writeFile(path.join(base,name),JSON.stringify(data,null,2)+'\n');
async function run(name,{clock=false,rate=1,profile=false}={}){
 const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
 await page.addInitScript(()=>{
  const nativeNow=performance.now.bind(performance),now=()=>performance.timeOrigin+nativeNow();
  const state={events:[],keys:[],input:null,output:null};window.__diag=state;
  const hash=s=>{let x=2166136261;for(let i=0;i<s.length;i++)x=Math.imul(x^s.charCodeAt(i),16777619);return(x>>>0).toString(16);};
  const log=(event,fields={})=>state.events.push({event,time:now(),...fields});
  const text=File.prototype.text;File.prototype.text=function(){log('file-text-start');return text.call(this).then(value=>{log('file-text-end',{bytes:value.length});return value;});};
  const Worker=window.Worker;window.Worker=class extends Worker{
   constructor(url,options){super(url,options);log('worker-created',{url:String(url)});this.addEventListener('message',event=>{const r=event.data;log('worker-reply',{kind:r.kind,id:r.id,keyHash:hash(r.key??''),keyMatchesSend:state.keys.includes(r.key)});if(r.kind==='success'&&!state.output)state.output=r.value;});this.addEventListener('error',event=>log('worker-error',{message:event.message}));}
   postMessage(message,...args){log('worker-post',{kind:message.kind,id:message.id,keyHash:hash(message.key??''),keyBytes:message.key?.length,keyEqualFirst:state.keys.length?message.key===state.keys[0]:true});if(message.kind==='derive'){state.keys.push(message.key);state.input??=message.geometry;}super.postMessage(message,...args);}
  };
  let previous=null;new MutationObserver(()=>{const current=document.querySelector('#geographic-map');if(current!==previous){log(current?'map-mounted':'map-removed');previous=current;}}).observe(document,{childList:true,subtree:true});
 });
 const cdp=await context.newCDPSession(page);const sessions=[];let sequence=1;const pending=new Map();
 cdp.on('Target.receivedMessageFromTarget',({message})=>{const result=JSON.parse(message);if(result.id&&pending.has(result.id)){const{resolve,reject}=pending.get(result.id);pending.delete(result.id);result.error?reject(result.error):resolve(result.result);}});
 const rpc=(sessionId,method,params={})=>new Promise((resolve,reject)=>{const id=sequence++;pending.set(id,{resolve,reject});cdp.send('Target.sendMessageToTarget',{sessionId,message:JSON.stringify({id,method,params})}).catch(reject);});
 if(profile){
  cdp.on('Target.attachedToTarget',async event=>{if(event.targetInfo.type!=='worker')return;try{await rpc(event.sessionId,'Profiler.enable');await rpc(event.sessionId,'Profiler.start');sessions.push(event.sessionId);await rpc(event.sessionId,'Runtime.runIfWaitingForDebugger');}catch(error){console.log('worker-profile-start-error',error);}});
  await cdp.send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:false});await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 }
 if(rate!==1)await cdp.send('Emulation.setCPUThrottlingRate',{rate});
 const result={name,clock,rate,profile,operations:[],pollSamples:[]};
 try{
  await page.goto('http://127.0.0.1:4315/?control=manual&seed=1994');
  if(clock){await page.clock.install({time:new Date('2026-10-18T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));}
  result.clockBefore=await page.evaluate(()=>({date:Date.now(),performance:performance.now()}));
  for(const kind of ['cold-file','warm-file']){
   const old=await page.getByLabel('Load game',{exact:true}).elementHandle();const start=performance.now();
   await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'same1994.json',mimeType:'application/json',buffer:payload});
   const checks=await Promise.allSettled([expect.poll(async()=>{const before=performance.now()-start;const connected=await old.evaluate(n=>n.isConnected);result.pollSamples.push({kind,beforeMs:before,afterMs:performance.now()-start,connected});return connected;},{timeout:5000}).toBe(false),expect(page.locator('#geographic-map')).toBeVisible({timeout:5000})]);
   const readiness=checks.map((r,index)=>({check:index===0?'old-input-detached':'map-visible',status:r.status,error:r.status==='rejected'?r.reason.stack??r.reason.message:null}));
   const deadlineMs=performance.now()-start;
   // Late completion is observation only; the original 5000ms assertions above retain their result.
   await page.waitForFunction(()=>document.querySelector('#geographic-map')&&![...document.querySelectorAll('[role=alert]')].some(n=>n.textContent),{},{timeout:30000});
   await page.waitForFunction(old=>!old.isConnected,old,{timeout:30000});
   result.operations.push({kind,deadlineMs,totalMs:performance.now()-start,readiness});
  }
  const start=performance.now();await page.getByRole('button',{name:'New game',exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toBeVisible({timeout:5000});result.operations.push({kind:'new-game-same-seed',totalMs:performance.now()-start});
  const trace=await page.evaluate(()=>({events:window.__diag.events,keyCount:window.__diag.keys.length,allKeysEqual:window.__diag.keys.every(k=>k===window.__diag.keys[0]),input:window.__diag.input,output:window.__diag.output}));
  result.clockAfter=await page.evaluate(()=>({date:Date.now(),performance:performance.now()}));
  const workerUrl=trace.events.find(e=>e.event==='worker-created').url;const response=await fetch(workerUrl);const body=Buffer.from(await response.arrayBuffer());await fs.writeFile(path.join(base,'worker-'+name+'.js'),body);await save('worker-http-'+name+'.json',{url:workerUrl,status:response.status,headers:Object.fromEntries(response.headers),bytes:body.length});
  await save('trace-'+name+'.json',trace);result.events=trace.events;result.keyCount=trace.keyCount;result.allKeysEqual=trace.allKeysEqual;
  if(profile){for(let i=0;i<sessions.length;i++){const value=await rpc(sessions[i],'Profiler.stop');await save('worker-'+name+'-'+i+'.cpuprofile',value.profile);}const value=await cdp.send('Profiler.stop');await save('main-'+name+'.cpuprofile',value.profile);}
 }catch(error){result.error=error.stack;await page.screenshot({path:path.join(base,name+'-failure.png')});}
 finally{await save('result-'+name+'.json',result);all.push(result);console.log(JSON.stringify(result));await context.close();if(result.error||result.operations.some(o=>o.readiness?.some(c=>c.status==='rejected')))throw Error('Original readiness check failed; stop candidate probe');}
}
try{await run('normal-unprofiled');await run('mock-clock-polls',{clock:true});await run('throttle2',{rate:2});}finally{await save('poll-results.json',all);await browser.close();}
