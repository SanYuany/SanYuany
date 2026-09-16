import test from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../src/architecture-state.js';

test('front gable stays under both roof panels instead of protruding through them',()=>{
 assert.equal(typeof policy.gableProfile,'function','gable must be derived from the actual roof plane');
 for(const [x,y] of policy.gableProfile()){
  const underside=6.81-Math.tan(.22)*(Math.abs(x)-2.52)-.07/Math.cos(.22);
  assert.ok(y<underside,`gable at ${x} penetrates roof: ${y} >= ${underside}`);
 }
});
test('leaf shape stays centimetre-scale even under scaled garden parents',()=>{
 assert.equal(typeof policy.gardenLeafScale,'function','parent scaling must not make metre-wide leaves');
 for(const parent of [1,1.5,2.2])for(const seed of [0,.5,1]){
  const [x,y,z]=policy.gardenLeafScale(parent,seed);
  assert.ok(x>0&&y>0&&z>0);
  assert.ok(2*y*parent<=.14,'longest leaf dimension is capped at 14 cm');
  assert.ok(2*x*parent<=.10,'leaf width is capped at 10 cm');
 }
});
