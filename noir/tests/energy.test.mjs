// Energy discovery across brands (owner 2026-11-18: "Consumo agora 0 W" with 12 kWh meters).
// Pure data tests: no fixture, every case is spelled out here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildModel } from '../data.js';

function home() {
  const H = { states: {}, entities: {}, devices: {}, areas: { k: { area_id: 'k', name: 'Küche' }, b: { area_id: 'b', name: 'Bad' }, w: { area_id: 'w', name: 'Wohnzimmer' }, h: { area_id: 'h', name: 'Flur' } }, config: { time_zone: 'Europe/Berlin' } };
  const dev = (id, name, area) => { H.devices[id] = { id, name, area_id: area }; };
  const ent = (eid, state, attrs, reg = {}) => { H.states[eid] = { entity_id: eid, state, attributes: attrs, last_changed: new Date().toISOString() }; H.entities[eid] = { entity_id: eid, ...reg }; };
  const W = (extra = {}) => ({ device_class: 'power', unit_of_measurement: 'W', state_class: 'measurement', ...extra });
  const KWH = (extra = {}) => ({ device_class: 'energy', unit_of_measurement: 'kWh', state_class: 'total_increasing', ...extra });
  // Meross (meross_lan): switch + W + kWh
  dev('meross', 'Kaffeemaschine', 'k'); ent('switch.kaffee', 'on', { friendly_name: 'Kaffeemaschine' }, { device_id: 'meross', platform: 'meross_lan' });
  ent('sensor.kaffee_power', '1200.5', W(), { device_id: 'meross', platform: 'meross_lan' }); ent('sensor.kaffee_energy', '12.3', KWH(), { device_id: 'meross', platform: 'meross_lan' });
  // Tapo (tplink): switch OFF but still reports 2 W standby; plus a "today" kWh copy that must not double count
  dev('tapo', 'Fernseher', 'w'); ent('switch.tv', 'off', {}, { device_id: 'tapo', platform: 'tplink' });
  ent('sensor.tv_current_consumption', '2', W(), { device_id: 'tapo', platform: 'tplink' }); ent('sensor.tv_total_consumption', '50', KWH(), { device_id: 'tapo', platform: 'tplink' }); ent('sensor.tv_today_s_consumption', '0.2', KWH({ friendly_name: "Today's consumption" }), { device_id: 'tapo', platform: 'tplink' });
  // Tuya: power in kW
  dev('tuya', 'Heizlüfter', 'b'); ent('switch.heiz', 'on', {}, { device_id: 'tuya', platform: 'tuya' }); ent('sensor.heiz_leistung', '1.5', W({ unit_of_measurement: 'kW' }), { device_id: 'tuya', platform: 'tuya' });
  // Plug with only kWh (no power sensor)
  dev('ikea', 'Kühlschrank', 'k'); ent('switch.fridge', 'on', {}, { device_id: 'ikea', platform: 'mqtt' }); ent('sensor.fridge_energy', '88', KWH(), { device_id: 'ikea', platform: 'mqtt' });
  // Shelly PM without switch: power only, with duplicates (average / peak must not add up)
  dev('shelly', 'Waschmaschine', 'b'); ent('sensor.wm_power', '450', W(), { device_id: 'shelly', platform: 'shelly' }); ent('sensor.wm_power_average', '300', W(), { device_id: 'shelly', platform: 'shelly' }); ent('sensor.wm_peak_power', '2100', W(), { device_id: 'shelly', platform: 'shelly' });
  // Sensor without device_id, linked by entity name to its switch (template / YAML)
  ent('switch.lampe_flur', 'on', {}, { platform: 'template' }); ent('sensor.lampe_flur_power', '7', W(), { platform: 'template' });
  // Older integration: power only as an attribute of the switch
  dev('old', 'Router', 'h'); ent('switch.router', 'on', { current_power_w: 9.4 }, { device_id: 'old', platform: 'legacy' });
  // Unavailable power sensor (Zigbee2MQTT) → no value, never 0 W
  dev('z2m', 'Aquarium', 'w'); ent('switch.aqua', 'on', {}, { device_id: 'z2m', platform: 'mqtt' }); ent('sensor.aqua_power', 'unavailable', W(), { device_id: 'z2m', platform: 'mqtt' });
  // Matter plug, hidden power sensor (hidden by integration) still counts
  dev('matter', 'Lampe Sofa', 'w'); ent('switch.sofa', 'on', {}, { device_id: 'matter', platform: 'matter' }); ent('sensor.sofa_power', '15', W(), { device_id: 'matter', platform: 'matter', hidden_by: 'integration' });
  // Whole-house meter and grid, phone battery power
  dev('meter', 'Stromzähler Haus', 'h'); ent('sensor.haus_energie', '9000', KWH(), { device_id: 'meter', platform: 'tibber' }); ent('sensor.netz_bezug_power', '1900', W(), { device_id: 'meter', platform: 'tibber' });
  dev('phone', 'Marvin Handy', null); ent('sensor.marvin_handy_battery_power', '0', W(), { device_id: 'phone', platform: 'mobile_app' });
  return H;
}

test('every brand: one live power per device, real values only', () => {
  const m = buildModel(home());
  const plug = (id) => m.plugs.find((p) => p.id === id);
  assert.equal(plug('switch.kaffee').w, 1201); assert.equal(plug('switch.kaffee').wSrc, 'sensor');
  assert.equal(plug('switch.tv').w, 2, 'a switched-off plug still reports its real standby power');
  assert.equal(plug('switch.heiz').w, 1500, 'kW converted to W');
  assert.equal(plug('switch.fridge').w, null); assert.equal(plug('switch.fridge').wSrc, 'none', 'kWh-only plug has no live power');
  assert.equal(plug('switch.lampe_flur').w, 7, 'sensor without device_id linked by entity name');
  assert.equal(plug('switch.router').w, 9); assert.equal(plug('switch.router').wSrc, 'attribute');
  assert.equal(plug('switch.aqua').w, null); assert.equal(plug('switch.aqua').wSrc, 'unavailable', 'unavailable is not 0 W');
  assert.equal(plug('switch.sofa').w, 15, 'hidden power sensor still read');
  const wm = m.loosePower.find((x) => x.device === 'shelly');
  assert.ok(wm, 'device without switch is a consumer'); assert.equal(wm.w, 450, 'average/peak sensors are not added');
  assert.ok(!m.loosePower.some((x) => /Handy/.test(x.name)), 'phone battery power is not a house consumer');
  assert.ok(!m.loosePower.some((x) => x.device === 'meter'), 'grid meter is not a consumer');
  assert.equal(m.gridW, 1900);
  assert.equal(m.liveW, 1201 + 2 + 1500 + 7 + 9 + 15 + 450);
  assert.ok(m.powerUnavailable.some((p) => p.id === 'switch.aqua'));
});

test('kWh meters: one per device, no daily copies, whole-house meter kept apart', () => {
  const m = buildModel(home());
  const ids = m.energyMeters.map((e) => e.id).sort();
  assert.deepEqual(ids, ['sensor.fridge_energy', 'sensor.kaffee_energy', 'sensor.tv_total_consumption']);
  assert.deepEqual(m.mainMeters.map((e) => e.id), ['sensor.haus_energie']);
});

test('no live data at all gives no value, not zero', () => {
  const H = home();
  for (const id of Object.keys(H.states)) if (H.states[id].attributes.device_class === 'power' || H.states[id].attributes.current_power_w != null) delete H.states[id];
  const m = buildModel(H);
  assert.equal(m.metered.length, 0); assert.equal(m.loosePower.length, 0);
  assert.ok(m.plugs.every((p) => p.w == null));
});
