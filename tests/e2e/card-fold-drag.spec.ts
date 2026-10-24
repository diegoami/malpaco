import {cardLabel} from '../../src/ui/cardLabels';
// T101 (owner, 2026-10-22): every floating card folds to a chip and drags (pointer and touch), its
// place kept for later cards and after a reload; a tap on its buttons never drags, and a map tap
// outside a folded or dragged card reaches the map. The game history is off the player's screen
// and comes back only with `?log`. Checked at a portrait and a landscape phone and a laptop.
import {expect,test} from '@playwright/test';
import type {Locator,Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {fixture as battle,step} from './battle-fixture';
import {fixture as friendly} from './friendly-fixture';
import {fixture as cardFixture,input,human} from './cards-fixtures';
import {pinned} from '../core/versioned-match-fixture';
import {saveVia,visitGame} from './shell';

const SIZES=[{width:390,height:844},{width:844,height:390},{width:1280,height:800}] as const;
const KEY='malpaco:card-position';
const drawer=(p:Page)=>p.locator('#game-focus-drawer');
const chip=(p:Page)=>p.locator('#unfold-card');
const grip=(p:Page)=>p.locator('#game-focus-drawer .card-grip');
const country=(p:Page,id:string)=>p.locator(`[data-country="${id}"]`);
const shots=(name:string,p:Page)=>{if(p.viewportSize()!.width!==390)return;mkdirSync('artifacts/T101',{recursive:true});return p.screenshot({path:`artifacts/T101/${name}-390x844.png`});};
const box=async(l:Locator)=>(await l.boundingBox())!;

/** The save button's Blob lands in `foldSave`, so the saved match is read without a download. */
async function begin(p:Page){
 await p.clock.install({time:new Date('2026-10-22T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-22T12:00:00Z'));
 await p.addInitScript(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'foldSave',blob);return create(blob as Blob);};});
}
const saved=(p:Page)=>saveVia(p,'foldSave');
/** Nine Isles, two human seats, manual; the turn's notice is dismissed so it covers no country. */
async function nineIsles(p:Page,seed:number,placements:number,from:string){
 await p.goto('/?view=reference-game&control=manual');
 await p.getByLabel('Seed',{exact:true}).fill(String(seed));await p.getByLabel('Seats',{exact:true}).selectOption('2');await p.getByRole('button',{name:'Start game',exact:true}).click();
 for(let n=0;n<placements;n++)await country(p,from).press('Enter');await p.locator('#start-combat-button').click();
 const dismiss=p.locator('#dismiss-notice');if(await dismiss.isVisible())await dismiss.click();
}
async function load(p:Page,text:string,path='/?setup'){
 await p.goto(path);
 const previous=await p.getByLabel('Load game',{exact:true}).elementHandle();
 await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'match.json',mimeType:'application/json',buffer:Buffer.from(text)});
 await expect.poll(()=>previous!.evaluate(n=>n.isConnected)).toBe(false);await expect(p.locator('[data-country]').first()).toBeVisible();
}

/** Fold to a chip that keeps the card's title, unfold from the chip; the saved match is unchanged. */
async function foldCycle(p:Page,control:Locator,title:RegExp,name?:string){
 await expect(drawer(p)).toBeVisible();await expect(control).toBeVisible();
 const before=await saved(p);await expect(control).toBeVisible();
 const open=await box(drawer(p));
 await p.locator('#fold-card').click();
 await expect(chip(p)).toBeVisible();await expect(chip(p)).toHaveText(title);await expect(chip(p)).toBeFocused();
 await expect(control).toBeHidden();await expect(drawer(p)).toHaveAttribute('data-folded','true');
 const folded=await box(drawer(p));expect(folded.height,'a chip, not a card').toBeLessThan(Math.min(open.height,90));
 const vp=p.viewportSize()!;expect(folded.x>=0&&folded.y>=0&&folded.x+folded.width<=vp.width+1&&folded.y+folded.height<=vp.height+1).toBe(true);
 if(name)await shots(name,p);
 await chip(p).click();await expect(chip(p)).toBeHidden();await expect(control).toBeVisible();await expect(drawer(p)).toHaveAttribute('data-folded','false');
 expect(await saved(p),'folding never changes the game').toBe(before);
}
/** Drags from the grip by (dx, dy) with the mouse. */
async function mouseDrag(p:Page,dx:number,dy:number){
 const g=await box(grip(p)),x=g.x+g.width/2,y=g.y+g.height/2;
 await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx/2,y+dy/2,{steps:4});await p.mouse.move(x+dx,y+dy,{steps:4});await p.mouse.up();
}
const inside=async(p:Page)=>{const b=await box(drawer(p)),vp=p.viewportSize()!;return b.x>=-0.5&&b.y>=-0.5&&b.x+b.width<=vp.width+0.5&&b.y+b.height<=vp.height+0.5;};
const kept=(p:Page)=>p.evaluate(k=>localStorage.getItem(k),KEY);

test.beforeEach(({},info)=>{test.skip(info.project.name!=='1280x800','the sizes are set per test');});

for(const size of SIZES)test.describe(`${size.width}×${size.height}`,()=>{
 test.use({viewport:size});

 test('attack, capture and friendly move cards fold to a chip and unfold; the game is unchanged',async({page})=>{
  test.setTimeout(150_000);await begin(page);
  const f=battle('capture');await nineIsles(page,f.seed,f.placements,f.from);
  await country(page,f.from).press('Enter');await country(page,f.to).press('Enter');
  await foldCycle(page,page.locator('#single-exchange-button'),/^Attack · .+ → .+$/,'folded-chip');
  let state=f.ready;
  for(let n=0;n<128&&state.phase==='attack';n++){await page.locator('#single-exchange-button').click();state=step(state,{kind:'attack',from:f.from,to:f.to});await expect(page.getByRole('region',{name:'Battle controls',exact:true})).toHaveAttribute('data-history-count',String(state.history.length));}
  expect(state.phase).toBe('capture');
  await foldCycle(page,page.locator('#confirm-capture-button'),/^Confirm capture move-in$/);
  const m=friendly();await nineIsles(page,m.seed,m.placements,m.from);
  await page.locator('#start-friendly-move-button').click();await country(page,m.from).press('Enter');await country(page,m.to).press('Enter');
  await foldCycle(page,page.locator('#confirm-friendly-move-button'),/^Choose a friendly move$/);
 });

 test('sets, discard, reward, Raid and result cards fold to a chip and unfold; the game is unchanged',async({page})=>{
  test.setTimeout(150_000);await begin(page);
  await load(page,input('T38-legal-Surge-before.json'));
  await foldCycle(page,page.getByRole('button',{name:'Skip cards',exact:true}),/^Choose or skip cards$/);
  const full=cardFixture('T37-reshuffle-before-match.json'),hand=full.state.cards!.hands[human(full.state)]!;
  await load(page,input('T37-reshuffle-before-match.json'));
  const discard=page.getByRole('button',{name:`Discard ${cardLabel(hand[0]!)} (card 1)`,exact:true});
  await foldCycle(page,discard,/^Discard a card to continue$/);
  await discard.click();
  await foldCycle(page,page.getByRole('button',{name:'Continue',exact:true}),/^Card draw notice$/);
  const raid=cardFixture('T39-legal-pending-raid.json');await load(page,input('T39-legal-pending-raid.json'));
  const target=raid.state.map.provinces.find(c=>raid.state.ownerOf[c.id]!==human(raid.state))!.id;
  await country(page,target).press('Enter');
  await foldCycle(page,page.getByRole('button',{name:'Confirm army reduction',exact:true}),/^Confirm army reduction$/);
  await load(page,pinned('domination').text,'/?view=reference-game');
  await foldCycle(page,page.locator('#result-new-game-button'),/^View game result$/);
 });

 test('a card drags by mouse inside the viewport, keeps its place for the next card and after a reload; a tap on a button never drags',async({page})=>{
  test.setTimeout(120_000);await begin(page);
  const full=cardFixture('T37-reshuffle-before-match.json'),hand=full.state.cards!.hands[human(full.state)]!;
  await load(page,input('T37-reshuffle-before-match.json'));await expect(drawer(page)).toBeVisible();
  const corner=await box(drawer(page)),vp=page.viewportSize()!;
  // Towards the middle of the screen.
  const dx=Math.round(vp.width/2-(corner.x+corner.width/2)),dy=Math.round(vp.height/2-(corner.y+corner.height/2));
  await mouseDrag(page,dx,dy);
  const moved=await box(drawer(page));
  expect(Math.abs(moved.x-(corner.x+dx))).toBeLessThanOrEqual(2);expect(Math.abs(moved.y-(corner.y+dy))).toBeLessThanOrEqual(2);
  expect(await inside(page)).toBe(true);await expect(drawer(page)).toHaveAttribute('data-moved','true');
  expect(JSON.parse((await kept(page))!)).toEqual({x:Math.round(moved.x),y:Math.round(moved.y)});
  await shots('dragged-card',page);
  // A press on Discard that wanders 3 px is a tap: the card stays, the discard happens, and the next card opens in the same place.
  const button=await box(page.getByRole('button',{name:`Discard ${cardLabel(hand[0]!)} (card 1)`,exact:true}));
  await page.mouse.move(button.x+button.width/2,button.y+button.height/2);await page.mouse.down();await page.mouse.move(button.x+button.width/2+3,button.y+button.height/2+2);await page.mouse.up();
  await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeVisible();
  const next=await box(drawer(page));expect([Math.round(next.x),Math.round(next.y)]).toEqual([Math.round(moved.x),Math.round(moved.y)]);
  // After a reload the kept place is used again.
  await load(page,input('T37-reshuffle-before-match.json'));await expect(drawer(page)).toBeVisible();
  const reloaded=await box(drawer(page));expect([Math.round(reloaded.x),Math.round(reloaded.y)]).toEqual([Math.round(moved.x),Math.round(moved.y)]);
  // Dragged far past the edge, it stays inside the safe viewport.
  await mouseDrag(page,5000,5000);expect(await inside(page)).toBe(true);
  await mouseDrag(page,-9000,-9000);expect(await inside(page)).toBe(true);
  const top=await box(drawer(page));expect(top.x).toBeLessThanOrEqual(1);expect(top.y).toBeLessThanOrEqual(1);
  // A double-tap on the grip puts it back in its corner and forgets the place.
  await grip(page).click();await grip(page).click();
  await expect(drawer(page)).not.toHaveAttribute('data-moved','true');expect(await kept(page)).toBeNull();
  const back=await box(drawer(page));expect([Math.round(back.x),Math.round(back.y)]).toEqual([Math.round(corner.x),Math.round(corner.y)]);
 });

 test('a map tap outside a folded or dragged card reaches the map',async({page})=>{
  test.setTimeout(120_000);await begin(page);
  const f=battle('capture');await nineIsles(page,f.seed,f.placements,f.from);
  await page.evaluate(()=>{Reflect.set(window,'mapTaps',[]);document.querySelector('.board')!.addEventListener('click',e=>(Reflect.get(window,'mapTaps') as string[]).push((e.target as Element).closest('[data-country]')?.getAttribute('data-country')??'sea'));});
  const taps=()=>page.evaluate(()=>Reflect.get(window,'mapTaps') as string[]);
  await country(page,f.from).click();await country(page,f.to).click();await expect(drawer(page)).toBeVisible();
  await page.locator('#fold-card').click();await expect(chip(page)).toBeVisible();
  // Just outside the chip's left edge is the map, not an invisible card.
  const c=await box(chip(page)),d=await box(drawer(page));
  expect(await page.evaluate(([x,y])=>!document.elementFromPoint(x!,y!)?.closest('#game-focus-drawer'),[d.x-4,c.y+c.height/2])).toBe(true);
  // A tap on the source (the card never covers it) reaches the map: the pair returns to its source alone.
  const before=(await taps()).length;
  await country(page,f.from).click();expect((await taps()).slice(before)).toEqual([f.from]);
  await expect(country(page,f.to)).not.toHaveClass(/\btarget\b/);await expect(country(page,f.from)).toHaveAttribute('data-selected','true');
  // Stage again, unfold, drag the card away: the next tap still reaches the map.
  await country(page,f.to).click();await expect(drawer(page)).toBeVisible();
  if(await chip(page).isVisible())await chip(page).click();
  // Away from the source: to the other half of the screen.
  const vp=page.viewportSize()!,src=await box(country(page,f.from)),card=await box(drawer(page));
  const toX=src.x+src.width/2<vp.width/2?vp.width-card.width-8:8,toY=src.y+src.height/2<vp.height/2?vp.height-card.height-8:8;
  await mouseDrag(page,Math.round(toX-card.x),Math.round(toY-card.y));await expect(drawer(page)).toHaveAttribute('data-moved','true');
  const later=(await taps()).length;
  await country(page,f.from).click();expect((await taps()).slice(later)).toEqual([f.from]);
  await expect(country(page,f.to)).not.toHaveClass(/\btarget\b/);
 });

 test('the game history is off the player screen: no icon in the menu, the notices or the result card; ?log brings it back',async({page})=>{
  test.setTimeout(150_000);await begin(page);
  const runToHuman=async()=>{for(let n=0;n<600;n++){if(await page.locator('.panel').getAttribute('data-computer-active')==='false')return;await page.clock.runFor(150);}throw Error('the computers did not hand back');};
  for(const log of [false,true]){
   await visitGame(page,`/?seed=7${log?'&log':''}`);await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46);
   await runToHuman();await expect(page.locator('#turn-guidance-title')).toHaveText('Your turn');
   // On your turn the notice holds only its dismiss icon; the Changes action is ?log only.
   await expect(page.locator('#open-changes')).toHaveCount(log?1:0);
   await page.locator('#open-game-menu').click();await expect(drawer(page)).toHaveAttribute('data-surface','menu');
   await expect(page.locator('#game-log-button')).toHaveCount(log?1:0);
   await expect(drawer(page).getByRole('button',{name:/history|event log/i})).toHaveCount(log?1:0);
   if(log){
    await page.locator('#game-log-button').click();const dialog=page.locator('dialog.game-event-log');await expect(dialog).toBeVisible();
    await expect(dialog.locator('.game-event')).not.toHaveCount(0);await expect(dialog).toContainText('Orange');await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
    await page.locator('#open-changes').click();await expect(dialog).toBeVisible();await expect(dialog.locator('.game-event.since')).not.toHaveCount(0);await page.keyboard.press('Escape');
   }else await page.keyboard.press('Escape');
   // The result card.
   await load(page,pinned('domination').text,`/?view=reference-game${log?'&log':''}`);
   await expect(page.locator('#result-new-game-button')).toBeVisible();
   await expect(page.locator('#result-history-button')).toHaveCount(log?1:0);
   if(log){await page.locator('#result-history-button').click();await page.locator('#game-log-button').click();await expect(page.locator('dialog.game-event-log')).toBeVisible();await page.keyboard.press('Escape');}
  }
 });
});

test.describe('touch',()=>{
 for(const size of SIZES)test(`${size.width}×${size.height}: a card drags by touch from its grip; a tap on its button does not drag`,async({browser})=>{
  test.setTimeout(120_000);
  const context=await browser.newContext({viewport:size,hasTouch:true,isMobile:false});const page=await context.newPage();
  try{
   await begin(page);
   const full=cardFixture('T37-reshuffle-before-match.json'),hand=full.state.cards!.hands[human(full.state)]!;
   await load(page,input('T37-reshuffle-before-match.json'));await expect(drawer(page)).toBeVisible();
   const corner=await box(drawer(page)),g=await box(grip(page)),x=g.x+g.width/2,y=g.y+g.height/2;
   const dx=-Math.round(Math.min(120,corner.x)),dy=-Math.round(Math.min(150,corner.y));
   const cdp=await context.newCDPSession(page);
   const touch=(type:'touchStart'|'touchMove'|'touchEnd',px:number,py:number)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:px,y:py}]});
   // A finger's pace: 16 ms a step, then it rests before lifting (no fling).
   await touch('touchStart',x,y);for(let i=1;i<=8;i++){await touch('touchMove',x+dx*i/8,y+dy*i/8);await page.waitForTimeout(16);}
   await page.waitForTimeout(150);await touch('touchMove',x+dx,y+dy);await page.waitForTimeout(50);await touch('touchEnd',x+dx,y+dy);
   const moved=await box(drawer(page));
   expect(Math.abs(moved.x-(corner.x+dx))).toBeLessThanOrEqual(2);expect(Math.abs(moved.y-(corner.y+dy))).toBeLessThanOrEqual(2);
   expect(await inside(page)).toBe(true);expect(await kept(page)).not.toBeNull();
   // A tap on a card button acts and never moves the card.
   await page.getByRole('button',{name:`Discard ${cardLabel(hand[0]!)} (card 1)`,exact:true}).tap();
   await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeVisible();
   const after=await box(drawer(page));expect([Math.round(after.x),Math.round(after.y)]).toEqual([Math.round(moved.x),Math.round(moved.y)]);
  }finally{await context.close();}
 });
});
