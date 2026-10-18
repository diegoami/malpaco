import {DRAWING_VERSION,immutable,presentationKey} from './generatedGeographyPresentation';
import type {AcceptedGeometry,Presentation} from './generatedGeographyPresentation';
export type WorkerRequest={kind:'derive';id:number;key:string;version:string;geometry:AcceptedGeometry}|{kind:'cancel';id:number};
export type WorkerResponse={kind:'success';id:number;key:string;version:string;value:Presentation}|{kind:'failure';id:number;key:string;version:string;message:string};
export interface WorkerPort {postMessage(message:WorkerRequest):void;addEventListener(type:'message',listener:(event:MessageEvent<WorkerResponse>)=>void):void;addEventListener(type:'error',listener:(event:ErrorEvent)=>void):void;removeEventListener(type:'message',listener:(event:MessageEvent<WorkerResponse>)=>void):void;removeEventListener(type:'error',listener:(event:ErrorEvent)=>void):void;terminate():void}
interface Subscriber {resolve:(value:Presentation)=>void;reject:(error:Error)=>void;detach:()=>void}
interface Pending {id:number;key:string;subscribers:Set<Subscriber>}
const aborted=()=>new DOMException('Presentation request cancelled','AbortError');
/** Own one instance per mounted host. Defaults: eight immutable completed drawings [designed]. */
export class PresentationService {
 private readonly cache=new Map<string,Presentation>();private readonly pending=new Map<string,Pending>();private readonly ids=new Map<number,Pending>();private sequence=0;private disposed=false;private terminalError:Error|null=null;
 constructor(private readonly worker:WorkerPort,private readonly capacity=8,private readonly version=DRAWING_VERSION){if(!Number.isInteger(capacity)||capacity<1)throw Error('Cache capacity must be positive');worker.addEventListener('message',this.onMessage);worker.addEventListener('error',this.onError);}
 request(geometry:AcceptedGeometry,signal?:AbortSignal):Promise<Presentation>{
  if(this.disposed)return Promise.reject(Error('Presentation service disposed'));if(this.terminalError)return Promise.reject(this.terminalError);if(signal?.aborted)return Promise.reject(aborted());
  const snapshot=structuredClone(geometry),key=presentationKey(snapshot,this.version),cached=this.cache.get(key);if(cached){this.cache.delete(key);this.cache.set(key,cached);return Promise.resolve(cached);}
  let pending=this.pending.get(key),fresh=false;if(!pending){pending={id:++this.sequence,key,subscribers:new Set()};this.pending.set(key,pending);this.ids.set(pending.id,pending);fresh=true;}
  const own=pending;
  const promise=new Promise<Presentation>((resolve,reject)=>{const cancel=()=>{own.subscribers.delete(subscriber);subscriber.detach();reject(aborted());if(!own.subscribers.size&&this.ids.has(own.id)){this.remove(own);try{this.worker.postMessage({kind:'cancel',id:own.id});}catch{/* Subscriber already received explicit cancellation. */}}};const subscriber:Subscriber={resolve,reject,detach:()=>signal?.removeEventListener('abort',cancel)};own.subscribers.add(subscriber);signal?.addEventListener('abort',cancel,{once:true});});
  if(fresh)try{this.worker.postMessage({kind:'derive',id:own.id,key,version:this.version,geometry:snapshot});}catch(error){this.fail(own,error instanceof Error?error:Error(String(error)));}return promise;
 }
 private remove(p:Pending){this.pending.delete(p.key);this.ids.delete(p.id);}
 private fail(p:Pending,error:Error){this.remove(p);for(const s of p.subscribers){s.detach();s.reject(error);}p.subscribers.clear();}
 private readonly onMessage=(event:MessageEvent<WorkerResponse>)=>{
  if(this.disposed)return;const r=event.data,p=this.ids.get(r.id);if(!p)return;
  if(r.key!==p.key||r.version!==this.version){this.fail(p,Error('Mismatched presentation worker identity'));return;}
  if(r.kind==='failure'){this.fail(p,Error(r.message));return;}
  if(r.value.contentKey!==p.key||r.value.drawingVersion!==this.version){this.fail(p,Error('Mismatched presentation content'));return;}
  const value=immutable(structuredClone(r.value));this.remove(p);this.cache.set(p.key,value);while(this.cache.size>this.capacity)this.cache.delete(this.cache.keys().next().value!);
  for(const s of p.subscribers){s.detach();s.resolve(value);}p.subscribers.clear();
 };
 private readonly onError=()=>{this.terminalError=Error('Presentation worker failed; recreate service before retry');for(const p of[...this.pending.values()])this.fail(p,this.terminalError);};
 dispose(){if(this.disposed)return;this.disposed=true;for(const p of[...this.pending.values()])this.fail(p,Error('Presentation service disposed'));this.cache.clear();this.worker.removeEventListener('message',this.onMessage);this.worker.removeEventListener('error',this.onError);this.worker.terminate();}
}
/** Bundlers resolve this URL relative to this module; no host imports prototype or Node code. */
export const createPresentationService=()=>new PresentationService(new Worker(new URL('./generatedGeographyPresentation.worker.ts',import.meta.url),{type:'module'}));
