import test from 'node:test';
import assert from 'node:assert/strict';
import * as timeline from '../src/timeline.js';
test('resident enters ahead of the camera and never becomes a close-up obstruction',()=>{
 assert.equal(typeof timeline.getResidentPose,'function');
 for(let p=.53;p<.7;p+=.002){const a=timeline.getResidentPose(p),c=timeline.getCamera(p);if(a.visible)assert.ok(Math.hypot(...a.position.map((v,i)=>v-c.position[i]))>2.4,'resident must stay clear of the story camera');}
 assert.ok(timeline.getResidentPose(.60).position[2]<1.9);
});
test('resident movement is deterministic and stops outside the arrival or departure chapters',()=>{
 assert.equal(typeof timeline.getResidentPose,'function');
 assert.deepEqual(timeline.getResidentPose(.60),timeline.getResidentPose(.60));
 for(const p of [0,.22,.47,.76,.99])assert.equal(timeline.getResidentPose(p).visible,false);
});
