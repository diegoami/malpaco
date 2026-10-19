import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const dir=path.dirname(new URL(import.meta.url).pathname),origin='http://127.0.0.1:4312';
const payload=await fs.readFile('docs/prototypes/new-game/T71/fixtures/geographic-reinforcement.json');
const save=(name,data)=>fs.writeFile(path.join(dir,name),JSON.stringify(data,null,2)+'\n');
const nativeStart=performance.now(),absolute=()=>performance.timeOrigin+performance.now();
const browser=await chromium.launch({headless:true});
const contexts=[],results=[];
try {
 for(const name of ['A','B']){
  const context=await browser.newContext({viewport:{width:1280,height:800}});contexts.push(context);
  const page=await context.newPage();const result={name,events:[],polls:[],checks:[],errors:[]};results.push(result);
  await page.exposeFunction('__nativeStamp',()=>absolute());
  await page.addInitScript(()=>{
   // Capture real monotonic clock before Playwright installs its page-clock shim.
   const realNow=performance.now.bind(performance),realOrigin=performance.timeOrigin;
   const state={events:[],input:null,output:null};window.__cold=state;
   const log=(event,fields={})=>state.events.push({event,nativeTime:realOrigin+realNow(),...fields});
   const text=File.prototype.text;File.prototype.text=function(){log('file-text-start');return text.call(this).then(v=>{log('file-text-end',{text:v});return v;},e=>{log('file-text-error',{message:e.message,stack:e.stack});throw e;});};
   const NativeWorker=window.Worker;window.Worker=class extends NativeWorker{
    constructor(url,opts){super(url,opts);log('worker-created',{url:String(url)});this.addEventListener('message',e=>{log('worker-reply',{message:e.data});if(e.data.kind==='success')state.output=e.data.value;});this.addEventListener('error',e=>log('worker-error',{message:e.message,filename:e.filename,lineno:e.lineno}));}
    postMessage(message,...rest){log('worker-post',{message});if(message.kind==='derive')state.input=message.geometry;return super.postMessage(message,...rest);}
   };
   let map=null,old=null,detached=false;
   window.__watchOld=node=>{old=node;log('old-widget-recorded',{connected:old.isConnected});};
   new MutationObserver(()=>{const next=document.querySelector('#geographic-map');if(next!==map){log(next?'map-mounted':'map-removed');map=next;}if(old&&!old.isConnected&&!detached){detached=true;log('old-widget-detached');}}).observe(document,{subtree:true,childList:true});
   window.addEventListener('error',e=>log('page-error',{message:e.message}));
   log('init-native-clock',{dateNow:Date.now(),performanceNow:realNow()});
  });
  page.on('console',m=>result.events.push({event:'console',time:absolute(),type:m.type(),text:m.text()}));
  page.on('pageerror',e=>result.errors.push({time:absolute(),message:e.message,stack:e.stack}));
  await page.clock.install({time:new Date('2026-10-18T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));
  result.clockPausedBeforeGoto=true;result.gotoStart=absolute();await page.goto(origin+'/');result.gotoEnd=absolute();
  await page.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'compactPanelSave',blob);return create(blob);};});
  result.clockBefore=await page.evaluate(()=>({date:Date.now(),performance:performance.now()}));
  result.page=page;
 }
 const load=async result=>{
  const page=result.page;delete result.page;
  const previous=await page.getByLabel('Load game',{exact:true}).elementHandle();await page.evaluate(old=>window.__watchOld(old),previous);
  result.loadStart=absolute();
  try {
   await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'panels.json',mimeType:'application/json',buffer:payload});result.setInputEnd=absolute();
   const mapCheck=expect(page.locator('#geographic-map')).toBeVisible({timeout:5000}).then(()=>({check:'map-visible',status:'passed',end:absolute()}),e=>({check:'map-visible',status:'FAILED',end:absolute(),message:e.message,stack:e.stack}));
   try{await expect.poll(async()=>{const sample={start:absolute()};try{sample.connected=await previous.evaluate(el=>el.isConnected);return sample.connected;}catch(e){sample.error={message:e.message,stack:e.stack};throw e;}finally{sample.end=absolute();result.polls.push(sample);} }).toBe(false);result.checks.push({check:'old-input-detached',status:'passed',end:absolute()});}
   catch(e){result.checks.push({check:'old-input-detached',status:'FAILED',end:absolute(),message:e.message,stack:e.stack});}
   result.checks.push(await mapCheck);
   if(result.checks.every(c=>c.status==='passed')){try{await expect(page.locator('[data-country]')).toHaveCount(46);result.checks.push({check:'country-count-46',status:'passed',end:absolute()});}catch(e){result.checks.push({check:'country-count-46',status:'FAILED',message:e.message,stack:e.stack,end:absolute()});}}
   else {result.lateObservationStart=absolute();try{await page.waitForFunction(old=>!old.isConnected&&document.querySelector('#geographic-map'),previous,{timeout:30000});result.lateObservation={completed:true,end:absolute()};}catch(e){result.lateObservation={completed:false,end:absolute(),message:e.message,stack:e.stack};}}
  } catch(e){result.errors.push({time:absolute(),message:e.message,stack:e.stack});}
  finally{
   result.clockAfter=await page.evaluate(()=>({date:Date.now(),performance:performance.now()}));
   result.trace=await page.evaluate(()=>window.__cold);result.ui=await page.evaluate(()=>({status:[...document.querySelectorAll('[role=status]')].map(x=>x.textContent),alerts:[...document.querySelectorAll('[role=alert]')].map(x=>x.textContent),heading:document.querySelector('h1')?.textContent,countries:document.querySelectorAll('[data-country]').length}));result.end=absolute();await save('context-'+result.name+'.json',result);
  }
 };
 const started=absolute();const a=load(results[0]);await new Promise(resolve=>setTimeout(resolve,750));const b=load(results[1]);await Promise.all([a,b]);
 const worker=await fetch(origin+'/assets/generatedGeographyPresentation.worker-DGiQULpt.js');const bytes=Buffer.from(await worker.arrayBuffer());await fs.writeFile(path.join(dir,'worker-http-body.js'),bytes);await save('worker-http.json',{url:worker.url,status:worker.status,headers:Object.fromEntries(worker.headers),bytes:bytes.length});
 await save('results.json',{diagnosticOnly:true,invocations:1,contexts:2,started,end:absolute(),durationMs:performance.now()-nativeStart,actualLoadStartDifferenceMs:results[1].loadStart-results[0].loadStart,results});
 const prior=JSON.parse(await fs.readFile('docs/prototypes/new-game/T75/preflight/ci-performance-proposal-20261019-01/trace-mock-clock-polls.json','utf8'));
 await save('comparison.json',{inputAB:JSON.stringify(results[0].trace.input)===JSON.stringify(results[1].trace.input),outputAB:JSON.stringify(results[0].trace.output)===JSON.stringify(results[1].trace.output),prior:results.map(r=>({name:r.name,inputExact:JSON.stringify(r.trace.input)===JSON.stringify(prior.input),outputExact:JSON.stringify(r.trace.output)===JSON.stringify(prior.output)}))});
}finally{for(const c of contexts)await c.close();await browser.close();await save('browser-closed.json',{time:absolute(),contextsClosed:contexts.length});}
