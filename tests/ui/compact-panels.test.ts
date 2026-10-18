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
