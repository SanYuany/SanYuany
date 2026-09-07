import test from 'node:test';
import assert from 'node:assert/strict';
import { scenes, rooms, products } from '../src/data.js';

test('ships exactly four approved hero scenes in narrative order', () => {
  assert.deepEqual(scenes.map(s => s.id), ['morning','leaving','coming-home','good-night']);
});

test('every scene has a camera path, consumer message, and commerce tiers', () => {
  for (const scene of scenes) {
    assert.ok(scene.camera.length >= 2, scene.id);
    assert.ok(scene.headline.length > 0, scene.id);
    assert.ok(scene.essential.length >= 1, scene.id);
    assert.ok(Array.isArray(scene.recommended), scene.id);
    assert.ok(Array.isArray(scene.upgrade), scene.id);
  }
});

test('all referenced product ids resolve', () => {
  const ids = new Set(products.map(p => p.id));
  for (const scene of scenes) {
    for (const id of [...scene.essential, ...scene.recommended, ...scene.upgrade]) {
      assert.ok(ids.has(id), `${scene.id} references unknown ${id}`);
    }
  }
});

test('rooms expose scene-driven exploration, not product-first navigation', () => {
  assert.ok(rooms.every(r => r.scenes?.length));
  assert.ok(rooms.every(r => !('products' in r)));
});
