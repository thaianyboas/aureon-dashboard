import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, sep } from 'node:path';

const root = 'build/neonplan3d-hacs-integration-candidate';
const base = join(root, 'custom_components/neonplan3d');
const metadata = JSON.parse(readFileSync(join(root, 'hacs.json'), 'utf8'));
const integration = JSON.parse(readFileSync(join(base, 'manifest.json'), 'utf8'));
const index = JSON.parse(readFileSync(join(root, 'MANIFEST.json'), 'utf8'));
assert.equal(metadata.content_in_root, false);
assert.equal(integration.domain, 'neonplan3d');
assert.equal(index.domain, integration.domain);
assert.ok(Array.isArray(index.files) && index.files.length > 10, 'Missing integration files');
const names = new Set();
for (const item of index.files) {
  assert.ok(item.path.startsWith('custom_components/neonplan3d/'));
  assert.ok(!item.path.includes('..'), 'Unsafe manifest path');
  assert.ok(!names.has(item.path), 'Duplicate file');
  names.add(item.path);
  const file = resolve(root, item.path);
  assert.ok(file.startsWith(resolve(root) + sep));
  assert.ok(existsSync(file) && statSync(file).isFile(), 'Missing ' + item.path);
  assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), item.sha256);
  assert.ok(!/\\.fp3dpack$|apartment-preset|private-floorplan/i.test(item.path), 'Private/paid asset path');
  assert.ok(!/__pycache__|\\.pyc$/i.test(item.path), 'Python bytecode must not be distributed');
}
for (const required of ['__init__.py', 'manifest.json', 'frontend/neonplan3d.js', 'frontend/neonplan3d-3d.js', 'frontend/neonplan3d-editor.js']) {
  assert.ok(names.has('custom_components/neonplan3d/' + required), 'Missing ' + required);
}
console.log('PASS: integration package layout, file hashes and required frontend assets (' + names.size + ' files). This is not a Home Assistant runtime test.');
