import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {activePlayer,apply,defaultOptions,raidCardsRules,serializeVersionedMatch} from '../../src/core';
import type {GameOptions,GameState} from '../../src/core';
import {createGeographicGame} from '../../src/core/geographic-game';
import {decideComputerAction} from '../../src/core/computer';
import {computerView} from '../../src/core/computer-view';
import {friendlySources,friendlyTargets} from '../../src/core/movement';
import {deserializeVersionedMatch,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
import {visitGame} from './shell';

const ROOT='malpaco:current-game';
function find(kind:'capture'|'move'){
 for(let seed=1;seed<50;seed++){
  const options:GameOptions={...defaultOptions(),seed,seats:[{kind:'human'},{kind:'computer'},{kind:'computer'},{kind:'computer'}],computerStrengths:['Normal','Normal','Normal'],dominationWin:true,roundLimit:null,names:'seed'};
  const made=createGeographicGame(options,raidCardsRules(options),{},2);if(!made.ok)continue;let state=made.state;
  for(let n=0;n<600&&!state.result;n++){
   if(activePlayer(state)?.kind==='human'){
    if(kind==='capture'&&state.pendingCapture&&state.pendingCapture.max>state.pendingCapture.min+1)return {state,options,from:state.pendingCapture.from,to:state.pendingCapture.to};
    if(kind==='move'&&state.phase==='attack'&&!state.pendingCapture){
     const from=friendlySources(state).find(id=>state.armies[id]!>=4),to=from?friendlyTargets(state,from)[0]:undefined;
     if(from&&to){const after=apply(state,{kind:'friendlyMove',from,to,amount:1});if(after.ok&&!after.state.result)return {state,options,from,to};}
    }
   }
   const action=decideComputerAction(computerView(state));if(!action)break;const next=apply(state,action);if(!next.ok)throw Error(next.error);state=next.state;
  }
 }
 throw Error('No legal troop fixture');
}
const CAPTURE=find('capture'),MOVE=find('move');
const saved=async(page:Page)=>deserializeVersionedMatch((await page.evaluate(k=>localStorage.getItem(k),ROOT))!).state;
const SIZES=[{width:320,height:640},{width:844,height:390},{width:1280,height:800}];
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set by each test'));
for(const size of SIZES)for(const kind of ['capture','move'] as const)test(`${size.width} ${kind}: Min/Max edit only the legal draft until Confirm`,async({page},info)=>{
 const f=kind==='capture'?CAPTURE:MOVE;
 await page.setViewportSize(size);await page.clock.install();await page.clock.pauseAt(new Date());
 const raw=serializeVersionedMatch(f.options,f.state.history,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY);
 await page.addInitScript(([key,text])=>{
  localStorage.setItem(key!,text!);Reflect.set(window,'boundsActive',true);Reflect.set(window,'boundsResume',false);
  Reflect.set(window,'MalpacoHost',{isActive:()=>Reflect.get(window,'boundsActive'),requiresResume:()=>Reflect.get(window,'boundsResume'),acknowledgeResume:()=>{if(!Reflect.get(window,'boundsActive'))return false;Reflect.set(window,'boundsResume',false);return true;}});
 },[ROOT,raw]);await visitGame(page,'/');
 if(kind==='move'){
  await page.locator('#start-friendly-move-button').click();
  for(const id of [f.from,f.to]){const country=page.locator(`[data-country="${id}"]`);await country.focus();await country.press('Enter');}
 }
 const prefix=kind==='capture'?'capture':'friendly-move',input=page.locator(`#${prefix}-amount`),min=kind==='capture'?f.state.pendingCapture!.min:1,max=kind==='capture'?f.state.pendingCapture!.max:f.state.armies[f.from]!-1;
 await expect(page.locator(`#${prefix}-min-button`)).toHaveText(/min/i);await expect(page.locator(`#${prefix}-max-button`)).toHaveText(/max/i);
 await page.locator(`#${prefix}-min-button`).click();await expect(input).toHaveValue(String(min));expect(await saved(page)).toEqual(f.state);
 await page.locator(`#${prefix}-more-button`).click();await expect(input).toHaveValue(String(min+1));
 await page.locator(`#${prefix}-max-button`).click();await expect(input).toHaveValue(String(max));expect(await saved(page)).toEqual(f.state);
 await page.locator(`#${prefix}-less-button`).click();await expect(input).toHaveValue(String(max-1));expect(await saved(page)).toEqual(f.state);
 await page.locator(`#${prefix}-max-button`).click();
 await page.evaluate(()=>{Reflect.set(window,'boundsActive',false);Reflect.set(window,'boundsResume',true);window.dispatchEvent(new Event('malpaco:native-background'));});
 await expect(page.locator(`#${prefix}-min-button`)).toBeDisabled();await expect(page.locator(`#${prefix}-max-button`)).toBeDisabled();
 await page.locator(`#${prefix}-min-button`).dispatchEvent('click');await expect(input).toHaveValue(String(max));expect(await saved(page)).toEqual(f.state);
 await page.evaluate(()=>{Reflect.set(window,'boundsActive',true);window.dispatchEvent(new Event('malpaco:native-foreground'));});
 await page.keyboard.press('Escape');await page.locator('#resume-turn-button').click();await page.locator('#open-required-action').click();
 await expect(input).toHaveValue(String(max));
 const amount=size.width===320?min:max;await page.locator(`#${prefix}-${size.width===320?'min':'max'}-button`).click();
 for(const id of [`${prefix}-min-button`,`${prefix}-max-button`,`${prefix}-amount`,`confirm-${kind==='capture'?'capture':'friendly-move'}-button`]){
  const box=(await page.locator('#'+id).boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(size.width);expect(box.y+box.height).toBeLessThanOrEqual(size.height);expect(box.height).toBeGreaterThanOrEqual(44);
 }
 await page.screenshot({path:info.outputPath(`${kind}-${size.width}.png`)});
 const expected=apply(f.state,kind==='capture'?{kind:'captureMove',amount}:{kind:'friendlyMove',from:f.from,to:f.to,amount});if(!expected.ok)throw Error(expected.error);
 await page.locator(`#confirm-${kind==='capture'?'capture':'friendly-move'}-button`).click();expect(await saved(page)).toEqual(expected.state);
});
