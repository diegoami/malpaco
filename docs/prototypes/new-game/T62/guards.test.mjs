import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkConstraint,segmentGap} from './contract.mjs';
import {checkConstraint as legacy} from '../T24/contract.mjs';
import {graphFixture,removeSea,addSea,refreshBonuses} from '../T24/graph-fixture.mjs';
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const small=()=>({bounds:{x:0,y:0,width:800,height:460},
 provinces:[{id:'a',island:'left',polygon:rect(0,0,100,100)},{id:'c',island:'left',polygon:rect(0,100,100,50)},{id:'b',island:'right',polygon:rect(140,0,100,150)}].map(p=>({...p,borders:[],seaLanes:[]})),
 islands:[{id:'left',provinces:['a','c'],polygon:rect(0,0,100,150)},{id:'right',provinces:['b'],polygon:rect(140,0,100,150)}],
 routes:[{from:'a',to:'b',points:[[100,50],[140,50]]}]});
const only=(group,b,prefix)=>{const errors=checkConstraint(group,b);assert.ok(errors.length);assert.ok(errors.every(e=>e.startsWith(prefix)),JSON.stringify(errors));};
test('attachment: whole inward continuation accepts 12px and rejects a shallow country',()=>{
 const b=small();assert.deepEqual(checkConstraint('attachment',b),[]);
 b.provinces[0].polygon=rect(89,0,11,100);
 only('attachment',b,'Inward 12px');
});
test('attachment: inward segment cannot exit and re-enter before its interior final sample',()=>{
 const b=small();b.provinces[0].polygon=[[0,0],[100,0],[100,100],[95,100],[95,49],[94,49],[94,100],[0,100]];
 only('attachment',b,'Inward 12px');
});
test('attachment: competing-country margin includes its 8px edge',()=>{
 const b=small();b.routes[0].points=[[100,92],[140,92]];
 assert.deepEqual(checkConstraint('attachment',b),[]);
 b.routes[0].points=[[100,92.001],[140,92.001]];
 only('attachment',b,'Competing-country margin');
});
test('attachment: a country boundary inside its silhouette is not exposed coast',()=>{
 const b=small();b.islands[0].polygon=rect(-10,-10,120,170);
 only('attachment',b,'Endpoint not on intended exposed coast');
});
test('attachment: zero-length first segment has no inward direction',()=>{
 const b=small();b.routes[0].points.splice(1,0,[100,50]);only('attachment',b,'No inward direction');
});
test('water: 10px unrelated clearance accepts its boundary and rejects 0.001px below',()=>{
 const b=small();b.islands.push({id:'third',provinces:['d'],polygon:rect(110,60,20,20)});b.provinces.push({id:'d',island:'third',borders:[],seaLanes:[],polygon:rect(110,60,20,20)});
 assert.deepEqual(checkConstraint('water',b),[]);
 b.islands.at(-1).polygon=b.provinces.at(-1).polygon=rect(110,59.999,20,20);
 assert.deepEqual(legacy('intersections',b),[]);only('water',b,'Unrelated-coast clearance');
});
test('water: an isolated tangent to a source coast is rejected by retained legacy rule',()=>{
 const b=small();b.routes[0].points.splice(1,0,[110,160],[100,150],[120,160]);
 assert.ok(checkConstraint('water',b).some(e=>e.startsWith('Route touches unrelated coast')));
});
test('traceability: minimum direct endpoint span includes 20px boundary',()=>{
 const b=small();b.routes[0].points=[[100,200],[120,200]];assert.deepEqual(checkConstraint('traceability',b),[]);
 b.routes[0].points.at(-1)[0]=119.999;only('traceability',b,'Endpoint span');
});
test('traceability: a long loop cannot disguise a subpixel endpoint gap',()=>{
 const b=small();b.routes[0].points=[[100,200],[100,300],[200,300],[100.5,200]];only('traceability',b,'Endpoint span');
});
test('traceability: all pairs including shared-country routes need 10px separation',()=>{
 const b=small();b.routes[0].points=[[100,200],[140,200]];b.routes.push({from:'a',to:'b',points:[[110,210],[130,210]]});
 assert.deepEqual(checkConstraint('traceability',b),[]);b.routes[1].points.forEach(p=>p[1]-=.001);only('traceability',b,'Route separation');
});
test('traceability: crossing, collinear containment and endpoint contacts have zero gap',()=>{
 for(const args of [ [[0,0],[10,10],[0,10],[10,0]],[[0,0],[100,0],[20,0],[30,0]],[[0,0],[10,0],[10,0],[20,10]] ])assert.equal(segmentGap(...args),0);
});
test('traceability: nonadjacent self-crossing is rejected',()=>{
 const b=small();b.routes[0].points=[[100,200],[150,250],[100,250],[150,200]];only('traceability',b,'Self-contact');
});
test('traceability: positive adjacent backtracking is rejected but forward collinearity passes',()=>{
 const b=small();b.routes[0].points=[[100,200],[120,200],[140,200]];assert.deepEqual(checkConstraint('traceability',b),[]);
 b.routes[0].points=[[100,200],[150,200],[140,200]];only('traceability',b,'Backtracking adjacent segments');
});
test('traceability: zero-length intermediate segment cannot hide behind valid span',()=>{
 const b=small();b.routes[0].points=[[100,200],[100,200],[140,200]];
 assert.ok(checkConstraint('traceability',b).some(e=>e.startsWith('Zero-length segment')));
});
test('groups: malformed route data and frame are rejected independently',()=>{
 for(const group of ['attachment','water','traceability'])for(const mutate of [b=>delete b.routes[0].points,b=>b.routes[0].points[0]=[Infinity,0],b=>b.bounds.width=0,b=>b.islands[0].polygon=[]]){
  const b=small();mutate(b);assert.ok(checkConstraint(group,b).length,group);
 }
});
const a=()=>JSON.parse(fs.readFileSync(new URL('../T60/evidence/build-LrdPTV/coast-first.json',import.meta.url)));
const singleEntrance=(b,islandId)=>{
 const ids=b.islands.find(i=>i.id===islandId).provinces,affected=b.routes.filter(r=>ids.includes(r.from)||ids.includes(r.to)).map(r=>({...r}));
 for(const r of affected)removeSea(b,r.from,r.to);
 for(const r of affected)addSea(b,ids[0],ids.includes(r.from)?r.to:r.from);
};
// Exact per-category messages prove a fairness refusal cannot be masked by a
// simultaneous graph refusal. The expected category list is independent of the
// implementation's delegation list; deleting any delegation loses messages.
const unaffected=['counts','symmetry','connectivity','degree','cells','borders','crossings','bonus','fortress','concentration','remoteness','crowding','labels'];
const mutations={
 counts:[a,b=>b.islands[0].provinces.pop()],
 symmetry:[a,b=>b.provinces[0].borders.pop()],
 connectivity:[a,b=>{for(const p of b.provinces){p.borders=[];p.seaLanes=[];}}],
 degree:[a,b=>{b.provinces[0].borders=[];b.provinces[0].seaLanes=[];}],
 cells:[a,b=>b.provinces[1].polygon=structuredClone(b.provinces[0].polygon)],
 borders:[a,b=>b.provinces[0].borders.pop()],
 crossings:[a,b=>b.routes.pop()],
 bonus:[a,b=>b.islands[0].bonus+=1],
 fortress:[graphFixture,b=>singleEntrance(b,'i6')],
 concentration:[graphFixture,b=>{for(const i of b.islands)singleEntrance(b,i.id);refreshBonuses(b);}],
 remoteness:[graphFixture,b=>addSea(b,'i0p2','i4p2')],
 crowding:[graphFixture,b=>addSea(b,'i0p0','i4p2')],
 labels:[a,b=>b.provinces[0].countContrast=4.4],
};
for(const [category,[make,mutate]] of Object.entries(mutations))test(`preserved: exact legacy ${category} delegation on meaningful mutant`,()=>{
 const b=make();mutate(b);assert.ok(legacy(category,b).length,`control must actually violate ${category}`);
 const expected=unaffected.flatMap(n=>legacy(n,b).map(e=>`${n}: ${e}`));
 assert.deepEqual(checkConstraint('preserved',b),expected);
});
