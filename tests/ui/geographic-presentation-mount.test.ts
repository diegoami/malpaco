import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {createGeographicGame} from '../../src/core/geographic-game';
import {defaultOptions} from '../../src/core/options';
import {GEOGRAPHIC_MATCH_IDENTITY,serializeVersionedMatch} from '../../src/core/match-save';
import {ReferenceMatchFiles} from '../../src/ui/referenceMatchFiles';
import {mountGeographicGame} from '../../src/ui/geographicGame';

const doubles=vi.hoisted(()=>({hosts:[] as any[],services:[] as any[],request:vi.fn()}));
vi.mock('../../src/ui/generatedGeographyPresentationService',()=>({createPresentationService:()=>{
 const service={request:doubles.request,dispose:vi.fn()};doubles.services.push(service);return service;
}}));
vi.mock('../../src/ui/referenceBattleGame',()=>({ReferenceBattleGame:class {
 readonly files:ReferenceMatchFiles;readonly dispose=vi.fn(()=>this.files.dispose());
 constructor(readonly map:any,readonly options:any,readonly newGame:()=>void,readonly state:any,_preferences:any,onLoad:any,_automatic:any,readonly presentation:any){
  this.files=new ReferenceMatchFiles(onLoad,options,()=>state,presentation.identity,true);doubles.hosts.push(this);
 }
 mount(root:HTMLElement){root.replaceChildren(this.files.el);}
}}));

// Drives the production form and ReferenceMatchFiles listeners without another DOM dependency.
class Node {
 readonly children:(Node|string)[]=[];readonly attrs:Record<string,string>={};readonly dataset:Record<string,string>={};
 readonly classList={add:vi.fn()};private ownText='';value='';id='';className='';checked=false;files:any[]=[];
 onsubmit:((event:{preventDefault():void})=>void)|null=null;onchange:(()=>void)|null=null;
 readonly listeners:Record<string,(()=>unknown)[]>={};
 constructor(readonly tag:string){}
 setAttribute(key:string,value:string){this.attrs[key]=String(value);if(key==='id')this.id=String(value);if(key==='value')this.value=String(value);}
 append(...nodes:(Node|string)[]){this.children.push(...nodes);}
 replaceChildren(...nodes:(Node|string)[]){this.children.splice(0,this.children.length,...nodes);}
 addEventListener(kind:string,callback:()=>unknown){(this.listeners[kind]??=[]).push(callback);}
 async emit(kind:string){await Promise.all((this.listeners[kind]??[]).map(f=>f()));}
 valid=true;reportValidity(){return this.valid;}
 set textContent(value:string){this.ownText=value;this.children.splice(0);}
 get textContent():string{return this.ownText+this.children.map(n=>typeof n==='string'?n:n.textContent).join('');}
 find(test:(node:Node)=>boolean):Node|undefined{if(test(this))return this;for(const child of this.children){const n=typeof child==='string'?undefined:child.find(test);if(n)return n;}return undefined;}
}
function deferred<T>(){let resolve!:(x:T)=>void,reject!:(x:unknown)=>void;const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const options={...defaultOptions(),seed:1994,seats:[{kind:'human' as const},{kind:'human' as const}],computerStrengths:[]};
const accepted=createGeographicGame(options);if(!accepted.ok)throw Error('Frozen accepted seed 1994 refused');
const success=accepted;
const payload=serializeVersionedMatch(options,[],GEOGRAPHIC_MATCH_IDENTITY);
let root:Node,cleanup:()=>void;
const node=(id:string)=>root.find(n=>n.id===id)!;
function submit(){root.find(n=>n.tag==='form')!.onsubmit!({preventDefault(){}});}
function load(text:string|Promise<string>){const input=node('reference-load-game-file');input.files=[{text:()=>Promise.resolve(text)}];return input.emit('change');}
function mount(){cleanup=mountGeographicGame(root as unknown as HTMLElement,{create:()=>success});}
beforeEach(()=>{
 vi.stubGlobal('document',{createElement:(tag:string)=>new Node(tag),createElementNS:(_ns:string,tag:string)=>new Node(tag)});
 vi.stubGlobal('location',{search:'?control=manual&seed=1994'});
 root=new Node('div');doubles.hosts.length=0;doubles.services.length=0;doubles.request.mockReset();cleanup=()=>{};
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('actual form waits for preparation before constructing any battle host and keeps accepted identities',async()=>{
 const work=deferred<any>();doubles.request.mockReturnValue(work.promise);mount();submit();
 expect(doubles.request).toHaveBeenCalledWith(success.geography,expect.any(AbortSignal));expect(doubles.hosts).toHaveLength(0);
 expect(root.textContent).toContain('Preparing game');work.resolve({drawingVersion:'frozen'});await tick();
 expect(doubles.hosts).toHaveLength(1);expect(doubles.hosts[0].state).toBe(success.state);expect(doubles.hosts[0].map).toBe(success.state.map);
 expect(doubles.hosts[0].presentation.initialState).toBe(success.state);expect(success.state.rng).toEqual(accepted.state.rng);
});
it('newer submit cancels an older drawing even when its worker ignores abort',async()=>{
 const a=deferred<any>(),b=deferred<any>();doubles.request.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);mount();submit();const signal=doubles.request.mock.calls[0]![1];submit();
 expect(signal.aborted).toBe(true);a.resolve({});await tick();expect(doubles.hosts).toHaveLength(0);b.resolve({});await tick();expect(doubles.hosts).toHaveLength(1);
});
it('actual newer invalid file supersedes a pending valid load before decode',async()=>{
 const a=deferred<any>();doubles.request.mockReturnValue(a.promise);mount();const older=load(payload);await tick();
 expect(doubles.request).toHaveBeenCalledTimes(1);const signal=doubles.request.mock.calls[0]![1];await load('invalid JSON');expect(signal.aborted).toBe(true);
 a.resolve({});await older;expect(doubles.hosts).toHaveLength(0);expect(root.textContent).toContain('Load failed');
});
it('Start game cancels a file still reading text before onLoad has run',async()=>{
 const text=deferred<string>(),work=deferred<any>();doubles.request.mockReturnValue(work.promise);mount();const old=load(text.promise);submit();text.resolve(payload);await old;
 expect(doubles.request).toHaveBeenCalledTimes(1);work.resolve({});await tick();expect(doubles.hosts).toHaveLength(1);
});
it('load failure preserves the live game and terminal worker failure recreates service on retry',async()=>{
 doubles.request.mockResolvedValueOnce({});mount();submit();await tick();const original=doubles.hosts[0];
 const fail=deferred<any>();doubles.request.mockReturnValueOnce(fail.promise);const loading=load(payload);await tick();
 expect(doubles.hosts).toHaveLength(1);expect(original.dispose).not.toHaveBeenCalled();fail.reject(Error('Worker stopped'));await loading;
 expect(original.dispose).not.toHaveBeenCalled();expect(root.textContent).toContain('Load failed: Could not prepare this map. Try again.');expect(root.textContent).not.toContain('Worker stopped');expect(doubles.services[0].dispose).toHaveBeenCalledTimes(1);
 doubles.request.mockResolvedValueOnce({});await load(payload);expect(doubles.services).toHaveLength(2);expect(doubles.hosts).toHaveLength(2);expect(original.dispose).toHaveBeenCalledTimes(1);
 expect(root.textContent).not.toContain('Load failed');expect(doubles.hosts[1].dispose).not.toHaveBeenCalled();
});
it('successful load disposal keeps the new host and the root service alive',async()=>{
 doubles.request.mockResolvedValue({});mount();submit();await tick();const original=doubles.hosts[0];await load(payload);
 expect(original.dispose).toHaveBeenCalledTimes(1);expect(doubles.hosts).toHaveLength(2);expect(doubles.services).toHaveLength(1);expect(doubles.services[0].dispose).not.toHaveBeenCalled();expect(doubles.hosts[1].dispose).not.toHaveBeenCalled();
});
it('New game cancels a live file preparation and later completion cannot leave setup',async()=>{
 doubles.request.mockResolvedValueOnce({});mount();submit();await tick();const work=deferred<any>();doubles.request.mockReturnValueOnce(work.promise);
 const loading=load(payload);await tick();doubles.hosts[0].newGame();expect(doubles.request.mock.calls[1]![1].aborted).toBe(true);work.resolve({});await loading;
 expect(root.find(n=>n.tag==='form')).toBeDefined();expect(doubles.hosts).toHaveLength(1);expect(doubles.services[0].dispose).not.toHaveBeenCalled();
});
it('root teardown cancels pending preparation, rejects completion and disposes service exactly once',async()=>{
 const work=deferred<any>();doubles.request.mockReturnValue(work.promise);mount();submit();cleanup();cleanup();
 expect(doubles.request.mock.calls[0]![1].aborted).toBe(true);work.resolve({});await tick();expect(doubles.hosts).toHaveLength(0);expect(doubles.services[0].dispose).toHaveBeenCalledTimes(1);
});
it('a stale AbortError never resets the service used by a newer request',async()=>{
 const a=deferred<any>(),b=deferred<any>();doubles.request.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);mount();submit();submit();
 a.reject(new DOMException('Superseded','AbortError'));await tick();expect(doubles.services[0].dispose).not.toHaveBeenCalled();b.resolve({});await tick();expect(doubles.hosts).toHaveLength(1);expect(doubles.services).toHaveLength(1);
});

it('invalid newer form submission cancels a pending file text read without mounting',async()=>{
 const text=deferred<string>();mount();const old=load(text.promise);root.find(n=>n.tag==='form')!.valid=false;submit();text.resolve(payload);await old;
 expect(doubles.request).not.toHaveBeenCalled();expect(doubles.hosts).toHaveLength(0);
});
it('an invalid file chosen after Start cancels the pending start drawing',async()=>{
 const work=deferred<any>();doubles.request.mockReturnValue(work.promise);mount();submit();const signal=doubles.request.mock.calls[0]![1];await load('invalid');expect(signal.aborted).toBe(true);
 work.resolve({});await tick();expect(doubles.hosts).toHaveLength(0);expect(root.textContent).toContain('Load failed');
});
it('invalid newer file keeps the old live match while rejecting an older pending load',async()=>{
 doubles.request.mockResolvedValueOnce({});mount();submit();await tick();const original=doubles.hosts[0],work=deferred<any>();doubles.request.mockReturnValueOnce(work.promise);
 const older=load(payload);await tick();await load('invalid');work.resolve({});await older;
 expect(doubles.hosts).toHaveLength(1);expect(original.dispose).not.toHaveBeenCalled();expect(root.textContent).toContain('Load failed');
});
