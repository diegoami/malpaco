import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkConstraint } from './contract.mjs';
import { graphFixture, addSea, removeSea, refreshBonuses } from './graph-fixture.mjs';

const cases = {
  counts: [
    ['country missing', b=>b.provinces.pop()],
    ['duplicate country ID', b=>b.provinces[1].id=b.provinces[0].id],
    ['duplicate island ID', b=>b.islands[1].id=b.islands[0].id],
    ['wrong partition size', b=>b.islands[0].provinces.pop()],
    ['country in two islands', b=>b.islands[1].provinces[0]=b.islands[0].provinces[0]],
    ['country island field mismatch', b=>b.provinces[0].island='i1'],
  ],
  symmetry: [
    ['one-way land edge', b=>b.provinces[0].borders.pop()],
    ['one-way sea edge', b=>b.provinces[0].seaLanes.pop()],
    ['self edge', b=>b.provinces[0].borders.push(b.provinces[0].id)],
    ['unknown endpoint', b=>b.provinces[0].borders.push('missing')],
    ['duplicate edge', b=>b.provinces[0].borders.push(b.provinces[0].borders[0])],
    ['land edge between islands', b=>{b.provinces[0].borders.push('i1p0');b.provinces.find(p=>p.id==='i1p0').borders.push('i0p0');}],
    ['sea edge within island', b=>addSea(b,'i0p0','i0p1')],
  ],
  connectivity: [
    ['disconnected country', b=>{for(const p of b.provinces){p.borders=p.borders.filter(id=>id!=='i8p5');p.seaLanes=p.seaLanes.filter(id=>id!=='i8p5');}const p=b.provinces.find(p=>p.id==='i8p5');p.borders=[];p.seaLanes=[];}],
    ['island land graph disconnected despite sea detour', b=>{for(const p of b.provinces.filter(p=>p.island==='i8'))p.borders=[];}],
    ['disconnected island graph', b=>{for(const r of [...b.routes])if(r.from.startsWith('i8')||r.to.startsWith('i8'))removeSea(b,r.from,r.to);}],
  ],
  degree: [
    ['degree below two', b=>{b.provinces[2].borders=[];b.provinces[2].seaLanes=[];}],
    ['degree above five', b=>{const p=b.provinces.find(p=>p.id==='i8p5');p.borders=['i8p0','i8p1','i8p2','i8p3','i8p4','i8p6'];}],
  ],
  crossings: [
    ['below fourteen', b=>{for(const r of [...b.routes].slice(0,3))removeSea(b,r.from,r.to);}],
    ['above eighteen', b=>{addSea(b,'i0p2','i4p2');addSea(b,'i1p2','i5p2');addSea(b,'i2p2','i6p2');}],
    ['missing rendered route', b=>b.routes.pop()],
    ['duplicate rendered route', b=>b.routes.push(structuredClone(b.routes[0]))],
    ['orphan rendered route', b=>b.routes.push({from:'i0p2',to:'i4p2'})],
  ],
  bonus: [
    ['bonus above size', b=>b.islands[0].bonus=4],
    ['incorrect entrance formula', b=>b.islands[0].bonus=2],
  ],
  fortress: [
    ['large single entrance', b=>singleEntrance(b,'i6')],
    ['four single-entrance islands', b=>{for(const id of ['i0','i1','i2','i3'])singleEntrance(b,id);}],
  ],
  concentration: [
    ['single entrances exceed quarter of bonuses', b=>{for(const i of b.islands)singleEntrance(b,i.id);refreshBonuses(b);}],
  ],
  remoteness: [
    ['five distinct island neighbours', b=>addSea(b,'i0p2','i4p2')],
    ['more than four hops', b=>{for(const r of [...b.routes])removeSea(b,r.from,r.to);for(let i=0;i<8;i++)addSea(b,`i${i}p0`,`i${i+1}p0`);}],
    ['unreachable island', b=>{for(const r of [...b.routes])if(r.from.startsWith('i8')||r.to.startsWith('i8'))removeSea(b,r.from,r.to);}],
  ],
  crowding: [
    ['third sea crossing', b=>{addSea(b,'i0p0','i4p2');}],
  ],
};
function singleEntrance(b, islandId) {
  const ids=b.islands.find(i=>i.id===islandId).provinces;
  const affected=b.routes.filter(r=>ids.includes(r.from)||ids.includes(r.to)).map(r=>({...r}));
  for(const r of affected)removeSea(b,r.from,r.to);
  for(const r of affected)addSea(b,ids[0],ids.includes(r.from)?r.to:r.from);
}
for (const [constraint, mutations] of Object.entries(cases)) {
  test(`${constraint}: positive graph control`,()=>assert.deepEqual(checkConstraint(constraint,graphFixture()),[]));
  for(const [name,mutate] of mutations)test(`${constraint}: rejects ${name}`,()=>{
    const board=graphFixture();mutate(board);
    assert.ok(checkConstraint(constraint,board).length>0,`${constraint} bypass: ${name}`);
  });
}
