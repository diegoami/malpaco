import {expect,test} from '@playwright/test';
import {build} from 'vite';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {configurableRaidCardsRules} from '../../src/core/state';
import {apply} from '../../src/core/rules';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {serializeVersionedMatch,deserializeVersionedMatch,GEOGRAPHIC_V3_CONFIGURABLE_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
import {openSurface} from './shell';
const KEY='malpaco:current-game',PREF='malpaco:next-game-settings';
const read=(p:import('@playwright/test').Page)=>p.evaluate(k=>localStorage.getItem(k),KEY);
let bundle:{js:string;css:string};
test.beforeAll(async()=>{
 const b=await build({configFile:false,logLevel:'silent',build:{write:false,cssCodeSplit:false,lib:{entry:'tests/e2e/harness/larger-map.ts',formats:['iife'],name:'LargerMap'}}});
 const output=((Array.isArray(b)?b[0]!:b) as {output:({type:'chunk';code:string}|{type:'asset';fileName:string;source:string|Uint8Array})[]}).output;
 bundle={js:output.filter(o=>o.type==='chunk').map(o=>o.type==='chunk'?o.code:'').join('\n'),css:output.filter(o=>o.type==='asset'&&o.fileName.endsWith('.css')).map(o=>o.type==='asset'?String(o.source):'').join('\n')};
});
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set per test'));
for(const width of [390,1280])test(`${width}: Settings preserves the current game and applies 72/96/46 only at New game`,async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width,height:width===390?844:800});
 await page.addInitScript(pref=>{if(sessionStorage.getItem('size-init'))return;sessionStorage.setItem('size-init','1');localStorage.setItem(pref,JSON.stringify({version:2,computerOpponents:1,reinforcementDivisor:5}));},PREF);
 await page.goto('/');await expect(page.locator('[data-country]')).toHaveCount(46,{timeout:60000});
 const key=KEY;
 const get=()=>page.evaluate(k=>localStorage.getItem(k),key);
 const pause=page.locator('#game-pause-button');if(await pause.getAttribute('aria-label')==='Pause game')await pause.click();
 let previous=46;for(const size of [72,96,46]){
  const before=await get();expect(before).not.toBeNull();await openSurface(page,'menu');
  const dialog=page.getByRole('dialog',{name:'Settings',exact:true});await expect(dialog.getByLabel('Map size',{exact:true})).toBeVisible({timeout:5000});await expect(dialog.getByLabel('Map size',{exact:true})).toHaveValue(String(previous));await dialog.getByLabel('Map size',{exact:true}).selectOption(String(size));
  expect(await get()).toBe(before);await expect(dialog.getByLabel('Starting armies',{exact:true})).toHaveValue('1-3');await expect(dialog.getByLabel('Computer opponents',{exact:true})).toHaveValue('1');
  await dialog.getByRole('button',{name:'Return to map',exact:true}).click();await openSurface(page,'menu');await page.locator('#new-game-button').click();await page.locator('#give-up-confirm').click();await page.locator('#give-up-new-game').click();
  await expect(page.locator('[data-country]')).toHaveCount(size,{timeout:60000});
  if(await pause.getAttribute('aria-label')==='Pause game')await pause.click();
  const currentKey=await page.evaluate(()=>{const seed=new URLSearchParams(location.search).get('seed');return 'malpaco:current-game'+(seed?':seed:'+seed:'');});
  const text=(await page.evaluate(k=>localStorage.getItem(k),currentKey))!,loaded=deserializeVersionedMatch(text);
  expect(loaded.state.map.provinces).toHaveLength(size);expect(loaded.options.seats).toHaveLength(2);expect(loaded.options.reinforcementDivisor).toBeUndefined();expect(loaded.identity.boardGenerator.version).toBe(size===46?2:3);
  await page.reload();await expect(page.locator('[data-country]')).toHaveCount(size,{timeout:60000});expect(await page.evaluate(k=>localStorage.getItem(k),currentKey)).toBe(text);
  await page.screenshot({path:`artifacts/T111-browser/game-${size}-${width}.png`,animations:'disabled'});previous=size;
 }
});
for(const size of [72,96] as const)for(const width of [390,1280])test(`${size}/${width}: every region has a readable badge and can be tapped and keyboard selected`,async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width,height:width===390?844:800});
 await page.route('**/larger-map-harness',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'}));await page.goto('/larger-map-harness');await page.addStyleTag({content:bundle.css});await page.addScriptTag({content:bundle.js});
 await page.evaluate(size=>(window as unknown as {LargerMap:{mount(s:72|96):void}}).LargerMap.mount(size),size);
 const nodes=page.locator('[data-country]');await expect(nodes).toHaveCount(size);
 const labels=await nodes.evaluateAll(ns=>ns.map(n=>{const count=n.querySelector<SVGGraphicsElement>('.count')!,badge=n.querySelector<SVGGraphicsElement>('.badge')!,cell=n.querySelector<SVGGeometryElement>('.cell')!,b=badge.getBoundingClientRect(),m=count.getScreenCTM()!;const x=b.x+b.width/2,y=b.y+b.height/2;return {id:n.getAttribute('data-country')!,px:parseFloat(getComputedStyle(count).fontSize)*Math.hypot(m.a,m.b),x,y,onLand:cell.isPointInFill(new DOMPoint(x,y).matrixTransform(cell.getScreenCTM()!.inverse())),hit:document.elementFromPoint(x,y)?.closest('[data-country]')===n};}));
 for(const l of labels){expect(l.px,l.id).toBeGreaterThanOrEqual(13.99);expect(l.onLand,l.id).toBe(true);expect(l.hit,l.id).toBe(true);await page.mouse.click(l.x,l.y);await expect(page.locator(`[data-country="${l.id}"]`)).toHaveAttribute('data-selected','true');}
 for(let i=0;i<size;i++){await nodes.nth(i).focus();await page.keyboard.press('Enter');await expect(nodes.nth(i)).toHaveAttribute('data-selected','true');}
 await page.screenshot({path:`artifacts/T111-browser/map-${size}-${width}.png`,animations:'disabled'});
});
for(const size of [72,96] as const)test(`${size}: pending capture survives phone rotation and reload`,async({page})=>{
 test.setTimeout(180000);const o={...defaultOptions(),seed:7,regionCount:size,names:'numbered' as const,reinforcementDivisor:3 as const};const g=createGeographicGame(o,configurableRaidCardsRules(o),{},3);if(!g.ok)throw Error(g.errors.join());
 let state=g.state;for(let n=0;n<4000&&!state.result&&!(state.pendingCapture&&state.players[state.currentPlayer]!.kind==='human');n++){const a=decideComputerAction(computerView(state));if(!a)throw Error('no action');const r=apply(state,a);if(!r.ok)throw Error(r.error);state=r.state;}
 expect(state.pendingCapture).toBeDefined();const text=serializeVersionedMatch(o,state.history,GEOGRAPHIC_V3_CONFIGURABLE_CARD_MATCH_IDENTITY);
 await page.addInitScript(([key,text])=>{if(sessionStorage.getItem('pending-size'))return;sessionStorage.setItem('pending-size','1');localStorage.setItem(key!,text!);},[KEY,text]);
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('[data-country]')).toHaveCount(size,{timeout:60000});
 await openSurface(page,'actions');await expect(page.locator('#capture-amount')).toBeVisible();const amount=await page.locator('#capture-amount').inputValue();
 await page.setViewportSize({width:844,height:390});await expect(page.locator('#capture-amount')).toHaveValue(amount);expect(deserializeVersionedMatch((await read(page))!).state.pendingCapture).toEqual(state.pendingCapture);
 await page.reload();await expect(page.locator('[data-country]')).toHaveCount(size,{timeout:60000});await openSurface(page,'actions');await expect(page.locator('#capture-amount')).toHaveValue(amount);expect(deserializeVersionedMatch((await read(page))!).state).toEqual(state);
});
