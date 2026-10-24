import {test,expect} from '@playwright/test';
import {visitGame} from './shell';

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
 await page.screenshot({path:info.outputPath('desktop-connections-tracker.png')});
});
