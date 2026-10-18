import type {Page,TestInfo} from '@playwright/test';
import {appendFileSync,readFileSync} from 'node:fs';
const light=process.env.DIAG_LABEL?.includes('fast')??false;
const contexts=new WeakMap<Page,{info:TestInfo,file:string,call:number,write:(kind:string,data:unknown)=>void,flush:()=>void}>();
export async function setupDiagnostic(p:Page,info:TestInfo){
 const file=info.outputPath('saves.jsonl'),buffer:unknown[]=[];const write=(kind:string,data:unknown)=>buffer.push({wall:Date.now(),kind,data}),flush=()=>{if(buffer.length){appendFileSync(file,buffer.map(x=>JSON.stringify(x)).join('\n')+'\n');buffer.length=0;}};contexts.set(p,{info,file,call:0,write,flush});
 p.on('download',d=>write('actual-download',{name:d.suggestedFilename(),url:d.url()}));p.on('pageerror',e=>write('pageerror',{message:e.message,stack:e.stack}));p.on('console',m=>write('console',{type:m.type(),text:m.text()}));p.on('close',()=>write('page-close',{}));p.on('crash',()=>write('page-crash',{}));
 const cdp=await p.context().newCDPSession(p);await cdp.send('Page.enable');await cdp.send('Log.enable');cdp.on('Log.entryAdded',d=>write('cdp-log',d));cdp.on('Page.downloadProgress',d=>write('cdp-download-progress',d));cdp.on('Page.downloadWillBegin',d=>write('cdp-download',d));
 await p.addInitScript(()=>{
  const events:unknown[]=[];Reflect.set(window,'saveDiagnostic',{events,mutations:0,created:0,revoked:0,anchors:0});const d=Reflect.get(window,'saveDiagnostic');
  const record=(kind:string,data:unknown)=>events.push({kind,clock:Date.now(),perf:performance.now(),active:navigator.userActivation.isActive,everActive:navigator.userActivation.hasBeenActive,data});
  const create=URL.createObjectURL.bind(URL);URL.createObjectURL=b=>{const url=create(b);d.created++;record('create-url',{url,size:(b as Blob).size});return url;};
  const revoke=URL.revokeObjectURL.bind(URL);URL.revokeObjectURL=url=>{d.revoked++;record('revoke-url',{url});revoke(url);};
  const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){d.anchors++;record('anchor-click',{href:this.href,download:this.download,connected:this.isConnected});return click.call(this);};
  const geometry=()=>{const e=document.getElementById('reference-save-game') as HTMLButtonElement|null,r=e?.getBoundingClientRect(),hit=r?document.elementFromPoint(r.x+r.width/2,r.y+r.height/2):null;return {connected:e?.isConnected,disabled:e?.disabled,focused:document.activeElement===e,rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,hit:hit?{id:hit.id,tag:hit.tagName}:null,errors:[...document.querySelectorAll('.match-error')].map(e=>e.textContent),history:document.querySelector('.battle-controls')?.getAttribute('data-history-count'),phase:document.querySelector('.panel')?.getAttribute('data-phase'),created:d.created,revoked:d.revoked,anchors:d.anchors};};
  document.addEventListener('click',e=>{if((e.target as Element)?.closest?.('#reference-save-game'))record('after-save-handler',geometry());});
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','click'])document.addEventListener(type,e=>{const t=e.target as Element;if(t?.closest?.('#reference-save-game'))record(type,{geometry:type==='click'?geometry():null,eventTimeStamp:e.timeStamp,id:t.id,trusted:e.isTrusted,x:(e as MouseEvent).clientX,y:(e as MouseEvent).clientY});},true);
  addEventListener('DOMContentLoaded',()=>{new MutationObserver(records=>{d.mutations+=records.length;}).observe(document.documentElement,{childList:true,subtree:true});});
 });
}
async function snapshot(p:Page){return p.evaluate(()=>{
 const el=document.querySelector<HTMLButtonElement>('#reference-save-game'),rect=el?.getBoundingClientRect(),hit=rect?document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2):null,parents=[];let n=el?.parentElement;while(n){const r=n.getBoundingClientRect(),s=getComputedStyle(n);parents.push({tag:n.tagName,id:n.id,class:n.className,rect:{x:r.x,y:r.y,width:r.width,height:r.height},overflowX:s.overflowX,overflowY:s.overflowY,scrollTop:n.scrollTop,clientHeight:n.clientHeight,scrollHeight:n.scrollHeight});n=n.parentElement;}
 return {url:location.href,button:el?{connected:el.isConnected,disabled:el.disabled,rect:{x:rect!.x,y:rect!.y,width:rect!.width,height:rect!.height},focused:document.activeElement===el,hit:hit?{tag:hit.tagName,id:hit.id,class:hit.className,text:hit.textContent?.slice(0,100)}:null}:null,parents,errors:[...document.querySelectorAll('.match-error')].map(e=>({text:e.textContent,rects:e.getClientRects().length})),history:document.querySelector('.battle-controls')?.getAttribute('data-history-count'),phase:document.querySelector('.panel')?.getAttribute('data-phase'),turn:document.querySelector('.turn')?.textContent,activation:{isActive:navigator.userActivation.isActive,hasBeenActive:navigator.userActivation.hasBeenActive},document:{scrollY,innerWidth,innerHeight,scrollHeight:document.documentElement.scrollHeight},diagnostic:Reflect.get(window,'saveDiagnostic')};
 });}
export async function diagnosticSave(p:Page){
 const c=contexts.get(p)!;const call=++c.call;c.write('save-before',{call,snapshot:light?null:await snapshot(p)});
 const pending=p.waitForEvent('download',{timeout:5000}).then(d=>({download:d,error:null}),e=>({download:null,error:String(e)}));
 let clickError:string|null=null;try{await p.getByRole('button',{name:'Save game',exact:true}).click({timeout:3000});c.write('click-resolved',{call});}catch(e){clickError=String(e);c.write('click-rejected',{call,error:clickError});}
 c.write('save-after-click',{call,snapshot:light?null:await snapshot(p)});const result=await pending;c.write('download-result',{call,error:result.error,snapshot:!light||result.error||clickError?await snapshot(p):null});
 if(clickError||!result.download){await p.screenshot({path:c.info.outputPath('failure-'+call+'.png'),fullPage:true});c.flush();throw Error(JSON.stringify({call,clickError,downloadError:result.error}));}
 const path=await result.download.path();if(!path)throw Error('Native download missing path');const text=readFileSync(path,'utf8');const v=JSON.parse(text);c.write('save-complete',{call,actions:v.actions?.length,last:v.actions?.at(-1)});return text;
}

export async function finishDiagnostic(p:Page){const c=contexts.get(p);if(c&&!p.isClosed())c.write('test-end-snapshot',await snapshot(p));c?.flush();}
