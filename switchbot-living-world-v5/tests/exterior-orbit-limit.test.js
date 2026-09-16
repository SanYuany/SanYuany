import test from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../src/architecture-state.js';
test('exterior orbit limits preserve the full portrait camera distance instead of clamping to 37',()=>{
 assert.equal(typeof A.exteriorNavigation,'function');
 for(const mobile of [false,true]){const p=A.exteriorCamera(mobile);const d=Math.hypot(...p.position.map((v,i)=>v-p.target[i]));const n=A.exteriorNavigation(mobile);assert.ok(n.maxDistance>d);assert.ok(n.fogNear>d+10);assert.ok(n.fogFar>n.fogNear);}
});
