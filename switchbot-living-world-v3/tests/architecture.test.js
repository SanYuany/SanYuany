import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const world = fs.readFileSync(new URL('../src/three-world.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

test('uses a real WebGL canvas and Three.js module', () => {
  assert.match(html, /<canvas[^>]+id="worldCanvas"/);
  assert.match(html, /three@0\.185\.1/);
  assert.match(world, /new THREE\.WebGLRenderer/);
  assert.match(world, /THREE\.PerspectiveCamera/);
});

test('scroll progress drives 3D camera position and target', () => {
  assert.match(app, /setWorldProgress/);
  assert.match(world, /cameraKeys/);
  assert.match(world, /camera\.position\.lerpVectors/);
  assert.match(world, /camera\.lookAt/);
});

test('world includes actual 3D house meshes and four scene state systems', () => {
  assert.match(world, /createHouse/);
  assert.match(world, /BoxGeometry/);
  assert.match(world, /morningState/);
  assert.match(world, /leavingState/);
  assert.match(world, /comingHomeState/);
  assert.match(world, /nightState/);
});

test('experience is SwitchBot-only and has four C2 hero scenes', () => {
  assert.doesNotMatch(html, /Nanoleaf/i);
  for (const id of ['morning','leaving','coming-home','good-night']) {
    assert.match(html, new RegExp(`data-scene="${id}"`));
  }
});
