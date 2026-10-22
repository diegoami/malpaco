import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {activePlayer,apply,defaultOptions,victoryRules} from '../../src/core';
import type {Action,GameState} from '../../src/core';
import {createGeographicGame} from '../../src/core/geographic-game';
import {deserializeVersionedMatch,GEOGRAPHIC_MATCH_IDENTITY,GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY,REFERENCE_MATCH_IDENTITY,serializeVersionedMatch} from '../../src/core/match-save';
import {openSurface,withSurface} from './shell';

async function save(page:Page){const pending=page.waitForEvent('download');await withSurface(page,'settings',()=>page.getByRole('button',{name:'Save game',exact:true}).click());return readFileSync((await(await pending).path())!,'utf8');}
async function start(page:Page,reference=false,manual=false){await page.goto(`/?generator=1&seed=1994&setup${reference?'&view=reference-game':''}${manual?'&control=manual':''}`);await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator(reference?'#reference-map':'#geographic-map')).toBeVisible();}
function reinforce(state:GameState,id:string){const result=apply(state,{kind:'reinforce',province:id,amount:1});if(!result.ok)throw Error(result.error);return result.state;}

test('active geographic Enter and Space each place an army',async({page})=>{
 const options={...defaultOptions(),seed:1994,seats:[{kind:'human' as const},{kind:'human' as const}],computerStrengths:[]};
 const game=createGeographicGame(options,victoryRules(options));if(!game.ok)throw Error(game.errors.join('; '));
 await start(page,false,true);let expected=game.state;
 const id=expected.map.provinces.find(p=>expected.ownerOf[p.id]===activePlayer(expected)!.id)!.id;
 for(const key of ['Enter','Space']){
  const before=expected.armies[id]!;await page.locator(`#geographic-map [data-country="${id}"]`).focus();await page.keyboard.press(key);
  expected=reinforce(expected,id);expect(expected.armies[id]).toBe(before+1);
  await expect(page.locator(`#geographic-map [data-country="${id}"]`)).toHaveAttribute('data-armies',String(before+1));
  expect(deserializeVersionedMatch(await save(page)).state).toEqual(expected);
 }
});

test('explicit reference rejects geographic v2 with correct guidance and preserves usable live match',async({page})=>{
 const options={...defaultOptions(),seed:1994,seats:[{kind:'human' as const},{kind:'human' as const}],computerStrengths:[]};
 const geographic=serializeVersionedMatch(options,[],GEOGRAPHIC_MATCH_IDENTITY);
 // This is a valid geographic v2 file, not a corrupted-load rejection fixture.
 expect(deserializeVersionedMatch(geographic).identity).toEqual(GEOGRAPHIC_MATCH_IDENTITY);
 await start(page,true,true);let before=deserializeVersionedMatch(await save(page)).state;
 const id=before.map.provinces.find(p=>before.ownerOf[p.id]===activePlayer(before)!.id)!.id;
 await page.locator(`#reference-map [data-country="${id}"]`).click();before=reinforce(before,id);
 const saved=await save(page),map=await page.locator('#reference-map').elementHandle();
 await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'geographic-v2.json',mimeType:'application/json',buffer:Buffer.from(geographic)});
 await openSurface(page,'settings');await expect(page.getByRole('alert')).toContainText('This game uses a generated map');
 await openSurface(page,'settings');await expect(page.getByRole('alert')).toContainText('main game screen');
 expect(await map!.evaluate(n=>n.isConnected)).toBe(true);await expect(page.locator('#geographic-map')).toHaveCount(0);
 expect(await save(page)).toBe(saved);
 await page.locator(`#reference-map [data-country="${id}"]`).click();expect(deserializeVersionedMatch(await save(page)).state).toEqual(reinforce(before,id));
});

async function shell(page:Page,reference:boolean){
 await start(page,reference);await expect(page.getByTestId('player-army-total')).toHaveCount(4);
 const loaded=deserializeVersionedMatch(await save(page));let state=loaded.state;
 expect(loaded.identity).toEqual(reference?REFERENCE_MATCH_IDENTITY:GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY);expect(state.rules.cards).toBe(reference?undefined:'raid-v1');
 // The normal card setup may still be at a computer's empty-hand cards phase;
 // the fixed human may already have recorded its synchronous no-set skip.
 if(state.phase==='cards'){expect(reference).toBe(false);expect(state.cards!.hands[activePlayer(state)!.id]).toEqual([]);const skipped=apply(state,{kind:'skipCards'});if(!skipped.ok)throw Error(skipped.error);state=skipped.state;}
 expect(state.phase).toBe('reinforce');
 const id=state.map.provinces.find(p=>state.ownerOf[p.id]===activePlayer(state)!.id)!.id;
 const actions:Action[]=[...state.history,{kind:'reinforce',province:id,amount:state.reinforcementPool},{kind:'endReinforcement'}];
 const text=serializeVersionedMatch(loaded.options,actions,loaded.identity);
 expect(deserializeVersionedMatch(text).state.phase).toBe('attack');
 const old=await page.getByLabel('Load game',{exact:true}).elementHandle();
 await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'attack.json',mimeType:'application/json',buffer:Buffer.from(text)});
 await expect.poll(()=>old!.evaluate(n=>n.isConnected)).toBe(false);
 return page.locator(reference?'#reference-game':'#geographic-game').evaluate(root=>{
  const style=(selector:string)=>getComputedStyle(root.querySelector(selector)!);
  const panel=root.querySelector('.panel')!.getBoundingClientRect(),p=style('.panel'),score=style('.score'),row=style('.score-row'),card=style('.panel .card'),log=style('.log-card'),legend=style('.legend'),steps=style('.steps li'),value=style('.step-value');
  return {panelWidth:panel.width,panelHeight:panel.height,panelGap:p.gap,scoreGap:score.gap,scorePadding:score.padding,rowPadding:row.padding,rowGap:row.gap,cardPadding:card.padding,logMinHeight:log.minHeight,legendMargin:legend.marginTop,legendFont:legend.fontSize,stepColumns:steps.gridTemplateColumns,stepGap:steps.gap,valueWhiteSpace:value.whiteSpace,valueOverflow:value.overflow,valueWrap:value.overflowWrap};
 });
}
test('default four-seat geographic shell shares reference responsive layout',async({page},info)=>{
 await page.clock.install({time:new Date('2026-10-18T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));
 const reference=await shell(page,true),geographic=await shell(page,false);
 console.log(JSON.stringify({kind:'responsive-shell',viewport:info.project.name,reference,geographic}));expect(geographic).toEqual(reference);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
