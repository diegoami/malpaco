import {chromium} from '@playwright/test';
import {spawn,spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
const out=process.env.T76_DIAGNOSTIC_DIR;
const build=spawnSync('npx',['vite','build'],{stdio:'inherit'});if(build.status!==0)process.exit(build.status??1);
const server=spawn('npx',['vite','preview','--port','4173','--strictPort'],{stdio:'inherit'});
let browser;const results=[];
try{
 for(let n=0;n<100;n++){try{if((await fetch('http://localhost:4173')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();
 for(const viewport of [{width:1280,height:800},{width:1920,height:1080}])for(const seed of [1994,513,749,1,0,6]){
  const page=await browser.newPage({viewport});await page.goto(`http://localhost:4173/?seed=${seed}&control=manual`);
  await page.getByLabel('Seats',{exact:true}).selectOption('2');for(let n=1;n<=2;n++)await page.getByLabel(`Seat ${n} control`,{exact:true}).selectOption('human');
  await page.getByRole('button',{name:'Start game',exact:true}).click();await page.locator('#geographic-map').waitFor();await page.mouse.move(0,0);
  const metrics=await page.locator('#geographic-map').evaluate(svg=>{
   const rect=n=>{if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
   const describe=n=>n?{tag:n.tagName,id:n.id,classes:n.getAttribute('class'),role:n.getAttribute('role'),country:n.closest('[data-country]')?.getAttribute('data-country'),rect:rect(n)}:null;
   const rows=[...svg.querySelectorAll('[data-country]')].map(n=>{
    const count=n.querySelector('.count');const anchor=new DOMPoint(Number(count.getAttribute('x')),Number(count.getAttribute('y'))-5).matrixTransform(count.getScreenCTM());
    const points=[[-20,-20],[20,-20],[-20,20],[20,20],[0,0]].map(([dx,dy])=>{const x=anchor.x+dx,y=anchor.y+dy,hit=document.elementFromPoint(x,y);return{x,y,ok:hit?.closest('[data-country]')===n,hit:describe(hit)};});
    return {id:n.getAttribute('data-country'),anchor:{x:anchor.x,y:anchor.y},points};
   });
   return {viewport:{width:innerWidth,height:innerHeight},board:rect(svg.closest('.board')),map:rect(svg),stage:rect(svg.closest('.stage')),rail:rect(document.querySelector('#battle-action-rail')),sidebar:rect(document.querySelector('#battle-sidebar')),topbar:rect(document.querySelector('#battle-topbar')),bad:rows.filter(r=>r.points.some(p=>!p.ok)),countries:rows.length};
  });
  results.push({seed,viewport,...metrics});writeFileSync(join(out,'hit-metrics.json'),JSON.stringify(results,null,2)+'\n');
  if(metrics.bad.length)await page.screenshot({path:join(out,`seed-${seed}-${viewport.width}.png`)});
  console.log(JSON.stringify({seed,width:viewport.width,bad:metrics.bad.map(r=>({id:r.id,hits:r.points.filter(p=>!p.ok).map(p=>p.hit)}))}));await page.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
