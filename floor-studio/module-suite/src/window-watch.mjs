// AUREON original implementation, not a copy of Mastershort's paid module.
export const id = 'aureon.window_watch';
const messages = {
  pt: { cold: '{name} aberta há {min} min; lá fora {temp} °C', heat: 'Aquecimento ligado com {name} aberta há {min} min', none: 'Nenhuma janela aberta por tempo excessivo.' },
  de: { cold: '{name} seit {min} Min. offen; draußen {temp} °C', heat: 'Heizung läuft bei offenem Fenster: {name} ({min} Min.)', none: 'Kein Fenster steht zu lange offen.' },
  en: { cold: '{name} open for {min} min; outside {temp} °C', heat: 'Heating on with {name} open for {min} min', none: 'No window has been open too long.' }
};
export const language = raw => /^(pt)/i.test(raw || '') ? 'pt' : /^(de)/i.test(raw || '') ? 'de' : 'en';
const fmt = (str, data) => str.replace(/\{(\w+)\}/g, (_, key) => String(data[key] ?? ''));
export function getTemperature(hass, weatherEntity) {
  const id = weatherEntity || Object.keys(hass?.states || {}).find(x => x.startsWith('weather.'));
  const state = hass?.states?.[id];
  const raw = state?.attributes?.temperature;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  return /F/i.test(String(state.attributes.temperature_unit || '°C')) ? (raw - 32) * 5 / 9 : raw;
}
export function isHeating(hass, roomId, building = null) {
  if (!roomId) return false;
  const areaId = building?.floors?.flatMap(f => f.rooms || []).find(r => r.id === roomId)?.area_id || roomId;
  for (const [id, state] of Object.entries(hass?.states || {})) {
    if (!id.startsWith('climate.')) continue;
    const entry = hass?.entities?.[id];
    const area = entry?.area_id || hass?.devices?.[entry?.device_id]?.area_id;
    if (area !== areaId) continue;
    if (state.attributes?.hvac_action === 'heating') return true;
  }
  return false;
}
export function windowConfig(host) {
  const saved = host.building?.()?.settings?.mods?.[id];
  return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
}
export function scan(host, now = Date.now(), config = windowConfig(host)) {
  const hass = host.hass();
  if (!hass) return [];
  const temp = getTemperature(hass, config.weatherEntity || host.weather?.());
  const coldThreshold = Number.isFinite(config.coldThreshold) ? config.coldThreshold : 12;
  const coldMinutes = Number.isFinite(config.coldMinutes) ? config.coldMinutes : 20;
  const heatMinutes = Number.isFinite(config.heatMinutes) ? config.heatMinutes : 10;
  const seen = new Set();
  const result = [];
  for (const opening of host.openings()) {
    if (!['window', 'roof_window'].includes(opening.kind) || !(opening.open || opening.tilted) || seen.has(opening.id)) continue;
    seen.add(opening.id);
    const state = hass.states[opening.entity];
    const since = Date.parse(state?.last_changed || '');
    if (!Number.isFinite(since)) continue; // Unknown opening duration must not create a false alert.
    const min = Math.max(0, Math.floor((now - since) / 60000));
    const heat = isHeating(hass, opening.roomId, host.building?.());
    const kind = heat && min >= heatMinutes ? 'heat' : temp !== null && temp < coldThreshold && min >= coldMinutes ? 'cold' : null;
    if (kind) result.push({ opening, min, temp, kind });
  }
  return result;
}
export const module = {
  api: 1, id,
  watched(host) { return [...new Set([...host.openings().map(x => x.entity), ...Object.keys(host.hass()?.states || {}).filter(x => x.startsWith('climate.')), windowConfig(host).weatherEntity, host.weather?.()].filter(Boolean))]; },
  alerts(host) {
    const l = language(host.language());
    return scan(host, Date.now(), windowConfig(host)).map(({opening: o, min, temp, kind}) => ({
      kind: kind === 'heat' ? 'aureon_window_heating' : 'aureon_window_cold', entity: o.entity,
      text: fmt(messages[l][kind], {name: o.name, min, temp: Math.round(temp ?? 0)}),
      color: kind === 'heat' ? [1, .6, .22] : [.42, .72, 1], floorId: o.floorId, roomId: o.roomId
    }));
  },
  voice(sentence, host) {
    if (!/(janela|janelas|fenster|windows?)/i.test(sentence) || !/(abert|offen|open|tempo|lange|long)/i.test(sentence)) return null;
    const l = language(host.language()), found = scan(host, Date.now(), windowConfig(host));
    if (!found.length) return {text: messages[l].none, highlight: []};
    return {text: found.map(({opening:o,min,temp,kind}) => fmt(messages[l][kind], {name:o.name,min,temp:Math.round(temp ?? 0)})).join('. '), highlight:found.map(x=>x.opening.entity), tour:found.map(x=>({openingId:x.opening.id}))};
  },
  help(lang) { return language(lang) === 'pt' ? ['Quais janelas estão abertas há muito tempo?'] : language(lang) === 'de' ? ['Welche Fenster sind lange offen?'] : ['Which windows have been open too long?']; }
};
export default module;
