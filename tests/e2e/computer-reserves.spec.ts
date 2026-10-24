import {expect,test} from '@playwright/test';
import {apply} from '../../src/core/rules';
import {deserializeVersionedMatch} from '../../src/core/match-save';
import {reserveFixture,RESERVE_CASES} from '../helpers/reserve-fixtures';
import {visitGame} from './shell';

const ROOT='malpaco:current-game',row=RESERVE_CASES[0],fixture=reserveFixture(row.size);
const action={kind:'friendlyMove' as const,from:row.from,to:row.to};
const outcome=apply(fixture.state,action);if(!outcome.ok)throw Error(outcome.error);
const expected=outcome.state;
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','viewports set per case'));
for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1280,height:800}])test(`${viewport.width}: resumed AI visibly moves the formerly idle reserve and saves exactly one legal action`,async({page},info)=>{
 await page.setViewportSize(viewport);await page.clock.install();await page.clock.pauseAt(new Date());
 await page.addInitScript(({text,sequence,key})=>{
  localStorage.setItem(key,text);localStorage.setItem(key+'-meta',JSON.stringify({id:'T128-reserve-repro',paused:false,eventAck:sequence,eventMarksCleared:sequence}));
 },{text:fixture.text,sequence:fixture.state.events?.sequence??0,key:ROOT});
 await visitGame(page,'/');await page.evaluate(()=>document.fonts.ready);
 const read=async()=>deserializeVersionedMatch((await page.evaluate(key=>localStorage.getItem(key),ROOT))!).state;
 expect(await read()).toEqual(fixture.state);
 await page.screenshot({path:info.outputPath(`reserve-before-${viewport.width}.png`)});
 await page.clock.runFor(120);
 expect(await read()).toEqual(expected);
 await expect(page.locator('#geographic-map')).toHaveAttribute('data-computer-feedback','friendlyMove');
 await expect(page.locator('.computer-transfer-trail')).toHaveCount(1);
 await page.clock.runFor(400);expect(await read()).toEqual(expected);
 await page.screenshot({path:info.outputPath(`reserve-moving-${viewport.width}.png`)});
 await page.clock.runFor(400);expect(await read()).toEqual(expected);
 for(const id of [row.from,row.to])await expect(page.locator(`[data-country="${id}"]`)).toHaveAttribute('data-armies',String(expected.armies[id]));
 await page.screenshot({path:info.outputPath(`reserve-after-${viewport.width}.png`)});
});
