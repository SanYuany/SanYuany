import test from 'node:test';
import assert from 'node:assert/strict';
import * as a from '../src/architecture-state.js';
test('story starts and ends with a complete exterior, revealing rooms before morning',()=>{
 assert.equal(typeof a.storyEnvelopeAlpha,'function');
 for(const [p,want] of [[0,1],[.02,1],[.08,0],[.22,0],[.66,0],[.9,0],[1,1]])assert.equal(a.storyEnvelopeAlpha(p),want);
});
test('exterior reveal is continuous and exactly reversible',()=>{
 const values=Array.from({length:1001},(_,i)=>a.storyEnvelopeAlpha(i/1000));
 assert.ok(values.every(x=>x>=0&&x<=1));
 for(let i=1;i<values.length;i++)assert.ok(Math.abs(values[i]-values[i-1])<.045);
 for(let i=1000;i>=0;i--)assert.equal(a.storyEnvelopeAlpha(i/1000),values[i]);
});
test('outside orbit starts at its existing independent camera with no jump',()=>{
 for(const mobile of [false,true]){
  const start=a.exteriorCamera(mobile),x=a.exteriorOrbitFrame(0,mobile),y=a.exteriorOrbitFrame(6000,mobile);
  for(let i=0;i<3;i++)assert.ok(Math.abs(x.position[i]-start.position[i])<1e-9);
  assert.deepEqual(x.target,start.target);assert.ok(Math.hypot(...x.position.map((v,i)=>v-y.position[i]))>3);
  assert.ok(Math.abs(Math.hypot(x.position[0]-x.target[0],x.position[2]-x.target[2])-Math.hypot(y.position[0]-y.target[0],y.position[2]-y.target[2]))<1e-8);
 }
});
test('orbit control limits do not silently crop the portrait exterior camera',()=>{
 for(const mobile of [false,true]){
  const p=a.exteriorCamera(mobile),distance=Math.hypot(...p.position.map((v,i)=>v-p.target[i]));
  assert.ok(a.exteriorMaxDistance(mobile)>distance);
 }
});
