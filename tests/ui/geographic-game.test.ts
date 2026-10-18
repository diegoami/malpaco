// UNEXECUTED. Proposed pure controller, not an existing export. The real setup
// submit/retry path MUST call this same controller; prove that wiring in disposable
// preflight before freezing this draft. No DOM dependency or production test URL.
import {expect,it,vi} from 'vitest';
import {createGeographicSetupController} from '../../src/ui/geographicGame';
import {createGeographicGame} from '../../src/core/geographic-game';
import type {GeographicGameResult} from '../../src/core/geographic-game';
import type {GameOptions} from '../../src/core';
import {defaultOptions} from '../../src/core/options';

it('reports all typed bounded refusal records without mounting and retries once',()=>{
 const options={...defaultOptions(),seed:1994},success=createGeographicGame(options);
 if(!success.ok)throw Error('Required successful retry fixture 1994 refused');
 const refusal:GeographicGameResult={ok:false,errors:['labels: gap below 44 CSS px','routes: coast endpoint unavailable'],attempts:50,
  failures:Array.from({length:50},(_,i)=>({attempt:i+1,constraints:['labels','routes'],candidate:success.geography})),rng:{seed:1506,state:1506}};
 const create=vi.fn<(options:GameOptions)=>GeographicGameResult>().mockReturnValueOnce(refusal).mockReturnValueOnce(success);
 const report=vi.fn(),mount=vi.fn();
 const controller=createGeographicSetupController({create,report,mount});
 controller.start({...options,seed:1506});
 expect(create).toHaveBeenCalledTimes(1);expect(mount).not.toHaveBeenCalled();
 expect(report).toHaveBeenLastCalledWith(refusal);expect('state' in refusal).toBe(false);
 controller.start(options);
 expect(create).toHaveBeenCalledTimes(2);expect(create).toHaveBeenLastCalledWith(options);
 expect(mount).toHaveBeenCalledTimes(1);expect(mount).toHaveBeenLastCalledWith(options,success);
 // The successful mount uses the accepted state once; no second generation after
 // navigation may silently consume another budget or replace accepted geometry.
 expect(report).toHaveBeenCalledTimes(1);
});

// A minimal DOM adapter drives the real mounted form submit handler. It avoids
// adding a DOM package and proves refusal injection reaches the production path.
class FormNode {
 readonly children:(FormNode|string)[]=[];
 readonly attrs:Record<string,string>={};
 readonly classes=new Set<string>();
 readonly classList={add:(...xs:string[])=>xs.forEach(x=>this.classes.add(x))};
 value='';id='';className='';checked=false;
 onsubmit:((event:{preventDefault():void})=>void)|null=null;
 onchange:(()=>void)|null=null;
 private ownText='';
 constructor(readonly tag:string){}
 setAttribute(key:string,value:string){this.attrs[key]=String(value);if(key==='id')this.id=String(value);if(key==='value')this.value=String(value);}
 append(...nodes:(FormNode|string)[]){this.children.push(...nodes);}
 replaceChildren(...nodes:(FormNode|string)[]){this.children.splice(0,this.children.length,...nodes);}
 addEventListener(){}
 reportValidity(){return true;}
 set textContent(value:string){this.ownText=value;this.children.splice(0);}
 get textContent():string{return this.ownText+this.children.map(n=>typeof n==='string'?n:n.textContent).join('');}
 find(predicate:(n:FormNode)=>boolean):FormNode|undefined{if(predicate(this))return this;for(const child of this.children){const found=typeof child==='string'?undefined:child.find(predicate);if(found)return found;}return undefined;}
}
import {mountGeographicGame} from '../../src/ui/geographicGame';
import {afterEach} from 'vitest';
afterEach(()=>vi.unstubAllGlobals());
it('the real mounted setup displays a typed refusal and retries without a partial mount',()=>{
 vi.stubGlobal('document',{createElement:(tag:string)=>new FormNode(tag),createElementNS:(_ns:string,tag:string)=>new FormNode(tag)});
 vi.stubGlobal('location',{search:'?control=manual&seed=1506'});
 const options={...defaultOptions(),seed:1994,seats:[{kind:'human' as const},{kind:'human' as const}],computerStrengths:[]};
 const success=createGeographicGame(options);if(!success.ok)throw Error('1994 retry refused');
 const refusal:GeographicGameResult={ok:false,errors:['labels: all candidates refused','routes: endpoint absent'],attempts:50,failures:Array.from({length:50},(_,i)=>({attempt:i+1,constraints:['labels','routes'],candidate:success.geography})),rng:{seed:1506,state:1506}};
 const create=vi.fn<(options:GameOptions)=>GeographicGameResult>().mockReturnValueOnce(refusal).mockReturnValueOnce(success),mount=vi.fn();
 const root=new FormNode('div');mountGeographicGame(root as unknown as HTMLElement,{create,mountAccepted:mount});
 const form=root.find(n=>n.tag==='form')!,input=root.find(n=>n.id==='geographic-seed')!,alert=root.find(n=>n.attrs['role']==='alert')!;
 form.onsubmit!({preventDefault(){}});expect(create).toHaveBeenCalledTimes(1);expect(mount).not.toHaveBeenCalled();
 expect(alert.textContent).toContain('50 attempts');expect(alert.textContent).toContain('Choose another seed');expect(root.find(n=>n.id==='geographic-map')).toBeUndefined();
 input.value='1994';form.onsubmit!({preventDefault(){}});expect(create).toHaveBeenCalledTimes(2);expect(mount).toHaveBeenCalledTimes(1);expect(mount).toHaveBeenLastCalledWith(expect.objectContaining({seed:1994}),success);
});

import {apply,activePlayer} from '../../src/core';
import {GameEventHistory} from '../../src/ui/gameEventLog';
import {deserializeVersionedMatch,serializeVersionedMatch,GEOGRAPHIC_MATCH_IDENTITY} from '../../src/core/match-save';
it('geographic file metadata and event history share the original accepted map and replay origin',()=>{
 const options={...defaultOptions(),seed:1994};const accepted=createGeographicGame(options);if(!accepted.ok)throw Error('1994 refused');
 const source=accepted.state.map.provinces.find(p=>accepted.state.ownerOf[p.id]===activePlayer(accepted.state)!.id)!;
 const action={kind:'reinforce' as const,province:source.id,amount:1},next=apply(accepted.state,action);if(!next.ok)throw Error(next.error);
 const loaded=deserializeVersionedMatch(serializeVersionedMatch(options,[action],GEOGRAPHIC_MATCH_IDENTITY));
 expect(loaded.identity).toEqual(GEOGRAPHIC_MATCH_IDENTITY);expect(loaded.geography).toEqual(accepted.geography);expect(loaded.initialState).toEqual(accepted.state);expect(loaded.state).toEqual(next.state);
 const history=new GameEventHistory(options,loaded.initialState);const rows=history.append(loaded.state);expect(rows).toHaveLength(1);expect(rows[0]!.index).toBe(1);expect(rows[0]!.regions).toHaveLength(1);expect(rows[0]!.regions[0]!.id).toBe(source.id);expect(rows[0]!.regions[0]!.description).toContain(`${accepted.state.armies[source.id]} → ${next.state.armies[source.id]} (+1)`);
});
