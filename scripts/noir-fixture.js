// Synthetic Home Assistant for AUREON Noir browser tests. No personal data: invented rooms and devices.
// Loaded into the page as a classic script; defines window.makeHass(lang).
window.makeHass = function makeHass(lang) {
  const iso = (min) => new Date(Date.now() - min * 60000).toISOString();
  const day = (d) => { const x = new Date(Date.now() + d * 86400000); return x.toISOString().slice(0, 10); };
  const areas = { living: 'Living room', kitchen: 'Kitchen', bedroom: 'Bedroom', bath: 'Bathroom', hall: 'Hallway', balcony: 'Balcony', office: 'Study with a really long name for wrapping' };
  const H = { areas: {}, devices: {}, entities: {}, states: {}, services: {}, calls: [], ws: [] };
  for (const [id, name] of Object.entries(areas)) H.areas[id] = { area_id: id, name };
  const dev = (id, name, area, model) => { H.devices[id] = { id, name, area_id: area, model: model || '' }; };
  const ent = (eid, state, attrs, reg) => { H.states[eid] = { entity_id: eid, state, attributes: attrs, last_changed: iso(reg?.ago || 30), last_updated: iso(1) }; H.entities[eid] = { entity_id: eid, ...reg }; };
  // lights
  [['living', 'Ceiling', 'on', 153, [255, 196, 137], 2800], ['living', 'Floor lamp with a long descriptive name', 'on', 110, [255, 180, 110], 2700], ['living', 'TV strip', 'on', 80, [169, 155, 255], null], ['kitchen', 'Ceiling', 'on', 230, [255, 236, 210], 4000], ['kitchen', 'Counter', 'off', 0, null, null], ['bedroom', 'Lamp left', 'on', 60, [255, 190, 120], 2600], ['bedroom', 'Lamp right', 'off', 0, null, null], ['bath', 'Mirror', 'off', 0, null, null], ['hall', 'Ceiling', 'on', 100, [255, 200, 140], 3000], ['balcony', 'String lights', 'off', 0, null, null]]
    .forEach(([a, n, s, b, rgb, k], i) => ent(`light.l${i}`, s, { friendly_name: n, brightness: s === 'on' ? b : null, rgb_color: rgb, color_temp_kelvin: k, supported_color_modes: i === 2 ? ['rgb'] : ['color_temp'], min_color_temp_kelvin: 2200, max_color_temp_kelvin: 6500 }, { area_id: a }));
  // plugs + power
  [['p1', 'TV', 'living', 'on', 86], ['p2', 'Fridge', 'kitchen', 'on', 112], ['p3', 'Coffee machine', 'kitchen', 'off', 0], ['p4', 'Router', 'hall', 'on', 9, ['protegida']], ['p5', 'Charger', 'bedroom', 'on', 5], ['p6', 'Towel heater', 'bath', 'on', 60]]
    .forEach(([id, n, a, s, w, labels]) => { dev('d' + id, n + ' plug', a, 'Smart Plug'); ent('switch.' + id, s, { friendly_name: n, device_class: 'outlet' }, { device_id: 'd' + id, labels: labels || [] }); ent('sensor.' + id + '_power', String(w), { friendly_name: n + ' power', device_class: 'power', unit_of_measurement: 'W' }, { device_id: 'd' + id }); });
  // climate
  [['living', 19.1, 21, 'heating'], ['kitchen', 20.2, 20, 'idle'], ['bedroom', 18.6, 19, 'heating'], ['bath', 21.4, 22, 'heating']]
    .forEach(([a, c, tgt, act], i) => ent(`climate.t${i}`, 'heat', { friendly_name: 'Radiator', current_temperature: c, temperature: tgt, hvac_action: act, min_temp: 5, max_temp: 30, target_temp_step: 0.5, current_humidity: 48 }, { area_id: a }));
  // covers
  ent('cover.c1', 'opening', { friendly_name: 'Curtain', current_position: 40, supported_features: 15 }, { area_id: 'living' });
  ent('cover.c2', 'open', { friendly_name: 'Blind', current_position: 100, supported_features: 15 }, { area_id: 'kitchen' });
  ent('cover.c3', 'closed', { friendly_name: 'Blind', current_position: 0, supported_features: 3 }, { area_id: 'bedroom' });
  // openings
  ent('binary_sensor.w1', 'on', { friendly_name: 'Window', device_class: 'window' }, { area_id: 'kitchen', ago: 25 });
  ent('binary_sensor.w2', 'off', { friendly_name: 'Window', device_class: 'window' }, { area_id: 'living' });
  ent('binary_sensor.w3', 'on', { friendly_name: 'Window by the bed', device_class: 'window' }, { area_id: 'bedroom', ago: 120 });
  ent('binary_sensor.d1', 'off', { friendly_name: 'Front door', device_class: 'door' }, { area_id: 'hall' });
  // security
  ent('lock.front', 'locked', { friendly_name: 'Front door' }, { area_id: 'hall' });
  ent('alarm_control_panel.home', 'disarmed', { friendly_name: 'Alarm', code_format: null, supported_features: 63 }, {});
  ent('camera.entry', 'idle', { friendly_name: 'Entrance' }, { area_id: 'hall' });
  // media: a Spotify account + speakers
  dev('dsp', 'Spotify', null, 'SpotifyPlus');
  ent('media_player.spotifyplus_demo', 'playing', { friendly_name: 'Spotify Demo', sp_user_id: 'demo', media_title: 'Synthetic Song', media_artist: 'Test Artist', media_album_name: 'Fixture Album', media_duration: 221, media_position: 84, media_position_updated_at: iso(0), volume_level: 0.42, shuffle: false, source: 'Kitchen speaker', supported_features: 4194303, media_content_id: 'spotify:track:abc123' }, { device_id: 'dsp', platform: 'spotifyplus' });
  [['s1', 'Kitchen speaker', 'kitchen', 'playing'], ['s2', 'Living room speaker', 'living', 'playing'], ['s3', 'Bedroom speaker', 'bedroom', 'idle'], ['s4', 'TV', 'living', 'off']]
    .forEach(([id, n, a, s]) => ent('media_player.' + id, s, { friendly_name: n, volume_level: 0.3, supported_features: 524288 | 16384 | 1 | 4 | 8 | 128 | 256 | 1024, device_class: id === 's4' ? 'tv' : 'speaker', group_members: [] }, { area_id: a, platform: 'alexa_media' }));
  // vacuum
  dev('dvac', 'Robot', 'hall', 'X60');
  ent('vacuum.robot', 'cleaning', { friendly_name: 'Robot', selected_map: 1, rooms: { 1: [{ id: 1, name: 'Living room', order: 1 }, { id: 2, name: 'Kitchen', order: 2 }, { id: 3, name: 'Hallway', order: 3 }, { id: 4, name: 'Bedroom', order: 4 }, { id: 5, name: 'Bathroom', order: 5 }] }, current_segment: 2, cleaning_sequence: [1, 2, 3, 4, 5], active_segments: [] }, { device_id: 'dvac' });
  ent('sensor.robot_battery', '81', { device_class: 'battery', unit_of_measurement: '%' }, { device_id: 'dvac', entity_category: 'diagnostic' });
  ent('sensor.robot_current_room', 'Kitchen', {}, { device_id: 'dvac' });
  ent('camera.robot_map', 'idle', { friendly_name: 'Current Map', entity_picture: '/api/camera_proxy/camera.robot_map?token=x' }, { device_id: 'dvac', area_id: 'living' });
  ent('media_player.hidden_echo', 'idle', { friendly_name: 'Echo Show hidden', volume_level: 0.2, supported_features: 4 }, { area_id: 'bedroom', hidden: true });
  ent('light.labelled', 'on', { friendly_name: 'Labelled lamp', brightness: 100, supported_color_modes: ['brightness'] }, { area_id: 'office', labels: ['deko'] });
  // appliances
  dev('dwash', 'Washing machine', 'bath', 'WM');
  ent('sensor.washer_operation', 'run', { friendly_name: 'Washer status' }, { device_id: 'dwash' });
  ent('sensor.washer_progress', '64', { unit_of_measurement: '%' }, { device_id: 'dwash' });
  ent('sensor.washer_remaining_time', '22', { unit_of_measurement: 'min' }, { device_id: 'dwash' });
  ent('select.washer_active_program', 'LaundryCare.Washer.Program.Cotton', { friendly_name: 'Washer active program' }, { device_id: 'dwash' });
  ent('select.washer_temperature', 'LaundryCare.Washer.EnumType.Temperature.GC40', { friendly_name: 'Washer temperature' }, { device_id: 'dwash' });
  dev('dold', 'Old washing machine', 'bath', 'Smart Plug');
  ent('switch.old_washer', 'on', { friendly_name: 'Old washing machine', device_class: 'outlet' }, { device_id: 'dold' });
  ent('sensor.old_washer_power', '450', { friendly_name: 'Old washing machine power', device_class: 'power', unit_of_measurement: 'W' }, { device_id: 'dold' });
  ent('switch.robot_self_clean', 'on', { friendly_name: 'Robot Self-Clean' }, { device_id: 'dvac', platform: 'dreame_vacuum' });
  ent('switch.echo_dnd', 'on', { friendly_name: 'Alexa - Kitchen' }, { area_id: 'kitchen', platform: 'alexa_devices' });
  ent('automation.washer_alexa', 'on', { friendly_name: 'Waschmaschine fertig (Alexa)' }, {});
  ent('sensor.energy_today', '3.4', { device_class: 'energy', unit_of_measurement: 'kWh', friendly_name: 'Energy today' }, {});
  ent('sensor.energy_month', '84.2', { device_class: 'energy', unit_of_measurement: 'kWh', friendly_name: 'Energy this month' }, {});
  ent('sensor.electricity_price', '0.32', { unit_of_measurement: '€/kWh', friendly_name: 'Electricity price' }, {});
  dev('ddish', 'Dishwasher', 'kitchen', 'DW');
  ent('sensor.dishwasher_status', 'finished', { friendly_name: 'Dishwasher status' }, { device_id: 'ddish' });
  // others
  ent('scene.morning', iso(60 * 20), { friendly_name: 'Morning' }, {}); ent('scene.cinema', iso(30), { friendly_name: 'Cinema' }, {}); ent('scene.dinner', iso(60 * 30), { friendly_name: 'Dinner' }, {}); ent('scene.night', iso(60 * 40), { friendly_name: 'Good night' }, {});
  ent('person.a', 'home', { friendly_name: 'Alex' }, {}); ent('person.b', 'not_home', { friendly_name: 'Sam' }, {});
  ent('weather.home', 'partlycloudy', { friendly_name: 'Sample City', temperature: 7, temperature_unit: '°C' }, {});
  ent('sun.sun', 'above_horizon', { next_setting: new Date(Date.now() + 3 * 3600e3).toISOString(), next_rising: new Date(Date.now() + 18 * 3600e3).toISOString() }, {});
  ent('sensor.waste_collection', '0', { friendly_name: 'Waste collection', [day(1)]: 'Schwarze Restmülltonne', [day(2)]: 'Blaue Papiertonne', [day(3)]: 'Grüne Biotonne', [day(4)]: 'Schwarze Restmülltonne', [day(9)]: 'Gelbe Tonne' }, {});
  ent('switch.hidden_thing', 'on', { friendly_name: 'Hidden' }, { area_id: 'living', labels: ['no_dboard'] });
  const sp = ['get_playlist_favorites', 'get_player_recent_tracks', 'get_album_favorites', 'get_track_favorites', 'get_show_favorites', 'search_tracks', 'get_spotify_connect_devices', 'player_transfer_playback', 'player_media_play_context', 'player_media_play_tracks', 'check_track_favorites', 'save_track_favorites', 'remove_track_favorites'];
  H.services = { light: { toggle: {}, turn_on: {}, turn_off: {} }, media_player: { media_play: {}, media_pause: {}, media_play_pause: {}, volume_set: {}, media_seek: {}, shuffle_set: {}, repeat_set: {}, media_next_track: {}, media_previous_track: {}, join: {}, unjoin: {}, select_source: {}, play_media: {} }, spotifyplus: Object.fromEntries(sp.map((x) => [x, {}])) };
  const hass = {
    ...H, language: lang || 'pt', locale: { language: lang || 'pt', time_zone: 'local' }, config: { time_zone: 'Europe/Berlin' },
    user: { id: 'u1', name: 'Alex Fixture', is_admin: true },
    hassUrl: (p) => p,
    callService: async (d, s, data, target, notify, ret) => {
      H.calls.push([d, s, data]);
      if (d === 'spotifyplus' && s === 'get_playlist_favorites') return { response: { result: { items: [1, 2, 3, 4, 5, 6].map((i) => ({ name: 'Playlist number ' + i + (i === 2 ? ' with an unusually long title' : ''), uri: 'spotify:playlist:P' + i, images: [] })), total: 6 } } };
      if (d === 'spotifyplus' && s === 'get_spotify_connect_devices') return { response: { result: { Items: [{ Id: 'x1', Name: 'Kitchen speaker', IsActiveDevice: true }, { Id: 'x2', Name: 'Living room speaker', IsInDeviceList: true }] } } };
      if (d === 'spotifyplus' && s === 'check_track_favorites') return { response: { result: { abc123: false } } };
      return { response: { result: {} } };
    },
    callWS: async (msg) => { H.ws.push(msg); if (msg.type === 'history/history_during_period') { const t0 = Date.now() / 1000; return { 'sensor.old_washer_power': [{ s: '0.4', lc: t0 - 7200 }, { s: '2100', lu: t0 - 35 * 60 }, { s: '450', lu: t0 - 20 * 60 }] }; } if (msg.type === 'automation/config' && msg.entity_id === 'automation.washer_alexa') return { config: { alias: 'Waschmaschine fertig (Alexa)', use_blueprint: { path: 'thaianyboas/appliance_done_status.yaml', input: { status_entity: 'sensor.washer_operation' } } } }; if (msg.type === 'config/label_registry/list') return [{ label_id: 'protegida', name: 'Protegida' }, { label_id: 'no_dboard', name: 'no_dboard' }, { label_id: 'deko', name: 'Deko' }]; return {}; },
    callApi: async () => [],
    connection: { subscribeMessage: async (cb, msg) => { H.ws.push(msg); const conds = ['partlycloudy', 'cloudy', 'rainy', 'rainy', 'cloudy', 'clear-night', 'clear-night'];
      setTimeout(() => cb({ forecast: msg.forecast_type === 'daily' ? [{ datetime: new Date().toISOString(), condition: 'partlycloudy', temperature: 9, templow: 3 }] : conds.map((c, i) => ({ datetime: new Date(Date.now() + i * 3600e3).toISOString(), condition: c, temperature: 7 - Math.floor(i / 2), precipitation_probability: c === 'rainy' ? 60 : 0 })) }), 10);
      return () => {}; } }
  };
  return hass;
};
