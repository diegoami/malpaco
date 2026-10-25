import {expect,test} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {apply} from '../../src/core/rules';
import {deserializeVersionedMatch} from '../../src/core/match-save';
import {visitGame} from './shell';
const ROOT='malpaco:current-game',text=readFileSync(new URL('../../fixtures/new-game/T141/tactical-resume.json',import.meta.url),'utf8'),before=deserializeVersionedMatch(text).state;
const action={kind:'friendlyMove' as const,from:'province_27',to:'province_26',amount:1},result=apply(before,action);if(!result.ok)throw Error(result.error);const after=result.state;
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','viewports set by case'));
for(const viewport of [{width:390,height:844},{width:1280,height:800}])test(`${viewport.width}: resumed game keeps its recorded prefix and uses improved future AI without a selector`,async({page},info)=>{
 await page.setViewportSize(viewport);await page.clock.install();await page.clock.pauseAt(new Date());
 await page.addInitScript(({text,key,sequence})=>{localStorage.setItem(key,text);localStorage.setItem(key+'-meta',JSON.stringify({id:'T141-adoption',paused:false,eventAck:sequence,eventMarksCleared:sequence}));},{text,key:ROOT,sequence:before.events?.sequence??0});
 await visitGame(page,'/');await page.evaluate(()=>document.fonts.ready);
 const read=async()=>deserializeVersionedMatch((await page.evaluate(key=>localStorage.getItem(key),ROOT))!).state;
 expect(await read()).toEqual(before);await page.clock.runFor(120);const state=await read();expect(state).toEqual(after);expect(state.history.slice(0,-1)).toEqual(before.history);expect(state.rules).toEqual(before.rules);
 await expect(page.locator('#geographic-map')).toHaveAttribute('data-computer-feedback','friendlyMove');await page.clock.runFor(400);expect(await read()).toEqual(after);
 await expect(page.locator('#next-game-computer-ai')).toHaveCount(0);await page.screenshot({path:info.outputPath(`improved-ai-${viewport.width}.png`)});
});
