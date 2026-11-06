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
// The earlier stores are never deleted: no removal at all in the take-over code, and no file removal anywhere.
// Since NeonPlan 3.0 a plan of AUREON's own that waited 30 days in its bin loses its stores; those are AUREON keys only
// (_plan_keys builds them from STORAGE_KEY_BUILDING/HISTORY = aureon_floor.*), never a key of an earlier name.
const takeOver = storage.slice(storage.indexOf('_TAKEN_OVER_KEYS = ('), storage.indexOf('\ndef _summary('));
assert.ok(takeOver.length > 200, 'Take-over code not found');
assert.doesNotMatch(takeOver, /async_remove\(|unlink|os\.remove|\.remove\(/, 'The earlier stores must never be deleted');
assert.doesNotMatch(storage, /unlink|os\.remove|shutil/, 'No files may be deleted by the storage code');
assert.equal([...storage.matchAll(/async_remove\(\)/g)].length, 3, 'Store removal only in PlanData.async_remove (own plan stores)');
assert.match(storage, /async def async_remove\(self\) -> None:\n        \"\"\"Remove the plan's stores \(only for a plan whose time in the bin is over\)\.\"\"\"\n        await self\._building_store\.async_remove\(\)\n        await self\._history_store\.async_remove\(\)/, 'Unexpected store removal');
assert.match(storage, /def _plan_keys\(plan_id: str\) -> tuple\[str, str\]:[\s\S]{0,260}return f"\{STORAGE_KEY_BUILDING\}\.\{plan_id\}", f"\{STORAGE_KEY_HISTORY\}\.\{plan_id\}"/, 'Plan stores must be AUREON keys');
assert.match(storage, /if await Store\[dict\[str, Any\]\]\(hass, STORAGE_VERSION, key\)\.async_load\(\) is not None:/, 'Existing stores must not be overwritten');
assert.match(stable, /0\.29\.0-test\.3/, 'Dashboard distribution version unexpectedly changed (owner test build)');
assert.match(readFileSync('rollback/v0.28.0/aureon-dashboard.js', 'utf8'), /const VERSION = '0\.28\.0'/, 'Rollback copy of v0.28.0 missing');
console.log('PASS: own integration identity (aureon_floor), storage compatibility, legacy migration and stable dashboard version. Runtime migration remains untested.');
