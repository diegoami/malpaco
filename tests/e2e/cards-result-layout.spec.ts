import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
const envelope='fixtures/new-game/T40/fixtures/T40-human-loss-450.json';
test('final T40 loss choices fit both modes; retain all geometry before assertions',async({page},info)=>{
 await page.clock.install({time:new Date('2026-10-18T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));await page.goto('/');const old=await page.getByLabel('Load game',{exact:true}).elementHandle();await page.getByLabel('Load game',{exact:true}).setInputFiles({name:'human-loss-450.json',mimeType:'application/json',buffer:readFileSync(envelope)});await expect.poll(()=>old!.evaluate(el=>el.isConnected)).toBe(false);await expect(page.locator('[data-country]')).toHaveCount(46);
 const measurements=[];
 for(const mode of ['compact','detailed']){
  await page.getByRole('combobox',{name:'Panel detail',exact:true}).selectOption(mode);
  const data=await page.locator('.panel > .action').evaluate(action=>{
   const rectangle=(el:Element)=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
   const shown=(el:Element)=>{const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0&&!(el as HTMLElement).hidden;};
   const describe=(el:Element)=>({tag:el.tagName,id:el.id,className:el.getAttribute('class'),text:el.textContent?.trim().slice(0,220),rect:rectangle(el),scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,overflowY:getComputedStyle(el).overflowY});
   const bounds=rectangle(action),buttons=['watch-computers-button','stop-game-button'].map(id=>{const node=document.getElementById(id)!;const rect=rectangle(node);return {...describe(node),enabled:!(node as HTMLButtonElement).disabled,visible:shown(node),fitsAction:rect.left>=bounds.left-1&&rect.right<=bounds.right+1&&rect.top>=bounds.top-1&&rect.bottom<=bounds.bottom+1,fitsViewport:rect.left>=-1&&rect.top>=-1&&rect.right<=innerWidth+1&&rect.bottom<=innerHeight+1};});
   return {viewport:{width:innerWidth,height:innerHeight},action:describe(action),visibleDirectActionChildren:[...action.children].filter(shown).map(describe),buttons};
  });
  measurements.push({mode,...data});await page.screenshot({path:info.outputPath(`t40-loss-${mode}.png`),fullPage:true});
 }
 writeFileSync(info.outputPath('geometry.json'),JSON.stringify({project:info.project.name,measurements},null,2)+'\n');await info.attach('geometry',{path:info.outputPath('geometry.json'),contentType:'application/json'});
 // Deliberately defer ALL fit assertions until both modes' metrics/screens exist.
 for(const row of measurements)for(const button of row.buttons){expect.soft(button.visible,`${row.mode} ${button.id} visible`).toBe(true);expect.soft(button.enabled,`${row.mode} ${button.id} enabled`).toBe(true);expect.soft(button.fitsAction,`${row.mode} ${button.id} inside action`).toBe(true);expect.soft(button.fitsViewport,`${row.mode} ${button.id} inside viewport`).toBe(true);}
});
