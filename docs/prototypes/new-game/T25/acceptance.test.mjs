import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { audit, failures, source, diagnostics, edges } from './audit.mjs';
const fixture=()=>JSON.parse(readFileSync(new URL('./preflight/mock-board.json',import.meta.url)));
test('schematic control passes every contract and original identity/opening check',()=>assert.deepEqual(failures(audit(fixture())),[]));
test('a renamed identity is refused while all T24 groups still pass',()=>{const b=fixture();b.provinces[0].name='Invented';const r=audit(b);assert(Object.values(r.constraints).every(e=>!e.length));assert(r.identity.some(e=>e.includes('Identity changed')));});
test('changed opening armies, owner and production markers are each refused',()=>{
 for(const field of ['armies','owner','production']){const b=fixture();b.provinces[0][field]=field==='armies'?99:field==='owner'?'invented':!b.provinces[0].production;assert(audit(b).identity.some(e=>e.includes('Opening state changed')));}
});
test('island name and membership identity are protected',()=>{const b=fixture();b.islands[0].name='Invented';assert(audit(b).identity.some(e=>e.includes('Island identity changed')));});
test('diagnostics reconstruct exact edge differences and income rather than trusting metadata',()=>{
 const b=fixture(),d=diagnostics(b);
 for(const field of ['borders','seaLanes']) {
   assert.deepEqual(d.changes[field].current,edges(source,field));
   const delta=d.changes[field];assert.deepEqual([...delta.current.filter(e=>!delta.removed.includes(e)),...delta.added].sort(),edges(b,field));
 }
 assert.equal(d.countries.length,46);assert.equal(d.islands.length,9);
 assert(d.islands.every(i=>i.entrances.length>=2&&i.proposedBonus<=source.islands.find(s=>s.id===i.id).provinces.length));
});
