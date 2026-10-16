import test from 'node:test';
import assert from 'node:assert/strict';
import {measure} from './measure.mjs';
const square=(x,y)=>[[x,y],[x+2,y],[x+2,y+2],[x,y+2]];
const fixture=()=>({islands:[{id:'a',polygon:square(-4,-4)},{id:'b',polygon:square(20,20)},{id:'c',polygon:square(4,4)}],provinces:[{id:'a1',name:'A',island:'a',polygon:square(-4,-4)},{id:'b1',name:'B',island:'b',polygon:square(20,20)}],routes:[{from:'a1',to:'b1',points:[[0,0],[10,0],[10,10]]}]});
test('route metrics use actual length, direct distance and bends',()=>{
  const result=measure(fixture()),r=result.routes[0];assert.equal(r.length,20);assert.equal(r.direct,Math.sqrt(200));assert.equal(r.bends,1);assert(Math.abs(r.detourRatio-Math.sqrt(2))<1e-12);assert.equal(r.unrelatedCoastClearance,4);
});
test('crossing routes have zero separation; a separated parallel route does not',()=>{
  const board=fixture();board.routes.push({from:'b1',to:'a1',points:[[5,-1],[5,1]]});assert.equal(measure(board).interactions[0].closestDistance,0);
  board.routes[1].points=[[1,2],[8,2]];assert.equal(measure(board).interactions[0].closestDistance,2);
});
