import {pinned} from '../core/versioned-match-fixture';
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {apply,computerAction,deserializeVersionedMatch} from '../../src/core';
import type {Action} from '../../src/core';
const fixtures='docs/prototypes/new-game/T71/fixtures';
const input=(host:string,label:string)=>readFileSync(join(fixtures,`${host}-${label}.json`),'utf8');
const categories=['reinforcement','selection-ready','exchange','repeated-pair','capture-movement','friendly-movement'];
const mode=(p:Page)=>p.getByRole('combobox',{name:'Panel detail',exact:true});
async function begin(p:Page,host:string){
 await p.clock.install({time:new Date('2026-10-18T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));
 await p.goto(host==='reference'?'/?view=reference-game':'/');
 await p.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'compactPanelSave',blob);return create(blob);};});
}
async function save(p:Page){await p.getByRole('button',{name:'Save game',exact:true}).click();return p.evaluate(()=>(Reflect.get(window,'compactPanelSave') as Blob).text());}
async function load(p:Page,text:string){
 const previous=await p.getByLabel('Load game',{exact:true}).elementHandle();
 await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'panels.json',mimeType:'application/json',buffer:Buffer.from(text)});
 await expect.poll(()=>previous!.evaluate(el=>el.isConnected)).toBe(false);await expect(p.locator('[data-country]')).toHaveCount(46);
}
async function bounds(p:Page){return p.locator('.battle-reference').evaluate(root=>{
 const selectors=['.topbar','.board','.panel','.panel>.turn','.panel>.action','.panel>.log-card'];
 return Object.fromEntries(selectors.map(selector=>{const r=root.querySelector(selector)!.getBoundingClientRect();return [selector,{x:r.x,y:r.y,width:r.width,height:r.height}];}));
});}
function stable(actual:Awaited<ReturnType<typeof bounds>>,anchor:Awaited<ReturnType<typeof bounds>>){
 for(const selector of Object.keys(anchor))for(const axis of ['x','y','width','height'] as const)expect(Math.abs(actual[selector]![axis]-anchor[selector]![axis]),`${selector} ${axis}`).toBeLessThanOrEqual(1);
}
async function essentials(p:Page){
 for(const locator of [mode(p),p.locator('#game-pause-button'),p.locator('#game-speed'),p.getByRole('button',{name:'Game event log',exact:true}),...await p.getByTestId('player-army-total').all()]){
  await expect(locator).toBeVisible();expect(await locator.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;})).toBe(true);
 }
 expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
function evidence(info:{project:{name:string}},host:string,label:string){const dir=process.env['COMPACT_PANEL_EVIDENCE_DIR']??'screenshots/compact-panels';mkdirSync(dir,{recursive:true});return join(dir,`${info.project.name}-${host}-${label}`);}
test.use({video:'on'});
for(const host of ['reference','geographic']){
 // Separate baseline geometry check still runs when the mode control is absent.
 test(`${host}: computer phase changes keep actual card bounds stable`,async({page},info)=>{
  await begin(page,host);let anchor:Awaited<ReturnType<typeof bounds>>|undefined;const samples=[];
  for(const label of categories){
   await load(page,input(host,label));const before=await bounds(page);anchor??=before;samples.push({label,before});
   stable(before,anchor);await page.clock.runFor(350);stable(await bounds(page),anchor);
  }
  writeFileSync(evidence(info,host,'geometry')+'.json',JSON.stringify(samples,null,2));
 });
 for(const detail of ['compact','detailed'])test(`${host} ${detail}: real computer actions retain fixed panel areas and essentials`,async({page},info)=>{
  await begin(page,host);let anchor:Awaited<ReturnType<typeof bounds>>|undefined;const samples=[];
  for(const label of categories){
   const text=input(host,label);await load(page,text);await expect(mode(page)).toBeVisible({timeout:1000});await mode(page).selectOption(detail);await expect(page.locator('.battle-reference')).toHaveAttribute('data-panel-detail',detail);
   await page.locator('#game-speed').selectOption('normal');const before=deserializeVersionedMatch(await save(page));expect(before.identity.boardGenerator.id).toBe(host==='reference'?'fixed-reference':'geographic');
   const action=computerAction(before.state);expect(action).not.toBeNull();const result=apply(before.state,action!);if(!result.ok)throw Error(result.error);
   const initial=await bounds(page);anchor??=initial;stable(initial,anchor);await essentials(page);
   await page.clock.runFor(350);expect(deserializeVersionedMatch(await save(page)).state).toEqual(result.state);const after=await bounds(page);stable(after,anchor);await essentials(page);
   const dice=page.locator('.battle-rolls');if(await dice.count()){if(detail==='compact')await expect(dice).toBeHidden();else if(result.state.log.some(e=>e.event==='attack'))await expect(dice).toBeVisible();}
   samples.push({label,action,before:initial,after});await page.screenshot({path:evidence(info,host,detail+'-'+label)+'.png'});
  }
  writeFileSync(evidence(info,host,detail+'-bounds')+'.json',JSON.stringify(samples,null,2));
 });
 test(`${host}: default/reversible keyboard mode preserves pause, speed, log, load and next callback`,async({page})=>{
  await begin(page,host);await load(page,input(host,'capture-movement'));await expect(mode(page)).toHaveValue('compact',{timeout:1000});
  await page.locator('#game-pause-button').click();await page.locator('#game-speed').selectOption('very-slow');const frozen=await save(page);
  await mode(page).focus();await mode(page).press('End');await expect(mode(page)).toHaveValue('detailed');expect(await save(page)).toBe(frozen);
  await page.getByRole('button',{name:'Game event log',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
  await mode(page).selectOption('compact');await mode(page).selectOption('detailed');await expect(page.locator('#game-pause-button')).toHaveText('Resume');await expect(page.locator('#game-speed')).toHaveValue('very-slow');
  await page.clock.runFor(10000);expect(await save(page)).toBe(frozen);await essentials(page);
  await page.locator('#game-pause-button').click();await page.clock.runFor(1999);expect(await save(page)).toBe(frozen);await page.clock.runFor(1);
  const before=deserializeVersionedMatch(frozen),a=computerAction(before.state)!,r=apply(before.state,a);if(!r.ok)throw Error(r.error);expect(deserializeVersionedMatch(await save(page)).state).toEqual(r.state);
  await load(page,input(host,'reinforcement'));await expect(mode(page)).toHaveValue('detailed');await expect(page.locator('#game-speed')).toHaveValue('very-slow');await mode(page).selectOption('compact');await expect(mode(page)).toHaveValue('compact',{timeout:1000});
 });
 for(const detail of ['compact','detailed'])test(`${host} ${detail}: mandatory human capture and friendly movement remain visible and operable`,async({page},info)=>{
  await begin(page,host);
  function human(label:string){const v=JSON.parse(input(host,label));v.options.seats=v.options.seats.map(()=>({kind:'human'}));v.options.computerStrengths=[];const text=JSON.stringify(v);expect(()=>deserializeVersionedMatch(text)).not.toThrow();return text;}
  await load(page,human('capture-movement'));await expect(mode(page)).toBeVisible({timeout:1000});await mode(page).selectOption(detail);const before=deserializeVersionedMatch(await save(page));expect(before.state.phase).toBe('capture');
  for(const id of ['capture-amount','confirm-capture-button']){await expect(page.locator('#'+id)).toBeVisible();await expect(page.locator('#'+id)).toBeEnabled();expect(await page.locator('#'+id).evaluate(el=>{const a=el.closest('.action')!.getBoundingClientRect(),r=el.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom+1;}),id+' stays inside action card').toBe(true);}
  await essentials(page);await page.screenshot({path:evidence(info,host,detail+'-human-capture')+'.png'});await page.locator('#confirm-capture-button').click();expect(deserializeVersionedMatch(await save(page)).state.history.at(-1)!.kind).toBe('captureMove');
  await load(page,human('friendly-movement'));const moving=deserializeVersionedMatch(await save(page)),trace=JSON.parse(readFileSync(join(fixtures,'fixture-discovery.json'),'utf8')).results.find((x:{host:string})=>x.host===host),action=trace.found['friendly-movement'].action as Extract<Action,{kind:'friendlyMove'}>;
  await page.locator('#start-friendly-move-button').click();await page.locator(`[data-country="${action.from}"]`).click();await page.locator(`[data-country="${action.to}"]`).click();
  for(const id of ['friendly-move-amount','confirm-friendly-move-button','cancel-friendly-move-button','skip-friendly-move-button']){await expect(page.locator('#'+id)).toBeVisible();await expect(page.locator('#'+id)).toBeEnabled();expect(await page.locator('#'+id).evaluate(el=>{const a=el.closest('.action')!.getBoundingClientRect(),r=el.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom+1;}),id+' stays inside action card').toBe(true);}
  await essentials(page);await page.screenshot({path:evidence(info,host,detail+'-human-move')+'.png'});await page.locator('#friendly-move-amount').fill('1');await page.locator('#confirm-friendly-move-button').click();
  const expected=apply(moving.state,{...action,amount:1});if(!expected.ok)throw Error(expected.error);expect(deserializeVersionedMatch(await save(page)).state).toEqual(expected.state);
 });
}

for(const detail of ['compact','detailed'])test(`reference ${detail}: human-loss choices fit and remain usable`,async({page},info)=>{
 await begin(page,'reference');await load(page,pinned('human-loss').text);await expect(mode(page)).toBeVisible({timeout:1000});await mode(page).selectOption(detail);
 for(const id of ['watch-computers-button','stop-game-button']){const el=page.locator('#'+id);await expect(el).toBeVisible();await expect(el).toBeEnabled();expect(await el.evaluate(node=>{const a=node.closest('.action')!.getBoundingClientRect(),r=node.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom+1&&r.right<=innerWidth&&r.bottom<=innerHeight;})).toBe(true);}
 await essentials(page);await page.screenshot({path:evidence(info,'reference',detail+'-human-loss')+'.png'});const previous=deserializeVersionedMatch(await save(page)).state;
 await page.locator('#stop-game-button').click();const result=apply(previous,{kind:'stopGame'});if(!result.ok)throw Error(result.error);expect(deserializeVersionedMatch(await save(page)).state).toEqual(result.state);
 await load(page,pinned('human-loss').text);await page.locator('#watch-computers-button').click();expect(deserializeVersionedMatch(await save(page)).state.watchingComputers).toBe(true);
});
