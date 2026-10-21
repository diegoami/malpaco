// T88 (A9–A11, A14): the acceptance viewport matrix, its width and height seams ±1, browser
// zoom at 200% and 400% (an effective 640×400 and 320×200 CSS viewport), synthetic safe
// cutouts and reduced height. At each size: no sideways document scroll, every visible
// control inside the safe viewport and clear of the others, no duplicate ids, and the pending
// capture's Confirm reachable; a draft survives every resize and nothing acts.
import {expect,test} from '@playwright/test';
import type {Page,TestInfo} from '@playwright/test';
import {pinned} from '../core/versioned-match-fixture';
import {closeSurface,openSurface,reachableInCard} from './shell';

type Size={width:number;height:number};
const MATRIX:Size[]=[[320,568],[360,640],[390,844],[430,932],[568,320],[640,360],[667,375],[844,390],[932,430],[768,1024],[1024,768],[800,540],[1280,800],[1920,1080]].map(([width,height])=>({width:width!,height:height!}));
const SEAMS:Size[]=[...[679,680,681,1099,1100,1101].map(width=>({width,height:800})),...[319,320,321,499,500,501,599,600,601].map(height=>({width:900,height}))];
const ZOOM:Size[]=[{width:640,height:400},{width:320,height:200}];
const INSETS={top:24,right:44,bottom:34,left:44};

async function pendingCapture(p:Page){
 await p.clock.install({time:new Date('2026-10-21T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-21T12:00:00Z'));
 await p.goto('/?view=reference-game&control=manual');
 await p.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'savedBlob',blob);return create(blob);};});
 await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'c.json',mimeType:'application/json',buffer:Buffer.from(pinned('pending-capture').text)});
 await expect(p.locator('#confirm-capture-button')).toBeVisible();
}
async function savedText(p:Page){await openSurface(p,'settings');await p.getByRole('button',{name:'Save game',exact:true}).click();await closeSurface(p);return p.evaluate(()=>(Reflect.get(window,'savedBlob') as Blob).text());}
/** Sideways scroll, controls outside the safe viewport or on top of each other, duplicate ids. */
function audit(p:Page,insets={top:0,right:0,bottom:0,left:0}){
 return p.evaluate(i=>{
  const controls=[...document.querySelectorAll<HTMLElement>('.game-overlay button, .game-overlay .hud-chip')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('#game-focus-drawer'));
  const box=(e:Element)=>e.getBoundingClientRect();
  const outside=controls.filter(e=>{const r=box(e);return r.left<i.left-0.5||r.top<i.top-0.5||r.right>innerWidth-i.right+0.5||r.bottom>innerHeight-i.bottom+0.5;}).map(e=>e.id||e.className);
  const overlaps:string[]=[];
  for(let a=0;a<controls.length;a++)for(let b=a+1;b<controls.length;b++){const x=box(controls[a]!),y=box(controls[b]!);if(controls[a]!.contains(controls[b]!)||controls[b]!.contains(controls[a]!))continue;if(x.left<y.right-0.5&&y.left<x.right-0.5&&x.top<y.bottom-0.5&&y.top<x.bottom-0.5)overlaps.push(`${controls[a]!.id}|${controls[b]!.id}`);}
  const ids=[...document.querySelectorAll('[id]')].map(e=>e.id),dupes=[...new Set(ids.filter((id,k)=>ids.indexOf(id)!==k))];
  return {sideways:document.documentElement.scrollWidth>innerWidth+1,outside,overlaps,dupes};
 },insets);
}
const settle=(p:Page)=>p.clock.runFor(200);

test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes are set here, so one project suffices'));

for(const [label,sizes] of [['matrix',MATRIX],['seams',SEAMS],['browser zoom 200% and 400%',ZOOM]] as const)
 test(`${label}: controls fit and clear each other, Confirm stays reachable, a draft survives and nothing acts`,async({page},info:TestInfo)=>{
  test.setTimeout(120_000);
  await pendingCapture(page);const before=await savedText(page);
  await openSurface(page,'actions');const draft=await page.locator('#capture-amount').getAttribute('min');await page.locator('#capture-amount').fill(draft!);
  for(const size of sizes){
   await page.setViewportSize(size);await settle(page);
   const a=await audit(page);expect(a,`${size.width}×${size.height}`).toEqual({sideways:false,outside:[],overlaps:[],dupes:[]});
   await openSurface(page,'actions');await reachableInCard(page.locator('#confirm-capture-button'));
   await expect(page.locator('#capture-amount')).toHaveValue(draft!);
   await expect(page.locator('#game-pause-button')).toBeInViewport({ratio:1});
   if(size.width<=390||size.height<=400)await page.screenshot({path:info.outputPath(`${label.split(' ')[0]}-${size.width}x${size.height}.png`)});
  }
  expect(await savedText(page)).toBe(before);
 });

test('synthetic safe cutouts keep every control inside the safe area with the capture card open',async({page})=>{
 await pendingCapture(page);
 await page.evaluate(i=>{for(const [k,v] of Object.entries(i))document.documentElement.style.setProperty(`--safe-${k}`,`${v}px`);},INSETS);
 for(const size of [{width:390,height:844},{width:844,height:390},{width:932,height:430},{width:667,height:375}]){
  await page.setViewportSize(size);await settle(page);await openSurface(page,'actions');
  const a=await audit(page,INSETS);expect(a,`${size.width}×${size.height}`).toMatchObject({sideways:false,outside:[],overlaps:[]});
  const confirm=await page.locator('#confirm-capture-button').boundingBox();
  expect(confirm!.y+confirm!.height,`${size.width}×${size.height} confirm above the bottom inset`).toBeLessThanOrEqual(size.height-INSETS.bottom+0.5);
 }
});
