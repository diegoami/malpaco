import {test,expect} from '@playwright/test';
import {reserveFixture} from '../helpers/reserve-fixtures';
import {visitGame,openSurface} from './shell';
const KEY='malpaco:scoreboard';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','explicit viewport matrix'));
for(const width of [320,390,568,820,1280])test(`${width}: all score fields and readable rules filter fit without sideways scrolling`,async({page},info)=>{
 await page.setViewportSize({width,height:width===568?320:844});await page.clock.install();await page.clock.pauseAt(new Date());
 const f=reserveFixture(46),recent=[{id:'config',date:'2026-11-07T12:00:00Z',result:'won',rounds:123,countries:96,seed:4294967295,rules:{id:'configurable-cards',version:1}},{id:'defender',date:'2026-11-06T12:00:00Z',result:'lost',rounds:99,countries:0,seed:1234567890,rules:{id:'island-defender',version:1}},{id:'unknown',date:'2026-11-05T12:00:00Z',result:'gave-up',rounds:5,countries:12,seed:42}];
 const scores={version:2,totals:{won:1,lost:1,gaveUp:1},byRules:{earlier:{won:1,lost:0,gaveUp:1},defender:{won:0,lost:1,gaveUp:0}},recent,ids:recent.map(r=>r.id)};
 await page.addInitScript(({wire,scores})=>{if(sessionStorage.getItem('scoreboard-fit'))return;sessionStorage.setItem('scoreboard-fit','1');localStorage.setItem('malpaco:current-game',wire);localStorage.setItem('malpaco:current-game-meta',JSON.stringify({id:'scoreboard-fit',paused:true}));localStorage.setItem('malpaco:scoreboard',JSON.stringify(scores));},{wire:f.text,scores});
 await visitGame(page,'/');await openSurface(page,'menu');await page.getByRole('button',{name:'Scoreboard',exact:true}).click();
 const board=page.getByRole('dialog',{name:'Scoreboard',exact:true}),filter=board.getByLabel('Combat rules for scores'),table=board.getByRole('table');
 await expect(table.getByRole('row')).toHaveCount(4);await expect(table.getByRole('columnheader')).toHaveCount(6);
 const r=(await filter.boundingBox())!;expect(r.height).toBeGreaterThanOrEqual(44);expect(await filter.evaluate(n=>parseFloat(getComputedStyle(n).fontSize))).toBeGreaterThanOrEqual(18);
 expect(await board.evaluate(n=>n.scrollWidth<=n.clientWidth)).toBe(true);
 for(const cell of await table.locator('tbody tr > *').all()){
  await cell.evaluate(n=>n.scrollIntoView({block:'center'}));await expect(cell.locator('.score-field-value')).toBeVisible();const b=(await cell.boundingBox())!;expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width);expect(await cell.evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);
 }
 await expect(table).toContainText('4294967295');await expect(table).toContainText('123');await expect(table).toContainText('96');
 await filter.selectOption('legacy');await expect(filter).toBeFocused();await expect(board.locator('#scoreboard-won')).toHaveText('1');await expect(table.locator('tbody tr')).toHaveCount(1);await expect(table).toContainText('Legacy');
 await filter.selectOption('earlier');await expect(board.locator('#scoreboard-gave-up')).toHaveText('1');await expect(table.locator('tbody tr')).toHaveCount(1);await expect(table).not.toContainText('4294967295');
 await filter.selectOption('all');await page.screenshot({path:info.outputPath(`scoreboard-${width}.png`)});
 const kept=await page.evaluate(k=>localStorage.getItem(k),KEY);expect(kept).toBe(JSON.stringify(scores));
 await board.getByRole('button',{name:'Reset',exact:true}).click();await board.getByRole('button',{name:'Keep',exact:true}).click();expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(kept);
});
