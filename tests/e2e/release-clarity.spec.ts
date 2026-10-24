import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {visitGame} from './shell';

async function portsInsideCountries(page:Page){
 const checks=await page.locator('#geographic-map .lane-port').evaluateAll(nodes=>nodes.map(n=>{
  const id=n.getAttribute('data-port-country')!,shape=document.querySelector<SVGGeometryElement>(`[data-country="${id}"] .cell`);
  const screen=(n as SVGGraphicsElement).getScreenCTM(),local=shape?.getScreenCTM();
  const point=screen&&local?new DOMPoint(Number(n.getAttribute('cx')),Number(n.getAttribute('cy'))).matrixTransform(screen).matrixTransform(local.inverse()):null;
  return {id,inside:!!shape&&!!point&&shape.isPointInFill(point)};
 }));
 expect(checks.length).toBeGreaterThan(0);expect(checks.filter(check=>!check.inside)).toEqual([]);
}

test('desktop sea endpoints and player panel are unmistakable',async({page},info)=>{
 await visitGame(page,'/?seed=7');
 const lanes=page.locator('#geographic-map .lane');
 expect(await lanes.count()).toBeGreaterThan(0);
 for(const lane of await lanes.all()){
  const edge=(await lane.getAttribute('data-edge'))!;
  const style=await lane.evaluate(n=>({width:Number.parseFloat(getComputedStyle(n).strokeWidth),effect:getComputedStyle(n).vectorEffect}));
  expect(style.width).toBeGreaterThanOrEqual(3);expect(style.effect).toBe('non-scaling-stroke');
  const ports=page.locator(`#geographic-map .lane-ports[data-edge="${edge}"]`);
  await expect(ports).toHaveAttribute('aria-label',/Sea connection: .+ ↔ .+/);
  expect((await ports.locator('[data-port-country]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-port-country')).sort()))).toEqual(edge.split('|').sort());
 }
 const tracker=(await page.locator('#turn-tracker').boundingBox())!;expect(tracker.width).toBeGreaterThanOrEqual(300);
 for(const row of await page.locator('.turn-row').all())expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(40);
 await portsInsideCountries(page);
 await page.screenshot({path:info.outputPath('desktop-connections-tracker.png')});
});

for(const size of [46,72,96])test(`${size}: sea dots stay inside their named regions at fit and zoom`,async({page})=>{
 await page.addInitScript(mapSize=>localStorage.setItem('malpaco:next-game-settings',JSON.stringify({version:4,mapSize,computerOpponents:3,startingArmiesRange:'1-3',eventFrequency:'Normal'})),size);
 await visitGame(page,'/?seed=7');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(size);
 await portsInsideCountries(page);
 const map=page.locator('#geographic-map'),box=(await map.boundingBox())!;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,-500);
 await expect.poll(async()=>Number(await map.getAttribute('data-camera-zoom'))).toBeGreaterThan(1);
 await portsInsideCountries(page);
});
