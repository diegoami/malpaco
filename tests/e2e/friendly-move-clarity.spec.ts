import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {activePlayer,apply,neighbours,deserializeVersionedMatch,serializeVersionedMatch} from '../../src/core';
import type {Action,GameState} from '../../src/core';
import {reserveFixture} from '../helpers/reserve-fixtures';
import {visitGame} from './shell';
const KEY='malpaco:current-game';
const step=(state:GameState,action:Action)=>{const r=apply(state,action);if(!r.ok)throw Error(r.error);return r.state;};
const enemyBorder=(s:GameState,id:string)=>neighbours(s.map.provinces.find(p=>p.id===id)!).some(n=>s.ownerOf[n]!==s.ownerOf[id]);
type Kind='mixed'|'same-interior'|'same-frontier'|'one-way'|'no-default';
const cache=new Map<Kind,{text:string;state:GameState;from:string;to:string}>();
/** Reallocate the last real placement pool through legal actions; never edit a saved state. */
function example(kind:Kind){
 const prior=cache.get(kind);if(prior)return prior;
 for(const size of [46,72,96]){
  const f=reserveFixture(size),history=f.state.history;
  for(let cut=history.length-1;cut>=0;cut--){
   if(history[cut]!.kind!=='endReinforcement')continue;
   let placementStart=cut;while(placementStart>0&&history[placementStart-1]!.kind==='reinforce')placementStart--;
   const initial=deserializeVersionedMatch(serializeVersionedMatch(f.options,history.slice(0,placementStart),f.identity)).state;
   if(initial.phase!=='reinforce'||activePlayer(initial)?.kind!=='human')continue;
   const own=activePlayer(initial)!.id;
   for(const a of initial.map.provinces.filter(p=>initial.ownerOf[p.id]===own))for(const b of neighbours(a)){
    if(initial.ownerOf[b]!==own)continue;
    const different=enemyBorder(initial,a.id)!==enemyBorder(initial,b);
    if(kind.startsWith('same')?different:!different)continue;
    if(kind==='same-interior'&&enemyBorder(initial,a.id)||kind==='same-frontier'&&!enemyBorder(initial,a.id))continue;
    const from=different?(enemyBorder(initial,a.id)?b:a.id):a.id,to=from===a.id?b:a.id;
    if(kind==='one-way'&&initial.armies[to]!==1||kind==='no-default'&&initial.armies[from]!==1)continue;
    let s=initial;
    const required=kind==='one-way'?[from]:kind==='no-default'?[to]:[from,to];
    if(required.reduce((sum,id)=>sum+Math.max(0,2-s.armies[id]!),0)>s.reinforcementPool)continue;
    for(const id of required)if(s.armies[id]!<2)s=step(s,{kind:'reinforce',province:id,amount:1});
    if(s.reinforcementPool)s=step(s,{kind:'reinforce',province:kind==='no-default'?to:from,amount:s.reinforcementPool});
    s=step(s,{kind:'endReinforcement'});
    const result={text:serializeVersionedMatch(f.options,s.history,f.identity),state:s,from,to};cache.set(kind,result);return result;
   }
  }
 }
 throw Error(`No legal ${kind} move fixture`);
}
async function start(page:Page,kind:Kind,mode='text'){
 const f=example(kind);await page.clock.install();await page.clock.pauseAt(new Date());
 await page.addInitScript(({text,mode,eventAck})=>{localStorage.setItem('malpaco:current-game',text);localStorage.setItem('malpaco:current-game-meta',JSON.stringify({id:'directed-move',paused:false,eventAck,eventMarksCleared:eventAck}));localStorage.setItem('malpaco:button-labels',mode);},{text:f.text,mode,eventAck:f.state.events?.sequence??0});
 await visitGame(page,'/');await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(100);return f;
}
const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
async function begin(page:Page,id:string){
 if(await country(page,id).getAttribute('aria-pressed')!=='true')await country(page,id).press('Shift+Enter');
 await page.locator('#province-move-button:visible, #province-action-button[data-kind="move"]:visible').click();
}
async function direction(page:Page,s:GameState,from:string,to:string){
 await expect(page.locator('#friendly-move-from')).toHaveText(`${s.map.provinces.find(p=>p.id===from)!.name} · ${s.armies[from]}`);
 await expect(page.locator('#friendly-move-to')).toHaveText(`${s.map.provinces.find(p=>p.id===to)!.name} · ${s.armies[to]}`);
 await expect(page.locator('.friendly-move-preview')).toHaveAttribute('data-from',from);
 await expect(page.locator('.friendly-move-preview')).toHaveAttribute('data-to',to);
 await expect(page.locator('#friendly-move-amount')).toHaveAttribute('max',String(s.armies[from]!-1));
}
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit viewport matrix'));
for(const size of [{width:390,height:844},{width:568,height:320},{width:820,height:1180},{width:1280,height:800}])for(const mode of ['text','icons','auto'])test(`${size.width} ${mode}: no empty Move window; interior → border default, explicit Swap and exact transfer`,async({page})=>{
 await page.setViewportSize(size);const f=await start(page,'mixed',mode);
 // Start at the frontier deliberately: the first chosen pair should orient toward it.
 await begin(page,f.to);
 await expect(page.locator('#game-focus-drawer')).toBeHidden();
 await expect(page.getByRole('button',{name:'Cancel move',exact:true})).toBeVisible();
 await expect(page.locator('#phase-announcement')).toBeHidden();
 expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(f.text);
 await country(page,f.from).press('Shift+Enter');await direction(page,f.state,f.from,f.to);
 const swap=page.getByRole('button',{name:'Swap move direction',exact:true});await expect(swap).toBeEnabled();await swap.click();
 await direction(page,f.state,f.to,f.from);
 expect(await page.locator('#friendly-move-amount').inputValue()).toBe(String(f.state.armies[f.to]!-1));
 await swap.click();await direction(page,f.state,f.from,f.to);
 await page.locator('#friendly-move-amount').fill('1');await page.clock.runFor(34);
 await page.screenshot({path:`artifacts/T164/before-geometry-${size.width}-${mode}.png`});
 const drawer=(await page.locator('#game-focus-drawer').boundingBox())!;
 for(const id of [f.from,f.to])for(const part of ['.count','.badge']){
  const box=(await country(page,id).locator(part).boundingBox())!;
  expect(box.x+box.width<=drawer.x||box.x>=drawer.x+drawer.width||box.y+box.height<=drawer.y||box.y>=drawer.y+drawer.height,JSON.stringify({message:'move card leaves both army counts clear',drawer,box,id})).toBe(true);
 }
 for(const button of await page.locator('.friendly-move-controls button:visible').all()){
  await button.scrollIntoViewIfNeeded();const b=(await button.boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(size.width);expect(b.y+b.height).toBeLessThanOrEqual(size.height);
 }
 await page.locator('#confirm-friendly-move-button').scrollIntoViewIfNeeded();
 for(const id of ['friendly-move-from','friendly-move-to']){const b=(await page.locator('#'+id).boundingBox())!;expect(b.y).toBeGreaterThanOrEqual(0);expect(b.y+b.height).toBeLessThanOrEqual(size.height);await expect(page.locator('#'+id)).toBeInViewport({ratio:1});}
 await page.screenshot({path:`artifacts/T164/move-${size.width}-${mode}.png`});
 expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(f.text);
 await page.locator('#confirm-friendly-move-button').click();
 await expect.poll(async()=>deserializeVersionedMatch((await page.evaluate(k=>localStorage.getItem(k),KEY))!).state).toEqual(step(f.state,{kind:'friendlyMove',from:f.from,to:f.to,amount:1}));
});
for(const kind of ['same-interior','same-frontier'] as const)test(`${kind}: tap order, pair/pre-pair cancellation and Escape preserve match bytes`,async({page})=>{
 const f=await start(page,kind);await begin(page,f.to);await country(page,f.from).press('Shift+Enter');await direction(page,f.state,f.to,f.from);
 await page.locator('#cancel-friendly-move-button').click();await expect(page.locator('#game-focus-drawer')).toBeHidden();await expect(page.locator('.friendly-move-preview')).toHaveCount(0);
 await begin(page,f.from);await country(page,f.to).press('Shift+Enter');await page.keyboard.press('Escape');await expect(page.locator('.friendly-move-preview')).toHaveCount(0);
 await begin(page,f.from);await page.getByRole('button',{name:'Cancel move',exact:true}).click();await expect(page.locator('#game-focus-drawer')).toBeHidden();
 expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(f.text);
});
test('interior first stays interior → border, and a one-army destination cannot be swapped into an illegal source',async({page})=>{
 const f=await start(page,'one-way');await begin(page,f.from);await country(page,f.to).press('Shift+Enter');await direction(page,f.state,f.from,f.to);
 await expect(page.getByRole('button',{name:'Swap move direction',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Swap move direction',exact:true})).toBeDisabled();
 expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(f.text);
});

test('a legal frontier → interior pair is retained when the interior cannot supply armies',async({page})=>{
 const f=await start(page,'no-default');await begin(page,f.to);await country(page,f.from).press('Shift+Enter');await direction(page,f.state,f.to,f.from);
 await expect(page.getByRole('button',{name:'Swap move direction',exact:true})).toBeDisabled();expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(f.text);
});
