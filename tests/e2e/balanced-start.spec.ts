import {expect,test} from '@playwright/test';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {raidCardsRules,activePlayer} from '../../src/core/state';
import {deserializeVersionedMatch,serializeVersionedMatch,GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY} from '../../src/core/match-save';
const KEY='malpaco:current-game';
test.beforeEach(({},info)=>test.skip(info.project.name!=='1280x800','sizes set by the test'));
for(const size of [{width:390,height:844},{width:1280,height:800}]){
 test(`${size.width}: fresh public games use the balanced identity and resume unchanged`,async({page})=>{
  await page.setViewportSize(size);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
  const text=()=>page.evaluate(k=>localStorage.getItem(k),KEY);
  await expect.poll(async()=>{const value=await text();return value?JSON.parse(value).rules:null;},{timeout:15000}).toEqual({id:'balanced-cards',version:1});
  const loaded=deserializeVersionedMatch((await text())!);expect(loaded.identity.actionSchemaVersion).toBe(5);
  await page.locator('#game-pause-button').click();
  const paused=(await text())!;const before=deserializeVersionedMatch(paused).state;
  await page.reload();await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
  expect(await text()).toBe(paused);expect(deserializeVersionedMatch((await text())!).state).toEqual(before);
  await page.screenshot({path:`artifacts/T102-browser/balanced-${size.width}.png`});
  expect(errors).toEqual([]);
 });
 test(`${size.width}: an old kept game retains its exact old identity, deal and income`,async({page})=>{
  await page.setViewportSize(size);
  const options={...defaultOptions(),seed:7};const old=createGeographicGame(options,raidCardsRules(options),{},2);
  if(!old.ok)throw Error(old.errors.join('; '));
  const text=serializeVersionedMatch(options,[],GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY);
  await page.addInitScript(([key,match])=>{if(!sessionStorage.getItem('old-balance-test')){sessionStorage.setItem('old-balance-test','1');localStorage.setItem(key!,match!);localStorage.setItem(key+'-meta',JSON.stringify({id:'old-balance-test',paused:true}));}},[KEY,text]);
  await page.goto('/');await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
  const saved=(await page.evaluate(k=>localStorage.getItem(k),KEY))!;
  const loaded=deserializeVersionedMatch(saved);expect(loaded.identity).toEqual(GEOGRAPHIC_V2_RAID_CARD_MATCH_IDENTITY);
  expect(loaded.state).toEqual(old.state);expect(activePlayer(loaded.state)?.id).toBe(activePlayer(old.state)?.id);
  await page.reload();await expect(page.locator('#geographic-map [data-country]')).toHaveCount(46,{timeout:60000});
  expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(saved);
 });
}
