import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const base = new URL('../neonplan3d-main/', import.meta.url);
const read = path => readFileSync(new URL(path, base), 'utf8');

test('all interactive surfaces are independent of commerce and license requests', () => {
  for (const file of ['components/extensions.ts', 'components/editor.ts', 'components/view3d.ts', 'panel.ts']) {
    const source = read('frontend/src/' + file);
    assert.doesNotMatch(source, /\b(?:shopUrl|supporterUrl|registerUrl|getLicense|activateLicense|refreshLicense|renderOffers|renderShop|renderNewsletter)\s*\(/, file);
  }
  assert.doesNotMatch(read('frontend/src/api.ts'), /neonplan3d\/(?:license\/|packs\/install)/);
});

test('only local import routes are registered, without background commerce refresh', () => {
  const backend = read('custom_components/neonplan3d/websocket.py');
  const registry = backend.split('for command in (')[1].split('):')[0];
  assert.doesNotMatch(backend, /neonplan3d\/(?:license\/|packs\/install)/);
  assert.doesNotMatch(read('custom_components/neonplan3d/license.py'), /SHOP_API|async_activate|async_refresh|async_fetch_pack/);
  assert.match(registry, /ws_packs_import/);
  assert.match(registry, /ws_modules_review/);
  assert.match(registry, /ws_modules_approve/);
  assert.doesNotMatch(read('custom_components/neonplan3d/__init__.py'), /async_refresh_quietly|FIRST_CHECK_DELAY|REFRESH_INTERVAL/);
});

test('local licensed packs retain signature and installation binding checks', () => {
  const backend = read('custom_components/neonplan3d/websocket.py');
  assert.match(backend, /verify_pack\(msg\["pack"\], instance=await lic.async_instance_fingerprint\(hass\)\)/);
  assert.match(backend, /instance = await lic.async_instance_fingerprint\(hass\)/);
  const extensions = read('frontend/src/components/extensions.ts');
  assert.match(extensions, /await importPack\(this.hass, await file.text\(\)\)/);
  assert.match(extensions, /await approveModule\(this.hass, review.pack.id, review.data.sha\)/);
  assert.match(extensions, /unlockedFeatures\(this.packs/);
  assert.match(read('frontend/src/import/app.ts'), /accept="[^"\n]*\.glb[^"\n]*\.obj/);
});
