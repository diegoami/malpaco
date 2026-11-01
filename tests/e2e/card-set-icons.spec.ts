import {test,expect} from '@playwright/test';
import {activePlayer,apply,classifyCardSet,deserializeVersionedMatch} from '../../src/core';
import type {Page} from '@playwright/test';
import {input,TRADE_CASES} from './cards-fixtures';
const KEY='malpaco:current-game';
const sizes=[{width:390,height:844},{width:568,height:320},{width:820,height:1180},{width:1280,height:800}];
function example(){
 for(const row of TRADE_CASES){
  const text=input(row.file).trim(),state=deserializeVersionedMatch(text).state,hand=state.cards!.hands[activePlayer(state)!.id]!;
  const choices:{indices:readonly[number,number,number];cards:typeof hand;kind:string}[]=[],seen=new Set<string>();
  for(let i=0;i<hand.length;i++)for(let j=i+1;j<hand.length;j++)for(let k=j+1;k<hand.length;k++){
   const cards=[hand[i]!,hand[j]!,hand[k]!],kind=classifyCardSet(cards),key=[...cards].sort().join('+');
   if(kind&&!seen.has(key)){seen.add(key);choices.push({indices:[i,j,k],cards,kind});}
  }
  if(choices.length>1&&choices.some(c=>c.cards.includes('Wild')))return {text,state,choices};
 }
 throw Error('Expected a retained legal multi-choice hand with wild substitution');
}
async function start(page:Page,mode:string,paused=false){
 const f=example();await page.clock.install();await page.clock.pauseAt(new Date());
 await page.addInitScript(({text,mode,paused})=>{localStorage.setItem('malpaco:current-game',text);localStorage.setItem('malpaco:current-game-meta',JSON.stringify({id:'set-icons',paused}));localStorage.setItem('malpaco:button-labels',mode);},{text:f.text,mode,paused});
 await page.goto('/');await page.locator('#resume-game').click();await expect(page.locator('[data-country]').first()).toBeVisible();await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(3000);return f;
}
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit viewport matrix'));
for(const size of sizes)for(const mode of ['text','icons','auto'])test(`${size.width} ${mode}: three-card icon alternatives match hand choices and commit exactly one set`,async({page})=>{
 await page.setViewportSize(size);const f=await start(page,mode);
 const choices=page.locator('.card-choice-controls button[data-card-set]');await expect(choices).toHaveCount(f.choices.length);
 const names:string[]=[];
 for(const [i,c] of f.choices.entries()){
  const b=choices.nth(i);await b.scrollIntoViewIfNeeded();await expect(b.locator('.card-set-symbol')).toHaveCount(3);
  expect(await b.locator('.card-set-symbol').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-kind')))).toEqual(c.cards);
  for(const icon of await b.locator('.card-set-symbol').all())await expect(icon).toBeVisible();
  await expect(b).toHaveAccessibleName(/—/);names.push((await b.getAttribute('aria-label'))!);await expect(b).toHaveAttribute('title',names[i]!);
  const r=(await b.boundingBox())!;expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(size.height);expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(size.width);
  expect(await b.textContent()).not.toMatch(/armies|any value|reduction/i);
 }
 await page.locator('#open-hand').click();
 const handChoices=page.locator('#hand-dialog .hand-plays button');await expect(handChoices).toHaveCount(f.choices.length);
 for(const [i,c] of f.choices.entries()){
  expect(await handChoices.nth(i).locator('.card-set-symbol').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-kind')))).toEqual(c.cards);
  await expect(handChoices.nth(i)).toHaveAccessibleName('Play '+names[i]);
 }
 await page.locator('#close-hand').click();await page.locator('#open-required-action').click();
 const before=await page.evaluate(k=>localStorage.getItem(k),KEY);expect(before).toBe(f.text);
 await page.screenshot({path:`artifacts/T163/choices-${size.width}-${mode}.png`});
 await choices.first().focus();await expect(choices.first()).toBeFocused();await page.keyboard.press('Enter');
 const expected=apply(f.state,{kind:'tradeCards',handIndices:f.choices[0]!.indices});if(!expected.ok)throw Error(expected.error);
 await expect.poll(async()=>deserializeVersionedMatch((await page.evaluate(k=>localStorage.getItem(k),KEY))!).state).toEqual(expected.state);
});
test('Skip preserves cards; paused hand choices are blocked',async({page})=>{
 const f=await start(page,'text',true);await page.locator('#open-hand').click();
 for(const b of await page.locator('#hand-dialog .hand-plays button').all())await expect(b).toBeDisabled();
 expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(f.text);
 await page.locator('#close-hand').click();await page.locator('#resume-turn-button').click();
 if(!await page.getByRole('button',{name:'Skip cards',exact:true}).isVisible())await page.locator('#open-required-action').click();
 await page.getByRole('button',{name:'Skip cards',exact:true}).click();
 const expected=apply(f.state,{kind:'skipCards'});if(!expected.ok)throw Error(expected.error);
 await expect.poll(async()=>deserializeVersionedMatch((await page.evaluate(k=>localStorage.getItem(k),KEY))!).state).toEqual(expected.state);
});
