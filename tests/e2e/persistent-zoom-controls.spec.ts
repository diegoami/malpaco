import {test, expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {visitGame, reloadGame} from './shell';

const KEY = 'malpaco:seed-game:0';
const sizes = [
 {width:390, height:844}, {width:568, height:320}, {width:844, height:390},
 {width:820, height:1180}, {width:1280, height:800},
];
test.beforeEach(({}, info) => test.skip(info.project.name !== '1280x800', 'explicit viewport matrix'));
async function start(page:Page, mode:string, viewport:{width:number;height:number}) {
 await page.setViewportSize(viewport);
 await page.addInitScript(value => localStorage.setItem('malpaco:button-labels', value), mode);
 await page.clock.install(); await page.clock.pauseAt(new Date());
 await visitGame(page, '/?seed=0');
 await page.evaluate(() => document.fonts.ready); await page.clock.runFor(100);
}
async function saved(page:Page) {return page.evaluate(k => localStorage.getItem(k), KEY);}

for (const viewport of sizes) for (const mode of ['text', 'icons', 'auto']) {
 test(`${mode} ${viewport.width}x${viewport.height}: zoom icons stay present and clickable at Fit`, async ({page}) => {
  await start(page, mode, viewport);
  const map = page.locator('#geographic-map'), zin = page.locator('#map-zoom-in'), zout = page.locator('#map-zoom-out');
  const before = await saved(page);
  await expect(map).toHaveAttribute('data-camera-zoom', '1');
  await expect(page.locator('#game-focus-drawer'), 'obsolete initial card closes after automatic card skip').toBeHidden();
  for (const [button, name] of [[zin, 'Zoom in'], [zout, 'Zoom out']] as const) {
   await expect(button).toBeVisible(); await expect(button).toHaveAccessibleName(name);
   await expect(button.locator('svg')).toBeVisible();
   const box = (await button.boundingBox())!;
   expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
   expect(box.x).toBeGreaterThanOrEqual(0);
   expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
   expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
   const hit = await button.evaluate(n => {
    const r = n.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
    return {uncovered:!!hit && n.contains(hit), hit:hit?.getAttribute('class'), button:r.toJSON(),
     widget:document.querySelector('#turn-tracker')?.getBoundingClientRect().toJSON()};
   });
   expect(hit.uncovered, JSON.stringify(hit)).toBe(true);
  }
  await expect(zout).toBeDisabled(); await expect(zin).toBeEnabled();
  await zin.click(); await expect(map).toHaveAttribute('data-camera-zoom', '1.5');
  await expect(zout).toBeEnabled(); await zout.click();
  await expect(map).toHaveAttribute('data-camera-zoom', '1');
  await expect(zout).toBeDisabled(); await expect(zin).toBeVisible(); await expect(zout).toBeVisible();
  await expect(page.locator('#map-fit')).toBeFocused();
  await page.locator('#open-game-menu').click(); await page.keyboard.press('Escape');
  await expect(zin).toBeVisible(); await expect(zout).toBeVisible(); expect(await saved(page)).toBe(before);
  await reloadGame(page);
  await expect(zin.locator('svg')).toBeVisible(); await expect(zout.locator('svg')).toBeVisible();
  await expect(zout).toBeDisabled(); expect(await saved(page)).toBe(before);
  await page.setViewportSize({width:viewport.height, height:viewport.width}); await page.clock.runFor(100);
  await expect(zin).toBeVisible(); await expect(zout).toBeVisible();
  await page.setViewportSize(viewport); await page.clock.runFor(100); expect(await saved(page)).toBe(before);
  await page.screenshot({path:`artifacts/T162/${mode}-${viewport.width}.png`});
 });
}

test('zoom limit keeps icons present, disables the bound and hands focus to Fit', async ({page}) => {
 await start(page, 'icons', {width:1280, height:800});
 const map = page.locator('#geographic-map'), zin = page.locator('#map-zoom-in'), zout = page.locator('#map-zoom-out');
 const before = await saved(page);
 for (let n = 0; n < 6; n++) await zin.click();
 await expect(map).toHaveAttribute('data-camera-zoom', '8');
 await expect(zin).toBeVisible(); await expect(zin).toBeDisabled(); await expect(zout).toBeEnabled();
 await expect(page.locator('#map-fit')).toBeFocused();
 await page.locator('#map-fit').press('End'); await expect(zout).toBeFocused();
 await page.locator('#map-fit').click(); await expect(map).toHaveAttribute('data-camera-zoom', '1');
 await expect(zout).toBeVisible(); await expect(zout).toBeDisabled(); expect(await saved(page)).toBe(before);
});
