import {visitGame,startFromResult} from './shell';
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {raidCardsRules,activePlayer} from '../../src/core/state';
import {apply} from '../../src/core/rules';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {serializeVersionedMatch,deserializeVersionedMatch,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
const KEY='malpaco:current-game',META=KEY+'-meta';
const read=(p:Page,key:string)=>p.evaluate(k=>localStorage.getItem(k),key);
async function host(page:Page,initialRequired=false){
 await page.addInitScript(required=>{
  Reflect.set(window,'nativeActive',true);Reflect.set(window,'nativeRequired',required);
  Reflect.set(window,'MalpacoHost',{isActive:()=>Reflect.get(window,'nativeActive')===true,requiresResume:()=>Reflect.get(window,'nativeRequired')===true,acknowledgeResume:()=>{if(!Reflect.get(window,'nativeActive'))return false;Reflect.set(window,'nativeRequired',false);return true;}});
 },initialRequired);
}
async function background(page:Page){await page.evaluate(()=>{Reflect.set(window,'nativeActive',false);Reflect.set(window,'nativeRequired',true);window.dispatchEvent(new Event('malpaco:native-background'));});}
async function foreground(page:Page){await page.evaluate(()=>{Reflect.set(window,'nativeActive',true);window.dispatchEvent(new Event('malpaco:native-foreground'));});}
const back=(page:Page)=>page.evaluate(()=>!window.dispatchEvent(new Event('malpaco:native-back',{cancelable:true})));
function capture(){
 const o={...defaultOptions(),seed:1};const g=createGeographicGame(o,raidCardsRules(o),{},2);if(!g.ok)throw Error(g.errors.join());
 let s=g.state;
 for(let n=0;n<2000&&!s.result;n++){
  if(s.pendingCapture&&activePlayer(s)?.kind==='human')return serializeVersionedMatch(o,s.history,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY);
  const a=decideComputerAction(computerView(s));if(!a)break;const r=apply(s,a);if(!r.ok)throw Error(r.error);s=r.state;
 }throw Error('No capture');
}
async function keptCapture(page:Page){
 await host(page);const text=capture();
 await page.addInitScript(([k,t])=>{if(!sessionStorage.getItem('native-kept')){sessionStorage.setItem('native-kept','1');localStorage.setItem(k!,t!);}},[KEY,text]);
 await visitGame(page,'/');await expect(page.locator('#confirm-capture-button')).toBeVisible({timeout:60000});
 return (await read(page,KEY))!;
}
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','one browser project; native device coverage separate'));
test('background force-keeps a partial computer turn; foreground and dialog-close cannot resume it',async({page})=>{
 await host(page);await page.clock.install();await page.clock.pauseAt(new Date());
 await visitGame(page,'/?seed=7');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 const key='malpaco:seed-game:7',meta='malpaco:seed-game-meta:7',before=deserializeVersionedMatch((await read(page,key))!);
 await page.clock.runFor(240);await background(page);
 await expect(page.locator('#game-pause-button')).toHaveAttribute('aria-label','Resume game');
 const saved=(await read(page,key))!;expect(deserializeVersionedMatch(saved).state.history.length).toBeGreaterThan(before.state.history.length);
 expect(JSON.parse((await read(page,meta))!).paused).toBe(true);
 const state=deserializeVersionedMatch(saved).state;
 for(const country of state.map.provinces)await expect(page.locator(`[data-country="${country.id}"]`)).toHaveAttribute('data-armies',String(state.armies[country.id]));
 await page.clock.runFor(20000);expect(await read(page,key)).toBe(saved);
 await foreground(page);await page.clock.runFor(20000);expect(await read(page,key)).toBe(saved);
 await page.locator('#game-pause-button').click();await page.clock.runFor(20000);
 expect(deserializeVersionedMatch((await read(page,key))!).state.history.length).toBeGreaterThan(state.history.length);
 expect(JSON.parse((await read(page,meta))!).paused).toBe(false);
});
test('Back closes a menu and folds capture without navigation or a game action',async({page})=>{
 const saved=await keptCapture(page),url=page.url();
 await page.locator('#open-game-menu').click();expect(await back(page)).toBe(true);
 await expect(page.locator('#game-focus-drawer')).toBeHidden();expect(page.url()).toBe(url);expect(await read(page,KEY)).toBe(saved);
 await page.locator('#open-required-action').click();await expect(page.locator('#confirm-capture-button')).toBeVisible();
 expect(await back(page)).toBe(true);await expect(page.locator('#open-required-action')).toBeVisible();
 expect(await read(page,KEY)).toBe(saved);expect(page.url()).toBe(url);expect(await back(page)).toBe(false);
});
for(const [button,name] of [['#game-help-button','Help'],['#open-game-menu','Settings']] as const)test(`background while ${name} is open stays paused after return and dialog dismissal`,async({page})=>{
 const saved=await keptCapture(page);await page.locator(button).click();
 await background(page);await foreground(page);expect(await back(page)).toBe(true);
 await expect(page.locator('dialog.game-help[open]')).toHaveCount(0);
 await expect(page.locator('#game-pause-button')).toHaveAttribute('aria-label','Resume game');
 expect(await read(page,KEY)).toBe(saved);expect(JSON.parse((await read(page,META))!).paused).toBe(true);
 await page.locator('#game-pause-button').click();await expect(page.locator('#game-pause-button')).toHaveAttribute('aria-label','Pause game');
 expect(await read(page,KEY)).toBe(saved);
});
test('native saved resume requirement pauses a new host before its first computer action',async({page})=>{
 await host(page,true);await page.clock.install();await page.clock.pauseAt(new Date());
 await visitGame(page,'/?seed=7');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 await expect(page.locator('#game-pause-button')).toHaveAttribute('aria-label','Resume game');
 const key='malpaco:seed-game:7',saved=(await read(page,key))!;await page.clock.runFor(20000);expect(await read(page,key)).toBe(saved);
 expect(deserializeVersionedMatch(saved).state.history).toEqual([]);
});

test('replacing the player host retires its native listener and never writes the old game metadata',async({page})=>{
 await keptCapture(page);const old=JSON.parse((await read(page,META))!).id;
 await page.locator('#open-game-menu').click();await page.locator('#new-game-button').click();
 await page.locator('#give-up-confirm').click();await startFromResult(page);
 await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
 const current=JSON.parse((await read(page,META))!).id;expect(current).not.toBe(old);
 await page.evaluate(meta=>{
  const original=Storage.prototype.setItem,writes:string[]=[];Reflect.set(window,'nativeMetaWrites',writes);
  Storage.prototype.setItem=function(key,value){if(key===meta)writes.push(JSON.parse(value).id);return original.call(this,key,value);};
 },META);
 await background(page);
 const writes=await page.evaluate(()=>Reflect.get(window,'nativeMetaWrites') as string[]);
 expect(writes.length).toBeGreaterThan(0);expect(writes.every(id=>id===current)).toBe(true);
 expect(JSON.parse((await read(page,META))!).id).toBe(current);
});
