import {visitGame} from './shell';
// T89: the 0.2.0 acceptance matrix (docs/plans/release-0.2.0-acceptance.md), A1–A14, by real
// clicks and keys on both supported hosts, with the engine as the independent action oracle:
// every staged choice leaves the saved match exactly as before, and every command adds exactly
// the engine's own next state. The release config runs this same file against the extracted
// artifact, where the legacy views are retired.
// T98 (0.2.1 amendments in the same plan): A1 is the instant start; A2–A5 expect the trimmed
// cards (Fight and Cancel, no odds, no fold) and a card that never reframes the map; A13 retired.
import {expect,test} from '@playwright/test';
import type {Page,TestInfo} from '@playwright/test';
import {activePlayer,attackTargets,computerAction} from '../../src/core';
import type {Action} from '../../src/core';
import {serializeVersionedMatch,deserializeVersionedMatch,REFERENCE_MATCH_IDENTITY} from '../../src/core/match-save';
import {pinned} from '../core/versioned-match-fixture';
import {fixture as cardFixture,input as cardInput,human,selectedNames,TRADE_CASES} from './cards-fixtures';
import {fixture as friendlyFixture} from './friendly-fixture';
import {begin,country,exactly,frontline,load,next,poolLeft,saved,savedText} from './helpers/release';
import {closeSurface,openSurface,reachableInCard,withSurface} from './shell';

const PORTRAIT={width:390,height:844},LANDSCAPE={width:844,height:390};
const MATRIX=[[320,568],[360,640],[390,844],[430,932],[568,320],[640,360],[667,375],[844,390],[932,430],[768,1024],[1024,768],[800,540],[1280,800],[1920,1080],
 [679,800],[680,800],[681,800],[1099,800],[1100,800],[1101,800],[900,319],[900,320],[900,321],[900,499],[900,500],[900,501],[900,599],[900,600],[900,601],[640,240],[640,400],[320,200]].map(([width,height])=>({width:width!,height:height!}));
const shot=(p:Page,info:TestInfo,name:string)=>p.screenshot({path:info.outputPath(`${name}.png`)});
const settle=(p:Page)=>p.clock.runFor(200);
const drawer=(p:Page)=>p.locator('#game-focus-drawer');
const viewBox=(p:Page)=>p.locator('svg[data-camera-zoom]').getAttribute('viewBox');
/** The camera refits a moment after a corner icon comes or goes: the viewBox once it rests. */
async function rested(p:Page){let last:string|null='';await expect.poll(async()=>{const now=await viewBox(p);await p.clock.runFor(100);const same=now===last&&now===await viewBox(p);last=now;return same;}).toBe(true);return last;}
/** The open card's visible controls, by accessible name (assistive-only content excluded). */
const shown=(p:Page)=>drawer(p).evaluate(card=>[...card.querySelectorAll<HTMLElement>('button,input,select')].filter(n=>n.getClientRects().length>0&&!n.closest('.visually-hidden')&&getComputedStyle(n).visibility!=='hidden').map(n=>n.getAttribute('aria-label')||n.textContent!.trim()));
/** Controls the 0.2.0 cards had and the 0.2.1 cards dropped: odds, Fight on, Stop, stop point, previews and the fold button. */
const RETIRED='#battle-odds, #fight-on-button, #stop-battle-button, #battle-stop-threshold, #capture-fold-button, #capture-preview, #capture-range';
const KEY='malpaco:current-game',record=(p:Page)=>p.evaluate(key=>localStorage.getItem(key),KEY);
async function geographic(p:Page,size=PORTRAIT){await begin(p,'/?seed=7&control=manual',size);await p.getByRole('button',{name:'Start game',exact:true}).click();await expect(p.locator('#geographic-map [data-country]')).toHaveCount(46);}
async function reference(p:Page,size=PORTRAIT){await begin(p,'/?view=reference-game&control=manual',size);}
/** The opening of the pinned human-loss replay at its first computer turn after a human one. */
function computerOpener(){
 const f=pinned('human-loss');let s=deserializeVersionedMatch(serializeVersionedMatch(f.options,[],REFERENCE_MATCH_IDENTITY)).state,human=false;
 for(const a of f.actions){s=next(s,a);if(activePlayer(s)?.kind==='human')human=true;else if(human&&s.phase==='reinforce')return {text:serializeVersionedMatch(f.options,s.history,REFERENCE_MATCH_IDENTITY),state:s};}
 throw Error('no computer opener');
}
/** Overlay controls inside the viewport and clear of each other; no sideways scroll; unique ids. */
const audit=(p:Page)=>p.evaluate(()=>{
 const cs=[...document.querySelectorAll<HTMLElement>('.game-overlay button, .game-overlay .hud-chip')].filter(e=>e.getClientRects().length&&!e.closest('#game-focus-drawer')),r=(e:Element)=>e.getBoundingClientRect();
 const outside=cs.filter(e=>{const b=r(e);return b.left<-0.5||b.top<-0.5||b.right>innerWidth+0.5||b.bottom>innerHeight+0.5;}).map(e=>e.id);
 const overlaps:string[]=[];for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){if(cs[i]!.contains(cs[j]!)||cs[j]!.contains(cs[i]!))continue;const a=r(cs[i]!),b=r(cs[j]!);if(a.left<b.right-0.5&&b.left<a.right-0.5&&a.top<b.bottom-0.5&&b.top<a.bottom-0.5)overlaps.push(`${cs[i]!.id}|${cs[j]!.id}`);}
 const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
 return {sideways:document.documentElement.scrollWidth>innerWidth+1,outside,overlaps,dupes:[...new Set(ids.filter((id,k)=>ids.indexOf(id)!==k))]};
});

test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','every size is set here, so one project suffices'));

test('matrix: both hosts fit every acceptance size, seam, zoom and reduced height; nothing acts',async({page})=>{
 test.setTimeout(180_000);
 await geographic(page);const g=await savedText(page);
 for(const size of MATRIX){await page.setViewportSize(size);await settle(page);expect(await audit(page),`geographic ${size.width}×${size.height}`).toEqual({sideways:false,outside:[],overlaps:[],dupes:[]});}
 expect(await savedText(page)).toBe(g);
 await reference(page);await load(page,pinned('pending-capture').text);await expect(page.locator('#confirm-capture-button')).toBeVisible();const r=await savedText(page);
 for(const size of MATRIX){await page.setViewportSize(size);await settle(page);expect(await audit(page),`reference ${size.width}×${size.height}`).toEqual({sideways:false,outside:[],overlaps:[],dupes:[]});
  await openSurface(page,'actions');await reachableInCard(page.locator('#confirm-capture-button'));}
 expect(await savedText(page)).toBe(r);
});

test('A1: explicit Start opens the portrait game: one human and three computers, Help reachable, the record kept',async({page},info)=>{
 // The frozen clock holds the computers still, so the kept record can be compared exactly.
 await begin(page,'/',PORTRAIT);await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
 await expect(page.locator('#geographic-setup, .setup-card form, #geographic-seed, #geographic-seats')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Start game',exact:true})).toHaveCount(0);
 const text=(await record(page))!,kept=deserializeVersionedMatch(text);
 expect(kept.options.seats.map(seat=>seat.kind)).toEqual(['human','computer','computer','computer']);
 expect(kept.options.seed).toBe(Number((await page.locator('.game-identity').textContent())!.match(/Seed (\d+)/)![1]));
 await shot(page,info,'A1-instant-start');
 await openSurface(page,'settings');await expect(page.getByRole('button',{name:'Save game',exact:true})).toHaveCount(0);await expect(page.getByLabel('Load game',{exact:true})).toHaveCount(0);
 await page.locator('#game-help-button').click();await expect(page.getByRole('dialog',{name:'Help & icon names'})).toBeVisible();
 await page.locator('#close-game-help').click();await closeSurface(page).catch(()=>{});expect(await record(page)).toBe(text);
});

test('A2: Place 1 by map and list to zero; stage by map, list and keyboard without acting; the card is Fight and Cancel and leaves the map framed; Fight adds one exchange; stale and paused refused',async({page},info)=>{
 await geographic(page,LANDSCAPE);let s=await saved(page);const {from,to}=frontline(s);
 for(let i=0;await poolLeft(page)>0;i++){
  await expect(page.locator('#placement-pool')).toBeVisible();
  if(i%3===2){await page.locator('#open-countries').click();const row=page.locator('[data-country-row]:not(:disabled)').first();const id=await row.getAttribute('data-country-row');await row.click();await closeSurface(page).catch(()=>{});s=next(s,{kind:'reinforce',province:id!,amount:1});}
  else{await country(page,from).click();s=next(s,{kind:'reinforce',province:from,amount:1});}
 }
 await exactly(page,s);
 await page.locator('#start-combat-button').click();s=next(s,{kind:'endReinforcement'});await exactly(page,s);
 // Staging by map, list and keyboard leaves the match exactly as it was; T97: the card holds Fight and Cancel only (no odds),
 // and it floats over the map: opening it leaves the viewBox as it was.
 await country(page,from).click();const framed=await rested(page);await country(page,to).click();await exactly(page,s);
 await openSurface(page,'actions');expect(await shown(page)).toEqual(['Fight','Cancel','Fold card']);await expect(page.locator(RETIRED)).toHaveCount(0);await expect(page.locator('#single-exchange-button')).toHaveAccessibleName('Fight');
 expect(await viewBox(page),'opening the card reframes the map').toBe(framed);
 await page.locator('#open-countries').click();const target=page.locator(`[data-country-row="${to}"]`);await expect(target).toBeEnabled();await target.click();await closeSurface(page);await exactly(page,s);
 await country(page,to).focus();await page.keyboard.press('Enter');await exactly(page,s);
 await shot(page,info,'A2-staged');
 // A stale Fight control from before a pause, and a paused Fight, do nothing.
 await openSurface(page,'actions');const stale=await page.locator('#single-exchange-button').elementHandle();
 await page.locator('#game-pause-button').click();await stale!.evaluate(n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true})));await exactly(page,s);
 await page.locator('#game-pause-button').click();await openSurface(page,'actions');await page.locator('#single-exchange-button').click();
 s=next(s,{kind:'attack',from,to});await exactly(page,s);
 // Nothing continues on its own; a second press is one more exchange.
 await page.clock.runFor(5000);await exactly(page,s);
 if(s.phase==='attack'&&attackTargets(s,from).includes(to)){await openSurface(page,'actions');await page.locator('#single-exchange-button').click();s=next(s,{kind:'attack',from,to});await exactly(page,s);}
});

test('A2: a legal set trades once and a skip changes nothing but the phase',async({page})=>{
 const row=TRADE_CASES[0],before=cardFixture(row.file);await begin(page,'/?setup',PORTRAIT);await load(page,cardInput(row.file));
 await openSurface(page,'actions');
 await page.getByRole('button',{name:`${row.kind}: ${selectedNames(before.state,row.indices).join(' + ')} — Add ${row.after-row.pool} armies`,exact:true}).first().click();
 await exactly(page,next(before.state,{kind:'tradeCards',handIndices:row.indices}));
 const other=cardFixture(TRADE_CASES[1].file);await load(page,cardInput(TRADE_CASES[1].file));await openSurface(page,'actions');
 await page.getByRole('button',{name:'Skip cards',exact:true}).click();await exactly(page,next(other.state,{kind:'skipCards'}));
});

test('A3: a capture draft survives fold, rotation, history and pause; dashed until one Confirm; short landscape keeps badges on their land',async({page},info)=>{
 await reference(page);const f=pinned('pending-capture');await load(page,f.text);let s=await saved(page);const pending=s.pendingCapture!;
 const draft=String(pending.min===pending.defaultAmount?pending.max:pending.min);
 await openSurface(page,'actions');expect(await shown(page)).toEqual(['Move one fewer army','Armies to move','Move one more army','Confirm move-in','Fold card']);await expect(page.locator(RETIRED)).toHaveCount(0);
 await page.locator('#capture-amount').fill(draft);
 await page.keyboard.press('Escape');await page.locator('#open-required-action').click();
 await page.setViewportSize(LANDSCAPE);await settle(page);await openSurface(page,'details');await closeSurface(page);
 await page.locator('#game-pause-button').click();await openSurface(page,'actions');await expect(page.locator('#capture-amount')).toHaveValue(draft);
 await page.locator('#confirm-capture-button').dispatchEvent('click');await exactly(page,s);
 for(const id of [pending.from,pending.to])expect(await country(page,id).locator('.badge').evaluate(n=>getComputedStyle(n).strokeDasharray)).not.toBe('none');
 await page.setViewportSize({width:640,height:360});await settle(page);await closeSurface(page).catch(()=>{});
 for(const id of [pending.from,pending.to])expect(await country(page,id).evaluate(n=>{const b=n.querySelector('.badge')!.getBoundingClientRect(),c=n.querySelector<SVGGeometryElement>('.cell')!;return c.isPointInFill(new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(c.getScreenCTM()!.inverse()));}),id).toBe(true);
 await shot(page,info,'A3-capture-640x360');
 await page.locator('#game-pause-button').click();await openSurface(page,'actions');await page.locator('#confirm-capture-button').click();
 s=next(s,{kind:'captureMove',amount:Number(draft)});await exactly(page,s);
});

test('A4: a friendly-move draft survives resize; Cancel changes nothing; Move & end turn is one move and the handoff',async({page})=>{
 const f=friendlyFixture();await reference(page,{width:1280,height:800});
 await page.getByLabel('Seed',{exact:true}).fill(String(f.seed));await page.getByLabel('Seats',{exact:true}).selectOption('2');await page.getByRole('button',{name:'Start game',exact:true}).click();
 for(let n=0;n<f.placements;n++)await country(page,f.from).click();await page.locator('#start-combat-button').click();let s=await saved(page);
 await page.locator('#start-friendly-move-button').click();await country(page,f.from).click();await country(page,f.to).click();
 await openSurface(page,'actions');expect(await shown(page)).toEqual(['Move one fewer army','Armies to move','Move one more army','Move and end turn','Cancel · back to attacks','Fold card']);
 await page.locator('#friendly-move-amount').fill('1');
 await page.setViewportSize(LANDSCAPE);await settle(page);await page.setViewportSize(PORTRAIT);await settle(page);await openSurface(page,'actions');
 await expect(page.locator('#friendly-move-amount')).toHaveValue('1');await page.locator('#cancel-friendly-move-button').click();await exactly(page,s);
 await page.locator('#start-friendly-move-button').click();await country(page,f.from).click();await country(page,f.to).click();
 await openSurface(page,'actions');await page.locator('#friendly-move-amount').fill('1');await page.locator('#confirm-friendly-move-button').click();
 s=next(s,{kind:'friendlyMove',from:f.from,to:f.to,amount:1} as Action);await exactly(page,s);
});

test('A5: Raid folds; a list pick stages the target with its preview; one Confirm raids; covered counts reappear',async({page},info)=>{
 const before=cardFixture('T39-legal-pending-raid.json'),target='province_4';await begin(page,'/?setup',PORTRAIT);await load(page,cardInput('T39-legal-pending-raid.json'));
 await expect(page.locator('#game-folded-choice')).toContainText('Raid');await expect(page.locator('#game-focus-drawer')).toBeHidden();
 const counts=()=>page.locator('[data-country] .count').allTextContents();const rest=await counts();
 await page.locator('#open-countries').click();await page.locator(`[data-country-row="${target}"]`).click();
 await expect(page.locator('#game-focus-drawer')).toHaveAttribute('data-surface','actions');await exactly(page,before.state);
 await shot(page,info,'A5-raid');
 await closeSurface(page);expect(await counts()).toEqual(rest);
 await page.locator('#open-required-action').click();expect(await shown(page)).toEqual(['Confirm raid','Fold card']);await expect(page.locator(RETIRED)).toHaveCount(0);
 await page.getByRole('button',{name:'Confirm raid',exact:true}).click();
 await exactly(page,next(before.state,{kind:'raidTarget',province:target}));
});

test('A6: a full hand discards before drawing, discloses nothing first, and the reward is acknowledged once',async({page})=>{
 const before=cardFixture('T37-reshuffle-before-match.json'),viewer=human(before.state),hand=before.state.cards!.hands[viewer]!;
 await begin(page,'/?setup',PORTRAIT);await load(page,cardInput('T37-reshuffle-before-match.json'));
 await page.keyboard.press('Escape');await page.setViewportSize(LANDSCAPE);await page.clock.runFor(5000);await exactly(page,before.state);
 await expect(page.locator('body')).not.toContainText('You drew');
 await openSurface(page,'actions');await page.getByRole('button',{name:`Discard ${hand[0]} (card 1)`,exact:true}).click();
 const after=next(before.state,{kind:'discardCard',handIndex:0});await exactly(page,after);
 await page.clock.runFor(10_000);await exactly(page,after);
 await openSurface(page,'actions');await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('button',{name:'Continue',exact:true})).toHaveCount(0);await exactly(page,after);
});

test('A7: computer play: pause exact, Fast-forward to the human turn, complete history, Changes',async({page})=>{
 // T101: the history is reached through the hidden `?log` link.
 await begin(page,'/?view=reference-game&log',PORTRAIT);const o=computerOpener();await load(page,o.text);
 await expect(page.locator('#fast-forward-button')).toBeVisible();
 await page.locator('#game-pause-button').click();const frozen=await savedText(page);await page.clock.runFor(10_000);expect(await savedText(page)).toBe(frozen);
 await withSurface(page,'settings',()=>page.locator('#game-speed').selectOption('slow'));await page.setViewportSize(LANDSCAPE);
 await page.locator('#game-pause-button').click();await page.locator('#fast-forward-button').click();await page.clock.runFor(60_000);
 let control=deserializeVersionedMatch(frozen).state;const steps=[] as number[];
 const s=await saved(page);expect(activePlayer(s)!.kind).toBe('human');
 // The oracle: computer actions only, from the frozen state to the human turn.
 while(activePlayer(control)?.kind==='computer'&&control.phase!=='human-loss'&&control.phase!=='finished'){control=next(control,computerAction(control)!);steps.push(1);}
 expect(s.history).toEqual(control.history);
 await withSurface(page,'settings',async()=>{await page.locator('#game-log-button').click();await expect(page.locator('dialog.game-event-log .game-event')).toHaveCount(s.history.length+1);await page.keyboard.press('Escape');});
 // T97: the menu's history icon opens at the changes since your last turn, marked.
 await withSurface(page,'settings',()=>page.locator('#game-log-button').click());
 await expect(page.locator('dialog.game-event-log .game-event.since')).toHaveCount(steps.length);
});

test('A8: a tiny region reached by Countries, Inspect and Focus; the tap acts on that region only; pan and repeated keys never act',async({page})=>{
 await geographic(page);let s=await saved(page);const me=activePlayer(s)!.id;
 const own=s.map.provinces.filter(c=>s.ownerOf[c.id]===me).map(c=>c.id);
 const tiny=(await page.locator('#geographic-map [data-country]').evaluateAll((ns,mine)=>ns.filter(n=>mine.includes((n as HTMLElement).dataset['country']!)).map(n=>{const r=n.querySelector('.cell')!.getBoundingClientRect();return {id:(n as HTMLElement).dataset['country']!,a:r.width*r.height};}).sort((x,y)=>x.a-y.a)[0]!.id,own));
 await page.locator('#open-countries').click();await page.getByRole('button',{name:'All',exact:true}).click();
 await page.locator(`[data-key="inspect:${tiny}"]`).click();await page.locator(`[data-key="focus:${tiny}"]`).click();
 await expect.poll(()=>page.locator('svg[data-camera-zoom]').getAttribute('data-camera-zoom').then(Number)).toBeGreaterThan(1);await closeSurface(page);
 // Closing the card reframes the map a moment later: measure only once the view is still.
 await expect.poll(async()=>{const a=await page.locator('svg[data-camera-zoom]').getAttribute('viewBox');await page.clock.runFor(100);return a===await page.locator('svg[data-camera-zoom]').getAttribute('viewBox');}).toBe(true);
 // A tap on the focused region places one army there. If it touches a neighbour too, the game asks
 // which country by name rather than guessing; the named choice is the region.
 const b=(await country(page,tiny).locator('.badge').boundingBox())!;await page.mouse.click(b.x+b.width/2,b.y+b.height/2);
 if(await page.locator('#game-focus-drawer').isVisible()){await expect(page.locator('#game-focus-drawer')).toContainText('Which country?');await page.locator(`[data-country-row="${tiny}"]`).click();}
 s=next(s,{kind:'reinforce',province:tiny,amount:1});await exactly(page,s);
 // A drag pans; it does not place. A held key repeats nothing.
 await page.mouse.move(b.x,b.y);await page.mouse.down();await page.mouse.move(b.x+90,b.y+40,{steps:6});await page.mouse.up();
 await country(page,tiny).evaluate(n=>n.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true})));
 await exactly(page,s);
});

test('A9: above a keyboard and inside safe insets an invalid then valid amount persists, Confirm is reachable, rotation never commits',async({page})=>{
 await reference(page,{width:390,height:422});await load(page,pinned('pending-capture').text);let s=await saved(page);
 await page.evaluate(()=>{for(const [k,v] of Object.entries({top:24,right:44,bottom:34,left:44}))document.documentElement.style.setProperty(`--safe-${k}`,`${v}px`);});
 await openSurface(page,'actions');const amount=page.locator('#capture-amount');await amount.fill('0');
 await page.setViewportSize({width:422,height:390});await settle(page);await openSurface(page,'actions');await expect(amount).toHaveValue('0');
 await page.locator('#confirm-capture-button').click();await exactly(page,s);
 const legal=String(s.pendingCapture!.defaultAmount);await amount.fill(legal);await amount.focus();
 expect(await amount.evaluate(n=>getComputedStyle(n).outlineStyle!=='none'||getComputedStyle(n).boxShadow!=='none')).toBe(true);
 await page.setViewportSize({width:390,height:844});await settle(page);await openSurface(page,'actions');await expect(amount).toHaveValue(legal);await exactly(page,s);
 await reachableInCard(page.locator('#confirm-capture-button'));await page.locator('#confirm-capture-button').click();
 s=next(s,{kind:'captureMove',amount:Number(legal)});await exactly(page,s);
});

test('A10: a load with an overlay open retires old controls; human loss: Watch and a labelled Stop game; result details; new game',async({page},info)=>{
 await geographic(page);await openSurface(page,'details');const stale=await page.locator('#open-countries').elementHandle();
 const loss=pinned('human-loss');await load(page,loss.text);await stale!.evaluate(n=>(n as HTMLElement).click());expect(await savedText(page)).toBe(loss.text);
 await openSurface(page,'actions');await expect(page.locator('#watch-computers-button')).toBeVisible();await expect(page.locator('#stop-game-button .card-icon-caption')).toHaveText('Stop game');
 await page.locator('#result-details-button').click();await expect(page.locator('#victory-details')).toContainText(`Seed${loss.options.seed}`);
 await shot(page,info,'A10-loss');
 await page.locator('#stop-game-button').click();await openSurface(page,'actions');await expect(page.locator('#victory-reason')).toBeVisible();
 await page.locator('#result-standings-button').click();await expect(page.locator('#victory-standings')).toBeVisible();
 await page.locator('#result-new-game-button').click();await expect(page.getByRole('button',{name:'Start game',exact:true})).toBeVisible();
});

test('A11: every country is hit at its own badge, at every seam; overlays take no hits outside themselves',async({page})=>{
 test.setTimeout(120_000);await geographic(page);
 for(const size of [{width:390,height:844},{width:680,height:800},{width:1100,height:800},{width:900,height:500},{width:844,height:390},{width:1280,height:800}]){
  await page.setViewportSize(size);await settle(page);
  const wrong=await page.locator('#geographic-map [data-country]').evaluateAll(ns=>ns.filter(n=>{const b=n.querySelector('.badge')!.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2;
   if(x<0||y<0||x>innerWidth||y>innerHeight)return false;const hit=document.elementFromPoint(x,y);return !!hit&&!hit.closest('.game-overlay button,.game-overlay .hud-chip,.game-notice')&&hit.closest('[data-country]')!==n;}).map(n=>(n as HTMLElement).dataset['country']));
  expect(wrong,`${size.width}×${size.height}`).toEqual([]);
  expect(await audit(page),`${size.width}×${size.height}`).toEqual({sideways:false,outside:[],overlaps:[],dupes:[]});
 }
});

for(const size of [PORTRAIT,LANDSCAPE])test(`A12 (automated part): at phone Fit ${size.width}×${size.height}, every count is at least 14 px and centred on its own country`,async({page},info)=>{
 for(const seed of [7,1994]){
  await begin(page,`/?seed=${seed}&control=manual`,size);await page.getByRole('button',{name:'Start game',exact:true}).click();await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);await settle(page);
  const bad=await page.locator('#geographic-map [data-country]').evaluateAll(ns=>ns.flatMap(n=>{const c=n.querySelector<SVGTextElement>('.count')!,m=c.getScreenCTM()!,px=parseFloat(getComputedStyle(c).fontSize)*Math.hypot(m.a,m.b);
   const b=n.querySelector('.badge')!.getBoundingClientRect(),cell=n.querySelector<SVGGeometryElement>('.cell')!,on=cell.isPointInFill(new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(cell.getScreenCTM()!.inverse()));
   return px>=13.99&&on?[]:[{id:(n as HTMLElement).dataset['country'],px,on}];}));
  expect(bad,`seed ${seed}`).toEqual([]);await shot(page,info,`A12-seed${seed}-${size.width}x${size.height}`);
 }
});

test('A14: the first Fit picks its turn from the bounds and shows every country; rotation keeps focus, selection and drafts; swipe pans only when zoomed',async({page})=>{
 await geographic(page,PORTRAIT);
 const view=()=>page.locator('svg[data-camera-zoom]').evaluate(n=>({zoom:Number((n as SVGElement).dataset['cameraZoom']),rotation:Number((n as SVGElement).dataset['cameraRotation']),box:n.getAttribute('viewBox')}));
 for(const size of [PORTRAIT,LANDSCAPE]){await page.setViewportSize(size);await settle(page);const v=await view();expect([0,90]).toContain(v.rotation);expect(v.zoom).toBe(1);
  const out=await page.locator('#geographic-map [data-country] .badge').evaluateAll(ns=>ns.filter(n=>{const r=n.getBoundingClientRect();return r.right<0||r.bottom<0||r.left>innerWidth||r.top>innerHeight;}).length);expect(out,`${size.width}×${size.height}`).toBe(0);}
 // At Fit a swipe does not pan.
 const fit=await view(),m=(await page.locator('svg[data-camera-zoom]').boundingBox())!;
 await page.mouse.move(m.x+m.width/2,m.y+m.height/2);await page.mouse.down();await page.mouse.move(m.x+m.width/2+120,m.y+m.height/2,{steps:6});await page.mouse.up();expect((await view()).box).toBe(fit.box);
 // Zoomed, a swipe pans; rotating keeps the camera's world focus and a capture draft.
 await reference(page,PORTRAIT);await load(page,pinned('pending-capture').text);await openSurface(page,'actions');
 const pending=(await saved(page)).pendingCapture!,draft=String(pending.min);await page.locator('#capture-amount').fill(draft);await closeSurface(page);
 await page.locator('#map-fit').click();await page.locator('svg[data-camera-zoom]').focus();await page.keyboard.press('+');
 const zoomed=await view();await page.setViewportSize(LANDSCAPE);await settle(page);expect((await view()).zoom).toBeCloseTo(zoomed.zoom,5);
 await openSurface(page,'actions');await expect(page.locator('#capture-amount')).toHaveValue(draft);
});

test('release: the legacy views are retired; their URLs open the main game',{tag:'@release-only'},async({page})=>{
 for(const view of ['generated-game','authored-game','game-setup','generated-prototype']){
  // T116: the main game starts after the explicit entry action, here on the given seed.
  await visitGame(page,`/?view=${view}&seed=7`);await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);await expect(page.locator('.game-identity')).toContainText('Seed 7');
  for(const old of ['#generated-game','#generated-prototype','#game-setup'])await expect(page.locator(old)).toHaveCount(0);
 }
});
