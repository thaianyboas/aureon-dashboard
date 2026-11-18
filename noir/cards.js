// AUREON Noir — the owner's own Home Assistant cards (built-in or installed through HACS) inside the dashboard.
// Owner 2026-11-18 ("quero poder adicionar outros cartões que baixei no HA"). Cards are created with Home Assistant's
// own card helpers, so any card that works in a normal HA dashboard works here; nothing here calls a service itself.
import yaml from 'js-yaml';

export const BUILTIN_CARDS = [
  ['tile', 'Tile'], ['entities', 'Entities'], ['button', 'Button'], ['gauge', 'Gauge'], ['glance', 'Glance'],
  ['sensor', 'Sensor'], ['history-graph', 'History graph'], ['statistics-graph', 'Statistics graph'],
  ['thermostat', 'Thermostat'], ['media-control', 'Media control'], ['weather-forecast', 'Weather forecast'],
  ['calendar', 'Calendar'], ['todo-list', 'To-do list'], ['map', 'Map'], ['markdown', 'Markdown'],
  ['picture-entity', 'Picture entity'], ['area', 'Area'], ['energy-distribution', 'Energy distribution']
];

// Cards installed through HACS register themselves in window.customCards.
export const installedCards = () => (Array.isArray(window.customCards) ? window.customCards : [])
  .filter((c) => c && c.type && !/^aureon/i.test(c.type))
  .map((c) => ({ type: 'custom:' + c.type, tag: c.type, name: c.name || c.type, description: c.description || '' }));

let helpersP = null;
export const cardHelpers = () => (helpersP ||= (window.loadCardHelpers ? window.loadCardHelpers() : Promise.reject(new Error('no card helpers'))));

export const tagOf = (type) => (String(type).startsWith('custom:') ? String(type).slice(7) : `hui-${type}-card`);

// A new card starts from the card's own example config when it offers one.
export async function stubConfig(type, hass) {
  try { await cardHelpers(); } catch { /* fine */ }
  const tag = tagOf(type);
  try { await Promise.race([customElements.whenDefined(tag), new Promise((r) => setTimeout(r, 1500))]); } catch { /* fine */ }
  const cls = customElements.get(tag), ents = Object.keys(hass?.states || {});
  try { const c = cls?.getStubConfig ? await cls.getStubConfig(hass, ents, ents) : null; if (c && typeof c === 'object') return { ...c, type }; } catch { /* fine */ }
  return { type };
}

// The card's own visual editor, when it has one (most HACS cards and all built-ins do).
export async function configElement(type, hass) {
  const cls = customElements.get(tagOf(type));
  if (!cls?.getConfigElement) return null;
  try { const el = await cls.getConfigElement(); el.hass = hass; el.lovelace = { config: { views: [] }, editMode: true }; return el; } catch { return null; }
}

export async function createCard(config, hass) {
  const h = await cardHelpers();
  const el = h.createCardElement(config);
  el.hass = hass;
  return el;
}

export const toYaml = (c) => { try { return yaml.dump(c, { lineWidth: 100, noRefs: true }); } catch { return ''; } };
export const fromYaml = (s) => { const v = yaml.load(s); if (!v || typeof v !== 'object' || Array.isArray(v) || !v.type) throw new Error('type'); return v; };
