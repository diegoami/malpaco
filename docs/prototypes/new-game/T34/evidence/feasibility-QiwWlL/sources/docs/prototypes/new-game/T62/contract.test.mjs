// Parent-authored bypass classes. Implementer must retain these assertions.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {location} from '../T24/geometry.mjs';
import {checkConstraint} from './contract.mjs';
const original=JSON.parse(fs.readFileSync(new URL('../T60/evidence/build-LrdPTV/coast-first.json',import.meta.url)));
const clone=()=>structuredClone(original);
const country=(b,id)=>b.provinces.find(p=>p.id===id);
for(const group of ['attachment','water','traceability','preserved'])test(`${group}: A positive control`,()=>assert.deepEqual(checkConstraint(group,clone()),[]));
const cases={
 attachment:[
  ['wrong country',b=>{const r=b.routes[0];r.points[0]=country(b,r.to).polygon[0];}],
  ['interior endpoint',b=>{const r=b.routes[0];r.points[0]=country(b,r.from).labelAt;}],
  ['off coast',b=>{b.routes[0].points[0]=[-10,-10];}],
  ['ambiguous boundary endpoint',b=>{
   let found=false;
   for(const r of b.routes){const p=country(b,r.from),island=b.islands.find(i=>i.id===p.island);
    const candidate=p.polygon.find(v=>location(v,island.polygon)===0&&b.provinces.some(q=>q.island===p.island&&q.id!==p.id&&location(v,q.polygon)===0));
    if(candidate){r.points[0]=candidate;found=true;break;}}
   assert.ok(found,'fixture must exercise a real shared coast junction');
  }],
  ['missing points',b=>delete b.routes[0].points],
  ['nonfinite endpoint',b=>b.routes[0].points[0]=[NaN,0]],
 ],
 water:[
  ['unrelated land entry',b=>{const r=b.routes[0],p=b.provinces.find(p=>p.island!==country(b,r.from).island&&p.island!==country(b,r.to).island);r.points.splice(1,0,p.labelAt);}],
  ['source land reentry',b=>{const r=b.routes[0];r.points.splice(1,0,country(b,r.from).labelAt);}],
 ],
 traceability:[
  ['crossing routes',b=>{const r=b.routes[0],a=r.points[0],z=r.points.at(-1);b.routes[1].points.splice(1,0,[(a[0]+z[0])/2,(a[1]+z[1])/2]);}],
  ['merged route geometry',b=>b.routes[1].points=structuredClone(b.routes[0].points)],
  ['shared-country ports merged',b=>{
   let found=false;
   for(let i=0;i<b.routes.length&&!found;i++)for(let j=i+1;j<b.routes.length&&!found;j++){
    const a=b.routes[i],c=b.routes[j],id=[a.from,a.to].find(id=>id===c.from||id===c.to);
    if(id){c.points[id===c.from?0:c.points.length-1]=structuredClone(a.points[id===a.from?0:a.points.length-1]);found=true;}}
   assert.ok(found,'fixture must exercise separate routes of one country');
  }],
  ['subpixel sea gap',b=>{const a=b.routes[0].points[0];b.routes[0].points=[a,[a[0]+0.5,a[1]]];}],
  ['zero length',b=>{const a=b.routes[0].points[0];b.routes[0].points=[a,a];}],
 ],
 preserved:[
  ['graph asymmetry',b=>b.provinces[0].borders.pop()],
  ['degree cap',b=>{const p=b.provinces[0];p.borders=b.provinces.filter(q=>q.id!==p.id).map(q=>q.id);}],
  ['wrong island size',b=>b.islands[0].provinces.pop()],
  ['labels overlap',b=>b.provinces[1].labelAt=structuredClone(b.provinces[0].labelAt)],
  ['small hit area',b=>b.provinces[0].hitSizeCss=39],
  ['small count text',b=>b.provinces[0].countTextCss=13],
  ['changed bonus',b=>b.islands[0].bonus+=1],
  ['fairness fortress',b=>{b.provinces[0].borders=[];b.provinces[0].seaLanes=[];}],
  ['cell overlap',b=>{const p=b.provinces[0],q=b.provinces.find(q=>q.id!==p.id&&q.island===p.island);q.polygon=structuredClone(p.polygon);}],
 ],
};
for(const [group,entries] of Object.entries(cases))for(const [name,mutate] of entries)test(`${group}: rejects ${name}`,()=>{
 const b=clone();mutate(b);assert.ok(checkConstraint(group,b).length>0,`${group} bypass: ${name}`);
});
