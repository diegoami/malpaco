// Parent-owned acceptance. Retain assertions through implementation.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {audit,failures,selected} from './audit.mjs';
import {inspect} from '../T62/contract.mjs';
test('selected A retains every adopted group and exact identity',()=>{const b=selected(),r=audit(b);assert.deepEqual(r.constraints,inspect(b));assert.deepEqual(failures(r),[]);assert.equal(r.landEdges,61);assert.equal(r.seaLinks,15);});
for(const [name,mutate] of [
 ['opening armies',b=>b.provinces[0].armies++],['owner',b=>b.provinces[0].owner='other'],['production',b=>b.provinces[0].production=!b.provinces[0].production],['bonus',b=>b.islands[0].bonus++],['land graph',b=>b.provinces[0].borders.pop()],['sea graph',b=>b.provinces.find(p=>p.seaLanes.length).seaLanes.pop()],['geometry',b=>b.provinces[0].polygon=[]],['label reservation',b=>b.provinces[0].labelAt=[0,0]],
])test(`rejects changed ${name} and keeps independent constraint diagnostics`,()=>{const b=selected();mutate(b);const r=audit(b);assert.deepEqual(r.constraints,inspect(b));assert.ok(r.identity.length);assert.ok(failures(r).length);});
