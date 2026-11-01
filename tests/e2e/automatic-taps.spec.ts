import {test,expect} from '@playwright/test';
import {humanHandFixture} from './event-fixture';
import {visitGame} from './shell';
import {overlapPoint} from './tap-overlap';
import {deserializeVersionedMatch,serializeVersionedMatch} from '../../src/core/match-save';
import {apply} from '../../src/core/rules';
import type {Page} from '@playwright/test';
const KEY='malpaco:current-game';
test.use({hasTouch:true});
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit touch viewports'));
async function prepare(page:Page,size={width:390,height:844}){
 const f=deserializeVersionedMatch(humanHandFixture().text);let state=f.state;if(state.phase==='cards'){const r=apply(state,{kind:'skipCards'});if(!r.ok)throw Error(r.error);state=r.state;}
 await page.setViewportSize(size);await page.clock.install();await page.clock.pauseAt(new Date());const text=serializeVersionedMatch(f.options,state.history,f.identity);await page.addInitScript(({key,text})=>{localStorage.setItem(key,text);localStorage.setItem(key+'-meta',JSON.stringify({id:'auto-taps',paused:false}));},{key:KEY,text});await visitGame(page,'/');await page.clock.runFor(3000);await page.locator('#hide-turn-widget').click();await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(100);return state;
}
const kept=async(page:Page)=>deserializeVersionedMatch((await page.evaluate(k=>localStorage.getItem(k),KEY))!).state;
for(const size of [{width:390,height:844},{width:844,height:390}])test(`${size.width}: border tap chooses greatest surface once, zooms and shows no chooser`,async({page})=>{
 let state=await prepare(page,size);const map=page.locator('#geographic-map');
 for(let n=0;n<2;n++){
  const point=await overlapPoint(page,state.players[state.currentPlayer]!.id);expect(point).not.toBeNull();const zoom=Number(await map.getAttribute('data-camera-zoom'));
  const expected=apply(state,{kind:'reinforce',province:point!.id,amount:1});if(!expected.ok)throw Error(expected.error);
  await page.touchscreen.tap(point!.x,point!.y);await expect(map).toHaveAttribute('data-camera-zoom',String(zoom*1.25));await expect(page.locator('#game-focus-drawer')).toBeHidden();const next=await kept(page);expect(next.history).toEqual(expected.state.history);expect(next.armies).toEqual(expected.state.armies);expect(next.rng).toEqual(expected.state.rng);state=next;
 }await page.screenshot({path:`artifacts/T160/tap-${size.width}.png`});
});
test('larger contact uses its surface and suppresses the following browser click',async({page})=>{
 const state=await prepare(page,{width:1280,height:800}),point=await overlapPoint(page,state.players[state.currentPlayer]!.id,20);expect(point).not.toBeNull();
 const map=page.locator('#geographic-map'),event={pointerId:7,pointerType:'touch',isPrimary:true,clientX:point!.x,clientY:point!.y,width:40,height:40};await map.dispatchEvent('pointerdown',event);await map.dispatchEvent('pointerup',event);await page.locator(`[data-country="${point!.id}"]`).dispatchEvent('click');
 const expected=apply(state,{kind:'reinforce',province:point!.id,amount:1});if(!expected.ok)throw Error(expected.error);expect((await kept(page)).history).toEqual(expected.state.history);await expect(map).toHaveAttribute('data-camera-zoom','1.25');await expect(page.locator('#game-focus-drawer')).toBeHidden();
});
test('cancelled touches and pan/pinch gestures never choose a region or show a chooser',async({page})=>{
 const state=await prepare(page),point=await overlapPoint(page,state.players[state.currentPlayer]!.id);expect(point).not.toBeNull();const map=page.locator('#geographic-map'),event={pointerId:7,pointerType:'touch',isPrimary:true,clientX:point!.x,clientY:point!.y};
 await map.dispatchEvent('pointerdown',event);await map.dispatchEvent('pointercancel',event);await expect(map).toHaveAttribute('data-camera-zoom','1');expect((await kept(page)).history).toEqual(state.history);
 await page.mouse.move(event.clientX,event.clientY);await page.mouse.down();await page.mouse.move(event.clientX+30,event.clientY,{steps:3});await page.mouse.up();expect((await kept(page)).history).toEqual(state.history);
 await map.dispatchEvent('pointerdown',event);const other={...event,pointerId:8,isPrimary:false,clientX:event.clientX+40};await map.dispatchEvent('pointerdown',other);await map.dispatchEvent('pointermove',{...other,clientX:event.clientX+80});await map.dispatchEvent('pointerup',{...other,clientX:event.clientX+80});await map.dispatchEvent('pointerup',event);await expect(map).toHaveAttribute('data-camera-zoom','2');expect((await kept(page)).history).toEqual(state.history);await expect(page.locator('#game-focus-drawer')).toBeHidden();
});
