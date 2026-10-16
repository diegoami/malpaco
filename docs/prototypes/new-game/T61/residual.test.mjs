import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {exposedSegments,segmentPieces} from '../T24/geometry.mjs';
import {checkConstraint} from '../T24/contract.mjs';
import {witness} from '../T24/witness.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
for(const [name,path] of [['A','../T60/evidence/build-LrdPTV/coast-first.json'],['T25','../T25/evidence/build-KGBcrF/board.json']]) {
 test(`coincident: retained ${name} subdivision`,()=>assert.deepEqual(checkConstraint('cells',read(path)),[]));
}
for(const reverse of [false,true])test(`coincident: sloped full shared edge reversed=${reverse}`,()=>{
 const a=[101.2,81.3],b=[173.7,127.9];
 const p={id:'p',island:'i',polygon:[a,b,[80,160]]};
 const q={id:'q',island:'i',polygon:reverse?[b,a,[190,40]]:[a,b,[190,40]]};
 const segments=exposedSegments(p,{provinces:[p,q]});
 assert.equal(segments.length,2);
 assert.ok(segments.every(({a,b})=>a[0]!==b[0]||a[1]!==b[1]));
});
test('real-gap: tiny interior slit remains rejected below area tolerance',()=>{
 const b=witness();b.provinces[0].polygon=[[40,25],[90,25],[90,49],[89.99999,49],[89.99999,50],[90,50],[90,75],[40,75]];
 const errors=checkConstraint('cells',b);
 assert.ok(errors.some(e=>e.startsWith('Explicit interior gap')));
 assert.ok(!errors.some(e=>e.includes('area mismatch')));
});
test('real-gap: shortened shared edge retains positive exposed interval',()=>{
 const p={id:'p',island:'i',polygon:[[0,0],[10,0],[0,10]]};
 const q={id:'q',island:'i',polygon:[[0.00001,0],[10,0],[10,-10]]};
 assert.ok(exposedSegments(p,{provinces:[p,q]}).some(({a,b})=>a[1]===0&&b[1]===0&&b[0]>a[0]));
});
test('real-overlap: tiny positive-area overlap remains rejected',()=>{
 const b=witness();b.provinces[0].polygon[1][0]+=0.000003;b.provinces[0].polygon[2][0]+=0.000003;
 assert.ok(checkConstraint('cells',b).some(e=>e.startsWith('Cell overlap')));
});
