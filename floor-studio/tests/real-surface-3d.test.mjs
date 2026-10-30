import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../neonplan3d-main/frontend/src/viewer/theme.ts', import.meta.url), 'utf8');
test('Real finish uses three-dimensional world-space coordinates, including height', () => {
  assert.match(source, /aureonValueNoise3\(vAureonSurfacePos\.xyz \* 58\.0\)/);
  assert.match(source, /vec3\(127\.1, 311\.7, 74\.7\)/);
});
test('realistic finish stays isolated to Real mode', () => {
  assert.match(source, /if \(uTheme == 4\)/);
  assert.match(source, /if \(uTheme == 3\)/);
  assert.match(source, /if \(uTheme == 1\)/);
});
