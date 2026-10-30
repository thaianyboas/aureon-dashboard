import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = 'floor-studio/neonplan3d-main/custom_components/neonplan3d';
const constants = readFileSync(base + '/const.py', 'utf8');
const storage = readFileSync(base + '/storage.py', 'utf8');
const manifest = JSON.parse(readFileSync(base + '/manifest.json', 'utf8'));
const stable = readFileSync('dist/aureon-dashboard.js', 'utf8');
assert.equal(manifest.domain, 'neonplan3d', 'Unexpected integration domain: migration must be reviewed');
assert.match(constants, /^DOMAIN = "neonplan3d"$/m);
assert.match(constants, /^LEGACY_DOMAIN = "floorplan_3d"$/m);
assert.match(constants, /^URL_BASE = "\/neonplan3d_static"$/m);
assert.match(constants, /^PANEL_URL_PATH = "neonplan3d"$/m);
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
assert.match(storage, /if await Store\[dict\[str, Any\]\]\(hass, STORAGE_VERSION, key\)\.async_load\(\) is not None:/, 'Existing stores must not be overwritten');
assert.match(stable, /0\.28\.0/, 'Stable dashboard version unexpectedly changed');
console.log('PASS: upstream integration identity, storage compatibility, legacy migration and stable dashboard version. Runtime migration remains untested.');
