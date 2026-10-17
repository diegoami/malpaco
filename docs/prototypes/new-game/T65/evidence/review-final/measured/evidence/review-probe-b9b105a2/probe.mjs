// Reviewer independent probe: verify the shared-boundary invariants that the task protects
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {simple} from '../../../T24/geometry.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const T64=JSON.parse(fs.readFileSync(path.join(root,'../../../T64/board.json')));
const T65=JSON.parse(fs.readFileSync(path.join(root,'../../../T65/board.json')));
const T63=JSON.parse(fs.readFileSync(path.join(root,'../../../T63/board.json')));
const key=(a,b)=>[JSON.stringify(a),JSON.stringify(b)].sort().join('|');
const rows=[];

// 1. T64 vs T65 metadata identity (coast, ports, routes, labels)
{
 const sem=b=>({...b,provinces:b.provinces.map(({polygon,...p})=>p)});
 rows.push({check:'T64-T65-semantic-identity',match:JSON.stringify(sem(T64))===JSON.stringify(sem(T65))});
}

// 2. Contact graph identity
{
 const owner=new Map();
 for(const p of T65.provinces)for(let j=0;j<p.polygon.length;j++){
  const a=p.polygon[j],b=p.polygon[(j+1)%p.polygon.length];
  const k=key(a,b);
  const s=owner.get(k)||new Set();s.add(p.id);owner.set(k,s);
 }
 const pairs=new Set();
 for(const [k,o] of owner)if(o.size===2)pairs.add([...o].sort().join('|'));
 const declared=new Set();
 for(const p of T65.provinces)for(const id of p.borders)declared.add([p.id,id].sort().join('|'));
 rows.push({check:'contact-graph-identity',pairsFromGeometry:pairs.size,pairsDeclared:declared.size,match:pairs.size===declared.size&&[...pairs].every(p=>declared.has(p))});
}

// 3. Per-segment opposite orientation
{
 const owner=new Map();
 for(const p of T65.provinces)for(let j=0;j<p.polygon.length;j++){
  const a=p.polygon[j],b=p.polygon[(j+1)%p.polygon.length];
  const k=key(a,b);
  const o=owner.get(k)||[];
  o.push({id:p.id,dir:j,a,b});
  owner.set(k,o);
 }
 let bad=0;
 for(const [k,owners] of owner){
  if(owners.length!==2)continue;
  const [a,b]=k.split('|').map(JSON.parse);
  const direction=owners.map(o=>{
   const p=T65.provinces.find(p=>p.id===o.id);
   return p.polygon.some((v,j)=>JSON.stringify(v)===JSON.stringify(a)&&JSON.stringify(p.polygon[(j+1)%p.polygon.length])===JSON.stringify(b));
  });
  if(direction[0]===direction[1])bad++;
 }
 rows.push({check:'shared-edge-opposite-orientation',twoOwnerEdges:[...owner.values()].filter(o=>o.length===2).length,sameDirectionCount:bad});
}

// 4. Within-province vertex uniqueness
{
 let aliased=0;
 for(const p of T65.provinces){
  const us=new Set(p.polygon.map(JSON.stringify));
  if(us.size!==p.polygon.length)aliased++;
 }
 rows.push({check:'within-province-vertex-uniqueness',aliasedProvinces:aliased});
}

// 5. Simple polygons (no self-intersection)
{
 const badP=T65.provinces.filter(p=>!simple(p.polygon)).map(p=>p.id);
 const badI=T65.islands.filter(i=>!simple(i.polygon)).map(i=>i.id);
 rows.push({check:'simple-polygons',badProvinces:badP,badIslands:badI});
}

// 6. T63 vs T65 polygons: T65 polygons are NOT identical to T63 (T64 changed them); we just verify T63's contact graph is preserved by T65.
{
 const declared63=new Set();
 for(const p of T63.provinces)for(const id of p.borders)declared63.add([p.id,id].sort().join('|'));
 const declared65=new Set();
 for(const p of T65.provinces)for(const id of p.borders)declared65.add([p.id,id].sort().join('|'));
 const sameSize=declared63.size===declared65.size;
 const sameElements=sameSize&&[...declared63].every(p=>declared65.has(p));
 rows.push({check:'T63-T65-contact-graph-identity',T63pairs:declared63.size,T65pairs:declared65.size,identical:sameElements});
}

// 7. One border retained straight, 60 bent
{
 const owner=new Map();
 for(const p of T65.provinces)for(let j=0;j<p.polygon.length;j++){
  const a=p.polygon[j],b=p.polygon[(j+1)%p.polygon.length];
  const k=key(a,b);
  const o=owner.get(k)||[];
  o.push({id:p.id,dir:j});
  owner.set(k,o);
 }
 const shared=[...owner.values()].filter(o=>o.length===2 && new Set(o.map(x=>x.id)).size===2);
 const subCount=new Map();
 for(const o of shared){
  const pair=[...o.map(x=>x.id)].sort().join('|');
  subCount.set(pair,(subCount.get(pair)||0)+1);
 }
 let bent=0,straight=0;
 const straightPairs=[];
 for(const [pair,c] of subCount){
  if(c===1)straight++;
  else bent++;
  if(c===1)straightPairs.push(pair);
 }
 const straightNames=straightPairs.map(pair=>pair.split('|').map(id=>T65.provinces.find(p=>p.id===id).name).join(' / '));
 rows.push({check:'bend-straight-count',bent,straight,straightPairs,straightNames});
}

// 8. Determinism: re-run naturalizeBorders twice with same input and seed -> identical bytes
{
 const {naturalizeBorders}=await import('../../../T65/borders.mjs');
 const a=JSON.stringify(naturalizeBorders(T64));
 const b=JSON.stringify(naturalizeBorders(T64));
 rows.push({check:'deterministic-output',match:a===b,bytes:a.length});
}

// 9. Verify the bent border vertex count distribution (sanity)
{
 // For each shared pair, the min subdivision count should match expected range
 const owner=new Map();
 for(const p of T65.provinces)for(let j=0;j<p.polygon.length;j++){
  const a=p.polygon[j],b=p.polygon[(j+1)%p.polygon.length];
  const k=key(a,b);
  const o=owner.get(k)||[];
  o.push({id:p.id,dir:j});
  owner.set(k,o);
 }
 const shared=[...owner.values()].filter(o=>o.length===2 && new Set(o.map(x=>x.id)).size===2);
 const subCount=new Map();
 for(const o of shared){
  const pair=[...o.map(x=>x.id)].sort().join('|');
  subCount.set(pair,(subCount.get(pair)||0)+1);
 }
 const counts=[...subCount.values()];
 const maxSub=Math.max(...counts);
 const minSub=Math.min(...counts);
 const mean=counts.reduce((s,c)=>s+c,0)/counts.length;
 rows.push({check:'subdivision-distribution',min:minSub,max:maxSub,mean:mean.toFixed(2)});
}

// 10. Verify T62 inspect passes (sanity check on the actual T65 board)
{
 const {inspect}=await import('../../../T62/contract.mjs');
 const checks=inspect(T65);
 const total=Object.values(checks).reduce((s,a)=>s+a.length,0);
 rows.push({check:'T62-inspect',totalErrors:total,errors:checks});
}

fs.writeFileSync(path.join(root,'report.json'),JSON.stringify({rows},null,2)+'\n');
console.log(JSON.stringify(rows,null,2));
