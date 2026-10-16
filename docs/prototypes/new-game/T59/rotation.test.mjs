import test from 'node:test';
import assert from 'node:assert/strict';
import {rotation,rotatePoint,islandTransform} from './rotation.mjs';
test('positive screen rotation is clockwise, negative anticlockwise',()=>{
  const cw=rotatePoint([20,10],[10,10],rotation(10)),ccw=rotatePoint([20,10],[10,10],rotation(-10));
  assert(cw[1]>10);assert(ccw[1]<10);assert(Math.abs(rotation(10).actualDegrees-10)<.2);
});
test('zero preserves vertices and arbitrary translations preserve shared boundaries',()=>{
  assert.deepEqual(rotatePoint([1,2],[5,6],rotation(0)),[1,2]);
  const transform=islandTransform({x:12,y:15,width:272,height:152,degrees:10});
  const shared=[90,76];assert.deepEqual(transform([...shared]),transform(shared));
  assert.deepEqual(transform([136,76]),[148,91]);
});
test('configured small angles vary and unreasonable/nonfinite values reject',()=>{
  assert.notEqual(rotation(5).actualDegrees,rotation(10).actualDegrees);
  for(const n of [NaN,Infinity,11,-11])assert.throws(()=>rotation(n));
});
