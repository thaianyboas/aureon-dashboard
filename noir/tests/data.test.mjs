import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModel, roomLayout, wasteCollections, cleanName, kelvinToRgb, shortBin, labelRoles } from '../data.js';

globalThis.window = {};
new Function(readFileSync(new URL('../../scripts/noir-fixture.js', import.meta.url), 'utf8'))();
const hass = () => globalThis.window.makeHass('pt');

test('classifies devices from the native registries', () => {
  const m = buildModel(hass(), { labels: { protegida: 'Protegida', no_dboard: 'no_dboard' } });
  assert.equal(m.lights.length, 11);
  assert.equal(m.climate.length, 4);
  assert.equal(m.covers.length, 3);
  assert.equal(m.openings.length, 4);
  assert.equal(m.cams.length, 1);
  assert.equal(m.vacuums[0].map.id, 'camera.robot_map');
  assert.ok(!m.speakers.some((s) => s.id === 'media_player.hidden_echo'));
  assert.ok(m.hiddenMedia.some((s) => s.id === 'media_player.hidden_echo'));
  assert.ok(buildModel(hass(), { forceShow: ['media_player.hidden_echo'] }).speakers.some((s) => s.id === 'media_player.hidden_echo'));
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
  assert.equal(m.plugW, 86 + 112 + 9 + 5 + 60 + 450); // + the old washing machine plug
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
  assert.deepEqual(m.waste.map((w) => w.type), ['Schwarze Restmülltonne', 'Blaue Papiertonne', 'Grüne Biotonne', 'Schwarze Restmülltonne', 'Gelbe Tonne']);
  assert.equal(m.waste[0].days, 1);
  assert.deepEqual(wasteCollections({ entity_id: 'sensor.x', state: 'unavailable', attributes: {} }, new Date(), 'UTC'), []);
});
test('short bin names keep the meaning without the colour word', () => {
  assert.equal(shortBin('Schwarze Restmülltonne'), 'Restmüll');
  assert.equal(shortBin('Blaue Papiertonne'), 'Papier');
  assert.equal(shortBin('Grüne Biotonne'), 'Bio');
  assert.equal(shortBin('Gelbe Tonne'), 'Gelbe Tonne');
  assert.equal(shortBin('Gelber Sack'), 'Gelber Sack');
  assert.equal(shortBin('Restmüll'), 'Restmüll');
  assert.equal(shortBin('Paper bin'), 'Paper');
});
test('names keep meaning when the room prefix goes', () => {
  assert.equal(cleanName('Flur - Lampen', 'Flur'), 'Lampen');
  assert.equal(cleanName('WC - Licht', 'Badezimmer'), 'WC - Licht');
  assert.equal(cleanName('Küche · Decke', 'Küche'), 'Decke');
  assert.equal(cleanName('Flur -', 'Flur'), 'Flur -');
});
test('helpers', () => {
  assert.equal(cleanName('Kitchen Ceiling', 'Kitchen'), 'Ceiling');
  assert.equal(cleanName('kitchen', 'Kitchen'), 'Kitchen');
  const [r, , b] = kelvinToRgb(2700); assert.ok(r > b);
  const lay = roomLayout([{ id: 'a' }, { id: 'b' }, { id: 'c' }], () => 1);
  assert.equal(lay.length, 3);
  for (const r2 of lay) { assert.ok(r2.x >= 0 && r2.x + r2.w <= 100.001); assert.ok(r2.y >= 0 && r2.y + r2.h <= 100.001); }
});

test('label roles come from HA (id, name or description), device labels count', () => {
  const roles = labelRoles({
    systemgeraete_dashboard: { name: 'systemgeraete_dashboard', description: 'Roteador, central de aquecimento e equipamentos essenciais' },
    no_dboard: { name: 'no_dboard', description: 'Exkludiert die Entität aus den Auto-Entity Auflistungen' },
    steckdosen_dashboard: { name: 'steckdosen_dashboard', description: 'Tomadas que podem ser ligadas e desligadas' },
    wichtig: { name: 'Wichtig', description: 'Geräte, die nie aus sein dürfen' },
    musik_box: { name: 'Musik Box', description: '' }
  });
  assert.equal(roles.systemgeraete_dashboard, 'protect');
  assert.equal(roles.no_dboard, 'hide');
  assert.equal(roles.steckdosen_dashboard, 'outlet');
  assert.equal(roles.wichtig, 'protect');
  assert.equal(roles.musik_box, undefined);
  const hass = {
    states: { 'switch.router': { entity_id: 'switch.router', state: 'on', attributes: { friendly_name: 'Netzwerk' } } },
    entities: { 'switch.router': { entity_id: 'switch.router', device_id: 'd1', labels: [] } },
    devices: { d1: { id: 'd1', name: 'Steckdose 3', labels: ['systemgeraete_dashboard'] } },
    areas: {}
  };
  const labels = { systemgeraete_dashboard: 'systemgeraete_dashboard', __roles: roles };
  const m = buildModel(hass, { labels });
  assert.equal(m.plugs.length, 1);
  assert.equal(m.plugs[0].locked, true, 'a device label protects the plug');
});

test('energy: power sensors without a plug (hidden or kW) still count', () => {
  const h = hass();
  h.devices.dmeter = { id: 'dmeter', name: 'Waschmaschine', area_id: 'kitchen' };
  h.states['sensor.meter_power'] = { entity_id: 'sensor.meter_power', state: '0.45', attributes: { unit_of_measurement: 'kW', friendly_name: 'Power' } };
  h.entities['sensor.meter_power'] = { entity_id: 'sensor.meter_power', device_id: 'dmeter', hidden_by: 'integration' };
  const m = buildModel(h);
  const r = m.loosePower.find((x) => x.device === 'dmeter');
  assert.ok(r); assert.equal(r.w, 450);
});
