// T89: shared steps for the 0.2.0 acceptance matrix. The engine is the independent oracle:
// every check compares the saved match with the engine's own replay of the expected actions.
import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {activePlayer,apply} from '../../../src/core';
import type {Action,GameState} from '../../../src/core';
import {deserializeVersionedMatch} from '../../../src/core/match-save';
import {openSurface,withSurface} from '../shell';

export const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
export function next(s:GameState,action:Action):GameState{const r=apply(s,action);if(!r.ok)throw Error(`oracle refused ${JSON.stringify(action)}: ${r.error}`);return r.state;}

/** A frozen clock and a Save that hands its blob to the test instead of a download. */
export async function begin(p:Page,path:string,size?:{width:number;height:number}){
 if(size)await p.setViewportSize(size);
 await p.clock.install({time:new Date('2026-10-21T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-21T12:00:00Z'));
 await p.goto(path);
 await p.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'savedBlob',blob);return create(blob);};});
}
/** Loads a match file from the page's file input: on setup it is on the page, in play it is in the menu card. */
export async function load(p:Page,text:string,name='match.json'){
 if(await p.locator('#battle-action-rail').count())await openSurface(p,'settings');
 const input=p.getByLabel('Load game',{exact:true}),previous=await input.elementHandle();
 await input.setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});
 await expect.poll(()=>previous!.evaluate(n=>n.isConnected)).toBe(false);
}
export async function savedText(p:Page):Promise<string>{
 await withSurface(p,'settings',()=>p.getByRole('button',{name:'Save game',exact:true}).click());
 return p.evaluate(()=>(Reflect.get(window,'savedBlob') as Blob).text());
}
export const saved=async(p:Page)=>deserializeVersionedMatch(await savedText(p)).state;
/** The engine-visible match: the same history, RNG, armies, owners, cards and phase. */
export async function exactly(p:Page,s:GameState){
 const a=await saved(p);
 expect({history:a.history,rng:a.rng,armies:a.armies,ownerOf:a.ownerOf,cards:a.cards,phase:a.phase,pool:a.reinforcementPool,pending:a.pendingCapture}).toEqual({history:s.history,rng:s.rng,armies:s.armies,ownerOf:s.ownerOf,cards:s.cards,phase:s.phase,pool:s.reinforcementPool,pending:s.pendingCapture});
}
/** One of the mover's countries that borders an enemy, and that enemy. */
export function frontline(s:GameState){const me=activePlayer(s)!.id,p=s.map.provinces.find(c=>s.ownerOf[c.id]===me&&c.borders.some(b=>s.ownerOf[b]!==me))!;return {from:p.id,to:p.borders.find(b=>s.ownerOf[b]!==me)!};}
export async function poolLeft(p:Page){return await p.locator('#placement-pool').isVisible()?Number(await p.locator('#placement-pool-count').textContent()):0;}
