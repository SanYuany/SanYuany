import test from 'node:test';
import assert from 'node:assert/strict';
import * as state from '../src/architecture-state.js';
test('envelope fade uses elapsed time, is bounded, and completes despite dropped frames',()=>{
 assert.equal(typeof state.envelopeAt,'function');
 assert.equal(state.envelopeAt(1,0,0),1);
 assert.equal(state.envelopeAt(1,0,1200),0);
 assert.equal(state.envelopeAt(1,0,600),.5);
 assert.equal(state.envelopeAt(0,1,99999),1);
 assert.equal(state.envelopeAt(0,1,-10),0);
});
test('an interrupted reveal continues from the current amount without a pop',()=>{
 assert.equal(typeof state.envelopeAt,'function');
 const mid=state.envelopeAt(1,0,300);
 assert.equal(state.envelopeAt(mid,1,0),mid);
 assert.ok(state.envelopeAt(mid,1,400)>mid);
});
test('reduced motion completes immediately and room/floor changes never leave opaque walls',()=>{
 assert.equal(typeof state.envelopeAt,'function');
 assert.equal(state.envelopeAt(1,0,0,true),0);
 assert.equal(state.resolveEnvelope({mode:'explore',room:'outside',floor:'all',override:false}).closed,false);
 assert.equal(state.resolveEnvelope({mode:'explore',room:'all',floor:'all',override:true}).closed,true);
 assert.equal(state.resolveEnvelope({mode:'story',room:'outside',override:true}).closed,false);
 assert.equal(state.resolveEnvelope({mode:'explore',room:'bedroom',floor:'2',override:true}).closed,false);
});
