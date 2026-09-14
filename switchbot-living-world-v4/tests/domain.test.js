import test from 'node:test';
import assert from 'node:assert/strict';
const timeline = await import('../src/timeline.js').catch(()=>({}));
const planner = await import('../src/planner.js').catch(()=>({}));
test('story computes physical states, not only labels',()=>{
  assert.equal(typeof timeline.getState,'function');
  const morning=timeline.getState(.2), night=timeline.getState(1);
  assert.ok(morning.curtain>.9);
  assert.equal(night.curtain,0);
  assert.equal(night.door,0);
  assert.equal(night.locked,true);
});
test('return animation is deterministic when scroll reverses',()=>{
  assert.equal(typeof timeline.getState,'function');
  const a=timeline.getState(.68);timeline.getState(.95);
  assert.deepEqual(timeline.getState(.68),a);
});
test('return lights follow door opening; never claim automatic door hardware',()=>{
  assert.equal(typeof timeline.getState,'function');
  const before=timeline.getState(.53), open=timeline.getState(.59), home=timeline.getState(.7);
  assert.equal(before.entry,0);assert.ok(open.door>.8);
  assert.ok(home.entry>.9);assert.ok(home.living>.9);
});
test('camera path is finite and continuous across 1000 scrub positions',()=>{
  assert.equal(typeof timeline.getCamera,'function');
  let previous=timeline.getCamera(0,false);
  for(let i=1;i<=1000;i++){
    const next=timeline.getCamera(i/1000,false);
    assert.ok([...next.position,...next.target].every(Number.isFinite));
    assert.ok(Math.hypot(...next.position.map((v,k)=>v-previous.position[k]))<.7);
    previous=next;
  }
  assert.notDeepEqual(timeline.getCamera(.2,true),timeline.getCamera(.2,false));
});
test('split curtains need two motors and owned devices are not added twice',()=>{
  assert.equal(typeof planner.buildPlan,'function');
  const a=planner.buildPlan({scenes:['morning','good-night'],curtainWindows:2,split:true,owned:{curtain:1,hub:1},compatibleLight:true});
  assert.equal(a.products.find(p=>p.id==='curtain').quantity,4);
  assert.equal(a.products.find(p=>p.id==='curtain').toBuy,3);
  assert.equal(a.products.find(p=>p.id==='hub').toBuy,0);
});
test('hands-free scene requires face keypad; hub shared across scene bundles',()=>{
  assert.equal(typeof planner.buildPlan,'function');
  const a=planner.buildPlan({scenes:['coming-home','leaving','good-night'],curtainWindows:1,split:false,owned:{},compatibleLight:true});
  assert.ok(a.products.find(p=>p.id==='keypad').quantity>=1);
  assert.equal(a.products.find(p=>p.id==='hub').quantity,1);
  assert.equal(new Set(a.products.map(p=>p.id)).size,a.products.length);
});
test('planner clamps counts and rejects unrecognized scenes',()=>{
  assert.equal(typeof planner.buildPlan,'function');
  const a=planner.buildPlan({scenes:['unknown','morning'],curtainWindows:-10,split:false,owned:{curtain:999}});
  assert.deepEqual(a.scenes,['morning']);
  assert.ok(a.products.every(p=>p.toBuy>=0 && p.quantity>=1));
});

test('coming-home hero sightline clears the front-centre post on both layouts',()=>{for(const mobile of [false,true]){const c=timeline.getCamera(.71,mobile),t=(c.position[2]-3.5)/(c.position[2]-c.target[2]);const x=c.position[0]+(c.target[0]-c.position[0])*t;assert.ok(Math.abs(x-.05)>.25,'Centre sightline must not meet the timber post');}});
