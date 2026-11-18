// AUREON Noir — data layer.
// Everything comes from the native Home Assistant registries in the hass object
// (hass.areas, hass.devices, hass.entities, hass.states). No entity id is guessed:
// classification uses domain, device_class, registry labels and the device the
// entity belongs to. Pure functions only, so they can be tested without a browser.

export const BAD = ['unknown', 'unavailable'];
export const labelKey = (v) => String(v || '').trim().toLowerCase().replaceAll('-', '_');

// Semantic labels (create them in HA → Configurações → Etiquetas):
//   no_dboard            → never shown on the dashboard (kept from AUREON)
//   steckdosen_dashboard → a switch that is a socket/plug (kept from AUREON)
//   protegida / immer_an / always_on / no_off → plug can never be switched off here
//   systemgeraete_dashboard (owner's HA: "Roteador, central de aquecimento e equipamentos essenciais") → protected
// Owner 2026-11-18: roles also come from the label's own description in HA, so a new label works without code.
const HIDE = ['no_dboard'];
const OUTLET = ['steckdosen_dashboard', 'show_dboard', 'tomada', 'steckdose', 'outlet', 'plug'];
const PROTECT = ['protegida', 'protegido', 'immer_an', 'always_on', 'no_off', 'nicht_ausschalten', 'aureon_protect', 'systemgeraete_dashboard', 'systemgeräte_dashboard', 'systemgeraete', 'essenciais', 'essential'];
const ROLE_RE = {
  protect: /essenci|essential|wichtig|systemger|nie aus|nicht aus|never (switch|turn) off|não deslig|nao deslig|roteador|router|heizung|aquecimento/i,
  hide: /exklud|exclu|ausblend|esconde|hide|no_dboard/i,
  outlet: /tomadas? que|steckdose|outlet|switch-entit|schalter/i
};
export function labelRoles(meta) {
  // meta: { [label_id]: { name, description } } → { [label_id]: 'protect' | 'hide' | 'outlet' }
  const out = {};
  for (const [id, l] of Object.entries(meta || {})) {
    const key = labelKey(id), name = labelKey(l?.name);
    if (HIDE.includes(key) || HIDE.includes(name)) out[id] = 'hide';
    else if (PROTECT.includes(key) || PROTECT.includes(name)) out[id] = 'protect';
    else if (OUTLET.includes(key) || OUTLET.includes(name)) out[id] = 'outlet';
    else if (l?.description) { for (const r of ['protect', 'hide', 'outlet']) if (ROLE_RE[r].test(l.description)) { out[id] = r; break; } }
  }
  return out;
}

const hasLabel = (reg, labels, keys) => (reg?.allLabels || reg?.labels || []).some((id) => keys.includes(labelKey(id)) || keys.includes(labelKey(labels?.[id])) || (labels?.__roles?.[id] && keys === ({ hide: HIDE, protect: PROTECT, outlet: OUTLET })[labels.__roles[id]]));

const OUTDOOR = /balk|balcon|varanda|terra(s|z)|garten|garden|jardim|patio|pátio|quintal|pool|piscina|outdoor|au(ss|ß)en/i;
// Fridge/freezer, network, Home Assistant/server, heating, aquarium: never switched off by the dashboard.
export const ESSENTIAL = /k(ü|ue)hl|gefrier|fridge|freezer|geladeira|congelador|refrigerador|router|fritz|modem|wlan|wi-?fi|mesh|home ?assistant|\bisg\b|server|\bnas\b|heizung|w(ä|ae)rmepumpe|caldeira|aquar|alarm/i;
export const PLUG_RUN_W = 8, PLUG_IDLE_W = 3;
// Battery tones (owner 2026-11-18): red = practically empty, yellow = critical, green = charged.
export const BATT_EMPTY = 10, BATT_LOW = 25;
const BT_ORDER = { red: 0, yellow: 1, green: 2 };
export function batteryTone(b) {
  if (b.level != null) return b.level <= BATT_EMPTY ? 'red' : b.level <= BATT_LOW ? 'yellow' : 'green';
  return b.low ? 'red' : 'green';
}
const APPLIANCE = [
  ['dish', /sp(ü|ue)lmaschine|geschirr|dish ?washer|lava-lou|lava lou|lou(ç|c)a/i],
  ['dryer', /trockner|dryer|secadora/i],
  ['washer', /wasch(?!becken)|washer|washing|lavadora|m(á|a)quina de lavar/i]
];
export const applianceKind = (text) => (APPLIANCE.find(([, re]) => re.test(String(text || ''))) || [null])[0];
const WASTE = /abfall|m(ü|ue|u)ll|waste|tonne|garbage|trash|recycl|restm|bio|papier|gelb|wertstoff|coleta|lixo/i;
const CONSUMPTION = /verbrauch|consumption|consumo/i;
const PERIODIC = /today|heute|daily|t[äa]glich|hoje|week|woche|month|monat|m[êe]s|year|jahr|ano|yesterday|gestern/i;
const SOLAR = /solar|photovolt|\bpv\b|_pv_|wechselrichter|inverter/i;
const GRID = /grid|netz|bezug|einspeis|import|export/i;

export function kelvinToRgb(k) {
  const t = Math.max(1000, Math.min(40000, k)) / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
  else { r = 329.7 * Math.pow(t - 60, -0.1332); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; }
  const c = (x) => Math.round(Math.max(0, Math.min(255, x)));
  return [c(r), c(g), c(b)];
}

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

export function cleanName(name, areaName) {
  let n = String(name || '').trim();
  if (areaName) {
    const a = areaName.toLowerCase();
    if (n.toLowerCase().startsWith(a + ' ') && n.length > a.length + 1) {
      // Owner 2026-11-18: "Flur - Lampen" must not become "- Lampen" — drop the separator too.
      const rest = n.slice(areaName.length + 1).replace(/^[\s\-–—·:|/_.,]+/, '').trim();
      if (rest.length >= 2) n = rest;
    }
  }
  return n ? n.charAt(0).toLocaleUpperCase() + n.slice(1) : n;
}

function dayKey(value, zone) {
  if (typeof value !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  try {
    const p = new Intl.DateTimeFormat('en', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    return ['year', 'month', 'day'].map((k) => p.find((x) => x.type === k)?.value).join('-');
  } catch { return null; }
}
const GENERIC = /^\s*(?:abfuhr|abholung|leerung|entleerung|müllabfuhr|collection(?:\s+of)?|pickup|pick-up|coleta(?:\s+de)?|recolha(?:\s+de)?)\b[\s:–—-]*/i;
export const wasteName = (raw) => { const t = String(raw || '').trim(), c = t.replace(GENERIC, '').trim(); return c ? c.charAt(0).toLocaleUpperCase() + c.slice(1) : t; };

// Same formats the previous AUREON accepted (WCS date-keyed / type-to-date / upcoming list / calendar).
export function wasteCollections(state, now, zone) {
  const today = dayKey(now.toISOString(), zone);
  if (!today || !state || BAD.includes(state.state)) return [];
  const rows = [], a = state.attributes || {};
  const add = (date, type) => {
    const key = dayKey(date, zone);
    if (!key || typeof type !== 'string' || !type.trim()) return;
    const days = Math.round((Date.parse(key + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 86400000);
    if (days >= 0) rows.push({ id: state.entity_id + ':' + key + ':' + type, date: key, type: wasteName(type), days });
  };
  if (state.entity_id.startsWith('calendar.')) add(a.start_time, a.message);
  else {
    for (const [k, v] of Object.entries(a)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k)) add(k, v);
      else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && k !== 'last_update') add(v, k);
    }
    if (Array.isArray(a.upcoming)) for (const e of a.upcoming) add(e.date, Array.isArray(e.types) ? e.types.join(', ') : e.type);
  }
  return rows;
}

// Dreame (Tasshack) and similar: rooms of the selected map, the planned order and the room being cleaned now.
export function vacuumRooms(attrs) {
  const a = attrs || {};
  let rooms = a.rooms;
  if (rooms && !Array.isArray(rooms) && typeof rooms === 'object') rooms = rooms[a.selected_map] || Object.values(rooms)[0];
  if (!Array.isArray(rooms)) return null;
  rooms = rooms.filter((r) => r && r.id != null && r.name);
  if (rooms.length < 2) return null;
  const byId = new Map(rooms.map((r) => [String(r.id), r]));
  let ids = Array.isArray(a.active_segments) && a.active_segments.length ? a.active_segments.map(String) : null;
  const seq = Array.isArray(a.cleaning_sequence) && a.cleaning_sequence.length ? a.cleaning_sequence.map(String) : rooms.slice().sort((x, y) => (x.order ?? 99) - (y.order ?? 99)).map((r) => String(r.id));
  ids = ids ? seq.filter((id) => ids.includes(id)).concat(ids.filter((id) => !seq.includes(id))) : seq;
  const list = ids.map((id) => byId.get(id)).filter(Boolean);
  if (list.length < 1) return null;
  const cur = a.current_segment != null ? list.findIndex((r) => String(r.id) === String(a.current_segment)) : -1;
  return { list: list.map((r) => r.name), cur, whole: !(Array.isArray(a.active_segments) && a.active_segments.length) };
}

export const BIN_COLORS = [[/gelb|yellow|amarel|verpack|plast|wertstoff/i, '#E3C03C'], [/bio|organ/i, '#9A7046'], [/papier|paper|papel|blau|blue|azul|karton/i, '#3A72BD'], [/glas|glass|vidro/i, '#4F9A6B'], [/rest|residu|schwarz|black|grau|grey|gray|haus/i, '#6A6A70']];
// Short bin name for small spaces: "Schwarze Restmülltonne" → "Restmüll", "Blaue Papiertonne" → "Papier",
// "Grüne Biotonne" → "Bio". The colour is shown by the bin dot, so the colour word can go. Unknown names stay whole.
const BIN_ADJ = /^(schwarze?[rn]?|blaue?[rn]?|grüne?[rn]?|gelbe?[rn]?|braune?[rn]?|graue?[rn]?|rote?[rn]?|black|blue|green|yellow|brown|grey|gray|red)\s+/i;
export function shortBin(name) {
  const full = String(name || '').trim();
  let s = full.replace(BIN_ADJ, '');
  if (/^(tonne|sack|bin|container)$/i.test(s)) return full;
  s = s.replace(/(?<=\p{L}{3})(tonne|behälter|container)$/iu, '').replace(/\s+(tonne|bin|container)$/i, '');
  return s || full;
}
export const binColor = (type) => (BIN_COLORS.find(([re]) => re.test(type)) || [0, '#6A6A70'])[1];

// ─────────────────────────────────────────────────────────────────────────────
export function buildModel(hass, opts = {}) {
  const now = opts.now || new Date();
  const labels = opts.labels || {};           // label_id → name (optional, from the label registry)
  const aliases = opts.aliases || {};         // entity_id → name kept only in this browser
  const hidden = new Set(opts.hidden || []);
  const forceShow = new Set(opts.forceShow || []);
  const zone = hass?.config?.time_zone || 'UTC';
  const states = hass?.states || {}, regs = hass?.entities || {}, devices = hass?.devices || {}, areaReg = hass?.areas || {};

  const areas = Object.values(areaReg).map((a) => ({ id: a.area_id, name: a.name, outdoor: OUTDOOR.test(a.name || '') || OUTDOOR.test(a.area_id || '') }));
  const areaName = (id) => areaReg[id]?.name || '';

  const byDevice = {};
  const m = { lights: [], plugs: [], climate: [], covers: [], openings: [], locks: [], alarms: [], cams: [], speakers: [], tvs: [], accounts: [], hiddenMedia: [], vacuums: [], scenes: [], people: [], proximity: [], appliances: [], waste: [], weather: null, sun: states['sun.sun'] || null, power: [], batteries: [], energyAll: [], energyMeters: [], energyByLabel: false, energyToday: null, energyMonth: null, costToday: null, price: null, solarW: null, gridW: null, batterySoc: null, all: [] };

  for (const [eid, st] of Object.entries(states)) {
    const reg0 = regs[eid] || {};
    // Labels on the device count for every entity of that device (owner labels devices in HA).
    const reg = { ...reg0, allLabels: [...new Set([...(reg0.labels || []), ...((reg0.device_id && devices[reg0.device_id]?.labels) || [])])] };
    const domain = eid.split('.')[0];
    // Owner 2026-11-18 ("o meu energia nem aparece"): every power sensor feeds Energy — also the ones HA hides
    // by default (many plugs ship them hidden) and the ones measured in kW.
    const pu = st.attributes?.unit_of_measurement;
    const isPower = domain === 'sensor' && (st.attributes?.device_class === 'power' || pu === 'W' || pu === 'kW');
    // Owner 2026-11-18: battery check — every battery the home reports (also hidden/diagnostic ones), phones excluded
    // because they charge every day.
    const bdc = st.attributes?.device_class;
    if (bdc === 'battery' && (domain === 'sensor' || domain === 'binary_sensor') && reg.platform !== 'mobile_app' && !hasLabel({ ...reg, allLabels: reg.allLabels }, labels, HIDE) && !BAD.includes(st.state)) {
      const dev0 = reg.device_id ? devices[reg.device_id] : null, area0 = reg.area_id || dev0?.area_id || null;
      const level = domain === 'sensor' ? num(st.state) : null, low = domain === 'binary_sensor' ? st.state === 'on' : null;
      if (domain === 'binary_sensor' || (level != null && /%/.test(pu || '%'))) m.batteries.push({ id: eid, device: reg.device_id || null, area: area0, areaName: areaName(area0), name: dev0 ? cleanName(dev0.name_by_user || dev0.name || eid, areaName(area0)) : cleanName(st.attributes?.friendly_name || eid, areaName(area0)).replace(/\s*(battery|batterie|bateria)\s*$/i, ''), level, low });
    }
    // Owner 2026-11-18 ("o energia tem que calcular sozinho … label verbrauch"): every energy counter (kWh, total)
    // is a candidate meter; the dashboard sums their statistics itself, the owner only sets the price.
    const sc = st.attributes?.state_class;
    if (domain === 'sensor' && (st.attributes?.device_class === 'energy' || /^[kM]?Wh$/.test(pu || '')) && (sc === 'total_increasing' || sc === 'total') && !hasLabel(reg, labels, HIDE)) {
      const dev1 = reg.device_id ? devices[reg.device_id] : null, area1 = reg.area_id || dev1?.area_id || null, fn = st.attributes?.friendly_name || eid;
      m.energyAll.push({ id: eid, device: reg.device_id || null, area: area1, areaName: areaName(area1), name: dev1 ? cleanName(dev1.name_by_user || dev1.name || fn, areaName(area1)) : cleanName(fn, areaName(area1)), text: eid + ' ' + fn + ' ' + (dev1?.name || ''), consumption: (reg.allLabels || []).some((id) => CONSUMPTION.test(id + ' ' + (labels?.[id] || ''))) });
    }
    if ((reg.hidden || reg.hidden_by) && !forceShow.has(eid) && !isPower) {
      if (domain === 'media_player') m.hiddenMedia.push({ id: eid, name: st.attributes?.friendly_name || eid });
      continue;
    }
    if (hasLabel(reg, labels, HIDE)) continue;
    const dev = reg.device_id ? devices[reg.device_id] : null;
    const area = reg.area_id || dev?.area_id || null;
    const a = st.attributes || {};
    // Owner 2026-11-18: a name the user typed in HA (registry name) is shown exactly as typed.
    const base = reg.name ? String(reg.name).trim() : cleanName(a.friendly_name || eid, areaName(area));
    const item = { id: eid, domain, area, areaName: areaName(area), device: reg.device_id || null, name: aliases[eid] || base, baseName: base, state: st.state, attrs: a, st, reg, labels: reg.allLabels, unavailable: BAD.includes(st.state), hidden: hidden.has(eid) };
    if (reg.device_id) (byDevice[reg.device_id] ||= []).push(item);
    const technical = reg.entity_category === 'config' || reg.entity_category === 'diagnostic';
    const dc = a.device_class;

    if (domain === 'weather' && !m.weather) m.weather = item;
    if (domain === 'person') { m.people.push(item); continue; }
    if (domain === 'sensor' && reg.platform === 'proximity') { (m.proximity ||= []).push(item); continue; }
    if (domain === 'scene') { m.scenes.push(item); continue; }
    if (isPower) { const v = num(st.state); m.power.push({ ...item, w: v == null ? null : pu === 'kW' ? v * 1000 : v }); continue; }
    if (domain === 'sensor' && dc === 'energy' && /today|heute|daily|hoje|tag/i.test(eid + ' ' + base) && m.energyToday == null) m.energyToday = { v: num(st.state), unit: a.unit_of_measurement || 'kWh' };
    if (domain === 'sensor' && dc === 'energy' && /month|monat|monthly|mês|mes\b|mensal/i.test(eid + ' ' + base) && m.energyMonth == null) m.energyMonth = { v: num(st.state), unit: a.unit_of_measurement || 'kWh' };
    if (domain === 'sensor' && (dc === 'monetary' || /^(€|eur|\$|usd|r\$|brl)$/i.test(a.unit_of_measurement || '')) && /cost|kosten|custo/i.test(eid + ' ' + base) && /today|heute|hoje|daily|tag/i.test(eid + ' ' + base) && m.costToday == null) m.costToday = { v: num(st.state), unit: a.unit_of_measurement || '€' };
    if (domain === 'sensor' && /\/\s*kwh$/i.test(a.unit_of_measurement || '') && m.price == null) m.price = { v: num(st.state), unit: String(a.unit_of_measurement).split('/')[0].trim() };
    if (domain === 'sensor' && /%/.test(a.unit_of_measurement || '') && dc === 'battery' && SOLAR.test(dev?.name || '') ) m.batterySoc = num(st.state);
    if ((domain === 'sensor' || domain === 'calendar') && WASTE.test(eid + ' ' + base)) m.waste.push(...wasteCollections(st, now, zone));
    if (technical) continue;

    if (domain === 'light') {
      const on = st.state === 'on';
      const b = a.brightness != null ? Math.round(a.brightness / 2.55) : (on ? 100 : 0);
      const rgb = a.rgb_color || (a.color_temp_kelvin ? kelvinToRgb(a.color_temp_kelvin) : [245, 190, 110]);
      const modes = a.supported_color_modes || [];
      m.lights.push({ ...item, on, b: Math.max(0, Math.min(100, b)), rgb, dimmable: modes.some((x) => x !== 'onoff'), ct: modes.includes('color_temp'), kelvin: a.color_temp_kelvin || null, minK: a.min_color_temp_kelvin || 2200, maxK: a.max_color_temp_kelvin || 6500 });
    } else if (domain === 'switch' && /^(alexa_devices|alexa_media|dreame_vacuum|xiaomi_miio|roborock|ecovacs)$/.test(reg.platform || '') && !hasLabel(reg, labels, OUTLET)) {
      // Owner 2026-11-16: Alexa "do not disturb" and robot settings (Auto Drying, Self-Clean…) are not plugs.
    } else if (domain === 'switch') {
      const outlet = dc === 'outlet' || hasLabel(reg, labels, OUTLET) || /steckdose|plug|outlet|tomada|socket|smart ?plug/i.test(base + ' ' + (dev?.model || '') + ' ' + (dev?.name || ''));
      // Owner 2026-11-17 (Fora/Férias left the fridge off): essentials are protected even without a label.
      const essential = ESSENTIAL.test([item.name, st.attributes.friendly_name, devices[reg.device_id]?.name_by_user, devices[reg.device_id]?.name].filter(Boolean).join(' '));
      m.plugs.push({ ...item, on: st.state === 'on', outlet, essential, locked: hasLabel(reg, labels, PROTECT) || essential });
    } else if (domain === 'climate') {
      m.climate.push({ ...item, cur: num(a.current_temperature), target: num(a.temperature), action: a.hvac_action || null, mode: st.state, min: num(a.min_temp) ?? 5, max: num(a.max_temp) ?? 30, step: num(a.target_temp_step) || 0.5, hum: num(a.current_humidity) });
    } else if (domain === 'cover') {
      const pos = num(a.current_position);
      m.covers.push({ ...item, pos: pos ?? (st.state === 'open' ? 100 : st.state === 'closed' ? 0 : 50), hasPos: pos != null && ((a.supported_features || 0) & 4) === 4, moving: st.state === 'opening' || st.state === 'closing', curtain: /vorhang|curtain|cortina|gardine/i.test(base) });
    } else if (domain === 'binary_sensor' && ['door', 'window', 'opening', 'garage_door'].includes(dc)) {
      m.openings.push({ ...item, open: st.state === 'on', door: dc === 'door' || dc === 'garage_door' });
    } else if (domain === 'lock') {
      m.locks.push({ ...item, locked: st.state === 'locked' });
    } else if (domain === 'alarm_control_panel') {
      m.alarms.push({ ...item, needsCode: !!a.code_format });
    } else if (domain === 'camera') {
      m.cams.push(item);
    } else if (domain === 'media_player') {
      if (reg.platform === 'spotifyplus' || reg.platform === 'aureon_music' || Object.hasOwn(a, 'sp_user_id')) { m.accounts.push({ ...item, playing: st.state === 'playing' }); continue; }
      m.speakers.push({ ...item, playing: st.state === 'playing', vol: a.volume_level != null ? Math.round(a.volume_level * 100) : null, features: a.supported_features || 0, tv: dc === 'tv' || /\btv\b|fernseh|televis|webos|bravia/i.test(base + ' ' + (dev?.model || '')) });
    } else if (domain === 'vacuum') {
      m.vacuums.push(item);
    }
  }

  // People: zone name and, with the HA "Proximity" integration, distance and direction to home (owner 2026-11-18).
  const zoneName = (st) => (st === 'home' ? 'home' : st === 'not_home' ? 'away' : st);
  for (const p of m.people) {
    p.zone = zoneName(p.state);
    const nm = labelKey(p.attrs?.friendly_name || p.name);
    const mine = (m.proximity || []).filter((x) => labelKey(x.attrs?.friendly_name || x.name).includes(nm) || labelKey(x.id).includes(labelKey(p.id.split('.')[1])));
    const dist = mine.find((x) => x.attrs?.device_class === 'distance' || /distance|distanz|distância/i.test(x.id));
    const dir = mine.find((x) => /direction|richtung|dire/i.test(x.id));
    if (dist && !dist.unavailable && Number.isFinite(Number(dist.state))) {
      const u = String(dist.attrs?.unit_of_measurement || 'm').toLowerCase();
      p.distM = Number(dist.state) * (u === 'km' ? 1000 : u === 'mi' ? 1609.34 : u === 'ft' ? 0.3048 : 1);
      p.distId = dist.id;
    }
    if (dir) p.dir = dir.state;
  }
  { const byDev = {}; for (const b of m.batteries) { const k = b.device || b.id, cur = byDev[k]; if (!cur || (cur.level == null && b.level != null)) byDev[k] = { ...b, low: b.low ?? cur?.low ?? null }; }
    const vacD = new Set(m.vacuums.map((v) => v.device).filter(Boolean)); // robots charge themselves
    m.batteries = Object.values(byDev).filter((b) => !(b.device && vacD.has(b.device))).map((b) => ({ ...b, tone: batteryTone(b) })).sort((a, b) => BT_ORDER[a.tone] - BT_ORDER[b.tone] || (a.level ?? 101) - (b.level ?? 101)); }
  // Owner 2026-11-18: a TV is a device of its own, not a speaker.
  m.tvs = m.speakers.filter((x) => x.tv);
  m.speakers = m.speakers.filter((x) => !x.tv);
  // Settings switches of a robot vacuum are not plugs either.
  const vacDevs = new Set(m.vacuums.map((v) => v.device).filter(Boolean));
  m.plugs = m.plugs.filter((p) => !(p.device && vacDevs.has(p.device)) || hasLabel(p.reg, labels, OUTLET));
  // Power per device, linked to the plug of the same device.
  const powerByDevice = {};
  for (const p of m.power) if (p.device && p.w != null) powerByDevice[p.device] = (powerByDevice[p.device] || 0) + p.w;
  for (const p of m.plugs) p.w = p.device && powerByDevice[p.device] != null ? Math.round(powerByDevice[p.device]) : null;
  const solar = m.power.filter((p) => SOLAR.test(p.id + ' ' + p.baseName + ' ' + (devices[p.device]?.name || '')));
  const grid = m.power.filter((p) => GRID.test(p.id + ' ' + p.baseName) && !solar.includes(p));
  if (solar.length) m.solarW = Math.round(solar.reduce((s, p) => s + (p.w || 0), 0));
  if (grid.length) m.gridW = Math.round(grid[0].w || 0);
  m.plugW = Math.round(m.plugs.reduce((s, p) => s + (p.on && p.w ? p.w : 0), 0));
  m.metered = m.plugs.filter((p) => p.w != null);
  // Power sensors that belong to no plug (a measuring plug whose switch is hidden, a device meter…), one row per device.
  const plugDevs = new Set(m.plugs.map((p) => p.device).filter(Boolean)), loose = {};
  for (const p of m.power) {
    if (p.w == null || solar.includes(p) || grid.includes(p) || (p.device && plugDevs.has(p.device))) continue;
    if (/total|gesamt|house|haus|casa|home|standby/i.test(p.id + ' ' + p.baseName) && !p.device) continue;
    const key = p.device || p.id, dev = p.device ? devices[p.device] : null;
    const g = (loose[key] ||= { id: key, device: p.device, name: dev ? cleanName(dev.name_by_user || dev.name || p.name, p.areaName) : p.name, area: p.area, areaName: p.areaName, on: true, w: 0, sensor: true });
    g.w += p.w;
  }
  m.loosePower = Object.values(loose).map((g) => ({ ...g, w: Math.round(g.w) }));
  // Energy meters: with a "Verbrauch" label only those count; otherwise every device counter except solar, grid and
  // periodic copies (utility meters "heute/Monat" would count the same energy twice). One counter per device.
  m.energyByLabel = m.energyAll.some((e) => e.consumption);
  { const pool = m.energyAll.filter((e) => (m.energyByLabel ? e.consumption : !SOLAR.test(e.text) && !GRID.test(e.text) && !/produc|erzeug|r[üu]ckspeis|returned/i.test(e.text)) && !PERIODIC.test(e.text)), per = {};
    for (const e of pool) { const k = e.device || e.id, cur = per[k]; if (!cur || (/total|gesamt/i.test(e.text) && !/total|gesamt/i.test(cur.text))) per[k] = e; }
    m.energyMeters = Object.values(per); }

  // Washer / dryer / dishwasher: device level, from whatever sensors that device exposes.
  const seen = new Set();
  for (const p of m.metered) {
    const kind = (APPLIANCE.find(([, re]) => re.test(p.name)) || [])[0];
    if (!kind || !p.device || APPLIANCE.some(([, re]) => re.test([devices[p.device]?.name_by_user, devices[p.device]?.name, devices[p.device]?.model].filter(Boolean).join(' ')))) continue;
    seen.add(p.device);
    const pw = m.power.filter((x) => x.device === p.device);
    m.appliances.push({ plug: true, powerIds: pw.map((x) => x.id), entities: [p.id, ...pw.map((x) => x.id)], w: p.w, id: p.device, kind, name: p.name, area: p.area, areaName: p.areaName, pct: null, mins: null, endAt: null, status: '', program: '', done: false, running: p.w >= PLUG_RUN_W, idle: p.w < PLUG_RUN_W });
  }
  for (const [devId, items] of Object.entries(byDevice)) {
    const dev = devices[devId] || {};
    const text = [dev.name_by_user, dev.name, dev.model].filter(Boolean).join(' ');
    const kind = (APPLIANCE.find(([, re]) => re.test(text)) || [])[0];
    if (!kind || seen.has(devId)) continue;
    seen.add(devId);
    const sensors = items.filter((x) => x.domain === 'sensor' || x.domain === 'binary_sensor' || x.domain === 'select');
    const pick = (re) => sensors.find((x) => re.test(x.id + ' ' + x.baseName) && !x.unavailable);
    const prog = pick(/progress|fortschritt|progresso/);
    const remain = pick(/remaining|verbleib|restzeit|rest_zeit|tempo_restante|time_left/);
    const finish = pick(/finish|ende|end_time|fertig|programm_ende|termina/);
    const status = pick(/operation|betrieb|status|state|phase|estado/) || pick(/programm|program/);
    const progEnt = sensors.find((x) => /program|programa/i.test(x.id + ' ' + x.baseName) && !/progress|fortschritt|ende|end|finish|remaining|time|zeit/i.test(x.id) && x !== status && !x.unavailable && !/^(unknown|none|off|aus|)$/i.test(String(x.state)));
    const tempEnt = sensors.find((x) => /temperat/i.test(x.id + ' ' + x.baseName) && !x.unavailable);
    const area = items[0]?.area || dev.area_id || null;
    let pct = prog ? num(prog.state) : null;
    let mins = null, endAt = null;
    if (remain) { const v = num(remain.state); if (v != null) mins = (remain.attrs.unit_of_measurement || '').startsWith('h') ? v * 60 : (remain.attrs.unit_of_measurement || '').startsWith('s') ? v / 60 : v; else if (/^\d+:\d{2}/.test(remain.state)) { const [h, mm] = remain.state.split(':').map(Number); mins = h * 60 + mm; } }
    if (finish && Number.isFinite(Date.parse(finish.state))) endAt = new Date(finish.state);
    if (endAt && mins == null) mins = Math.max(0, Math.round((endAt - now) / 60000));
    if (mins != null && !endAt) endAt = new Date(now.getTime() + mins * 60000);
    const stText = status ? String(status.state) : '';
    const done = /finish|fertig|beendet|ende\b|end\b|done|complete|concluí|pronto/i.test(stText) || pct === 100;
    const idle = !done && (/^(off|aus|idle|standby|ready|bereit|inactive|inaktiv|none|desligad)/i.test(stText) || (!stText && pct == null && mins == null));
    // An older machine without its own integration, measured by a smart plug (owner 2026-11-16: "máquina velha").
    const pw = items.filter((x) => x.domain === 'sensor' && x.attrs?.device_class === 'power' && !x.unavailable);
    if (!status && !prog && !remain && !finish && pw.length) {
      const w = Math.round(pw.reduce((s2, x) => s2 + (num(x.state) || 0), 0));
      m.appliances.push({ plug: true, powerIds: pw.map((x) => x.id), entities: items.map((x) => x.id), w, id: devId, kind, name: cleanName(dev.name_by_user || dev.name || kind, areaName(area)).replace(/\s+(plug|steckdose|tomada)$/i, ''), area, areaName: areaName(area), pct: null, mins: null, endAt: null, status: '', program: '', done: false, running: w >= PLUG_RUN_W, idle: w < PLUG_RUN_W });
      continue;
    }
    const human = (v) => { let x = String(v || '').split('.').pop().replace(/_/g, ' ').replace(/([a-z])([A-Z0-9])/g, '$1 $2').trim(); return x ? x[0].toUpperCase() + x.slice(1) : ''; };
    const program = progEnt ? human(progEnt.state) : '';
    let temp = '';
    if (tempEnt) { const tv = String(tempEnt.state).match(/(\d{2,3})\s*$/) || String(tempEnt.state).match(/GC(\d+)/i); if (tv) temp = tv[1] + '°'; else if (/cold|kalt|fria/i.test(tempEnt.state)) temp = '❄'; }
    m.appliances.push({ entities: items.map((x) => x.id), program: [program, temp].filter(Boolean).join(' '), id: devId, kind, name: cleanName(dev.name_by_user || dev.name || kind, areaName(area)), area, areaName: areaName(area), pct, mins, endAt, status: stText, statusLabel: status ? (status.attrs?.options ? stText : stText) : '', done, running: !done && !idle, idle });
  }

  // The robot's map is a camera of the robot's own device (Dreame & co.): it belongs to the robot, not to Security.
  const vacDevices = new Set(m.vacuums.map((v) => v.device).filter(Boolean));
  for (const v of m.vacuums) v.map = m.cams.find((c) => c.device && c.device === v.device) || null;
  m.cams = m.cams.filter((c) => !(c.device && vacDevices.has(c.device)));
  for (const v of m.vacuums) {
    const items = v.device ? (byDevice[v.device] || []) : [];
    const bat = items.find((x) => x.domain === 'sensor' && x.attrs.device_class === 'battery' && !x.unavailable);
    if (bat) v.battery = num(bat.state);
    const fact = (re) => items.find((x) => x.domain === 'sensor' && re.test(x.id) && !x.unavailable && x.state !== '' );
    v.facts = [fact(/current_room|aktueller_raum/), fact(/cleaned_area|gereinigte_flache|area_cleaned/), fact(/cleaning_time|reinigungszeit/)].filter(Boolean).map((x) => x.state + (x.attrs.unit_of_measurement ? ' ' + x.attrs.unit_of_measurement : ''));
  }
  m.waste.sort((x, y) => x.days - y.days || x.type.localeCompare(y.type));
  const uniq = new Map(); for (const w of m.waste) uniq.set(w.date + w.type, w); m.waste = [...uniq.values()];

  // Areas that actually have something to show, plus "no area".
  const domainsInArea = {};
  const visibleLists = ['lights', 'plugs', 'climate', 'covers', 'openings', 'locks', 'cams', 'speakers'];
  for (const k of visibleLists) for (const d of m[k]) (domainsInArea[d.area || '_none'] ||= []).push(d);
  m.areas = areas.filter((a) => domainsInArea[a.id]?.length);
  if (domainsInArea._none?.length) m.areas.push({ id: '_none', name: opts.noAreaName || '—', outdoor: false, none: true });
  m.byArea = domainsInArea;
  for (const k of visibleLists) for (const d of m[k]) if (!d.area) d.area = '_none';
  m.total = visibleLists.reduce((s, k) => s + m[k].length, 0) + m.vacuums.length + m.appliances.length;
  return m;
}

// Squarified-ish room layout for the 3D house / plan: rows with widths weighted by device count.
export function roomLayout(areas, weight) {
  const n = areas.length;
  if (!n) return [];
  const cols = Math.max(1, Math.round(Math.sqrt(n * 1.6)));
  const rows = [];
  for (let i = 0; i < n; i += cols) rows.push(areas.slice(i, i + cols));
  const rowW = rows.map((r) => r.reduce((s, a) => s + Math.max(1, weight(a)), 0));
  const total = rowW.reduce((s, x) => s + x, 0);
  const out = [];
  let y = 0;
  rows.forEach((r, ri) => {
    const h = Math.max(18, 100 * rowW[ri] / total);
    let x = 0;
    r.forEach((a) => {
      const w = 100 * Math.max(1, weight(a)) / rowW[ri];
      out.push({ area: a, x, y, w, h });
      x += w;
    });
    y += h;
  });
  const scale = 100 / y;
  return out.map((o) => ({ ...o, y: o.y * scale, h: o.h * scale }));
}
