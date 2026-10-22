// T97 (owner, #240 and #244): bare-minimum cards that float over the full-size map. Each card holds
// only its controls, opening one never reframes the map, a card moves aside from the countries in
// play, the history card closes by ×, Escape or a swipe, computer turns show no controls, and the
// seats are named by colour. Checked at a portrait and a landscape phone, a tablet and a laptop.
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {fixture as battle,map,step} from './battle-fixture';
import {fixture as friendly,step as move} from './friendly-fixture';
import {fixture as cardFixture,input,human,next} from './cards-fixtures';
import type {GameState} from '../../src/core';

const SIZES=[{width:390,height:844},{width:844,height:390},{width:820,height:1180},{width:1280,height:800}] as const;
const drawer=(p:Page)=>p.locator('#game-focus-drawer');
const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
const viewBox=(p:Page)=>p.locator('.battle-reference > .board > svg').getAttribute('viewBox');
/** The camera refits a frame after a corner icon (the pool) comes or goes; wait until it rests. */
async function settled(p:Page){let last='';await expect.poll(async()=>{const now=await viewBox(p)??'';const same=now===last;last=now;return same;},{intervals:[50,50,100,100]}).toBe(true);return last;}
const shots=(name:string,p:Page)=>{if(p.viewportSize()!.width!==390)return;mkdirSync('artifacts/T97',{recursive:true});return p.screenshot({path:`artifacts/T97/${name}-390x844.png`});};

/** The controls the open card shows, by accessible name; assistive-only content is not shown. */
function shown(p:Page){
 return drawer(p).evaluate(card=>[...card.querySelectorAll<HTMLElement>('button,input,select')].filter(n=>n.getClientRects().length>0&&!n.closest('.visually-hidden')&&getComputedStyle(n).visibility!=='hidden').map(n=>n.getAttribute('aria-label')||n.textContent!.trim()));
}
/** The open card's text outside its controls, as shown on screen (assistive-only text excluded). */
function prose(p:Page){
 return drawer(p).evaluate(card=>{const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT),parts:string[]=[];
  for(let node=walker.nextNode();node;node=walker.nextNode()){const el=node.parentElement!;if(el.closest('.visually-hidden, button, [hidden], h2')||!el.getClientRects().length||!node.textContent!.trim())continue;parts.push(node.textContent!.trim());}
  return parts.join(' ');});
}
/** Every control on screen is at least a 44 px target. */
async function targets(p:Page){
 const small=await p.evaluate(()=>[...document.querySelectorAll<HTMLElement>('button,input,select')].filter(n=>n.getClientRects().length>0&&!n.closest('.visually-hidden, .game-store')).map(n=>({n:n.getAttribute('aria-label')||n.textContent!.trim(),r:n.getBoundingClientRect()})).filter(x=>x.r.width<43.5||x.r.height<43.5).map(x=>`${x.n} ${x.r.width}×${x.r.height}`));
 expect(small,'controls under 44 px').toEqual([]);
}
/** The open card covers no badge (shape or count) of the given countries. */
async function clear(p:Page,ids:readonly string[]){
 const hits=await p.evaluate(ids=>{const card=document.querySelector('#game-focus-drawer')!.getBoundingClientRect();
  return ids.flatMap(id=>[...document.querySelectorAll(`[data-country="${CSS.escape(id)}"] :is(.badge, .army-count)`)].map(n=>n.getBoundingClientRect()).filter(r=>r.width>0&&r.left<card.right&&r.right>card.left&&r.top<card.bottom&&r.bottom>card.top).map(()=>id));},ids);
 expect(hits,'the card covers a badge of the countries in play').toEqual([]);
}
/** Closing the card (Escape folds it) and reopening it from its strip leaves the map's viewBox as it is. */
async function steady(p:Page,before:string|null){
 expect(await viewBox(p),'opening the card reframes the map').toBe(before);
 await p.keyboard.press('Escape');await expect(drawer(p)).toBeHidden();expect(await viewBox(p)).toBe(before);
 await p.locator('#open-required-action').click();await expect(drawer(p)).toBeVisible();expect(await viewBox(p)).toBe(before);
}
async function paint(p:Page,s:GameState){for(const c of map.provinces)await expect(country(p,c.id)).toHaveAttribute('data-armies',String(s.armies[c.id]));}
async function history(p:Page,count:number){await expect(p.getByRole('region',{name:'Battle controls',exact:true})).toHaveAttribute('data-history-count',String(count));}
/** Nine Isles, two human seats, manual: every action is a click the engine oracle replays. */
async function nineIsles(p:Page,seed:number,placements:number,from:string){
 await p.clock.install();await p.clock.pauseAt(new Date());await p.goto('/?view=reference-game&control=manual');
 await p.getByLabel('Seed',{exact:true}).fill(String(seed));await p.getByLabel('Seats',{exact:true}).selectOption('2');await p.getByRole('button',{name:'Start game',exact:true}).click();
 for(let n=0;n<placements;n++)await country(p,from).click();await p.locator('#start-combat-button').click();
}
async function cardsGame(p:Page,file:string){
 await p.clock.install({time:new Date('2026-10-18T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));await p.goto('/?setup');
 const previous=await p.getByLabel('Load game',{exact:true}).elementHandle();
 await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'cards.json',mimeType:'application/json',buffer:Buffer.from(input(file))});
 await expect.poll(()=>previous!.evaluate(n=>n.isConnected)).toBe(false);await expect(p.locator('[data-country]')).toHaveCount(46);
}

test.beforeEach(({},info)=>{test.skip(info.project.name!=='1280x800','the sizes are set per test');});

for(const size of SIZES)test.describe(`${size.width}×${size.height}`,()=>{
 test.use({viewport:size});

 test('attack and capture: Fight and Cancel only, one exchange per Fight, then −, amount, + and Confirm, never over the pair',async({page})=>{
  test.setTimeout(120_000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const f=battle('capture');await nineIsles(page,f.seed,f.placements,f.from);
  await country(page,f.from).click();const before=await settled(page);await country(page,f.to).click();
  await expect(drawer(page)).toBeVisible();await expect(drawer(page)).toHaveAttribute('data-surface','actions');
  expect(await shown(page)).toEqual(['Fight','Cancel']);expect(await prose(page),'no pair line, odds or settings').toBe('');await clear(page,[f.from,f.to]);await targets(page);await shots('attack-card',page);await steady(page,before);
  await expect(page.locator('#game-info-button, [data-icon="info"]:visible')).toHaveCount(0);
  // Each press is exactly one engine exchange; nothing continues on its own.
  let state=f.ready;
  for(let n=0;n<128&&state.phase==='attack';n++){
   await page.locator('#single-exchange-button').click();state=step(state,{kind:'attack',from:f.from,to:f.to});
   await history(page,state.history.length);await paint(page,state);await page.clock.runFor(3000);await history(page,state.history.length);
   if(state.phase==='attack'){expect(await shown(page)).toEqual(['Fight','Cancel']);await clear(page,[f.from,f.to]);}
  }
  expect(state.phase).toBe('capture');expect(await viewBox(page)).toBe(before);
  expect(await shown(page)).toEqual(['Move one fewer army','Armies to move','Move one more army','Confirm move-in']);
  await expect(drawer(page).locator('#capture-preview, #capture-range, #capture-fold-button, #fight-on-button, #stop-battle-button, #battle-odds, #battle-stop-threshold')).toHaveCount(0);
  expect(await prose(page),'no preview or range text').toBe('');await clear(page,[f.from,f.to]);await targets(page);await shots('capture-card',page);await steady(page,before);
  await page.locator('#capture-less-button').click();const amount=Number(await page.locator('#capture-amount').inputValue());expect(amount).toBe(state.pendingCapture!.defaultAmount-1);
  await page.locator('#confirm-capture-button').click();state=step(state,{kind:'captureMove',amount});await paint(page,state);
  expect(errors).toEqual([]);
 });

 test('friendly move: Cancel until a pair, then −, amount, +, Confirm and Cancel, never over the pair',async({page})=>{
  const f=friendly();await nineIsles(page,f.seed,f.placements,f.from);
  const before=await settled(page);await page.locator('#start-friendly-move-button').click();
  await expect(drawer(page)).toBeVisible();expect(await viewBox(page)).toBe(before);expect(await shown(page)).toEqual(['Cancel · back to attacks']);
  // Choosing the source brings the camera's Focus icon (a corner icon); the pair itself reframes nothing.
  await country(page,f.from).click();const chosen=await settled(page);await country(page,f.to).click();expect(await viewBox(page)).toBe(chosen);
  expect(await shown(page)).toEqual(['Move one fewer army','Armies to move','Move one more army','Move and end turn','Cancel · back to attacks']);
  expect(await prose(page),'no preview or range text').toBe('');
  await clear(page,[f.from,f.to]);await targets(page);
  await page.locator('#confirm-friendly-move-button').click();const after=move(f.ready,{kind:'friendlyMove',from:f.from,to:f.to,amount:f.ready.armies[f.from]!-1});await paint(page,after);
 });

 test('card choices hold only their buttons: sets and Skip, a card each to discard, Continue, and the Raid strip then Confirm',async({page})=>{
  test.setTimeout(120_000);
  // Sets: a button per legal set, plus Skip.
  await cardsGame(page,'T38-legal-Surge-before.json');await expect(drawer(page)).toBeVisible();
  const names=await shown(page);expect(names.at(-1)).toBe('Skip cards');expect(names.length).toBeGreaterThan(1);for(const name of names.slice(0,-1))expect(name).toMatch(/^(Anchor|Compass|Lantern|Surge|Raid): .+ — /);
  // The hand and the public counts are for assistive technology only.
  expect(await drawer(page).locator('.card-public-counts, [aria-label="Your hand"]').evaluateAll(ns=>ns.map(n=>n.classList.contains('visually-hidden')))).toEqual([true,true]);
  expect(await prose(page),'no long sentences').toBe('');await targets(page);await shots('sets-card',page);await steady(page,await settled(page));
  // Discard: one button per card, then the reward's Continue.
  const full=cardFixture('T37-reshuffle-before-match.json');await cardsGame(page,'T37-reshuffle-before-match.json');await expect(drawer(page)).toBeVisible();
  const hand=full.state.cards!.hands[human(full.state)]!;expect(await shown(page)).toEqual(hand.map((kind,i)=>`Discard ${kind} (card ${i+1})`));expect(await prose(page)).toBe('');
  await targets(page);await steady(page,await settled(page));
  await page.getByRole('button',{name:`Discard ${hand[0]} (card 1)`,exact:true}).click();
  await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeVisible();expect(await shown(page)).toEqual(['Continue']);await targets(page);await steady(page,await settled(page));
  // Raid: its strip while a target is chosen, then Confirm alone.
  const raid=cardFixture('T39-legal-pending-raid.json');await cardsGame(page,'T39-legal-pending-raid.json');
  await expect(page.locator('#game-folded-choice')).toBeVisible();await expect(drawer(page)).toBeHidden();
  const target=raid.state.map.provinces.find(c=>raid.state.ownerOf[c.id]!==human(raid.state))!.id;const before=await settled(page);
  await country(page,target).click();await expect(drawer(page)).toBeVisible();expect(await viewBox(page)).toBe(before);
  expect(await shown(page)).toEqual(['Confirm raid']);expect(await prose(page)).toBe('');await clear(page,[target]);await targets(page);
  await page.getByRole('button',{name:'Confirm raid',exact:true}).click();
  const done=next(raid.state,{kind:'raidTarget',province:target});await expect(country(page,target)).toHaveAttribute('data-armies',String(done.armies[target]));
 });

 test('the menu, the Countries list and the history: no reframing, 44 px targets, history closes by ×, Escape and a swipe',async({page})=>{
  // The clock holds the computers still, so only the cards could move the map.
  await page.clock.install();await page.clock.pauseAt(new Date());
  await page.goto('/?seed=7');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
  await expect(page.locator('#game-info-button')).toHaveCount(0);
  const before=await settled(page);
  await page.locator('#open-game-menu').click();await expect(drawer(page)).toHaveAttribute('data-surface','menu');expect(await viewBox(page)).toBe(before);
  expect(await shown(page)).toEqual(['Game speed','Help & icon names','New game','Game event log','Scoreboard','Return to map']);
  await expect(drawer(page).locator('.score, .log-card, #panel-detail, .card-public-counts')).toHaveCount(0);
  await targets(page);await shots('menu',page);
  const icon=page.locator('#game-log-button'),box=(await icon.boundingBox())!;const help=(await page.locator('#game-help-button').boundingBox())!;
  expect(box.width*box.height,'the history is the smaller icon').toBeLessThan(help.width*help.height);
  const log=page.locator('dialog.game-event-log');
  await icon.click();await expect(log).toBeVisible();await targets(page);await shots('history',page);
  await log.getByRole('button',{name:'Close game event log',exact:true}).click();await expect(log).toBeHidden();
  await page.locator('#open-game-menu').click();await page.locator('#game-log-button').click();await expect(log).toBeVisible();
  await page.keyboard.press('Escape');await expect(log).toBeHidden();
  await page.locator('#open-game-menu').click();await page.locator('#game-log-button').click();await expect(log).toBeVisible();
  const r=(await log.boundingBox())!,y=r.y+Math.min(r.height-10,90);
  await page.mouse.move(r.x+r.width/2,y);await page.mouse.down();await page.mouse.move(r.x+r.width/2+40,y);await page.mouse.move(r.x+r.width/2+140,y,{steps:4});await page.mouse.up();
  await expect(log).toBeHidden();
  // The Countries list opens only from its icon, and it floats too.
  await expect(drawer(page)).toBeHidden();await page.locator('#open-countries').click();await expect(drawer(page)).toHaveAttribute('data-surface','countries');expect(await viewBox(page)).toBe(before);
 });
});

test.describe('computer turns',()=>{
 for(const size of SIZES)test(`${size.width}×${size.height}: no controls while a computer plays, and the seats read You, Orange, Green and Purple`,async({page})=>{
  test.setTimeout(150_000);await page.setViewportSize(size);
  await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-22T12:00:00Z'));
  await page.goto('/?seed=7&files');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
  const notice=page.locator('#active-seat-notice .game-notice-title'),seen=new Set<string>();
  /** While a computer seat plays, only the corner icons and the notice (Fast-forward, ×) are on screen. */
  const quiet=async()=>{
   const extra=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('button,input,select')].filter(n=>n.getClientRects().length>0&&!n.closest('.visually-hidden, .game-store, #game-status, .game-corner-end, .map-camera-controls, #active-seat-notice')).map(n=>n.id||n.getAttribute('aria-label')||n.textContent));
   expect(extra,'controls on screen during a computer turn').toEqual([]);await expect(page.locator('#game-focus-drawer')).toBeHidden();
  };
  /** Your turn: the pool, a card choice, or End turn is up. */
  const mine=page.locator('#placement-pool:visible, #end-turn-button:visible, #game-focus-drawer:visible');
  const computerTurn=async()=>{for(let n=0;n<400;n++){const title=await notice.textContent().catch(()=>null);const m=title?.match(/^(\w+) · /);if(m&&m[1]!=='Your'){seen.add(m[1]!);await quiet();}else if(await mine.count())return;await page.clock.runFor(400);}};
  const humanTurn=async()=>{
   await expect(mine.first()).toBeVisible();
   const reward=page.getByRole('button',{name:'Continue',exact:true});if(await reward.isVisible()){await reward.click();return;}
   const skip=page.getByRole('button',{name:'Skip cards',exact:true});if(await skip.isVisible())await skip.click();
   const pool=page.locator('#placement-pool-count');
   if(await pool.isVisible()){
    // A country of yours that nothing floats over (the notice floats over the map too).
    const own=await page.locator('[data-country][aria-label*=", You, "]').evaluateAll(ns=>ns.find(n=>{const r=n.querySelector('.cell')!.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit&&n.contains(hit);})?.getAttribute('data-country'));
    for(let n=Number(await pool.textContent());n>0;n--)await country(page,own!).click();await page.locator('#start-combat-button').click();}
   await page.locator('#end-turn-button').click();
  };
  if(!await mine.count())await computerTurn();
  if(size.width===390)await shots('your-turn',page);
  for(let round=0;round<3&&(round===0||seen.size<3);round++){await humanTurn();await page.clock.runFor(400);if(size.width===390&&round===0)await shots('computer-turn',page);await computerTurn();}
  expect([...seen].sort()).toEqual(['Green','Orange','Purple']);
  // The history and the map's names read the same, never Seat N.
  await page.locator('#open-game-menu').click();await page.locator('#game-log-button').click();const log=page.locator('dialog.game-event-log');
  const text=await log.textContent()??'';for(const name of ['You','Orange','Green','Purple'])expect(text).toContain(` · ${name} · `);expect(text).not.toMatch(/Seat \d/);await page.keyboard.press('Escape');
  expect(await page.locator('[data-country]').evaluateAll(ns=>ns.map(n=>n.getAttribute('aria-label')).filter(l=>/Seat \d/.test(l??'')))).toEqual([]);
  // The result standings: giving up shows the seats as they stand.
  await page.locator('#open-game-menu').click();await page.getByRole('button',{name:'New game',exact:true}).click();await page.locator('#give-up-confirm').click();
  await expect(page.locator('#give-up-standings tbody th')).toHaveCount(4);expect((await page.locator('#give-up-standings tbody th').allTextContents()).sort()).toEqual(['Green','Orange','Purple','You']);
 });

 test('the result card names the computers by colour',async({page})=>{
  await cardsGame(page,'T40-human-loss-450.json');await expect(drawer(page)).toBeVisible();
  await page.locator('#result-standings-button').click();
  expect((await page.locator('#victory-standings tbody th').allTextContents()).sort()).toEqual(['Green','Orange','Purple','You']);
  await expect(page.locator('#victory-standings tbody')).not.toContainText(/Seat \d/);
 });
});
