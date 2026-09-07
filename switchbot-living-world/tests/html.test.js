import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('experience, explore, and build modes are present', () => {
  for (const id of ['experience','explore','build']) assert.match(html, new RegExp(`id="${id}"`));
});

test('site uses scroll world style cinematic stage', () => {
  assert.match(html, /cinematic-stage/);
  assert.match(html, /scroll-progress/);
});

test('page is SwitchBot-only', () => {
  assert.doesNotMatch(html, /Nanoleaf/i);
});
