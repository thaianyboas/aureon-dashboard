import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = 'floor-studio/neonplan3d-main/custom_components/aureon_floor';
const constants = readFileSync(base + '/const.py', 'utf8');
const storage = readFileSync(base + '/storage.py', 'utf8');
const manifest = JSON.parse(readFileSync(base + '/manifest.json', 'utf8'));
const stable = readFileSync('dist/aureon-dashboard.js', 'utf8');
// SEP-01 (owner decision 2026-11-05): own domain, so the official NeonPlan 3D can never replace this installation.
// The stores of neonplan3d (then floorplan_3d) are copied once, never changed or deleted (runtime-tested in pytest).
assert.equal(manifest.domain, 'aureon_floor', 'Unexpected integration domain: migration must be reviewed');
assert.match(constants, /^DOMAIN = "aureon_floor"$/m);
assert.match(constants, /^LEGACY_DOMAINS = \("neonplan3d", "floorplan_3d"\)$/m);
assert.match(constants, /^URL_BASE = "\/aureon_floor_static"$/m);
assert.match(constants, /^PANEL_URL_PATH = "aureon-floor-studio"$/m);
for (const [name, suffix] of Object.entries({
  STORAGE_KEY_BUILDING: 'building',
  STORAGE_KEY_IMAGES: 'images',
  STORAGE_KEY_HISTORY: 'history',
  STORAGE_KEY_PACKS: 'packs',
  STORAGE_KEY_LICENSE: 'license',
  STORAGE_KEY_DIAGNOSTICS: 'diagnostics',
  STORAGE_KEY_VOICE: 'voice',
})) {
  assert.match(constants, new RegExp('^' + name + ' = f?"\\{DOMAIN\\}\\.' + suffix + '"$', 'm'), 'Storage key drift: ' + name);
}
assert.match(storage, /async_migrate_legacy_stores/, 'Legacy migration missing');
for (const key of ['STORAGE_KEY_LICENSE', 'STORAGE_KEY_VOICE', 'locate']) assert.match(storage.split('_TAKEN_OVER_KEYS = (')[1].split(')')[0], new RegExp(key), 'Store not taken over: ' + key);
assert.doesNotMatch(storage, /async_remove\(|unlink|os\.remove/, 'The earlier stores must never be deleted');
assert.match(storage, /if await Store\[dict\[str, Any\]\]\(hass, STORAGE_VERSION, key\)\.async_load\(\) is not None:/, 'Existing stores must not be overwritten');
assert.match(stable, /0\.29\.0-test\.3/, 'Dashboard distribution version unexpectedly changed (owner test build)');
assert.match(readFileSync('rollback/v0.28.0/aureon-dashboard.js', 'utf8'), /const VERSION = '0\.28\.0'/, 'Rollback copy of v0.28.0 missing');
console.log('PASS: own integration identity (aureon_floor), storage compatibility, legacy migration and stable dashboard version. Runtime migration remains untested.');
