import {afterEach,describe,expect,it,vi} from 'vitest';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';

type Mode='compact'|'detailed';
// Small DOM adapter only for the native select; layout/full-host effects are browser checks.
class SelectNode {
 attrs:Record<string,string>={};children:unknown[]=[];value='';onchange:(()=>void)|null=null;
 listeners:Record<string,(()=>void)[]>={};
 constructor(readonly tagName:string){}
 setAttribute(name:string,value:string){this.attrs[name]=String(value);if(name==='value')this.value=String(value);}
 append(...nodes:unknown[]){this.children.push(...nodes);if(this.tagName==='select'&&!this.value){const first=this.children.find(c=>c instanceof SelectNode) as SelectNode|undefined;this.value=first?.value??'';}}
 addEventListener(type:string,fn:()=>void){(this.listeners[type]??=[]).push(fn);}
 change(value:string){this.value=value;this.onchange?.();for(const fn of this.listeners['change']??[])fn();}
}
afterEach(()=>vi.unstubAllGlobals());
async function factory(){
 vi.stubGlobal('document',{createElement:(tag:string)=>new SelectNode(tag),createTextNode:(s:string)=>s});
 const path=resolve('src/ui/panelDetail.ts');
 // Missing behavior is an executed assertion, not an import/collection error.
 expect(existsSync(path),'actual shared panel-detail control must exist').toBe(true);
 return (await import('../../src/ui/panelDetail')).createPanelDetailControl as (preferences:{detail?:Mode},notify:(detail:Mode)=>void)=>HTMLSelectElement;
}
function options(node:SelectNode){return node.children.filter(c=>c instanceof SelectNode) as SelectNode[];}
describe('actual native compact panel control',()=>{
 it('defaults Compact and exposes two labelled reversible choices',async()=>{
  const create=await factory(),preferences:{detail?:Mode}={},events:Mode[]=[];
  const select=create(preferences,mode=>events.push(mode)) as unknown as SelectNode;
  expect(select.tagName).toBe('select');expect(select.attrs['aria-label']).toBe('Panel detail');expect(select.value).toBe('compact');
  expect(options(select).map(o=>o.value)).toEqual(['compact','detailed']);expect(options(select).map(o=>o.children.join(''))).toEqual(['Compact','Detailed']);
  select.change('detailed');expect(preferences.detail).toBe('detailed');expect(events).toEqual(['detailed']);select.change('compact');expect(preferences.detail).toBe('compact');expect(events).toEqual(['detailed','compact']);
 });
 it('retains the session choice across replacement without changing other preferences or match state',async()=>{
  const create=await factory(),state=Object.freeze({history:Object.freeze([]),rng:Object.freeze({seed:1994,state:17})});
  const preferences={detail:'detailed' as Mode,speed:'very-slow',threshold:2,paused:true,logOpen:true,state};const snapshot={...preferences};
  const notify=vi.fn();const first=create(preferences,notify) as unknown as SelectNode;expect(first.value).toBe('detailed');expect(notify).not.toHaveBeenCalled();
  first.change('compact');const second=create(preferences,notify) as unknown as SelectNode;expect(second.value).toBe('compact');
  expect({...preferences,detail:'detailed'}).toEqual(snapshot);expect(preferences.state).toBe(state);expect(notify).toHaveBeenCalledExactlyOnceWith('compact');
 });
 it('normalizes an invalid stored or event value without exposing a third mode',async()=>{
  const create=await factory(),preferences={detail:'broken' as Mode},events:Mode[]=[];
  const select=create(preferences,m=>events.push(m)) as unknown as SelectNode;expect(select.value).toBe('compact');
  select.change('broken');expect(preferences.detail).toBe('compact');expect(select.value).toBe('compact');expect(events).toEqual(['compact']);
 });
});

class LogNode {
 attrs:Record<string,string>={};children:(LogNode|string)[]=[];dataset:Record<string,string>={};hidden=false;title='';
 style={display:'',setProperty:(_key:string,_value:string)=>{}};private top=0;clientHeight=80;
 constructor(readonly tagName:string){}
 get scrollHeight(){return this.children.length*24;}
 get scrollTop(){return this.top;}set scrollTop(n:number){this.top=Math.max(0,Math.min(n,Math.max(0,this.scrollHeight-this.clientHeight)));}
 setAttribute(k:string,v:string){this.attrs[k]=v;}
 toggleAttribute(k:string,v:boolean){if(v)this.attrs[k]='';else delete this.attrs[k];}
 addEventListener(_event:string,_handler:unknown){}
 append(...nodes:(LogNode|string)[]){this.children.push(...nodes);}
 replaceChildren(...nodes:(LogNode|string)[]){this.children=[...nodes];}
 set textContent(s:string){this.children=[s];}get textContent():string{return this.children.map(x=>typeof x==='string'?x:x.textContent).join('');}
 querySelector(selector:string):LogNode|null {for(const n of this.children){if(typeof n==='string')continue;if(selector.startsWith('.')?n.attrs['class']?.split(' ').includes(selector.slice(1)):n.tagName===selector)return n;const found=n.querySelector(selector);if(found)return found;}return null;}
}
async function battleLog(){
 vi.stubGlobal('document',{createElement:(tag:string)=>new LogNode(tag),createElementNS:(_ns:string,tag:string)=>new LogNode(tag)});
 const {Panel}=await import('../../src/ui/panel'),core=await import('../../src/core'),{pinned}=await import('../core/versioned-match-fixture');
 const state=core.deserializeVersionedMatch(pinned('human-loss').text).state,panel=new Panel({onAttack(){},onStartCombat(){},onEndTurn(){},onNewGame(){}});
 const render=(s:typeof state)=>panel.render({state:s,from:null,to:null,blocked:'',hint:'',seed:1994});
 const log=(panel.el as unknown as LogNode).querySelector('.log')!;render(state);return {state,panel,log,render,core};
}
describe('complete bounded sidebar battle history',()=>{
 it('keeps every historical entry chronologically, exceeding the former seven-row cap',async()=>{
  const {state,log,render}=await battleLog(),expected=state.log.filter(e=>e.event!=='game_started');
  expect(expected.length).toBeGreaterThan(7);expect(log.children).toHaveLength(expected.length);
  for(const [i,entry] of expected.entries()){
   const row=(log.children[i] as LogNode).textContent;
   if(entry.event==='attack'){expect(row).toContain(state.map.provinces.find(p=>p.id===entry.from)!.name);expect(row).toContain(state.map.provinces.find(p=>p.id===entry.to)!.name);}
   else expect(row).toContain(state.players.find(p=>p.id===entry.player)!.name);
  }
  const texts=log.children.map(n=>(n as LogNode).textContent);render(state);render(state);expect(log.children.map(n=>(n as LogNode).textContent)).toEqual(texts);
 });
 it('follows new entries only at the bottom and preserves an older reading position',async()=>{
  const {state,log,render,core}=await battleLog();
  let next=state;const watch=core.apply(next,{kind:'watchComputers'});if(!watch.ok)throw Error(watch.error);next=watch.state;
  for(let i=0;i<20&&next.log.length===state.log.length;i++){const a=core.computerAction(next);if(!a)throw Error('Expected computer continuation');const r=core.apply(next,a);if(!r.ok)throw Error(r.error);next=r.state;}
  expect(next.log.length).toBeGreaterThan(state.log.length);log.scrollTop=log.scrollHeight;render(next);expect(log.children).toHaveLength(next.log.filter(e=>e.event!=='game_started').length);expect(log.scrollTop).toBe(log.scrollHeight-log.clientHeight);
  render(state);log.scrollTop=48;render(next);expect(log.scrollTop).toBe(48);render(next);expect(log.scrollTop).toBe(48);
 });
 it('replaces a loaded/new match history without retaining foreign entries or duplicates',async()=>{
  const {state,log,render,core}=await battleLog();expect(log.children.length).toBeGreaterThan(7);
  const o=core.defaultOptions(),fresh=core.deserializeVersionedMatch(core.serializeVersionedMatch(o,[],core.REFERENCE_MATCH_IDENTITY)).state;
  render(fresh);expect(log.children).toHaveLength(0);render(state);expect(log.children).toHaveLength(state.log.filter(e=>e.event!=='game_started').length);
 });
});
