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
const HIDE = ['no_dboard'];
const OUTLET = ['steckdosen_dashboard', 'tomada', 'steckdose', 'outlet', 'plug'];
const PROTECT = ['protegida', 'protegido', 'immer_an', 'always_on', 'no_off', 'nicht_ausschalten', 'aureon_protect'];

const hasLabel = (reg, labels, keys) => (reg?.labels || []).some((id) => keys.includes(labelKey(id)) || keys.includes(labelKey(labels?.[id])));

const OUTDOOR = /balk|balcon|varanda|terra(s|z)|garten|garden|jardim|patio|pátio|quintal|pool|piscina|outdoor|au(ss|ß)en/i;
const APPLIANCE = [
  ['dish', /sp(ü|ue)lmaschine|geschirr|dish ?washer|lava-lou|lava lou|lou(ç|c)a/i],
  ['dryer', /trockner|dryer|secadora/i],
  ['washer', /wasch(?!becken)|washer|washing|lavadora|m(á|a)quina de lavar/i]
];
const WASTE = /abfall|m(ü|ue|u)ll|waste|tonne|garbage|trash|recycl|restm|bio|papier|gelb|wertstoff|coleta|lixo/i;
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
    if (n.toLowerCase().startsWith(a + ' ') && n.length > a.length + 1) n = n.slice(areaName.length + 1);
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

export const BIN_COLORS = [[/gelb|yellow|amarel|verpack|plast|wertstoff/i, '#E3C03C'], [/bio|organ/i, '#9A7046'], [/papier|paper|papel|blau|blue|azul|karton/i, '#3A72BD'], [/glas|glass|vidro/i, '#4F9A6B'], [/rest|residu|schwarz|black|grau|grey|gray|haus/i, '#6A6A70']];
export const binColor = (type) => (BIN_COLORS.find(([re]) => re.test(type)) || [0, '#6A6A70'])[1];

// ─────────────────────────────────────────────────────────────────────────────
export function buildModel(hass, opts = {}) {
  const now = opts.now || new Date();
  const labels = opts.labels || {};           // label_id → name (optional, from the label registry)
  const aliases = opts.aliases || {};         // entity_id → name kept only in this browser
  const hidden = new Set(opts.hidden || []);
  const zone = hass?.config?.time_zone || 'UTC';
  const states = hass?.states || {}, regs = hass?.entities || {}, devices = hass?.devices || {}, areaReg = hass?.areas || {};

  const areas = Object.values(areaReg).map((a) => ({ id: a.area_id, name: a.name, outdoor: OUTDOOR.test(a.name || '') || OUTDOOR.test(a.area_id || '') }));
  const areaName = (id) => areaReg[id]?.name || '';

  const byDevice = {};
  const m = { lights: [], plugs: [], climate: [], covers: [], openings: [], locks: [], alarms: [], cams: [], speakers: [], accounts: [], vacuums: [], scenes: [], people: [], appliances: [], waste: [], weather: null, sun: states['sun.sun'] || null, power: [], energyToday: null, solarW: null, gridW: null, batterySoc: null, all: [] };

  for (const [eid, st] of Object.entries(states)) {
    const reg = regs[eid] || {};
    const domain = eid.split('.')[0];
    if (reg.hidden || reg.hidden_by) continue;
    if (hasLabel(reg, labels, HIDE)) continue;
    const dev = reg.device_id ? devices[reg.device_id] : null;
    const area = reg.area_id || dev?.area_id || null;
    const a = st.attributes || {};
    const base = cleanName(reg.name || a.friendly_name || eid, areaName(area));
    const item = { id: eid, domain, area, areaName: areaName(area), device: reg.device_id || null, name: aliases[eid] || base, baseName: base, state: st.state, attrs: a, st, reg, labels: reg.labels || [], unavailable: BAD.includes(st.state), hidden: hidden.has(eid) };
    if (reg.device_id) (byDevice[reg.device_id] ||= []).push(item);
    const technical = reg.entity_category === 'config' || reg.entity_category === 'diagnostic';
    const dc = a.device_class;

    if (domain === 'weather' && !m.weather) m.weather = item;
    if (domain === 'person') { m.people.push(item); continue; }
    if (domain === 'scene') { m.scenes.push(item); continue; }
    if (domain === 'sensor' && dc === 'power') { m.power.push({ ...item, w: num(st.state) }); continue; }
    if (domain === 'sensor' && dc === 'energy' && /today|heute|daily|hoje|tag/i.test(eid + ' ' + base) && m.energyToday == null) m.energyToday = { v: num(st.state), unit: a.unit_of_measurement || 'kWh' };
    if (domain === 'sensor' && /%/.test(a.unit_of_measurement || '') && dc === 'battery' && SOLAR.test(dev?.name || '') ) m.batterySoc = num(st.state);
    if ((domain === 'sensor' || domain === 'calendar') && WASTE.test(eid + ' ' + base)) m.waste.push(...wasteCollections(st, now, zone));
    if (technical) continue;

    if (domain === 'light') {
      const on = st.state === 'on';
      const b = a.brightness != null ? Math.round(a.brightness / 2.55) : (on ? 100 : 0);
      const rgb = a.rgb_color || (a.color_temp_kelvin ? kelvinToRgb(a.color_temp_kelvin) : [245, 190, 110]);
      const modes = a.supported_color_modes || [];
      m.lights.push({ ...item, on, b: Math.max(0, Math.min(100, b)), rgb, dimmable: modes.some((x) => x !== 'onoff'), ct: modes.includes('color_temp'), kelvin: a.color_temp_kelvin || null, minK: a.min_color_temp_kelvin || 2200, maxK: a.max_color_temp_kelvin || 6500 });
    } else if (domain === 'switch') {
      const outlet = dc === 'outlet' || hasLabel(reg, labels, OUTLET) || /steckdose|plug|outlet|tomada|socket|smart ?plug/i.test(base + ' ' + (dev?.model || '') + ' ' + (dev?.name || ''));
      m.plugs.push({ ...item, on: st.state === 'on', outlet, locked: hasLabel(reg, labels, PROTECT) });
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

  // Washer / dryer / dishwasher: device level, from whatever sensors that device exposes.
  const seen = new Set();
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
    const status = pick(/operation|betrieb|status|state|programm|program|phase|estado/);
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
    m.appliances.push({ id: devId, kind, name: cleanName(dev.name_by_user || dev.name || kind, areaName(area)), area, areaName: areaName(area), pct, mins, endAt, status: stText, statusLabel: status ? (status.attrs?.options ? stText : stText) : '', done, running: !done && !idle, idle });
  }

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
