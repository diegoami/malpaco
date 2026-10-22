import {expect,test} from '@playwright/test';
import type {Page,TestInfo} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeVersionedMatch} from '../../src/core';

// T80: the camera is presentation only. Every check compares the exact saved match
// before and after, and a positive control shows the same input would have acted.
const fixture=(host:string,name:string)=>readFileSync(`fixtures/new-game/T71/fixtures/${host}-${name}.json`,'utf8');
// A human attack turn with an empty hand: selecting a source changes no core state.
const attack=(host:string)=>readFileSync(`fixtures/new-game/issue180/preflight/fixtures/${host==='reference'?'T39-legal-pending-raid':'geographic-raid-pending-one-human'}-attack-empty.json`,'utf8');
const map=(p:Page)=>p.locator('svg[data-camera-zoom]');
const sizes=[[320,568],[568,320],[768,1024],[1024,768],[1280,800]] as const;

async function begin(p:Page,width=1280,height=800){
 await p.setViewportSize({width,height});
 // Pause a second after install: pausing at the install time itself races the running clock.
 await p.clock.install({time:new Date('2026-10-19T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-19T12:00:01Z'));
 await p.goto('/?setup');await p.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'cameraSave',blob);return create(blob);};});
}
async function drawer(p:Page,open:boolean){
 const d=p.locator('#game-focus-drawer');
 if(open&&!await d.isVisible())await p.locator('#open-game-menu').click();
 if(!open&&await d.isVisible())await p.locator('#close-game-drawer').click();
 await expect(d).toBeVisible({visible:open});
 await stable(p);
}
async function load(p:Page,text:string){
 const input=p.getByLabel('Load game',{exact:true});
 if(await p.locator('#battle-action-rail').count()&&!await input.isVisible())await drawer(p,true);
 const old=await input.elementHandle();await input.setInputFiles({name:'camera.json',mimeType:'application/json',buffer:Buffer.from(text)});
 // A generated board prepares its drawing in a worker first.
 await expect.poll(()=>old!.evaluate(e=>e.isConnected),{timeout:30_000}).toBe(false);await expect(p.locator('[data-country]')).toHaveCount(46);
 // Let any computer seats finish so the human's turn is the stable starting point.
 await p.clock.runFor(120_000);
}
/** Exact saved match; the drawer it needs is closed again so the camera returns to the full board. */
async function save(p:Page){
 const button=p.getByRole('button',{name:'Save game',exact:true});
 const opened=!await button.isVisible();if(opened)await drawer(p,true);
 await button.click();const text=await p.evaluate(()=>(Reflect.get(window,'cameraSave') as Blob).text());
 if(opened)await drawer(p,false);
 return deserializeVersionedMatch(text).state;
}
/** The shell has no panels to collapse (T79); close any requested card so the board is at rest. */
async function collapse(p:Page){
 await drawer(p,false);
 await expect(p.locator('.panel')).toBeHidden();
}
const viewBox=(p:Page)=>map(p).getAttribute('viewBox');
/** After a layout change, wait until the camera has re-measured: two reads apart give the same viewBox. */
async function stable(p:Page){
 let last:string|null='';
 await expect.poll(async()=>{const now=await viewBox(p),same=now===last;last=now;return same;},{intervals:[100,200,200,400]}).toBe(true);
}
async function settle(p:Page){await p.clock.runFor(100);}
/** Screen centre of a country's cell, or null unless it is drawn well inside the map (40 px margin). */
async function centre(p:Page,id:string){
 return p.locator(`[data-country="${id}"] .cell`).evaluate((cell,id)=>{
  const r=cell.getBoundingClientRect(),m=cell.closest('svg')!.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
  const hit=document.elementFromPoint(x,y)?.closest('[data-country]');
  return x>m.left+40&&x<m.right-40&&y>m.top+40&&y<m.bottom-40&&hit?.getAttribute('data-country')===id?[x,y] as const:null;
 },id);
}
/** A country whose own centre pixel hits it, so a tap there is unambiguous. */
async function tappable(p:Page,ids:string[]){for(const id of ids){const c=await centre(p,id);if(c)return {id,at:c};}throw Error('no tappable country');}
async function shot(p:Page,info:TestInfo,name:string){await p.screenshot({path:info.outputPath(name+'.png')});}

test.beforeEach(({},info)=>{test.skip(info.project.name!=='1280x800','sizes are set per test');});

for(const host of ['reference','geographic']){
 test(`${host}: Fit shows the whole archipelago, turned in portrait, labels upright (A14)`,async({page},info)=>{
  await begin(page);await load(page,fixture(host,'reinforcement'));await collapse(page);
  for(const [width,height] of sizes){
   await page.setViewportSize({width,height});await settle(page);
   await expect(map(page)).toHaveAttribute('data-camera-rotation',width<height?'90':'0');
   await expect(map(page)).toHaveAttribute('data-camera-zoom','1');
   const report=await map(page).evaluate(svg=>{
    const m=svg.getBoundingClientRect(),cells=[...svg.querySelectorAll('[data-country] .cell')].map(c=>c.getBoundingClientRect());
    const tilted=[...svg.querySelectorAll('[data-country] .count')].filter(t=>{const c=(t as SVGGraphicsElement).getScreenCTM()!;return Math.abs(c.b)>1e-6||c.a<=0;}).length;
    return {inside:cells.every(r=>r.left>=m.left-0.5&&r.right<=m.right+0.5&&r.top>=m.top-0.5&&r.bottom<=m.bottom+0.5),cells:cells.length,tilted};
   });
   expect(report).toEqual({inside:true,cells:46,tilted:0});
   await shot(page,info,`${host}-fit-${width}x${height}`);
  }
 });

 test(`${host}: drag, swipe and wheel never place an army; a tap still does`,async({page})=>{
  await begin(page);await load(page,fixture(host,'reinforcement'));await collapse(page);
  const before=await save(page),own=Object.keys(before.ownerOf).filter(id=>before.ownerOf[id]===before.players[before.currentPlayer]!.id);
  const {at}=await tappable(page,own),fit=await viewBox(page);
  // Swipe at Fit: starts and ends on the same country, yet neither pans nor places.
  await page.mouse.move(at[0],at[1]);await page.mouse.down();await page.mouse.move(at[0]+30,at[1]+20,{steps:5});await page.mouse.move(at[0]+2,at[1]+1,{steps:5});await page.mouse.up();
  expect(await viewBox(page)).toBe(fit);expect(await save(page)).toEqual(before);
  // Zoomed: the same drag pans the board, still without placing.
  // T92: at Fit only Fit rests on the map; the keyboard zooms, and then Zoom in and out appear.
  await expect(page.locator('#map-zoom-in')).toBeHidden();await expect(page.locator('#map-fit')).toBeVisible();
  await page.locator('[data-country]').first().focus();await page.keyboard.press('+');await expect(map(page)).toHaveAttribute('data-camera-zoom','1.5');
  await expect(page.locator('#map-zoom-in')).toBeVisible();await expect(page.locator('#map-zoom-out')).toBeVisible();
  const zoomed=await tappable(page,own),panned=await viewBox(page);
  await page.mouse.move(zoomed.at[0],zoomed.at[1]);await page.mouse.down();await page.mouse.move(zoomed.at[0]-40,zoomed.at[1]-30,{steps:8});await page.mouse.up();
  expect(await viewBox(page)).not.toBe(panned);expect(await save(page)).toEqual(before);
  // Wheel zooms the camera only.
  await page.mouse.move(zoomed.at[0],zoomed.at[1]);await page.mouse.wheel(0,-200);
  expect(Number(await map(page).getAttribute('data-camera-zoom'))).toBeGreaterThan(1.5);expect(await save(page)).toEqual(before);
  // Positive control: an ordinary click on an own country places exactly one army.
  await page.locator('#map-fit').click();await expect(map(page)).toHaveAttribute('data-camera-zoom','1');
  const target=await tappable(page,own);await page.mouse.click(target.at[0],target.at[1]);
  const after=await save(page);expect(after.armies[target.id]).toBe(before.armies[target.id]!+1);expect(after.reinforcementPool).toBe(before.reinforcementPool-1);
 });

 test(`${host}: selection survives zoom, Focus, keyboard camera and rotation; the core does not move`,async({page},info)=>{
  await begin(page);await load(page,attack(host));await collapse(page);
  const before=await save(page),own=Object.keys(before.ownerOf).filter(id=>before.ownerOf[id]===before.players[before.currentPlayer]!.id&&before.armies[id]!>1);
  const source=await tappable(page,own);await page.mouse.click(source.at[0],source.at[1]);
  const selected=page.locator(`[data-country="${source.id}"]`);await expect(selected).toHaveAttribute('data-selected','true');
  // A drag's release is neither a country action nor a background deselect, at Fit or zoomed.
  for(const zoom of [false,true]){
   if(zoom)await page.locator('#map-focus').click();
   const from=(await centre(page,source.id))!;
   await page.mouse.move(from[0],from[1]);await page.mouse.down();await page.mouse.move(from[0]+60,from[1]+40,{steps:6});await page.mouse.up();
   await expect(selected).toHaveAttribute('data-selected','true');
  }
  await page.locator('#map-fit').click();
  await page.locator('#map-focus').click();
  const focused=Number(await map(page).getAttribute('data-camera-zoom'));expect(focused).toBeGreaterThanOrEqual(2);
  expect(await centre(page,source.id)).not.toBeNull();
  await selected.focus();await page.keyboard.press('-');expect(Number(await map(page).getAttribute('data-camera-zoom'))).toBeLessThan(focused);
  await page.keyboard.press('0');await expect(map(page)).toHaveAttribute('data-camera-zoom','1');
  await page.locator('#map-focus').click();
  for(const [width,height] of [[390,844],[844,390],[768,1024],[1280,800]] as const){
   await page.setViewportSize({width,height});await settle(page);
   await expect(map(page)).toHaveAttribute('data-camera-rotation',width<height?'90':'0');
   expect(Number(await map(page).getAttribute('data-camera-zoom'))).toBeCloseTo(focused,6);
   expect(await centre(page,source.id),`${source.id} stays in view at ${width}x${height}`).not.toBeNull();
   await expect(selected).toHaveAttribute('data-selected','true');
   await shot(page,info,`${host}-focus-${width}x${height}`);
  }
  expect(await save(page)).toEqual(before);
 });

 // T97 (owner, #240): cards float over the full-size map; opening or closing one never reframes it.
 test(`${host}: a card over the board leaves the map's framing as it is; the same counts stay (E)`,async({page},info)=>{
  await begin(page);await load(page,fixture(host,'reinforcement'));await collapse(page);
  const counts=()=>page.locator('[data-country]').evaluateAll(ns=>ns.map(n=>[n.getAttribute('data-country'),n.querySelector('.count')!.textContent]));
  const before=await counts(),box=await viewBox(page);
  await drawer(page,true);expect(await viewBox(page)).toBe(box);
  await shot(page,info,`${host}-drawer-open`);
  await drawer(page,false);await settle(page);
  expect(await counts()).toEqual(before);expect(await viewBox(page)).toBe(box);
  await expect(map(page)).toHaveAttribute('data-camera-zoom','1');
 });
}

test.describe('touch',()=>{
 test.use({hasTouch:true});
 test('geographic: pinch zooms and two-finger release acts on nothing; a tap places one army',async({page})=>{
  await begin(page,390,844);await load(page,fixture('geographic','reinforcement'));await collapse(page);
  const before=await save(page),own=Object.keys(before.ownerOf).filter(id=>before.ownerOf[id]===before.players[before.currentPlayer]!.id);
  const {at}=await tappable(page,own),cdp=await page.context().newCDPSession(page);
  const touch=(type:'touchStart'|'touchMove'|'touchEnd',points:[number,number][])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y],id)=>({x,y,id}))});
  await touch('touchStart',[[at[0]-20,at[1]],[at[0]+20,at[1]]]);
  for(let i=1;i<=6;i++)await touch('touchMove',[[at[0]-20-i*10,at[1]],[at[0]+20+i*10,at[1]]]);
  await touch('touchEnd',[]);
  expect(Number(await map(page).getAttribute('data-camera-zoom'))).toBeGreaterThan(1.5);
  expect(await save(page)).toEqual(before);
  // One-finger swipe while zoomed pans and acts on nothing.
  const box=await viewBox(page),m=(await map(page).boundingBox())!,z=[m.x+m.width/2,m.y+m.height/2] as const;
  await touch('touchStart',[[z[0],z[1]]]);for(let i=1;i<=5;i++)await touch('touchMove',[[z[0]-i*12,z[1]-i*8]]);await touch('touchEnd',[]);
  expect(await viewBox(page)).not.toBe(box);expect(await save(page)).toEqual(before);
  await page.locator('#map-fit').tap();await expect(map(page)).toHaveAttribute('data-camera-zoom','1');
  const tap=await tappable(page,own);await page.touchscreen.tap(tap.at[0],tap.at[1]);await settle(page);
  const after=await save(page);expect(after.armies[tap.id]).toBe(before.armies[tap.id]!+1);
 });
});
