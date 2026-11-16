import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModel, roomLayout, wasteCollections, cleanName, kelvinToRgb } from '../data.js';

globalThis.window = {};
new Function(readFileSync(new URL('../../scripts/noir-fixture.js', import.meta.url), 'utf8'))();
const hass = () => globalThis.window.makeHass('pt');

test('classifies devices from the native registries', () => {
  const m = buildModel(hass(), { labels: { protegida: 'Protegida', no_dboard: 'no_dboard' } });
  assert.equal(m.lights.length, 10);
  assert.equal(m.climate.length, 4);
  assert.equal(m.covers.length, 3);
  assert.equal(m.openings.length, 4);
  assert.equal(m.cams.length, 1);
  assert.equal(m.locks.length, 1);
  assert.equal(m.vacuums.length, 1);
  assert.deepEqual(m.accounts.map((a) => a.id), ['media_player.spotifyplus_demo']);
  assert.ok(m.speakers.every((s) => !s.id.includes('spotifyplus')));
});
test('no_dboard hides, protegida locks, power is linked to the plug of the same device', () => {
  const m = buildModel(hass(), { labels: { protegida: 'Protegida', no_dboard: 'no_dboard' } });
  assert.ok(!m.plugs.some((p) => p.id === 'switch.hidden_thing'));
  assert.equal(m.plugs.find((p) => p.id === 'switch.p2').locked, true);
  assert.equal(m.plugs.find((p) => p.id === 'switch.p1').w, 86);
  assert.equal(m.plugW, 86 + 112 + 9 + 5 + 60);
});
test('appliances: running with progress, finished state', () => {
  const m = buildModel(hass());
  const w = m.appliances.find((a) => a.kind === 'washer'), d = m.appliances.find((a) => a.kind === 'dish');
  assert.equal(w.running, true); assert.equal(w.pct, 64); assert.equal(w.mins, 22);
  assert.equal(d.done, true);
});
test('local aliases and hidden list apply', () => {
  const m = buildModel(hass(), { aliases: { 'light.l0': 'Lustre' }, hidden: ['light.l1'] });
  assert.equal(m.lights.find((l) => l.id === 'light.l0').name, 'Lustre');
  assert.equal(m.lights.find((l) => l.id === 'light.l1').hidden, true);
});
test('waste: WCS date keys, sorted by days', () => {
  const m = buildModel(hass());
  assert.deepEqual(m.waste.map((w) => w.type), ['Restmüll', 'Bio', 'Papier', 'Gelbe Tonne']);
  assert.equal(m.waste[0].days, 0);
  assert.deepEqual(wasteCollections({ entity_id: 'sensor.x', state: 'unavailable', attributes: {} }, new Date(), 'UTC'), []);
});
test('helpers', () => {
  assert.equal(cleanName('Kitchen Ceiling', 'Kitchen'), 'Ceiling');
  assert.equal(cleanName('kitchen', 'Kitchen'), 'Kitchen');
  const [r, , b] = kelvinToRgb(2700); assert.ok(r > b);
  const lay = roomLayout([{ id: 'a' }, { id: 'b' }, { id: 'c' }], () => 1);
  assert.equal(lay.length, 3);
  for (const r2 of lay) { assert.ok(r2.x >= 0 && r2.x + r2.w <= 100.001); assert.ok(r2.y >= 0 && r2.y + r2.h <= 100.001); }
});
