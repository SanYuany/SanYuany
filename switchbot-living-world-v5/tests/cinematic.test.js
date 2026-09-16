import test from 'node:test';
import assert from 'node:assert/strict';
import * as timeline from '../src/timeline.js';
const inside=(p)=>Math.abs(p[0])<4.75 && p[2]<3.45 && p[2]>-3.45;
test('desktop camera actually enters the upper bedroom and the ground-floor living room',()=>{
 const b=timeline.getCamera(.22);const l=timeline.getCamera(.71);
 assert.ok(inside(b.position),'bedroom camera must cross the open front, not only zoom from outside');
 assert.ok(inside(l.position),'living camera must cross the open front');
 assert.ok(b.position[1]>4.4 && b.position[1]<5.4);
 assert.ok(l.position[1]>1.5 && l.position[1]<2.5);
});
test('mobile has independent composed keys, not just a distance-scaled desktop camera',()=>{
 assert.ok(Array.isArray(timeline.mobileCameraKeys),'independent portrait track is required');
 const a=timeline.getCamera(.71),b=timeline.getCamera(.71,true);
 assert.notDeepEqual(a.target,b.target);
});
test('camera path remains finite and frame-continuous when seeking both directions',()=>{
 for(const mobile of [false,true]){let prev=timeline.getCamera(0,mobile);for(let i=1;i<=1600;i++){
 const curr=timeline.getCamera(i/1600,mobile);
 assert.ok(curr.position.every(Number.isFinite));assert.ok(curr.target.every(Number.isFinite));
 assert.ok(Math.hypot(...curr.position.map((x,k)=>x-prev.position[k]))<.55,'no spatial cut');prev=curr;
 }assert.deepEqual(timeline.getCamera(.43,mobile),timeline.getCamera(.43,mobile));}
});
