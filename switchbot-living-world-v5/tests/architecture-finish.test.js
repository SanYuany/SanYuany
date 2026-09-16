import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const modulePath=new URL('../src/architecture-state.js',import.meta.url);
test('architectural view module exists so the model can have a finished exterior',()=>{
 assert.ok(existsSync(modulePath),'missing architecture-state.js: exterior/cutaway behavior not implemented');
});
if(existsSync(modulePath)){
 const {resolveEnvelope,seededRandom}=await import(modulePath);
 test('outside shows finished walls and roof of the same house',()=>{
  assert.deepEqual(resolveEnvelope({mode:'explore',room:'outside',floor:'all'}),{closed:true,roof:true});
 });
 test('story and room viewpoints keep the cutaway clear',()=>{
  for(const room of ['all','bedroom','living','entrance','outside'])assert.equal(resolveEnvelope({mode:'story',room,floor:'all'}).closed,false);
  for(const room of ['all','bedroom','living','entrance'])assert.equal(resolveEnvelope({mode:'explore',room,floor:'all'}).closed,false);
 });
 test('floor isolation never closes the selected room behind facade',()=>{
  for(const floor of ['1','2'])assert.equal(resolveEnvelope({mode:'explore',room:'outside',floor}).closed,false);
 });
 test('material sampling is deterministic without modifying global random',()=>{
  const a=seededRandom(1701),b=seededRandom(1701),c=seededRandom(1702);
  const first=Array.from({length:500},a),second=Array.from({length:500},b);
  assert.deepEqual(first,second);assert.ok(first.every(x=>x>=0&&x<1));assert.notDeepEqual(first,Array.from({length:500},c));
 });
}
