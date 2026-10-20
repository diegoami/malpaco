import {test,expect} from '@playwright/test';
import type {Page,TestInfo} from '@playwright/test';
import {readFileSync} from 'node:fs';

async function begin(page:Page,host:string,kind:'layout'|'cards') {
  await page.clock.install({time:new Date('2026-10-19T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-19T12:00:00Z'));
  const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(host==='reference'?'/?view=reference-game':'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'t76Save',blob);return create(blob);};});
  const path=kind==='layout'?`fixtures/new-game/T71/fixtures/${host}-reinforcement.json`:
    `fixtures/new-game/T40/fixtures/${host==='reference'?'T38-legal-Surge-before.json':'geographic-income-before-one-human.json'}`;
  const old=await page.getByLabel('Load game',{exact:true}).elementHandle();
  await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'panels.json',mimeType:'application/json',buffer:Buffer.from(readFileSync(path))});
  await expect.poll(()=>old!.evaluate(e=>e.isConnected)).toBe(false);
  await expect(page.locator('.battle-reference [data-country]')).toHaveCount(46);
  return errors;
}
async function save(page:Page){await page.getByRole('button',{name:'Save game',exact:true}).click();return page.evaluate(()=>(Reflect.get(window,'t76Save') as Blob).text());}
async function box(page:Page){return page.locator('.battle-reference .board').evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});}
async function fits(page:Page,selector:string){const e=page.locator(selector);await expect(e).toBeVisible();expect(await e.evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.width>0&&r.height>0&&r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&!!hit&&(n===hit||n.contains(hit));})).toBe(true);}
async function evidence(page:Page,info:TestInfo,label:string){await page.screenshot({path:info.outputPath(label+'.png')});await info.attach(label,{body:JSON.stringify({board:await box(page),scroll:await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,innerWidth,innerHeight}))}),contentType:'application/json'});}
for(const host of ['reference','geographic']){
  test(`${host}: independently hidden panels reclaim map area and restore exactly`,async({page},info)=>{
    const errors=await begin(page,host,'layout');const before=await save(page),original=await box(page);
    const top=page.locator('#toggle-topbar'),side=page.locator('#toggle-sidebar');
    await expect(top).toHaveAttribute('aria-expanded','true',{timeout:1000});
    await expect(side).toHaveAttribute('aria-expanded','true',{timeout:1000});
    await evidence(page,info,'expanded');
    await top.click();await expect(top).toHaveAttribute('aria-expanded','false');await expect(page.locator('.battle-reference .topbar')).toBeHidden();
    const topHidden=await box(page);expect(topHidden.height).toBeGreaterThan(original.height+24);expect(topHidden.width).toBe(original.width);
    await side.click();await expect(side).toHaveAttribute('aria-expanded','false');
    const both=await box(page);expect(both.width).toBeGreaterThan(original.width+200);expect(both.height).toBe(topHidden.height);
    const rail=page.locator('#battle-action-rail');await expect(rail).toHaveAttribute('role','toolbar');expect((await rail.boundingBox())!.width).toBeLessThanOrEqual(72);
    for(const id of ['toggle-topbar','toggle-sidebar','open-game-cards','open-game-details','open-game-settings']){await fits(page,'#'+id);const control=page.locator('#'+id);await expect(control).toHaveAccessibleName(/\S/);await expect(control).toHaveAttribute('title',/\S/);}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
    await evidence(page,info,'both-hidden');
    await top.focus();await top.press('Enter');await expect(top).toHaveAttribute('aria-expanded','true');
    const sideOnly=await box(page);expect(sideOnly.width).toBe(both.width);expect(sideOnly.height).toBe(original.height);
    await side.focus();await side.press('Space');await expect(side).toHaveAttribute('aria-expanded','true');expect(await box(page)).toEqual(original);
    expect(await save(page)).toBe(before);expect(errors).toEqual([]);
  });
  test(`${host}: icon cards surface closes with Escape and returns focus without game actions`,async({page},info)=>{
    const errors=await begin(page,host,'cards');const before=await save(page);
    const top=page.locator('#toggle-topbar'),side=page.locator('#toggle-sidebar');
    await expect(side).toBeVisible({timeout:1000});await side.click();await top.click();
    const cards=page.locator('#open-game-cards');await fits(page,'#open-game-cards');await cards.click();
    const drawer=page.locator('#game-focus-drawer');await expect(drawer).toBeVisible();await expect(drawer).toHaveAttribute('role','dialog');
    await expect(drawer.locator('.card-interactions')).toBeVisible();await fits(page,'#close-game-drawer');await evidence(page,info,'cards-drawer');
    await page.keyboard.press('Escape');await expect(drawer).toBeHidden();await expect(cards).toBeFocused();
    await cards.press('Enter');await expect(drawer).toBeVisible();await page.locator('#close-game-drawer').click();await expect(cards).toBeFocused();
    await top.click();await side.click();expect(await save(page)).toBe(before);expect(errors).toEqual([]);
  });
}
