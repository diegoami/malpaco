// T83 (A5, A6, E): card choices on the full-viewport map at phone portrait and landscape,
// tablet and desktop. Real legal sets are reachable; Raid targets come from the map or the
// Countries list with the card folded to its strip; the full-hand discard discloses no draw;
// each choice acts once, pause holds it, and covered badges stay beneath the card.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeVersionedMatch} from '../../src/core';
import type {GameState,LoadedVersionedMatch} from '../../src/core';
import {fixture,input,human,next,publicKinds,selectedNames,TRADE_CASES} from './cards-fixtures';
import {closeSurface,openSurface,reachableInCard,withSurface} from './shell';

const VIEWPORTS=[
 {name:'phone portrait',width:390,height:844},
 {name:'phone landscape',width:844,height:390},
 {name:'tablet',width:820,height:1180},
 {name:'desktop',width:1280,height:800},
] as const;
const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
const cards=(p:Page)=>p.getByRole('region',{name:'Cards',exact:true});
const drawer=(p:Page)=>p.locator('#game-focus-drawer');

async function begin(page:Page){await page.clock.install({time:new Date('2026-10-18T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));await page.goto('/?setup');}
async function load(page:Page,file:string){const previous=await page.getByLabel('Load game',{exact:true}).elementHandle();await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'cards.json',mimeType:'application/json',buffer:Buffer.from(input(file))});await expect.poll(()=>previous!.evaluate(el=>el.isConnected)).toBe(false);await expect(page.locator('[data-country]')).toHaveCount(46);}
async function saved(page:Page){return withSurface(page,'settings',async()=>{const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save game',exact:true}).click();return deserializeVersionedMatch(readFileSync((await(await download).path())!,'utf8'));});}
async function exact(page:Page,state:GameState){const actual=(await saved(page)).state;expect(actual.history).toEqual(state.history);expect(actual.rng).toEqual(state.rng);expect(actual.armies).toEqual(state.armies);expect(actual.cards).toEqual(state.cards);}
/** Two synchronous clicks on one control: a single action at most (the second is stale). */
async function doubleClick(page:Page,name:string){await page.getByRole('button',{name,exact:true}).evaluate(n=>{n.dispatchEvent(new MouseEvent('click',{bubbles:true}));n.dispatchEvent(new MouseEvent('click',{bubbles:true}));});}
async function counts(page:Page){return page.locator('[data-country]').evaluateAll(ns=>Object.fromEntries(ns.map(n=>[n.getAttribute('data-country'),n.querySelector('.count')!.textContent])));}
/**
 * Badges under the open card lie beneath it (the card wins the hit test); the same counts reappear
 * on close (E). The camera usually frames the map beside the card, so few or none are covered.
 */
async function badgesBeneath(page:Page,state:GameState){
 const before=await counts(page);
 await openSurface(page,'actions');await expect(drawer(page)).toBeVisible();
 const covered=await page.locator('[data-country]').evaluateAll(ns=>{
  const d=document.getElementById('game-focus-drawer')!.getBoundingClientRect();
  return ns.flatMap(n=>{const b=n.querySelector('.count')!.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2;
   if(x<d.left||x>d.right||y<d.top||y>d.bottom||x<0||y<0||x>innerWidth||y>innerHeight)return [];
   return [{id:n.getAttribute('data-country'),beneath:!!document.elementFromPoint(x,y)?.closest('#game-focus-drawer')}];});
 });
 for(const c of covered)expect(c.beneath,`${c.id} badge lies beneath the card`).toBe(true);
 await closeSurface(page);
 expect(await counts(page)).toEqual(before);
 for(const [id,n] of Object.entries(before))expect(n).toBe(String(state.armies[id]));
}

for(const v of VIEWPORTS)test.describe(v.name,()=>{
 test.use({viewport:{width:v.width,height:v.height}});
 test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','the viewport is set here, so one project suffices'));

 test('legal sets and Skip are reachable; a set trades once; pause and Escape cannot bypass the choice',async({page},info)=>{
  await begin(page);const row=TRADE_CASES[0],before=fixture(row.file),action={kind:'tradeCards' as const,handIndices:row.indices},after=next(before.state,action);
  await load(page,row.file);
  const label=`${row.kind}: ${selectedNames(before.state,row.indices).join(' + ')} — Add ${row.after-row.pool} armies`,offered=cards(page).getByRole('button',{name:label,exact:true}).first();
  await openSurface(page,'actions');await reachableInCard(offered);await reachableInCard(cards(page).getByRole('button',{name:'Skip cards',exact:true}));await page.screenshot({path:info.outputPath(`sets-${v.width}x${v.height}.png`)});
  await badgesBeneath(page,before.state);
  // Escape folds the choice; it is not complete, and its strip returns to it.
  await openSurface(page,'actions');await page.keyboard.press('Escape');await expect(page.locator('#game-folded-choice')).toContainText('Choose or skip cards');await exact(page,before.state);
  // Paused, the set does nothing.
  await page.locator('#game-pause-button').click();await openSurface(page,'actions');await offered.dispatchEvent('click');await exact(page,before.state);
  await page.locator('#game-pause-button').click();await openSurface(page,'actions');
  await doubleClick(page,label);await exact(page,after);
 });

 test('Raid folds to its strip; a map tap or a Countries-list choice stages the target; Confirm acts once',async({page},info)=>{
  await begin(page);const before=fixture('T39-legal-pending-raid.json'),target='province_4',after=next(before.state,{kind:'raidTarget',province:target}),name=before.state.map.provinces.find(p=>p.id===target)!.name;
  for(const via of ['map','list'] as const){
   await load(page,'T39-legal-pending-raid.json');
   await expect(page.locator('#game-folded-choice')).toContainText('Raid · choose an enemy country');await expect(drawer(page)).toBeHidden();
   // T97: the strip speaks for itself; the notice is the turn's own line.
   await expect(page.locator('.game-notice-title')).toHaveText('Your turn · choose a Raid target');
   if(via==='map')await country(page,target).click();
   else{await page.locator('#open-countries').click();await expect(drawer(page)).toHaveAttribute('data-surface','countries');const row=page.locator(`[data-country-row="${target}"]`);await expect(row).toHaveAttribute('aria-label',new RegExp(`^Raid target: ${name}`));await reachableInCard(row);await row.click();}
   await expect(drawer(page)).toHaveAttribute('data-surface','actions');await expect(cards(page)).toContainText(name);await exact(page,before.state);
   await reachableInCard(cards(page).getByRole('button',{name:'Confirm raid',exact:true}));await page.screenshot({path:info.outputPath(`raid-${via}-${v.width}x${v.height}.png`)});
   // Paused, Confirm does nothing.
   await page.locator('#game-pause-button').click();await openSurface(page,'actions');await cards(page).getByRole('button',{name:'Confirm raid',exact:true}).dispatchEvent('click');await exact(page,before.state);
   await page.locator('#game-pause-button').click();await openSurface(page,'actions');
   await doubleClick(page,'Confirm raid');await exact(page,after);
  }
 });

 test('a full hand discards before drawing, disclosing nothing; the reward acknowledges once',async({page},info)=>{
  await begin(page);const before=fixture('T37-reshuffle-before-match.json'),viewer=human(before.state),hand=before.state.cards!.hands[viewer]!,after=next(before.state,{kind:'discardCard',handIndex:2});
  const drawn=after.cards!.hands[viewer]!.at(-1)!,loaded:LoadedVersionedMatch=before;
  await load(page,'T37-reshuffle-before-match.json');await openSurface(page,'actions');
  const choices=hand.map((kind,i)=>cards(page).getByRole('button',{name:`Discard ${kind} (card ${i+1})`,exact:true}));
  for(const c of choices)await reachableInCard(c);
  await page.screenshot({path:info.outputPath(`full-hand-${v.width}x${v.height}.png`)});
  await expect(cards(page)).toContainText('before drawing');await expect(page.locator('body')).not.toContainText('You drew');
  // The coming draw is neither shown nor in the page, unless it is already own or public.
  if(!hand.includes(drawn)&&!publicKinds(loaded).has(drawn))expect(await page.locator('body').textContent()).not.toMatch(new RegExp(String.raw`\b${drawn}\b`));
  expect(await page.locator('body').innerHTML()).not.toContain(JSON.stringify(before.state.cards!.drawPile));
  await badgesBeneath(page,before.state);
  await openSurface(page,'actions');await doubleClick(page,`Discard ${hand[2]} (card 3)`);await exact(page,after);
  const more=cards(page).getByRole('button',{name:'Continue',exact:true});await openSurface(page,'actions');await reachableInCard(more);
  // Paused, Continue holds; then one acknowledgment, no engine action.
  await page.locator('#game-pause-button').click();await openSurface(page,'actions');await more.dispatchEvent('click');await expect(more).toBeVisible();
  await page.locator('#game-pause-button').click();await openSurface(page,'actions');
  await doubleClick(page,'Continue');await expect(page.getByRole('button',{name:'Continue',exact:true})).toHaveCount(0);await exact(page,after);
 });
});
