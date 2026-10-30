import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('./theme.ts', import.meta.url), 'utf8');
test('world-space coordinate injected after transformed exists', () => {
  assert.match(source, /replace\("#include <begin_vertex>"/);
  assert.doesNotMatch(source, /replace\("#include <worldpos_vertex>"/);
  assert.match(source, /vAureonSurfacePos = \(modelMatrix \* vec4\(transformed, 1\.0\)\)\.xyz/);
});
test('shader varying declared in both stages', () => {
  assert.match(source, /varying vec3 vAureonSurfacePos;/);
  assert.match(source, /shader\.fragmentShader/);
});
