import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const shader = readFileSync(new URL('./theme.ts', import.meta.url), 'utf8');
test('real finish uses stable world coordinates rather than camera-dependent pixel noise', () => {
  assert.match(shader, /vAureonSurfacePos = \(modelMatrix \* vec4\(transformed, 1\.0\)\)\.xyz/);
  assert.match(shader, /aureonValueNoise3\(vAureonSurfacePos\.xyz \* 58\.0\)/);
  assert.doesNotMatch(shader, /gl_FragCoord/);
});
test('material grain only modifies real mode', () => {
  const real = shader.indexOf('if (uTheme == 4)');
  const grain = shader.indexOf('float grain =');
  const day = shader.indexOf('// day:');
  assert.ok(real >= 0 && grain > real && day > grain);
});

test('real finish uses smoothly interpolated noise without hard voxel colour jumps', () => {
  assert.match(shader, /f = f \* f \* \(3\.0 - 2\.0 \* f\)/);
  assert.match(shader, /return mix\(mix\(a, b, f\.y\), mix\(c, d, f\.y\), f\.z\)/);
  assert.doesNotMatch(shader, /float grain = fract\(sin\(dot\(cell/);
});
