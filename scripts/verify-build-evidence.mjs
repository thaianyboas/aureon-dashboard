import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve('floor-studio');
const evidence = JSON.parse(readFileSync(resolve(root, 'BUILD_VERIFIED.json'), 'utf8'));
assert.equal(evidence.schema, 1);
function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    const child = resolve(path, entry.name);
    return entry.isDirectory() ? walk(child) : [relative(root, child).split(sep).join('/')];
  });
}
const expected = walk(resolve(root, 'neonplan3d-main/frontend/src'));
expected.push('aureon-dashboard.js', ...['build.mjs', 'package.json', 'package-lock.json', 'tsconfig.json'].map(name => 'neonplan3d-main/frontend/' + name));
assert.deepEqual(Object.keys(evidence.sources).sort(), expected.sort(), 'Build inputs changed; rebuild before packaging');
for (const group of ['sources', 'bundles']) {
  assert.ok(Object.keys(evidence[group]).length >= 4);
  for (const [name, hash] of Object.entries(evidence[group])) {
    const path = resolve(root, name);
    assert.ok(path.startsWith(root + sep), 'Unsafe build evidence path');
    assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'), hash, 'Stale build evidence: ' + name);
  }
}
console.log('PASS: candidate inputs and primary bundles match successful typecheck/build evidence.');
