// Frozen fixture import is finalized only after the parent supplies the T74 oracle.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createGeographicGame} from '../../src/core/geographic-game';
import {defaultOptions} from '../../src/core/options';
import {GEOGRAPHIC_MATCH_IDENTITY,deserializeVersionedMatch,serializeVersionedMatch} from '../../src/core/match-save';
import frozen from '../../fixtures/new-game/T75/preflight/phase-b-20261018-01/fixtures/seed-1994-after.json' with {type:'json'};
import changed from '../../fixtures/new-game/T75/preflight/phase-b-20261018-01/fixtures/changed-boundary-hits.json' with {type:'json'};

type Drawing={bounds:{x:number;y:number;width:number;height:number};islands:{polygon:number[][]}[];provinces:{id:string;polygon:number[][];labelAt:number[]}[];routes:{from:string;to:string;points:number[][]}[]};
const oracles:Record<string,Drawing>={'1994':frozen as unknown as Drawing};
const options={...defaultOptions(),seed:1994,seats:[{kind:'human' as const},{kind:'human' as const}],computerStrengths:[]};
const result=createGeographicGame(options);if(!result.ok)throw Error('Frozen 1994 refused');
const accepted=result;
const payload=serializeVersionedMatch(options,[],GEOGRAPHIC_MATCH_IDENTITY);
const ring=(points:number[][])=>'M'+points.map(p=>p.join(',')).join('L')+'Z';
async function save(page:Page){const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save game',exact:true}).click();return readFileSync((await(await pending).path())!,'utf8');}
async function installWorkerGate(page:Page){
 await page.addInitScript(()=>{
  const Native=window.Worker;
  const gate={posted:0,held:0,hold:true,workers:0,queue:[] as (()=>void)[],release(){this.hold=false;this.queue.splice(0).forEach(deliver=>deliver());}};
  (window as any).__presentationWorker=gate;
  window.Worker=class extends Native{
   constructor(url:string|URL,options?:WorkerOptions){super(url,options);gate.workers++;
    super.addEventListener('message',event=>{
     if(!gate.hold)return;event.stopImmediatePropagation();gate.held++;
     gate.queue.push(()=>super.dispatchEvent(new MessageEvent('message',{data:event.data})));
    });
   }
   override postMessage(message:any,transferOrOptions?:any){if(message.kind==='derive')gate.posted++;super.postMessage(message,transferOrOptions);}
  };
 });
}
async function assertDrawing(page:Page,expected:Drawing){
 const actual=await page.locator('#geographic-map').evaluate(svg=>({
  countries:[...svg.querySelectorAll('[data-country]')].map(g=>({id:g.getAttribute('data-country'),path:g.querySelector('.cell')!.getAttribute('d'),x:Number(g.querySelector('.count')!.getAttribute('x')),y:Number(g.querySelector('.count')!.getAttribute('y'))-5})),
  coasts:[...svg.querySelectorAll('.coast')].map(p=>p.getAttribute('d')),
  routes:[...svg.querySelectorAll('.lane')].map(p=>({edge:p.getAttribute('data-edge'),points:p.getAttribute('points')})),
 }));
 expect(actual.countries).toEqual(expected.provinces.map(p=>({id:p.id,path:ring(p.polygon),x:p.labelAt[0],y:p.labelAt[1]})));
 expect(actual.coasts).toEqual(expected.islands.map(i=>ring(i.polygon)));
 expect(actual.routes).toEqual(expected.routes.map(r=>({edge:[r.from,r.to].sort().join('|'),points:r.points.map(p=>p.join(',')).join(' ')})));
}
test('real worker preparation is responsive and precedes playable construction',async({page})=>{
 await installWorkerGate(page);await page.goto('/?seed=1994&control=manual');await page.getByRole('button',{name:'Start game',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__presentationWorker.posted)).toBeGreaterThan(0);
 await expect.poll(()=>page.evaluate(()=>(window as any).__presentationWorker.held)).toBeGreaterThan(0);
 await expect(page.locator('#geographic-map')).toHaveCount(0);await expect(page.getByRole('status')).toContainText('Preparing game');
 await page.getByLabel('Seed',{exact:true}).fill('2000');await expect(page.getByLabel('Seed',{exact:true})).toHaveValue('2000');
 await page.evaluate(()=>(window as any).__presentationWorker.release());await expect(page.locator('#geographic-map')).toBeVisible();
 await assertDrawing(page,oracles['1994']!);await assertHits(page);const loaded=deserializeVersionedMatch(await save(page));expect(loaded.options).toEqual(options);expect(loaded.state).toEqual(accepted.state);expect(loaded.initialState).toEqual(accepted.state);
});
test('actual geographic load preserves exact replay while painting the frozen presentation',async({page})=>{
 await page.goto('/?control=manual');await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'resume.json',mimeType:'application/json',buffer:Buffer.from(payload)});
 await expect(page.locator('#geographic-map')).toBeVisible();await assertDrawing(page,oracles['1994']!);await assertHits(page);
 const state=deserializeVersionedMatch(await save(page));expect(state.state).toEqual(accepted.state);expect(state.geography).toEqual(accepted.geography);
});
// Supplement this bounded browser contract with precomputed changed-boundary hit
// samples from the frozen oracle once its exact content is supplied. Existing
// geographic-board retains real pointer/keyboard attacks, overlays and replay.

async function assertHits(page:Page){
 const hits=await page.locator('#geographic-map').evaluate((svg,samples)=>samples.map(sample=>{
  const [x,y]=sample.point;const point=new DOMPoint(x!,y!).matrixTransform((svg as SVGSVGElement).getScreenCTM()!);
  return document.elementFromPoint(point.x,point.y)?.closest('[data-country]')?.getAttribute('data-country')??null;
 }),changed.samples);
 expect(hits).toEqual(changed.samples.map(p=>p.id));
}
test('frozen changed boundaries receive pointer hits and a repeated load reuses the root drawing cache',async({page},info)=>{
 await installWorkerGate(page);await page.goto('/?control=manual&seed=1994');await page.evaluate(()=>(window as any).__presentationWorker.release());
 await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toBeVisible();await assertDrawing(page,oracles['1994']!);await assertHits(page);
 const first=await page.evaluate(()=>({posted:(window as any).__presentationWorker.posted,workers:(window as any).__presentationWorker.workers}));expect(first).toEqual({posted:1,workers:1});
 await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'same.json',mimeType:'application/json',buffer:Buffer.from(payload)});await expect.poll(async()=>deserializeVersionedMatch(await save(page)).options.seed).toBe(1994);
 expect(await page.evaluate(()=>({posted:(window as any).__presentationWorker.posted,workers:(window as any).__presentationWorker.workers}))).toEqual(first);await assertHits(page);
 await page.getByRole('button',{name:'New game',exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toBeVisible();expect(await page.evaluate(()=>(window as any).__presentationWorker.posted)).toBe(1);
 await page.mouse.move(0,0);await page.screenshot({path:(process.env['T75_SCREENSHOTS']??'screenshots')+'/playable-1994-'+info.project.name+'.png'});
});

test('invalid newer file and New game reject held real-worker load completions without replacing a live match',async({page})=>{
 const otherOptions={...options,seed:6};const other=createGeographicGame(otherOptions);if(!other.ok)throw Error('Frozen 6 refused');
 const otherFile=serializeVersionedMatch(otherOptions,[],GEOGRAPHIC_MATCH_IDENTITY);
 await installWorkerGate(page);await page.goto('/?control=manual&seed=1994');await page.evaluate(()=>(window as any).__presentationWorker.release());
 await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map')).toBeVisible();const original=await save(page);
 await page.evaluate(()=>(window as any).__presentationWorker.hold=true);
 await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'pending.json',mimeType:'application/json',buffer:Buffer.from(otherFile)});
 await expect.poll(()=>page.evaluate(()=>(window as any).__presentationWorker.held)).toBe(1);expect(await save(page)).toBe(original);
 await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('invalid JSON')});await expect(page.getByRole('alert')).toContainText('Load failed');
 await page.evaluate(()=>(window as any).__presentationWorker.release());await assertDrawing(page,oracles['1994']!);expect(await save(page)).toBe(original);
 await page.evaluate(()=>(window as any).__presentationWorker.hold=true);
 await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'pending.json',mimeType:'application/json',buffer:Buffer.from(otherFile)});
 await expect.poll(()=>page.evaluate(()=>(window as any).__presentationWorker.held)).toBe(2);await page.getByRole('button',{name:'New game',exact:true}).click();
 await page.evaluate(()=>(window as any).__presentationWorker.release());await expect(page.getByRole('button',{name:'Start game',exact:true})).toBeVisible();await expect(page.locator('#geographic-map')).toHaveCount(0);
});
