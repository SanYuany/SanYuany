import test from 'node:test';import assert from 'node:assert/strict';
import * as state from '../src/architecture-state.js';
import * as T from '../vendor/three/three.module.min.js';
test('exterior camera has an independently composed portrait contract',()=>{assert.equal(typeof state.exteriorCamera,'function','exteriorCamera is missing: current outside view crops the house');});
if(state.exteriorCamera){for(const mobile of [false,true])test(`${mobile?'portrait':'desktop'} exterior contains the complete site inside the clear viewing area`,()=>{
 const pose=state.exteriorCamera(mobile),w=mobile?390:1280,h=mobile?844:800;
 const c=new T.PerspectiveCamera(mobile?46:43,w/h,.065,150);c.position.set(...pose.position);c.lookAt(...pose.target);c.setViewOffset(w,h,w*pose.offset[0],h*pose.offset[1],w,h);c.updateMatrixWorld();
 for(const x of [-8.15,9.35])for(const y of [-.7,7.3])for(const z of [-7.1,7.5]){const p=new T.Vector3(x,y,z).project(c),sx=(p.x+1)/2,sy=(1-p.y)/2;assert.ok(sx>=(mobile?.02:.20)&&sx<=.98,'whole site should remain inside horizontal viewport');assert.ok(sy>.10&&sy<(mobile?.55:.92),'exterior clears header and bottom controls');}
});}
