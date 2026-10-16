import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { audit, failures, baseline, expected, namedPair } from './audit.mjs';
const mock=JSON.parse(readFileSync(new URL('./preflight/rotation-probe/build-W3XJay/board.json',import.meta.url)));
test('T25 is meaningfully rejected: wrong links and absent rotations',()=>{
  const errors=failures(audit(baseline));assert(errors.some(e=>e.includes('Sea changes')));assert(errors.some(e=>e.includes('North must rotate')));assert(errors.some(e=>e.includes('Cliff must rotate')));
});
test('rotated mock satisfies unchanged T24 and revised owner contract',()=>assert.deepEqual(failures(audit(mock)),[]));
test('exact approved edge delta is independently named',()=>{
  assert.equal(expected.added.length,2);assert.equal(expected.removed.length,3);
  assert(expected.removed.includes(namedPair('South fell','Marsh keep')));
});
test('an unapproved extra change is rejected',()=>{
  const b=structuredClone(mock);const [a,c]=[b.provinces[0],b.provinces[1]];a.seaLanes.push(c.id);c.seaLanes.push(a.id);
  assert(failures(audit(b)).some(e=>e.includes('Sea changes')));
});
test('identity and opening guards remain active',()=>{
  const b=structuredClone(mock);b.provinces[0].name='Invented';b.provinces[1].armies++;
  const errors=failures(audit(b));assert(errors.some(e=>e.includes('Identity changed')));assert(errors.some(e=>e.includes('Opening state changed')));
});
test('bonus guard remains active',()=>{const b=structuredClone(mock);b.islands[4].bonus++;assert(failures(audit(b)).some(e=>e.includes('Invalid bonus')));});
test('changed frame and land adjacency each reject independently',()=>{
  const b=structuredClone(mock);b.bounds.width++;assert(failures(audit(b)).some(e=>e.includes('Comparison frame')));
  const c=structuredClone(mock);c.provinces[0].borders=[];assert(failures(audit(c)).some(e=>e.includes('Land edges changed')));
});
test('both actual coast rotations are enforced independently',()=>{
  for(const [id,message] of [['island_0','North must rotate'],['island_7','Cliff must rotate']]){
    const b=structuredClone(mock),i=b.islands.find(i=>i.id===id);
    for(const country of i.provinces)b.provinces.find(p=>p.id===country).polygon=baseline.provinces.find(p=>p.id===country).polygon;
    assert(failures(audit(b)).some(e=>e.includes(message)));
  }
});
