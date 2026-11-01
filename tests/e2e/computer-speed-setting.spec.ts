import {test,expect} from '@playwright/test';
import {visitGame} from './shell';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','preference behavior'));
test('four computer-speed choices persist through launcher, play and reload without changing match bytes',async({page})=>{
 await page.clock.install();await page.clock.pauseAt(new Date());await page.goto('/?seed=7');const speed=page.getByLabel('Computer turn speed',{exact:true});await expect(speed.locator('option')).toHaveText(['Slow','Normal','Fast','Very fast']);await expect(speed).toHaveValue('normal');
 await speed.selectOption('fast');await page.reload();await expect(speed).toHaveValue('fast');await page.locator('#start-game').click();await expect(page.locator('[data-country]')).toHaveCount(46);await page.clock.runFor(3000);await page.locator('#open-game-menu').click();
 const before=await page.evaluate(()=>localStorage.getItem('malpaco:seed-game:7'));await expect(speed).toHaveValue('fast');await speed.selectOption('very-fast');await expect(page.locator('.battle-controls[aria-label="Battle controls"]')).toHaveAttribute('data-speed','very-fast');expect(await page.evaluate(()=>localStorage.getItem('malpaco:seed-game:7'))).toBe(before);await page.reload();await visitGame(page,'/?seed=7');await page.locator('#open-game-menu').click();await expect(speed).toHaveValue('very-fast');expect(await page.evaluate(()=>localStorage.getItem('malpaco:seed-game:7'))).toBe(before);
});
test('a failed speed write restores the kept selection and reports the failure',async({page})=>{
 await page.goto('/');const speed=page.getByLabel('Computer turn speed',{exact:true});await speed.selectOption('fast');await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('quota');};});await speed.selectOption('slow');await expect(speed).toHaveValue('fast');await expect(page.getByRole('alert').filter({hasText:/speed/})).toBeVisible();
});
