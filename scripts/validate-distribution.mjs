import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const h = JSON.parse(readFileSync('hacs.json', 'utf8'));
assert.equal(h.filename, 'aureon-dashboard.js');
assert.equal(h.content_in_root, false);
assert.ok(existsSync(`dist/${h.filename}`));
execFileSync(process.execPath, ['--check', `dist/${h.filename}`]);
const digest = createHash('sha256').update(readFileSync(`dist/${h.filename}`)).digest('hex');
const expected = readFileSync('scripts/stable-dashboard.sha256', 'utf8').trim();
assert.equal(digest, expected, 'Stable HACS distribution must remain unchanged until candidate approval');
for (const file of ['announcements', 'window-watch', 'heat-monitor', 'house-answers', 'module-settings']) {
  assert.deepEqual(readFileSync(`floor-studio/module-suite/src/${file}.mjs`), readFileSync(`floor-studio/neonplan3d-main/frontend/src/aureon-modules/${file}.mjs`), `Module source drift: ${file}`);
}
assert.ok(existsSync('floor-studio/neonplan3d-main/LICENSE'));
console.log('PASS: HACS metadata, stable distribution checksum, module parity and upstream license');
