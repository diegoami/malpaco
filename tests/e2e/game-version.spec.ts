import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {reserveFixture} from '../helpers/reserve-fixtures';
import {visitGame} from './shell';
const {version}=JSON.parse(readFileSync('package.json','utf8')) as {version:string};

test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit viewport matrix'));
test('running version stays at top right on launcher and retained play without covering controls',async({page})=>{
 const sizes=[[390,844],[568,320],[844,390],[820,1180],[1280,800]] as const;
 await page.goto('/');
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});
  const badge=page.locator('#game-version');await expect(badge).toHaveText(`v${version}`);
  await expect(badge).toHaveAccessibleName(`Malpaco version ${version}`);
 }
 const raw=reserveFixture(46).text;
 await page.evaluate(text=>{localStorage.setItem('malpaco:current-game',text);localStorage.setItem('malpaco:current-game-meta',JSON.stringify({id:'version-check',paused:true}));},raw);
 await visitGame(page,'/');await expect(page.locator('[data-country]')).toHaveCount(46);
 for(const mode of ['text','icons','auto']){
  await page.evaluate(mode=>{localStorage.setItem('malpaco:button-labels',mode);window.dispatchEvent(new Event('malpaco:button-labels-changed'));},mode);
  for(const [width,height] of sizes){
   await page.setViewportSize({width,height});
   const badge=page.locator('#game-version');await expect(badge).toHaveText(`v${version}`);
   const r=(await badge.boundingBox())!;expect(r.x+r.width).toBeGreaterThan(width-40);expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(16);
   const overlaps=await badge.evaluate(node=>{const a=node.getBoundingClientRect();return [...document.querySelectorAll('button')].filter(b=>{const r=b.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(b).visibility!=='hidden'&&a.left<r.right&&a.right>r.left&&a.top<r.bottom&&a.bottom>r.top;}).map(b=>b.id);});
   expect(overlaps).toEqual([]);
   expect(await badge.evaluate(n=>getComputedStyle(n).pointerEvents)).toBe('none');
  }
 }
 await page.evaluate(()=>{document.documentElement.style.setProperty('--safe-top','24px');document.documentElement.style.setProperty('--safe-right','18px');});
 const inset=(await page.locator('#game-version').boundingBox())!;
 expect(inset.y).toBeGreaterThanOrEqual(24);expect(inset.y+inset.height).toBeLessThanOrEqual(40);expect(inset.x+inset.width).toBeLessThanOrEqual(1280-18);
 await page.evaluate(()=>{document.documentElement.style.removeProperty('--safe-top');document.documentElement.style.removeProperty('--safe-right');});
 await page.locator('#game-help-button').click();await expect(page.locator('dialog.game-help[open]')).toContainText(`Malpaco ${version}`);
 expect(await page.evaluate(()=>localStorage.getItem('malpaco:current-game'))).toBe(raw);
 await page.reload();await expect(page.locator('#game-version')).toHaveText(`v${version}`);
});

test('illustrated manual identifies the running package and has current control guidance',async({page})=>{
 await page.goto('/manual/index.html');
 await expect(page.locator('#manual-version')).toHaveText(`Malpaco ${version}`);
 await expect(page.locator('main')).not.toContainText('Malpaco 0.5.1');
 await expect(page.locator('main')).toContainText('From → To');
 await expect(page.locator('main')).toContainText('GitHub Pages');
 await expect(page.locator('main img')).toHaveCount(8);
});

test('diagnostic reference setup retains its original surface',async({page})=>{
 await page.goto('/?view=reference-game');await expect(page.getByRole('heading',{name:'New reference game',exact:true})).toBeVisible();
 await expect(page.locator('#game-version')).toHaveCount(0);
});
