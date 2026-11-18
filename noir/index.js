// AUREON Noir — the AUREON Dashboard for Home Assistant (HACS).
// One Lovelace card (`custom:aureon-dashboard`) plus the dashboard strategy
// (`strategy: type: custom:aureon-dashboard`). Reads the native registries in `hass`,
// sends a Home Assistant command only when the person taps something, renames in the
// entity/device registry only for administrators and only after an explicit confirmation.
import { LitElement, html, svg, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './styles.js';
import { buildModel, roomLayout, binColor, shortBin, vacuumRooms, labelRoles, applianceKind, PLUG_RUN_W, PLUG_IDLE_W } from './data.js';
import { translator, localeOf } from './i18n.js';
import { MusicController, isSpotifyPlus, artworkUrl, position } from '../floor-studio/dashboard/music/controller.mjs';

export const VERSION = '1.4.8';
export const BUILD = 'AUREON-NOIR-20261118j';

export const THEMES = [
  { id: 'aureon', name: 'Aureon', desc: 'Ouro · grafite', accent: '#E6CC9A', bg: '#08080A', card: '#111114', card2: '#0E0E11', sunk: '#0B0B0D', raise: '#17171B', line: '#1C1C21', line2: '#26262C' },
  { id: 'ambar', name: 'Âmbar', desc: 'Vela · café', accent: '#F5B65C', bg: '#0A0806', card: '#15110D', card2: '#110E0A', sunk: '#0C0A07', raise: '#1C1712', line: '#241E17', line2: '#30281F' },
  { id: 'oceano', name: 'Oceano', desc: 'Azul gelo · noite', accent: '#8FB8FF', bg: '#06080C', card: '#0F131A', card2: '#0B0F15', sunk: '#080B10', raise: '#151B24', line: '#1B2230', line2: '#253144' },
  { id: 'ametista', name: 'Ametista', desc: 'Lilás · ameixa', accent: '#B9A8FF', bg: '#08070C', card: '#121019', card2: '#0E0C14', sunk: '#0A0910', raise: '#18151F', line: '#211D2C', line2: '#2D2740' },
  { id: 'jade', name: 'Jade', desc: 'Menta · floresta', accent: '#7EE0A8', bg: '#060A08', card: '#0F1512', card2: '#0B110E', sunk: '#080D0A', raise: '#141C18', line: '#1B2721', line2: '#25362D' },
  { id: 'rose', name: 'Rosé', desc: 'Rosa antigo · vinho', accent: '#F2A7B5', bg: '#0B0708', card: '#161012', card2: '#120C0E', sunk: '#0D090A', raise: '#1D1517', line: '#271C20', line2: '#36282C' },
  { id: 'platina', name: 'Platina', desc: 'Preto · branco', accent: '#F2F2F3', bg: '#070707', card: '#111111', card2: '#0D0D0D', sunk: '#0A0A0A', raise: '#171717', line: '#1E1E1E', line2: '#2A2A2A' },
  { id: 'ha', name: 'Home Assistant', desc: 'Segue o tema do HA', ha: true }
];
const SECTIONS = ['lights', 'climate', 'plugs', 'energy', 'covers', 'openings', 'security', 'tv', 'music'];
const SCENE_GLOW = ['245,208,138', '169,155,255', '255,160,100', '143,184,255', '126,224,168', '242,167,181'];
const F = { PAUSE: 1, SEEK: 2, VOL: 4, PREV: 16, NEXT: 32, SOURCE: 2048, PLAY: 16384, SHUFFLE: 32768, GROUP: 524288 };

const P = {
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  power: 'M12 3v9M6.3 7.3a8 8 0 1 0 11.4 0',
  minus: 'M5 12h14', plus: 'M12 5v14M5 12h14',
  tv: 'M3 6h18v11H3zM8 21h8M12 17v4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  plug: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4', lock: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3', unlock: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 7.5-2',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4', eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 22 12a13 13 0 0 1-2.4 3.4M6.6 6.6A13 13 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.4-1',
  left: 'M15 6l-6 6 6 6', right: 'M9 6l6 6-6 6', up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', check: 'M5 12l5 5 9-10', x: 'M6 6l12 12M18 6 6 18',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z', cloud: 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  grid: 'M8 21 12 3l4 18M9.2 15h5.6M10 11h4M6 7h12', home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z', batt: 'M3 7h16v10H3zM21 11v2M7 10v4M10.5 10v4',
  flame: 'M12 2c1 3.5 5 5 5 10a5 5 0 0 1-10 0c0-2.5 1.2-3.8 2.4-5 0 2.3 1.1 3.5 2.4 3.5 0-3.5-1.2-5.5.2-8.5z',
  win: 'M4 3h16v18H4zM12 3v18M4 12h16', door: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16M14.5 12h.01', shield: 'M12 3l8 3v6c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V6z',
  speaker: 'M7 3h10v18H7zM12 8h.01M12 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', tv: 'M3 5h18v12H3zM8 21h8', note: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  play: 'M8 5v14l11-7z', pause: 'M6 5h4v14H6zM14 5h4v14h-4z', prev: 'M7 5h2v14H7zM20 5v14L10 12z', next: 'M15 5h2v14h-2zM4 5v14l10-7z',
  shuffle: 'M4 7h3c4 0 6 10 10 10h3M17 4l3 3-3 3M4 17h3c1.5 0 2.6-1.4 3.6-3M14 9.5C15 8 16 7 17 7h3M17 14l3 3-3 3', vol: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6',
  washer: 'M4 3h16v18H4zM12 17.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM7 6.5h2', dish: 'M4 3h16v18H4zM4 8h16M8 13h8M8 16.5h8', robot: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6', camOff: 'M3 3l18 18M15 10l6-3v10l-2-1M10 7h5v5M3 7h3v10h9', grip: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
  rain: 'M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 8a3.5 3.5 0 0 0 1 7zM8 18l-1 3M12 18l-1 3M16 18l-1 3', snow: 'M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 8a3.5 3.5 0 0 0 1 7zM8 19h.01M12 21h.01M16 19h.01M10 20.5h.01M14 20.5h.01',
  storm: 'M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 8a3.5 3.5 0 0 0 1 7zM12.5 15l-2 4h3l-2 4', fog: 'M4 9h16M6 13h12M4 17h16M8 21h8', moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  partly: 'M8 2.5v1.5M2.5 8H4M4.1 4.1l1 1M11.9 4.1l-1 1M5.5 10.5A3.5 3.5 0 0 1 11 6M9 20h8a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 8 13.5 3.3 3.3 0 0 0 9 20z', wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8',
  out: 'M14 4H6v16h8M10 12h10M17 9l3 3-3 3', suitcase: 'M4 8h16v12H4zM9 8V5h6v3M4 13h16', bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  mapI: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  palette: 'M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.3A4.7 4.7 0 0 0 21 9.8C21 6 17 3 12 3zM7.5 12.5h.01M9.5 8h.01M14.5 8h.01'
};
// A refined wheelie bin in the bin's colour (owner 2026-11-16: "algo como a opção A, porém mais elegante").
let binSeq = 0;
const binSvg = (c, open, key, cls = '') => {
  const id = 'b' + (++binSeq % 100000) + key, dk = `color-mix(in srgb,${c} 45%,#000)`, md = `color-mix(in srgb,${c} 80%,#000)`, lt = `color-mix(in srgb,${c} 70%,#fff)`;
  return svg`<svg class=${'wb ' + cls + (open ? ' open' : '')} viewBox="0 0 60 78"><defs>
    <linearGradient id=${id + 'g'} x1="0" x2="1"><stop offset="0" style=${'stop-color:' + dk}></stop><stop offset=".28" style=${'stop-color:' + lt}></stop><stop offset=".55" style=${'stop-color:' + c}></stop><stop offset="1" style=${'stop-color:' + dk}></stop></linearGradient>
    <linearGradient id=${id + 'l'} x1="0" x2="0" y1="0" y2="1"><stop offset="0" style=${'stop-color:' + lt}></stop><stop offset="1" style=${'stop-color:' + md}></stop></linearGradient></defs>
    <ellipse cx="30" cy="74" rx="21" ry="2.6" fill="rgba(0,0,0,.55)"></ellipse>
    <path d="M10.5 17h39l-3.6 49.2a3 3 0 0 1-3 2.8H17.1a3 3 0 0 1-3-2.8z" fill=${'url(#' + id + 'g)'}></path>
    <path d="M21.5 25v36M30 25v37M38.5 25v36" stroke="rgba(0,0,0,.22)" stroke-width="1.6" stroke-linecap="round"></path>
    <path d="M22.6 25v36M31.1 25v37M39.6 25v36" stroke="rgba(255,255,255,.07)" stroke-width="1" stroke-linecap="round"></path>
    <path d="M15 19.5 L17.6 64" stroke="rgba(255,255,255,.16)" stroke-width="2.2" stroke-linecap="round"></path>
    <rect x="8.5" y="14.5" width="43" height="4.5" rx="1.6" style=${'fill:' + dk}></rect>
    <circle cx="16.5" cy="69.5" r="4.2" fill="#0b0b0c" stroke="#2c2c30" stroke-width="1.2"></circle><circle cx="43.5" cy="69.5" r="4.2" fill="#0b0b0c" stroke="#2c2c30" stroke-width="1.2"></circle>
    <g class="lid"><path d="M6.5 13.6V9.8a3 3 0 0 1 3-3h41a3 3 0 0 1 3 3v3.8z" fill=${'url(#' + id + 'l)'}></path><rect x="23" y="3.4" width="14" height="3.4" rx="1.6" style=${'fill:' + md}></rect></g>
  </svg>`;
};
const ic = (n, cls = 'i') => svg`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true"><path d=${P[n]}></path></svg>`;
const WX = { 'clear-night': 'moon', cloudy: 'cloud', exceptional: 'sun', fog: 'fog', hail: 'snow', lightning: 'storm', 'lightning-rainy': 'storm', partlycloudy: 'partly', pouring: 'rain', rainy: 'rain', snowy: 'snow', 'snowy-rainy': 'snow', sunny: 'sun', windy: 'wind', 'windy-variant': 'wind' };
const WXC = { sun: '#F5D08A', moon: '#C9D8F5', partly: '#F5D08A', rain: '#8FB8FF', storm: '#B9A8FF', snow: '#E6F0FF', fog: '#A1A1AA', wind: '#C9D8F5', cloud: '#C9D8F5' };
const wxIcon = (cond, when, size) => { let k = WX[cond] || 'cloud'; const h = when ? when.getHours() : 12; if (k === 'sun' && (h < 6 || h >= 18)) k = 'moon'; return svg`<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style=${`color:${WXC[k]};${size === 'big' ? 'width:46px;height:46px;stroke-width:1.3' : 'width:18px;height:18px'}`}><path d=${P[k]}></path></svg>`; };
const hexRgb = (h) => { const m = String(h || '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!m) { const r = String(h || '').match(/(\d+)\D+(\d+)\D+(\d+)/); return r ? `${r[1]},${r[2]},${r[3]}` : '230,204,154'; } let x = m[1]; if (x.length === 3) x = x.split('').map((c) => c + c).join(''); const n = parseInt(x, 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };
const rgba = (rgb, a) => `rgba(${rgb},${a})`;
const p2 = (n) => String(n).padStart(2, '0');

class AureonDashboard extends LitElement {
  static properties = { hass: { attribute: false }, _config: { state: true }, _tick: { state: true }, _ui: { state: true } };
  static styles = styles;
  static getStubConfig() { return {}; }

  constructor() {
    super();
    this._config = {};
    this._ui = { room: 'all', domain: 'all', edit: false, showHidden: false, themeOpen: false, editing: null, draft: '', confirm: null, drag: null, over: null, unlockArm: null, player: null };
    this._toasts = [];
    this._prefs = null;
    this._prevAppl = null;
    this._labels = {};
    this._pendingTarget = {};
    this._local = {};
    this._accentRgb = '230,204,154';
    this._mc = new MusicController();
    this._mc.subscribe(() => this.requestUpdate());
  }

  setConfig(config) { this._config = { ...(config || {}) }; }
  getCardSize() { return 14; }
  connectedCallback() { super.connectedCallback(); this._timer = setInterval(() => { this._tick = Date.now(); this._toasts = this._toasts.filter((t) => t.exp > Date.now()); }, 1000); window.addEventListener('popstate', this._onPop); this._mountTop(); if (location.hash === '#aureon-music' && this._ui) this._ui = { ...this._ui, musicPage: true, libMore: true }; }
  disconnectedCallback() { window.removeEventListener('popstate', this._onPop); this._unmountTop(); clearInterval(this._timer); this._lblRO?.disconnect(); this._lblRO = null; this._lblObs = null; (this._unsubs || []).forEach((u) => { try { u(); } catch { /* ok */ } }); this._unsubs = []; this._fcFor = null; super.disconnectedCallback(); }

  // ── preferences (per HA user, this browser) ──────────────────────────────
  get _key() { return 'aureon.noir.v1.' + (this.hass?.user?.id || 'local'); }
  _loadPrefs() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem(this._key) || '{}') || {}; } catch { p = {}; }
    this._prefs = { theme: 'aureon', view: '3d', secOrder: SECTIONS.slice(), order: {}, aliases: {}, hidden: [], wasteAck: {}, ...p };
    const so = (this._prefs.secOrder || []).filter((k) => SECTIONS.includes(k));
    this._prefs.secOrder = so.concat(SECTIONS.filter((k) => !so.includes(k)));
  }
  _save(patch) {
    this._prefs = { ...this._prefs, ...patch };
    try { localStorage.setItem(this._key, JSON.stringify(this._prefs)); } catch { /* private mode */ }
    this._pushPrefs();
    this.requestUpdate();
  }
  // Owner 2026-11-18: the same settings on every phone/computer. Stored on the Home Assistant server per user
  // (frontend user data), kept in sync live; localStorage is only the fast first paint / offline copy.
  _syncPrefs() {
    if (this._syncing || !this.hass?.callWS) return;
    this._syncing = true;
    const KEY = 'aureon_noir';
    this.hass.callWS({ type: 'frontend/get_user_data', key: KEY }).then((r) => {
      const v = r?.value;
      if (v && typeof v === 'object') this._applyRemote(v);
      else this._pushPrefs(true);
      this._synced = true;
    }).catch(() => { this._synced = false; });
    try {
      this.hass.connection?.subscribeMessage?.((ev) => { const v = ev?.value; if (v && typeof v === 'object' && JSON.stringify(v) !== this._lastPushed) this._applyRemote(v); }, { type: 'frontend/subscribe_user_data', key: KEY })
        .then((u) => (this._unsubs ||= []).push(u)).catch(() => {});
    } catch { /* ok */ }
  }
  _applyRemote(v) {
    const so = (v.secOrder || []).filter((k) => SECTIONS.includes(k));
    this._prefs = { theme: 'aureon', view: '3d', order: {}, aliases: {}, hidden: [], wasteAck: {}, ...v, secOrder: so.concat(SECTIONS.filter((k) => !so.includes(k))) };
    try { localStorage.setItem(this._key, JSON.stringify(this._prefs)); } catch { /* ok */ }
    this.requestUpdate();
  }
  _pushPrefs(silent) {
    if (!this.hass?.callWS) return;
    clearTimeout(this._pushT);
    this._pushT = setTimeout(() => {
      const body = JSON.stringify(this._prefs); this._lastPushed = body;
      this.hass.callWS({ type: 'frontend/set_user_data', key: 'aureon_noir', value: JSON.parse(body) })
        .then(() => { if (!silent) { this._savedState = 'all'; this._savedAt = Date.now(); this.requestUpdate(); setTimeout(() => this.requestUpdate(), 2600); } })
        .catch(() => { if (!silent) { this._savedState = 'local'; this._savedAt = Date.now(); this.requestUpdate(); setTimeout(() => this.requestUpdate(), 2600); } });
    }, 350);
  }
  _set(patch) { this._ui = { ...this._ui, ...patch }; }

  willUpdate(changed) {
    if (changed.has('hass') && this.hass) {
      if (!this._prefs) this._loadPrefs();
      if (!this._syncing) this._syncPrefs();
      this._mc.setHass(this.hass);
      const wid = this._config.weather_entity || this._prefs?.weather || Object.keys(this.hass.states).find((e) => e.startsWith('weather.') && !this.hass.entities?.[e]?.hidden);
      if (wid) this._subForecast(wid);
      if (this._libAsked && this._libAsked !== this._mc.entityId) this._libAsked = null;
      if (!this._labelsLoaded && this.hass.callWS) {
        this._labelsLoaded = true;
        this._loadLabels();
        // Owner 2026-11-18: everything comes from HA and stays in sync — a new or edited label shows up by itself.
        try { this.hass.connection?.subscribeEvents?.(() => this._loadLabels(), 'label_registry_updated').then((u) => (this._unsubs ||= []).push(u)).catch(() => {}); } catch { /* ok */ }
      }
    }
  }
  updated() {
    this._declutter();
    const th = this._theme();
    if (th.ha) { const c = getComputedStyle(this).getPropertyValue('--primary-color'); const rgb = hexRgb(c); if (rgb !== this._accentRgb) { this._accentRgb = rgb; this.requestUpdate(); } }
  }

  // Keep the 3D room labels from sitting on top of each other (phones, many rooms).
  _declutter() {
    cancelAnimationFrame(this._lblRaf);
    this._lblRaf = requestAnimationFrame(() => this._declutterNow());
  }
  _declutterNow(force) {
    const stage = this.renderRoot?.querySelector('.stage');
    const iso = stage?.querySelector('.iso');
    if (!iso) { this._lblSig = null; return; }
    if (!this._lblRO && window.ResizeObserver) { this._lblRO = new ResizeObserver(() => this._declutterNow(true)); }
    if (this._lblRO && this._lblObs !== stage) { this._lblRO.disconnect(); this._lblRO.observe(stage); this._lblObs = stage; }
    if (!this._fontsHooked && document.fonts?.ready) { this._fontsHooked = true; document.fonts.ready.then(() => this._declutterNow(true)); }
    const lbls = [...stage.querySelectorAll('.lbls .lbl')];
    const S = stage.getBoundingClientRect();
    const sig = Math.round(S.width) + 'x' + Math.round(S.height) + '|' + lbls.map((l) => l.textContent.replace(/\s+/g, ' ')).join('|') + '|' + this._ui.room;
    if (!force && sig === this._lblSig) return;
    // 1) put each label over the centre of its room (projected, raised a little above the floor)
    const items = [];
    for (const l of lbls) {
      const halo = iso.querySelector(`.r3[data-room="${CSS.escape(l.dataset.room)}"] .halo`);
      const h = halo?.getBoundingClientRect();
      if (!h || !h.width) { this._lblSig = null; return; }
      l.style.left = (h.left + h.width / 2 - S.left).toFixed(1) + 'px';
      l.style.top = (h.top + h.height / 2 - S.top).toFixed(1) + 'px';
      l.style.setProperty('--dy', '0px');
      items.push(l);
    }
    this._lblSig = sig;
    // 2) nudge labels vertically (smallest move) until none touch each other
    const GAP = 6, placed = [];
    const rs = items.map((l) => {
      const r = l.getBoundingClientRect();
      const dx = Math.max(S.left + 2 - r.left, Math.min(0, S.right - 2 - r.right));
      if (dx) l.style.left = (parseFloat(l.style.left) + dx).toFixed(1) + 'px';
      return { l, r: { left: r.left + dx, right: r.right + dx, top: r.top, bottom: r.bottom } };
    }).sort((p, q) => (p.r.top + p.r.bottom) - (q.r.top + q.r.bottom));
    const hits = (r, dy) => placed.some((p) => r.left < p.right + GAP && p.left < r.right + GAP && r.top + dy < p.bottom + GAP && p.top < r.bottom + dy + GAP);
    for (const { l, r } of rs) {
      const cands = [0];
      for (const p of placed) cands.push(p.bottom + GAP - r.top, p.top - GAP - r.bottom);
      let dy = cands.filter((d) => !hits(r, d)).sort((x, y) => Math.abs(x) - Math.abs(y))[0];
      if (dy == null) dy = Math.max(...placed.map((p) => p.bottom)) + GAP - r.top;
      l.style.setProperty('--dy', dy.toFixed(1) + 'px');
      placed.push({ left: r.left, right: r.right, top: r.top + dy, bottom: r.bottom + dy });
    }
    stage.classList.add('ready');
  }
  _theme() { return THEMES.find((t) => t.id === this._prefs?.theme) || THEMES[0]; }
  _toast(title, body) { this._toasts = [...this._toasts, { id: Math.random().toString(36).slice(2), title, body, exp: Date.now() + 9000 }]; this.requestUpdate(); }
  _call(domain, service, data) { return this.hass.callService(domain, service, data).catch((e) => this._toast(domain + '.' + service, String(e?.message || e))); }

  // ── ordering / visibility ────────────────────────────────────────────────
  _sorted(dom, list) {
    const ord = this._prefs.order[dom] || [];
    const rank = (id) => { const i = ord.indexOf(id); return i < 0 ? 1e6 : i; };
    return list.slice().sort((a, b) => rank(a.id) - rank(b.id) || (a.areaName || '').localeCompare(b.areaName || '') || a.name.localeCompare(b.name));
  }
  _visible(dom, list) {
    const ui = this._ui, sec = { cams: 'security', locks: 'security', speakers: 'music' }[dom] || dom;
    return list.filter((d) => (ui.room === 'all' || d.area === ui.room) && (!d.hidden || (ui.edit && ui.showHidden)) && this._rulesOk(sec, d));
  }
  _move(dom, id, dir, ids) {
    const i = ids.indexOf(id), j = i + dir; if (i < 0 || j < 0 || j >= ids.length) return;
    const ord = (this._prefs.order[dom] || []).filter((x) => ids.includes(x) || true);
    const full = ids.slice(); [full[i], full[j]] = [full[j], full[i]];
    this._save({ order: { ...this._prefs.order, [dom]: full.concat(ord.filter((x) => !full.includes(x))) } });
  }
  _drop(dom, target, ids) {
    const d = this._ui.drag; this._set({ drag: null, over: null });
    if (!d || d.dom !== dom || d.id === target) return;
    const full = ids.filter((x) => x !== d.id); full.splice(full.indexOf(target), 0, d.id);
    const ord = this._prefs.order[dom] || [];
    this._save({ order: { ...this._prefs.order, [dom]: full.concat(ord.filter((x) => !full.includes(x))) } });
  }
  _toggleHidden(id) { const h = new Set(this._prefs.hidden); h.has(id) ? h.delete(id) : h.add(id); this._save({ hidden: [...h] }); }
  _moveSection(k, dir) { const so = this._prefs.secOrder.slice(), i = so.indexOf(k), j = i + dir; if (j < 0 || j >= so.length) return; [so[i], so[j]] = [so[j], so[i]]; this._save({ secOrder: so }); }

  // ── renaming ─────────────────────────────────────────────────────────────
  _saveName(item, t) {
    const name = (this._ui.draft || '').trim();
    if (!name || name === item.name) { this._set({ editing: null, confirm: null }); return; }
    if (this.hass?.user?.is_admin) this._set({ confirm: item.id });
    else { this._localName(item, name); this._toast(t('renamedLocal'), t('renamedLocalWhy')); }
  }
  _localName(item, name) { this._save({ aliases: { ...this._prefs.aliases, [item.id]: name } }); this._set({ editing: null, confirm: null }); }
  async _haName(item, name, t) {
    try {
      if (item.isDevice) await this.hass.callWS({ type: 'config/device_registry/update', device_id: item.id, name_by_user: name });
      else await this.hass.callWS({ type: 'config/entity_registry/update', entity_id: item.id, name });
      const al = { ...this._prefs.aliases }; delete al[item.id]; this._save({ aliases: al });
      this._toast(t('renamedHa'), (item.isDevice ? item.name : item.id) + ' → ' + name);
    } catch (e) { this._toast(t('renameFail'), String(e?.message || e)); }
    this._set({ editing: null, confirm: null });
  }

  editBar(dom, d, ids, t, abs = false) {
    const ui = this._ui;
    if (!ui.edit) return nothing;
    const editing = ui.editing === d.id;
    if (editing && ui.confirm === d.id) {
      const name = ui.draft.trim();
      return html`<div class="editbar ${abs ? 'abs' : ''}" role="group" aria-label=${t('rename')}>
        <span class="q">${t('confirmHa')} <b>“${name}”</b></span>
        <button class="btn sm" @click=${() => this._localName(d, name)}>${t('onlyHere')}</button>
        <button class="btn sm" @click=${() => this._set({ confirm: null })}>${t('cancel')}</button>
        <button class="btn sm pri" @click=${() => this._haName(d, name, t)}>${t('confirmBtn')}</button></div>`;
    }
    if (editing) {
      return html`<div class="editbar ${abs ? 'abs' : ''}">
        <span class="ent">${d.isDevice ? d.name : d.id}</span>
        <input .value=${ui.draft} aria-label=${t('newName') + ' · ' + d.name} @input=${(e) => this._set({ draft: e.target.value })}
          @keydown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); this._saveName(d, t); } else if (e.key === 'Escape') this._set({ editing: null }); }}>
        <button class="ib sm" style="background:var(--accent);color:var(--on-accent);border-color:var(--accent)" aria-label=${t('save')} @click=${() => this._saveName(d, t)}>${ic('check', 'i s')}</button>
        <button class="ib sm ghost" aria-label=${t('cancel')} @click=${() => this._set({ editing: null })}>${ic('x', 'i s')}</button></div>`;
    }
    return html`<div class="editbar ${abs ? 'abs' : ''}">
      <span class="ent">${d.isDevice ? d.name : d.id}</span>
      <span class="dim" title="↕" style="display:inline-flex;width:24px;justify-content:center;cursor:grab">${ic('grip', 'i s')}</span>
      <button class="ib sm" aria-label=${t('back') + ' · ' + d.name} @click=${() => this._move(dom, d.id, -1, ids)}>${ic('left', 'i s')}</button>
      <button class="ib sm" aria-label=${t('fwd') + ' · ' + d.name} @click=${() => this._move(dom, d.id, 1, ids)}>${ic('right', 'i s')}</button>
      <button class="ib sm" aria-label=${(d.hidden ? t('unhide') : t('hide')) + ' · ' + d.name} @click=${() => this._toggleHidden(d.id)}>${ic(d.hidden ? 'eye' : 'eyeOff', 'i s')}</button>
      <button class="ib sm" style="color:var(--accent)" aria-label=${t('rename') + ' · ' + d.name} @click=${() => this._set({ editing: d.id, draft: d.name, confirm: null })}>${ic('pencil', 'i s')}</button></div>`;
  }
  dnd(dom, d, ids) {
    const ui = this._ui;
    if (!ui.edit || ui.editing === d.id) return {};
    return {
      start: (e) => { try { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move'; } catch { /* ok */ } this._set({ drag: { dom, id: d.id } }); },
      over: (e) => { if (this._ui.drag?.dom !== dom) return; e.preventDefault(); if (this._ui.over !== d.id) this._set({ over: d.id }); },
      drop: (e) => { e.preventDefault(); this._drop(dom, d.id, ids); },
      end: () => this._set({ drag: null, over: null })
    };
  }
  tileAttrs(dom, d, ids) { const h = this.dnd(dom, d, ids); return { draggable: this._ui.edit && this._ui.editing !== d.id ? 'true' : 'false', h, cls: (d.hidden ? ' ghosted' : '') + (this._ui.over === d.id && this._ui.drag?.id !== d.id ? ' dragover' : '') }; }

  // ── sections header ──────────────────────────────────────────────────────
  secHead(key, title, sub, extra, t) {
    // Owner 2026-11-16: every section folds with a tap on its title; the choice is remembered.
    const closed = !this._ui.musicPage && !this._ui.edit && !!(this._prefs.secClosed || {})[key];
    return html`<div class=${'sech' + (closed ? ' closed' : '')}><h2 class="h2"><button class="sectog" aria-expanded=${closed ? 'false' : 'true'} @click=${() => this._save({ secClosed: { ...(this._prefs.secClosed || {}), [key]: !closed } })}><span class="txt">${title} ${sub ? html`<small>${sub}</small>` : nothing}</span><span class="secchev" aria-hidden="true">${ic('down', 'i s')}</span></button></h2>
      <div class="wrapRow" style=${closed ? 'display:none' : ''}>${this._ui.edit ? html`<button class="ib sm" aria-label=${t('sectionUp') + ' · ' + title} @click=${() => this._moveSection(key, -1)}>${ic('up', 'i s')}</button><button class="ib sm" aria-label=${t('sectionDown') + ' · ' + title} @click=${() => this._moveSection(key, 1)}>${ic('down', 'i s')}</button>` : nothing}${extra || nothing}</div></div>`;
  }

  render() {
    if (!this.hass) return html``;
    if (!this._prefs) this._loadPrefs();
    const lang = localeOf(this.hass), t = translator(lang);
    const now = new Date();
    const ui = this._ui, prefs = this._prefs;
    const m = buildModel(this.hass, { now, labels: this._labels, aliases: prefs.aliases, hidden: prefs.hidden, forceShow: prefs.forceShow, noAreaName: t('noArea') });
    if (this._topBtn) { this._topBtn.setAttribute('aria-label', t('toTop')); this._topBtn.title = t('toTop'); }
    this._peopleEta(m, now);
    this._applMap(m);
    this._plugCycles(m, now);
    this._detectFinished(m, t);
    const th = this._theme();
    const aRgb = th.ha ? this._accentRgb : hexRgb(th.accent);
    const vars = th.ha
      ? `--bg:var(--primary-background-color);--card:var(--card-background-color,var(--ha-card-background,#1c1c1c));--card2:var(--secondary-background-color,var(--card-background-color));--sunk:var(--primary-background-color);--raise:var(--secondary-background-color,var(--card-background-color));--line:var(--divider-color);--line2:var(--divider-color);--fg:var(--primary-text-color);--fg2:var(--primary-text-color);--mut:var(--secondary-text-color);--dim:var(--disabled-text-color,var(--secondary-text-color));--accent:var(--primary-color);--on-accent:var(--text-primary-color,#fff);`
      : `--bg:${th.bg};--card:${th.card};--card2:${th.card2};--sunk:${th.sunk};--raise:${th.raise};--line:${th.line};--line2:${th.line2};--fg:#F2F2F3;--fg2:#D4D4D8;--mut:#A1A1AA;--dim:#8A8A94;--accent:${th.accent};--on-accent:#1A1408;`;
    const L = m.lights.length ? m.lights.reduce((s, l) => s + (l.on ? l.b / 100 : 0), 0) / m.lights.length : 0;
    const pagebg = `--pagebg:radial-gradient(70% 40% at 20% 0%, ${rgba(aRgb, (0.02 + 0.12 * L).toFixed(3))} 0%, ${rgba(aRgb, 0)} 70%), var(--bg);`;
    const ctx = { m, t, lang, now, aRgb, L };
    const show = {
      lights: m.lights.length, climate: m.climate.length, plugs: m.plugs.length, energy: m.metered.length || m.solarW != null,
      covers: m.covers.length, openings: m.openings.length, security: m.cams.length + m.locks.length + m.alarms.length, tv: m.tvs.length, music: m.speakers.length || m.accounts.length
    };
    const secRender = { lights: () => this.sLights(ctx), climate: () => this.sClimate(ctx), plugs: () => this.sPlugs(ctx), energy: () => this.sEnergy(ctx), covers: () => this.sCovers(ctx), openings: () => this.sOpenings(ctx), security: () => this.sSecurity(ctx), tv: () => this.sTV(ctx), music: () => this.sMusic(ctx) };
    const secs = prefs.secOrder.filter((k) => show[k] && !(prefs.secHidden || []).includes(k) && (ui.domain === 'all' || ui.domain === k));
    return html`<div lang=${lang} class="page ${ui.edit ? 'editing' : ''}" style=${vars + pagebg} @click=${(e) => { if (ui.themeOpen && !e.composedPath().some((n) => n.classList?.contains('themeWrap'))) this._set({ themeOpen: false }); if (ui.alarmOpen && !e.composedPath().some((n) => n.classList?.contains('alw'))) this._set({ alarmOpen: false, alarmCode: '' }); }}>
      <div class="wrap">
        ${ui.musicPage ? html`<div class="mpage">
          <div class="mpbar"><button class="btn sm" @click=${() => this._musicPage(false)}>${ic('left', 'i s')}${t('backHome')}</button></div>
          ${this.sMusic(ctx, true)}</div>` : html`
        ${this.header(ctx)}
        ${ui.edit ? this.banner(t) : nothing}
        ${this.pushes(ctx)}
        ${this.hero(ctx)}
        ${this.modes(ctx)}
        ${m.scenes.length ? this.scenes(ctx) : nothing}
        ${this.live(ctx)}
        ${this.filters(ctx, show)}
        ${ui.room !== 'all' ? this.roomHead(ctx) : nothing}
        ${secs.map((k) => secRender[k]())}
        ${secs.every((k) => !secRender[k]) || !secs.length ? html`<div class="empty">${t('nothingHere')}</div>` : nothing}`}
      </div>
      ${ui.settings ? this.settings(ctx) : nothing}
      <div class="toasts" aria-live="polite">${repeat(this._toasts, (x) => x.id, (x) => html`<div class="toast rise" role="status">
        <span class="ic" style="background:var(--accent);color:var(--on-accent)">${ic('check')}</span>
        <span class="grow"><b class="txt" style="display:block;font-size:14px;font-weight:500">${x.title}</b><span class="txt muted" style="display:block;font-size:13px;line-height:1.45">${x.body}</span></span>
        <button class="ib sm ghost" aria-label=${t('closeToast')} @click=${() => { this._toasts = this._toasts.filter((y) => y.id !== x.id); this.requestUpdate(); }}>${ic('x', 'i s')}</button></div>`)}</div>
    </div>`;
  }

  _detectFinished(m, t) {
    const cur = {}; for (const a of m.appliances) cur[a.id] = a.done ? 'done' : a.running ? 'run' : 'idle';
    if (this._prevAppl) for (const a of m.appliances) if (this._prevAppl[a.id] === 'run' && cur[a.id] === 'done') this._toasts = [...this._toasts, { id: a.id + Date.now(), title: t('finished', { n: a.name }), body: t('finishedBody', { a: a.areaName || '' }), exp: Date.now() + 15000 }];
    this._prevAppl = cur;
  }

  // ── header ───────────────────────────────────────────────────────────────
  header({ m, t, lang, now }) {
    const ui = this._ui, th = this._theme();
    const w = m.weather, sun = m.sun;
    let sunTxt = '';
    if (sun) {
      const fmt = (d) => d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
      const rise = Date.parse(sun.attributes?.next_rising), set = Date.parse(sun.attributes?.next_setting);
      if (sun.state === 'above_horizon' && set) { const left = Math.max(0, Math.round((set - now) / 60000)); sunTxt = t('sunLeft', { t: Math.floor(left / 60) + 'h' + p2(left % 60) }); }
      else if (rise) sunTxt = t('sunUp', { t: fmt(new Date(rise)) });
    }
    const people = m.people.slice(0, 5);
    return html`<header class="top">
      <span class="wordmark">AUREON</span>
      <div class="wrapRow" style="justify-content:flex-end">
        <button class="btn" aria-label=${t('settings')} @click=${() => this._set({ settings: 'home', themeOpen: false })}>${ic('gear', 'i s')}<span class="hideNarrow">${t('settings')}</span></button>
        <button class=${'btn' + (ui.edit ? ' pri' : '')} aria-pressed=${ui.edit ? 'true' : 'false'} @click=${() => this._set({ edit: !ui.edit, editing: null, confirm: null })}>${ic('pencil', 'i s')}${ui.edit ? t('doneEdit') : t('edit')}</button>
        ${m.metered.length ? html`<span class="chip">${svg`<svg class="i s" viewBox="0 0 24 24" aria-hidden="true" style="color:var(--accent)"><path d=${P.bolt}></path></svg>`}${m.plugW} W</span>` : nothing}
        ${people.length ? html`<span class="avatars" role="img" aria-label=${t('homePeople') + ': ' + people.filter((p) => p.state === 'home').map((p) => p.name).join(', ')}>
          ${people.map((p) => { const pic = p.attrs.entity_picture; return html`<span class="av" title=${p.name + ' · ' + (p.state === 'home' ? t('homePeople') : p.state === 'not_home' ? t('away') : p.state)} style=${pic ? `background-image:url("${this._url(pic)}");color:transparent` : ''}>${(p.name || '?').charAt(0)}<b class=${p.state === 'home' ? 'home' : ''}></b></span>`; })}
        </span>` : nothing}
      </div>
    </header>`;
  }
  // Arrival estimate from the proximity distance: speed over the last ~15 minutes (history + live samples).
  _peopleEta(m, now) {
    this._prox ||= {};
    for (const p of m.people) {
      if (!p.distId || p.distM == null) continue;
      const rec = (this._prox[p.id] ||= { samples: [], asked: 0 });
      const last = rec.samples[rec.samples.length - 1];
      if (!last || last.d !== p.distM) rec.samples.push({ t: now.getTime(), d: p.distM });
      rec.samples = rec.samples.filter((x) => now - x.t < 20 * 60000).slice(-60);
      if (this.hass.callWS && Date.now() - rec.asked > 5 * 60000 && p.dir === 'towards') {
        rec.asked = Date.now();
        this.hass.callWS({ type: 'history/history_during_period', start_time: new Date(now - 15 * 60000).toISOString(), entity_ids: [p.distId], minimal_response: true, no_attributes: true }).then((res) => {
          const u = String(this.hass.states[p.distId]?.attributes?.unit_of_measurement || 'm').toLowerCase(), k = u === 'km' ? 1000 : u === 'mi' ? 1609.34 : 1;
          const pts = (res?.[p.distId] || []).map((x) => ({ t: 1000 * Number(x.lu ?? x.lc), d: Number(x.s) * k })).filter((x) => Number.isFinite(x.t) && Number.isFinite(x.d));
          rec.samples = [...pts, ...rec.samples].sort((a, b) => a.t - b.t); this.requestUpdate();
        }).catch(() => {});
      }
      const s0 = rec.samples.find((x) => now - x.t < 15 * 60000), s1 = rec.samples[rec.samples.length - 1];
      if (p.dir === 'towards' && s0 && s1 && s1.t - s0.t > 60000 && s0.d > s1.d) {
        const v = (s0.d - s1.d) / ((s1.t - s0.t) / 1000);
        if (v > 1.2 && p.distM < 80000) p.etaMin = Math.max(1, Math.round(p.distM / v / 60));
      }
    }
  }
  // Machines (owner 2026-11-18): washer and dishwasher always have a card; Settings → Aparelhos can point a kind to
  // a plug (older machine) or hide it.
  _applMap(m) {
    const map = this._prefs.applMap || {};
    for (const [kind, id] of Object.entries(map)) {
      if (!id) continue;
      const dev = m.appliances.find((a) => a.id === id);
      if (dev) { m.appliances = m.appliances.filter((a) => a === dev || a.kind !== kind); dev.kind = kind; continue; }
      const p = m.plugs.find((x) => x.id === id);
      if (!p) continue;
      const pw = m.power.filter((x) => x.device && x.device === p.device);
      const w = p.w ?? Math.round(pw.reduce((s2, x) => s2 + (x.w || 0), 0));
      m.appliances = m.appliances.filter((a) => a.kind !== kind && a.id !== p.device);
      m.appliances.push({ plug: true, powerIds: pw.map((x) => x.id), entities: [p.id, ...pw.map((x) => x.id)], w, id: p.device || p.id, kind, name: p.name, area: p.area, areaName: p.areaName, pct: null, mins: null, endAt: null, status: '', program: '', done: false, running: pw.length ? w >= PLUG_RUN_W : p.on && false, idle: true });
    }
  }
  _meId() { const uid = this.hass.user?.id; return Object.values(this.hass.states).find((s2) => s2.entity_id.startsWith('person.') && s2.attributes?.user_id === uid)?.entity_id || null; }
  _url(path) { return path && this.hass.hassUrl ? this.hass.hassUrl(path) : path; }

  banner(t) {
    const ui = this._ui;
    return html`<div class="banner rise" role="status">
      <span class="row grow"><span class="ic" style="background:var(--accent);color:var(--on-accent)">${ic('pencil', 'i s')}</span>
        <span class="grow"><b style="display:block;font-size:14px;font-weight:500">${t('editTitle')}</b><span class="muted txt" style="font-size:12px;line-height:1.45">${t('editHint')}</span></span></span>
      <span class="wrapRow">
        <button class="btn sm" @click=${() => this._set({ showHidden: !ui.showHidden })}>${ic(ui.showHidden ? 'eyeOff' : 'eye', 'i s')}${ui.showHidden ? t('hideHidden') : t('showHidden')}</button>
        <button class="btn sm" @click=${() => this._save({ order: {}, secOrder: SECTIONS.slice(), hidden: [] })}>${t('reset')}</button>
        <button class="btn sm pri" @click=${() => this._set({ edit: false, editing: null, confirm: null })}>${t('done')}</button></span></div>`;
  }

  // ── hero: clock + 3D house / plan ────────────────────────────────────────
  hero(ctx) {
    const { m, t, lang, now, aRgb, L } = ctx, ui = this._ui, prefs = this._prefs;
    const zone = this.hass.locale?.time_zone === 'server' ? this.hass.config?.time_zone : undefined;
    let time = '', date = '';
    try { time = now.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: zone }); date = now.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: zone }); } catch { time = p2(now.getHours()) + ':' + p2(now.getMinutes()); }
    const hr = now.getHours();
    const user = (this.hass.user?.name || '').split(' ')[0];
    const greet = (hr < 5 ? t('evening') : hr < 12 ? t('morning') : hr < 18 ? t('afternoon') : t('evening')) + (user ? ', ' + user : '') + '.';
    const on = m.lights.filter((l) => l.on);
    const roomsLit = new Set(on.map((l) => l.area)).size;
    const playing = m.speakers.filter((s) => s.playing);
    const run = m.appliances.find((a) => a.running && a.endAt);
    const parts = [on.length ? t('lightsOn', { n: on.length, r: roomsLit }) : t('allLightsOff')];
    if (playing.length) parts.push(playing.length >= m.speakers.filter((s) => !s.tv).length && playing.length > 1 ? t('musicAll') : t('musicIn', { n: playing.length }));
    if (run) parts.push(t('washerEnds', { n: run.name, t: run.endAt.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) }));
    if (m.vacuums.some((v) => v.state === 'cleaning')) parts.push(t('robotIn'));
    const maxN = Math.max(1, ...m.areas.map((a) => (m.byArea[a.id] || []).length));
    const layout = roomLayout(m.areas, (a) => Math.max(maxN * 0.45, (m.byArea[a.id] || []).length));
    const is3d = prefs.view !== '2d';
    return html`<section class="hero" aria-label=${t('house3d')}>
      <div class="glow" style=${`background:radial-gradient(circle, ${rgba(aRgb, (0.05 + 0.25 * L).toFixed(3))} 0%, ${rgba(aRgb, 0)} 65%)`}></div>
      <div class="heroL">
        <div style="display:flex;flex-direction:column;gap:12px">
          <span class="eyebrow">${date}</span><span class="clock">${time}</span>
          <h1 class="greet txt">${greet}</h1>
          ${m.people.length ? html`<div class="ppl" role="list" aria-label=${t('homePeople')}>${m.people.slice(0, 6).map((p) => { const pic = p.attrs.entity_picture, home = p.state === 'home';
            const where = home ? t('homeS') : p.etaMin != null && p.etaMin <= 60 ? t('onTheWay', { m: p.etaMin }) : p.state === 'not_home' ? t('awayS') : p.state === 'unknown' || p.state === 'unavailable' ? '—' : p.state;
            return html`<button class=${'pp' + (home ? ' home' : p.etaMin != null ? ' coming' : '')} role="listitem" aria-label=${p.name + ' · ' + where + ' · ' + t('showMap')} @click=${() => this._moreInfo(p.id)}><span class="ppav" style=${pic ? `background-image:url("${this._url(pic)}");color:transparent` : ''}>${(p.name || '?').charAt(0)}</span><span class="txt"><b>${p.name}</b><small>${where}</small></span>${!home && p.attrs.latitude != null ? html`<span class="ppmap" aria-hidden="true">${ic('mapI', 'i s')}</span>` : nothing}</button>`; })}</div>` : nothing}
          ${m.weather ? this.weatherBlock(ctx) : html`<p class="story txt">${parts.join(', ')}.</p>`}
        </div>
      </div>
      <div class="heroR">
        <div class="row sp" style="flex-wrap:wrap;gap:8px"><span class="eyebrow txt">${t('tapRoom')}</span>
          <span class="row" style="gap:8px;flex-wrap:wrap">${m.alarms[0] ? this.alarmMenu(ctx) : nothing}
          <span class="seg" role="group" aria-label=${t('house3d') + ' / ' + t('plan')}>
            <button aria-pressed=${is3d ? 'true' : 'false'} @click=${() => this._save({ view: '3d' })}>3D</button>
            <button aria-pressed=${!is3d ? 'true' : 'false'} @click=${() => this._save({ view: '2d' })}>${t('plan').toUpperCase()}</button></span></span></div>
        ${is3d ? html`<div class="stage" role="group" aria-label=${t('house3d')}><div class="iso"><div class="ground" aria-hidden="true"></div>
          ${layout.map((r) => this.room3d(r, ctx))}</div>
          <div class="lbls" aria-hidden="true">${layout.map((r) => this.label3d(r, ctx))}</div></div>`
          : html`<div class="plan2d" role="group" aria-label=${t('plan')}>${layout.map((r) => this.room2d(r, ctx))}</div>`}
      </div>
    </section>`;
  }
  _roomLook(area, m) {
    const ls = m.lights.filter((l) => l.area === area.id), on = ls.filter((l) => l.on);
    const k = on.length ? on.reduce((s, l) => s + l.b, 0) / on.length / 100 : 0;
    const rgb = on.length ? on.slice().sort((a, b) => b.b - a.b)[0].rgb.join(',') : '245,190,110';
    const th = m.climate.find((c) => c.area === area.id);
    const dots = [];
    if (m.openings.some((o) => o.area === area.id && o.open)) dots.push('var(--accent)');
    if (m.speakers.some((s) => s.area === area.id && s.playing)) dots.push('#A99BFF');
    if (m.climate.some((c) => c.area === area.id && c.action === 'heating')) dots.push('#FF9A5A');
    return { ls, on, k, rgb, lit: on.length > 0, temp: th?.cur, dots };
  }
  room3d(r, { m, t }) {
    const a = r.area, L = this._roomLook(a, m), sel = this._ui.room === a.id, H = a.outdoor ? 6 : 22;
    const cA = L.lit ? `background:${rgba(L.rgb, 0.1 + 0.22 * L.k)};border:1px solid ${rgba(L.rgb, 0.25 + 0.3 * L.k)}` : 'background:rgba(242,242,243,.035);border:1px solid var(--line2)';
    const cB = L.lit ? `background:${rgba(L.rgb, 0.16 + 0.28 * L.k)};border:1px solid ${rgba(L.rgb, 0.3 + 0.35 * L.k)}` : 'background:rgba(242,242,243,.06);border:1px solid var(--line2)';
    const floor = (L.lit ? `border:1px ${a.outdoor ? 'dashed' : 'solid'} ${rgba(L.rgb, 0.35 + 0.4 * L.k)};background:radial-gradient(90% 90% at 50% 50%, ${rgba(L.rgb, 0.25 + 0.5 * L.k)} 0%, ${rgba(L.rgb, 0.04)} 75%), var(--raise);box-shadow:0 0 ${Math.round(30 + 60 * L.k)}px ${rgba(L.rgb, 0.15 + 0.35 * L.k)}` : `border:1px ${a.outdoor ? 'dashed' : 'solid'} var(--line2);background:var(--card);box-shadow:none`) + (sel ? ';outline:2px solid var(--fg);outline-offset:3px;transform:translateZ(10px)' : '');
    return html`<button class="r3" data-room=${a.id} aria-pressed=${sel ? 'true' : 'false'} aria-label=${`${a.name}: ${t('ofOn', { a: L.on.length, b: L.ls.length })}`} @click=${() => this._pickRoom(sel ? 'all' : a.id)}
      style=${`left:calc(${r.x}% + 4px);top:calc(${r.y}% + 4px);width:calc(${r.w}% - 8px);height:calc(${r.h}% - 8px);${floor}`}>
      <span class="w wt" style=${`height:${H}px;${cA}`}></span><span class="w wb" style=${`height:${H}px;${cB}`}></span>
      <span class="w wl" style=${`width:${H}px;${cA}`}></span><span class="w wr" style=${`width:${H}px;${cB}`}></span>
      <span class="halo" style=${`background:${rgba(L.rgb, 0.9)};opacity:${L.lit ? (0.15 + 0.55 * L.k).toFixed(2) : 0}`}></span>
</button>`;
  }
  label3d(r, { m }) {
    const a = r.area, L = this._roomLook(a, m), sel = this._ui.room === a.id;
    return html`<span class="lbl" data-room=${a.id}><span class="n" style=${L.lit || sel ? 'color:var(--fg)' : 'color:var(--mut)'}>${a.name}</span>
      <span style=${`font-size:13px;color:${L.lit ? 'var(--fg)' : 'var(--mut)'}`}>${L.temp != null ? L.temp.toFixed(1).replace('.', ',') + '° · ' : ''}${L.on.length}/${L.ls.length}</span>
      <span class="dots">${L.dots.map((c) => html`<i style=${'background:' + c}></i>`)}</span></span>`;
  }
  room2d(r, { m, t }) {
    const a = r.area, L = this._roomLook(a, m), sel = this._ui.room === a.id;
    const look = (L.lit ? `border:1px ${a.outdoor ? 'dashed' : 'solid'} ${rgba(L.rgb, 0.28 + 0.4 * L.k)};background:radial-gradient(120% 100% at 50% 45%, ${rgba(L.rgb, 0.1 + 0.34 * L.k)} 0%, ${rgba(L.rgb, 0)} 72%), var(--card);box-shadow:0 0 ${Math.round(20 + 40 * L.k)}px -10px ${rgba(L.rgb, 0.25 + 0.5 * L.k)}` : `border:1px ${a.outdoor ? 'dashed' : 'solid'} var(--line2);background:var(--sunk)`) + (sel ? ';outline:2px solid var(--fg);outline-offset:2px' : '');
    return html`<button class="r2" aria-pressed=${sel ? 'true' : 'false'} aria-label=${`${a.name}: ${t('ofOn', { a: L.on.length, b: L.ls.length })}`} @click=${() => this._pickRoom(sel ? 'all' : a.id)}
      style=${`left:calc(${r.x}% + 5px);top:calc(${r.y}% + 5px);width:calc(${r.w}% - 10px);height:calc(${r.h}% - 10px);${look}`}>
      <span class="n"><i style=${L.lit ? `background:rgb(${L.rgb});box-shadow:0 0 12px 2px ${rgba(L.rgb, 0.7)}` : 'background:var(--line2)'}></i>${a.name}</span>
      <span class="row" style=${`gap:6px;font-size:13px;color:${L.lit ? 'var(--fg)' : 'var(--dim)'}`}>${L.temp != null ? L.temp.toFixed(1).replace('.', ',') + '° · ' : ''}${L.on.length}/${L.ls.length}<span class="dots">${L.dots.map((c) => html`<i style=${'background:' + c}></i>`)}</span></span></button>`;
  }

  // ── weather forecast (weather/subscribe_forecast, native HA) ─────────────
  _subForecast(entityId) {
    if (!entityId || this._fcFor === entityId) return;
    (this._unsubs || []).forEach((u) => { try { u(); } catch { /* ok */ } });
    this._unsubs = []; this._fcFor = entityId; this._fc = {};
    const conn = this.hass?.connection;
    if (!conn?.subscribeMessage) return;
    for (const type of ['hourly', 'daily']) {
      conn.subscribeMessage((ev) => { this._fc = { ...this._fc, [type]: ev?.forecast || [] }; this.requestUpdate(); }, { type: 'weather/subscribe_forecast', forecast_type: type, entity_id: entityId })
        .then((u) => { if (this._fcFor === entityId) this._unsubs.push(u); else u(); }).catch(() => {});
    }
  }
  weatherBlock({ m, t, lang, now }) {
    const w = m.weather;
    if (!w) return nothing;
    const fc = this._fc || {};
    const deg = (v) => (v == null || !Number.isFinite(Number(v)) ? '—' : Math.round(Number(v)) + '°');
    const hourly = (fc.hourly || w.attrs.forecast || []).filter((f) => Date.parse(f.datetime) >= now.getTime() - 45 * 60000).slice(0, 7);
    const today = (fc.daily || [])[0];
    const hi = today?.temperature, lo = today?.templow;
    const city = this._config.city || w.name;
    return html`<div class="wx">
      <div class="row" style="gap:12px;align-items:center">
        ${wxIcon(w.state, now)}
        <span style="font-size:30px;font-weight:200;letter-spacing:-.05em;line-height:1">${deg(w.attrs.temperature)}</span>
        <span class="txt" style="font-size:13px;line-height:1.35;min-width:0"><b style="font-weight:500">${t('wx_' + w.state)}</b><span class="muted"> · ${city}${hi != null ? ' · ' + t('maxmin', { h: Math.round(hi), l: lo != null ? Math.round(lo) : '—' }) : ''}</span></span>
      </div>
      ${hourly.length > 1 ? html`<div class="hours" role="list" aria-label=${t('forecastT')}>${hourly.slice(1, 7).map((f) => { const d = new Date(f.datetime); const p = Number(f.precipitation_probability);
        return html`<span class="hr" role="listitem"><span class="mono muted" style="font-size:10px">${d.toLocaleTimeString(lang, { hour: '2-digit' })}</span>${wxIcon(f.condition, d)}<b style="font-size:13px;font-weight:400">${deg(f.temperature)}</b><span class="mono" style=${'font-size:9px;color:#8FB8FF;' + (p >= 20 ? '' : 'visibility:hidden')}>${Math.round(p || 0)}%</span></span>`; })}</div>` : nothing}
    </div>`;
  }

  // ── reminders ("push") ───────────────────────────────────────────────────
  reminders({ m, t, lang, now }) {
    const list = [], ack = this._prefs.wasteAck || {};
    const byRoom = {};
    const kinds = this._prefs.reminderKinds || {};
    if (kinds.lights !== false) for (const l of m.lights) if (l.on && !l.hidden && this._rulesOk('lights', l)) (byRoom[l.area] ||= []).push(l);
    const heatingRooms = new Set(m.climate.filter((c) => c.action === 'heating').map((c) => c.area));
    for (const [area, ls] of Object.entries(byRoom).sort((a, b) => b[1].length - a[1].length)) {
      const room = ls[0].areaName || t('noArea');
      list.push({ key: 'L:' + area + ':' + ls.map((l) => l.id).join(','), icon: 'bulb', tone: 'var(--accent)', title: ls.length === 1 ? t('lightRoom', { r: room }) : t('lightsRoom', { n: ls.length, r: room }), body: ls.map((l) => l.name).join(' · '), action: t('turnOff'), act: () => this._call('light', 'turn_off', { entity_id: ls.map((l) => l.id) }) });
    }
    for (const o of m.openings.filter((x) => kinds.openings !== false && x.open && !x.hidden && this._rulesOk('openings', x))) {
      const mins = Math.max(0, Math.round((now - Date.parse(o.st.last_changed)) / 60000));
      const heat = heatingRooms.has(o.area);
      list.push({ key: 'O:' + o.id + ':' + o.st.last_changed, icon: o.door ? 'door' : 'win', tone: heat ? '#FF9A5A' : 'var(--accent)', title: t('openedIn', { n: o.name, r: o.areaName }), body: t('since', { t: mins < 60 ? mins + ' ' + t('min') : Math.round(mins / 60) + ' h' }) + (heat ? ' · ' + t('heatingWaste') : ''), action: t('okS'), act: null });
    }
    for (const l of m.locks.filter((x) => kinds.locks !== false && !x.locked && !x.unavailable)) list.push({ key: 'K:' + l.id + ':' + l.st.last_changed, icon: 'unlock', tone: '#FF8A80', title: t('unlockedN', { n: l.name }), body: l.areaName, action: t('lockS'), act: () => this._call('lock', 'lock', { entity_id: l.id }) });
    for (const a of m.appliances.filter((x) => kinds.appliances !== false && x.done)) list.push({ key: 'A:' + a.id + ':' + a.status, icon: a.kind === 'dish' ? 'dish' : 'washer', tone: 'var(--accent)', title: t('finished', { n: a.name }), body: t('cycleDone') + (a.areaName ? ' · ' + a.areaName : ''), action: t('okS'), act: null });
    for (const p of m.people.filter((x) => kinds.arrivals !== false && x.etaMin != null && x.etaMin <= 30 && x.state !== 'home' && x.id !== this._meId())) list.unshift({ key: 'P:' + p.id + ':' + Math.round(p.etaMin / 5), icon: 'home', tone: '#7EE0A8', title: t('arriving', { n: p.name, m: p.etaMin }), body: t('arrivingBody', { d: p.distM >= 1000 ? (p.distM / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(p.distM) + ' m' }), action: t('okS'), act: null });
    const nb = m.waste[0];
    if (kinds.waste !== false && nb && nb.days <= 1 && !ack[nb.date + nb.type]) list.push({ key: 'W:' + nb.date + nb.type, icon: 'trash', tone: binColor(nb.type), title: shortBin(nb.type), body: nb.days === 0 ? t('wasteToday') : t('wasteTomorrow'), action: t('doneS'), act: () => this._save({ wasteAck: { ...ack, [nb.date + nb.type]: true } }) });
    return list.filter((r) => !this._dismissed?.has(r.key));
  }
  pushes(ctx) {
    const { t } = ctx, items = this.reminders(ctx);
    if (!items.length) return nothing;
    const open = this._ui.pushOpen, shown = open ? items : items.slice(0, 3);
    if (this._prefs.pushMin) {
      const icons = [...new Set(items.map((r) => r.icon + '|' + r.tone))].slice(0, 6);
      return html`<button class="pushbar" aria-expanded="false" @click=${() => this._save({ pushMin: false })}>
        <span class="pi" style="width:30px;height:30px;color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,transparent)">${ic('bell', 'i s')}</span>
        <b style="font-size:13px;font-weight:500">${t('reminders')} · ${items.length}</b>
        <span class="row" style="gap:4px">${icons.map((x) => { const [i, c] = x.split('|'); return html`<span style=${'color:' + c}>${ic(i, 'i s')}</span>`; })}</span>
        <span class="muted" style="font-size:12px;margin-left:auto">${t('expand')}</span></button>`;
    }
    const dismiss = (k) => { (this._dismissed ||= new Set()).add(k); this.requestUpdate(); };
    return html`<section class="sec" aria-label=${t('reminders')}>
      <div class="row sp" style="padding:0 4px;gap:8px;flex-wrap:wrap"><span class="eyebrow">${t('reminders')} · ${items.length}</span>
        <span class="row" style="gap:6px">${items.length > 3 ? html`<button class="btn sm" @click=${() => this._set({ pushOpen: !open })}>${open ? t('fewer') : t('more', { n: items.length - 3 })}</button>` : nothing}
        <button class="btn sm" aria-expanded="true" @click=${() => this._save({ pushMin: true })}>${ic('down', 'i s')}${t('minimize')}</button></span></div>
      <div class="pushes">${repeat(shown, (r) => r.key, (r) => html`<div class="push rise" role="status">
        <span class="pi" style=${`color:${r.tone};background:color-mix(in srgb, ${r.tone} 16%, transparent)`}>${ic(r.icon, 'i s')}</span>
        <span class="grow"><b class="txt" style="display:block;font-size:14px;font-weight:500">${r.title}</b><span class="txt muted" style="display:block;font-size:12px;line-height:1.4;margin-top:2px">${r.body}</span></span>
        <span class="row" style="gap:4px;flex:none"><button class="btn sm pri" @click=${() => { if (r.act) r.act(); dismiss(r.key); }}>${r.action}</button>
          <button class="ib sm ghost" aria-label=${t('closeToast')} @click=${() => dismiss(r.key)}>${ic('x', 'i s')}</button></span>
      </div>`)}</div>
    </section>`;
  }

  // ── house modes ──────────────────────────────────────────────────────────
  _modeDefs(t) {
    return [
      { id: 'home', name: t('modeHome'), icon: 'home', alarm: 'alarm_disarm', alarmState: 'disarmed', def: { lightsOff: false, plugs: [], restore: true } },
      { id: 'away', name: t('modeAway'), icon: 'out', alarm: 'alarm_arm_away', alarmState: 'armed_away', def: { lightsOff: true, plugs: [] } },
      { id: 'vacation', name: t('modeVacation'), icon: 'suitcase', alarm: 'alarm_arm_vacation', alarmState: 'armed_vacation', def: { lightsOff: true, plugs: [] } },
      { id: 'night', name: t('modeNight'), icon: 'moon', alarm: 'alarm_arm_night', alarmState: 'armed_night', def: { lightsOff: false, plugs: [] } }
    ];
  }
  _modeCfg(def) { return { ...def.def, ...(this._prefs.modes?.[def.id] || {}) }; }
  _activeMode(m) {
    const a = m.alarms[0], last = this._prefs.mode;
    if (!a) return last || 'home';
    return { disarmed: 'home', armed_away: last === 'vacation' ? 'vacation' : 'away', armed_vacation: 'vacation', armed_night: 'night', armed_home: last === 'night' ? 'night' : 'home' }[a.state] || last || 'home';
  }
  modes(ctx) {
    const { m, t } = ctx, defs = this._modeDefs(t), active = this._activeMode(m), alarm = m.alarms[0];
    const effect = (d) => {
      const c = this._modeCfg(d), e = [];
      if (alarm) e.push(d.id === 'home' ? t('effAlarmOff') : d.id === 'night' ? t('effAlarmNight') : t('effAlarmOn'));
      if (c.lightsOff) e.push(t('effLights'));
      const n = (c.plugs || []).filter((id) => m.plugs.some((p) => p.id === id && !p.locked)).length;
      if (n) e.push(n === 1 ? t('effPlug') : t('effPlugs', { n }));
      if (d.id === 'home' && c.restore && (this._prefs.modeOff || []).length) e.push(t('effRestore'));
      return e.join(' · ') || '—';
    };
    return html`<section class="sec" aria-label=${t('modeTitle')}><h2 class="eyebrow" style="margin:0;padding:0 4px;font-weight:400">${t('modeTitle')}</h2>
      <div class="modes">${defs.map((d) => { const on = d.id === active; return html`<button class="mode" aria-pressed=${on ? 'true' : 'false'} @click=${() => this._set({ modeSheet: d.id, modeCode: '' })}>
        <span class="row sp" style="width:100%"><span class="ic" style=${on ? 'background:var(--accent);color:var(--on-accent)' : ''}>${ic(d.icon)}</span>${on ? html`<span class="tag" style="color:var(--accent)">● ${t('active')}</span>` : nothing}</span>
        <b style="font-size:17px;font-weight:500;letter-spacing:-.02em">${d.name}</b><span class="muted txt" style="font-size:12px;line-height:1.4;text-align:left">${effect(d)}</span></button>`; })}</div>
      ${this._ui.modeSheet ? this.modeSheet(ctx, defs.find((d) => d.id === this._ui.modeSheet)) : nothing}
    </section>`;
  }
  modeConfig({ m, t }, d) {
    const c = this._modeCfg(d), alarm = m.alarms[0];
    const free = m.plugs.filter((p) => !p.locked && !p.hidden);
    const setCfg = (patch) => this._save({ modes: { ...(this._prefs.modes || {}), [d.id]: { ...c, ...patch } } });
    const sel = new Set(c.plugs || []);
    const supportsVac = alarm && ((alarm.attrs.supported_features || 0) & 32);
    const alarmTarget = d.id === 'home' ? t('disarmed') : d.id === 'night' ? t('armNight') : d.id === 'vacation' ? (supportsVac ? t('modeVacation') : t('armAway')) : t('armAway');
    const restoreList = (this._prefs.modeOff || []).filter((id) => m.plugs.some((p) => p.id === id));
    const sw = (on, fn, label) => html`<button class="switch" role="switch" aria-checked=${on ? 'true' : 'false'} aria-label=${label} @click=${fn}><span><i></i></span></button>`;
    const byRoom = {}; for (const p of free) (byRoom[p.areaName || t('noArea')] ||= []).push(p);
    return html`
        ${alarm ? html`<div class="chk"><span class="ic" style="width:36px;height:36px">${ic('shield', 'i s')}</span><span class="grow txt"><b>${alarm.name}</b><span class="muted" style="display:block;font-size:12px">${t('alarmTo', { s: alarmTarget })}</span></span></div>
          ${alarm.needsCode ? html`<input type="password" inputmode="numeric" autocomplete="off" .value=${this._ui.modeCode || ''} placeholder=${t('code')} aria-label=${t('code')} @input=${(e) => this._set({ modeCode: e.target.value })} style="min-height:44px;padding:0 14px;border-radius:12px;border:1px solid var(--line2);background:var(--sunk);color:var(--fg);font:inherit">` : nothing}` : html`<span class="muted" style="font-size:13px">${t('noAlarm')}</span>`}
        <div class="chk"><span class="ic" style="width:36px;height:36px">${ic('bulb', 'i s')}</span><span class="grow txt"><b>${t('lightsOffAll')}</b></span>${sw(c.lightsOff, () => setCfg({ lightsOff: !c.lightsOff }), t('lightsOffAll'))}</div>
        ${d.id === 'home' && restoreList.length ? html`<div class="chk"><span class="ic" style="width:36px;height:36px">${ic('plug', 'i s')}</span><span class="grow txt"><b>${t('restorePlugs')}</b><span class="muted" style="display:block;font-size:12px">${restoreList.map((id) => m.plugs.find((p) => p.id === id)?.name).join(' · ')}</span></span>${sw(c.restore, () => setCfg({ restore: !c.restore }), t('restorePlugs'))}</div>` : nothing}
        ${d.id !== 'home' && free.length ? html`<span class="eyebrow" style="font-size:10px;padding-top:6px">${t('plugsOffSel')}</span>
          ${Object.entries(byRoom).map(([room, ps]) => html`<span class="dim" style="font-size:11px;padding:4px 2px 0">${room}</span>${ps.map((p) => html`<div class="chk"><span class="ic" style=${'width:36px;height:36px;' + (sel.has(p.id) ? 'color:var(--accent)' : '')}>${ic('plug', 'i s')}</span><span class="grow txt"><b>${p.name}</b><span class="muted" style="display:block;font-size:12px">${p.on ? (p.w != null ? p.w + ' W' : t('plugOn')) : t('plugOff')}</span></span>
            <button class=${'offchk' + (sel.has(p.id) ? ' on' : '')} role="checkbox" aria-checked=${sel.has(p.id) ? 'true' : 'false'} aria-label=${t('plugsOffSel') + ' · ' + p.name} @click=${() => { sel.has(p.id) ? sel.delete(p.id) : sel.add(p.id); setCfg({ plugs: [...sel] }); }}>${sel.has(p.id) ? html`${ic('power', 'i s')}<span>${t('plugOff')}</span>` : nothing}</button></div>`)}`)}
          <span class="row muted" style="font-size:12px;gap:6px">${ic('lock', 'i s')}${t('essentialHint')}</span>` : nothing}
        ${d.id !== 'home' ? (() => { const off = m.plugs.filter((p) => sel.has(p.id) && !p.locked); return html`<div class=${'willoff' + (off.length ? ' some' : '')}>${off.length ? t('willOff', { n: off.length, list: off.map((p) => p.name).join(', ') }) : t('willOffNone')}</div>`; })() : nothing}
`;
  }
  modeSheet({ m, t }, d) {
    const c = this._modeCfg(d), alarm = m.alarms[0];
    const free = m.plugs.filter((p) => !p.locked && !p.hidden);
    const setCfg = (patch) => this._save({ modes: { ...(this._prefs.modes || {}), [d.id]: { ...c, ...patch } } });
    const sel = new Set(c.plugs || []);
    const supportsVac = alarm && ((alarm.attrs.supported_features || 0) & 32);
    const alarmTarget = d.id === 'home' ? t('disarmed') : d.id === 'night' ? t('armNight') : d.id === 'vacation' ? (supportsVac ? t('modeVacation') : t('armAway')) : t('armAway');
    const restoreList = (this._prefs.modeOff || []).filter((id) => m.plugs.some((p) => p.id === id));
    const sw = (on, fn, label) => html`<button class="switch" role="switch" aria-checked=${on ? 'true' : 'false'} aria-label=${label} @click=${fn}><span><i></i></span></button>`;
    const byRoom = {}; for (const p of free) (byRoom[p.areaName || t('noArea')] ||= []).push(p);
    return html`<div class="overlay" @click=${(e) => { if (e.target === e.currentTarget) this._set({ modeSheet: null }); }}>
      <div class="sheet rise" role="dialog" aria-modal="true" aria-label=${d.name}>
        <div class="row sp" style="align-items:flex-start;gap:12px"><span style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow" style="color:var(--accent)">${t('modeTitle')}</span><span style="font-size:30px;font-weight:300;letter-spacing:-.03em">${d.name}</span></span>
          <button class="ib" aria-label=${t('cancel')} @click=${() => this._set({ modeSheet: null })}>${ic('x', 'i s')}</button></div>
        ${this.modeConfig({ m, t }, d)}
        <div class="row" style="justify-content:flex-end;gap:8px;padding-top:6px;flex-wrap:wrap">
          <button class="btn" @click=${() => this._set({ modeSheet: null })}>${t('cancel')}</button>
          ${(() => { const n = d.id !== 'home' ? m.plugs.filter((p) => sel.has(p.id) && !p.locked).length : 0; return html`<button class="btn pri" ?disabled=${alarm?.needsCode && !(this._ui.modeCode || '').trim()} @click=${() => this._applyMode(m, d, t)}>${n ? t('activateOff', { m: d.name, n }) : t('activate', { m: d.name })}</button>`; })()}</div>
      </div></div>`;
  }
  async _applyMode(m, d, t) {
    const c = this._modeCfg(d), alarm = m.alarms[0], code = (this._ui.modeCode || '').trim();
    this._set({ modeSheet: null, modeCode: '' });
    const jobs = [];
    if (alarm) {
      let svc = d.alarm;
      if (svc === 'alarm_arm_vacation' && !((alarm.attrs.supported_features || 0) & 32)) svc = 'alarm_arm_away';
      if (alarm.state !== d.alarmState) jobs.push(this._call('alarm_control_panel', svc, { entity_id: alarm.id, ...(code ? { code } : {}) }));
    }
    if (c.lightsOff) { const ids = m.lights.filter((l) => l.on).map((l) => l.id); if (ids.length) jobs.push(this._call('light', 'turn_off', { entity_id: ids })); }
    let modeOff = this._prefs.modeOff || [];
    if (d.id === 'home') {
      if (c.restore && modeOff.length) { const ids = modeOff.filter((id) => m.plugs.some((p) => p.id === id && !p.on)); if (ids.length) jobs.push(this._call('switch', 'turn_on', { entity_id: ids })); }
      modeOff = [];
    } else {
      const ids = (c.plugs || []).filter((id) => m.plugs.some((p) => p.id === id && p.on && !p.locked));
      if (ids.length) { jobs.push(this._call('switch', 'turn_off', { entity_id: ids })); modeOff = [...new Set([...modeOff, ...ids])]; }
    }
    await Promise.all(jobs);
    this._save({ mode: d.id, modeOff });
    this._toast(t('modeOn', { m: d.name }), '');
  }

  // ── settings ─────────────────────────────────────────────────────────────
  _rulesOk(sec, d) {
    const r = this._prefs.labelRules || {}, ids = d.labels || [];
    for (const k of ['all', sec]) {
      const rule = r[k]; if (!rule) continue;
      if ((rule.exclude || []).some((x) => ids.includes(x))) return false;
      if ((rule.include || []).length && !(rule.include || []).some((x) => ids.includes(x))) return false;
    }
    return true;
  }
  // "Alexa avisa ao terminar" (owner 2026-11-16): finds the automation made from the AUREON blueprint for this machine
  // (admins only, via automation/config) and switches it on/off on tap. Without one, a tap opens the blueprints page.
  _loadAlexaAutos() {
    const autos = Object.keys(this.hass.states).filter((id) => id.startsWith('automation.'));
    const sig = autos.join('|');
    if (this._autoSig === sig || !this.hass.user?.is_admin || !this.hass.callWS) return;
    this._autoSig = sig;
    // Owner 2026-11-18 ("mas nao aparece"): the automation/config WebSocket returns the blueprint already filled in,
    // without use_blueprint. The stored automation (the same REST call the HA automation editor uses) still has it.
    const stored = (id) => { const cid = this.hass.states[id]?.attributes?.id; return cid && this.hass.callApi ? this.hass.callApi('GET', 'config/automation/config/' + encodeURIComponent(cid)).then((r) => (r && typeof r === 'object' && !Array.isArray(r) ? r : null)).catch(() => null) : Promise.resolve(null); };
    const live = (id) => this.hass.callWS({ type: 'automation/config', entity_id: id }).then((r) => r?.config || r).catch(() => null);
    Promise.all(autos.map(async (id) => [id, (await stored(id)) || (await live(id))])).then((rows) => {
      const out = [];
      for (const [id, c] of rows) {
        if (!c) continue;
        const bp = c.use_blueprint;
        if (bp && /appliance_done_(status|power)/.test(bp.path || '')) { const inp = bp.input || {}; out.push({ id, ents: [inp.status_entity, inp.power_entity, inp.power_sensor].flat().filter(Boolean), alias: String(c.alias || '') }); continue; }
        // Filled-in form: an AUREON appliance automation names itself and watches one sensor in its trigger.
        if (!bp && /alexa/i.test(String(c.alias || '')) && /ciclo|cycle|fertig|termin|zyklus|done/i.test(String(c.alias || ''))) {
          const trig = JSON.stringify(c.triggers || c.trigger || []), ents = [...new Set(trig.match(/\b(?:sensor|binary_sensor|switch)\.[a-z0-9_]+/g) || [])];
          if (ents.length) out.push({ id, ents, alias: String(c.alias || '') });
        }
      }
      this._alexaAutos = out; this.requestUpdate();
    });
  }
  // Owner 2026-11-18 ("ja configurei e esta em Automações e ele nao encontra"): the automation often watches the
  // machine's plug, not the smart machine itself. Match, in order: same entity, same device, the watched entity
  // names the same kind of machine, the alias names the machine, the watched entity is in the machine's room.
  _alexaFind(a) {
    const list = this._alexaAutos || []; if (!list.length) return null;
    const E = this.hass.entities || {}, D = this.hass.devices || {};
    const info = (e) => { const r = E[e] || {}, d = D[r.device_id] || {}; return { dev: r.device_id, area: r.area_id || d.area_id, text: [e, r.name, this.hass.states[e]?.attributes?.friendly_name, d.name_by_user, d.name].filter(Boolean).join(' ') }; };
    const tests = [
      (x) => x.ents.some((e) => a.entities?.includes(e)),
      (x) => x.ents.some((e) => info(e).dev && info(e).dev === a.id),
      (x) => !!a.kind && x.ents.some((e) => applianceKind(info(e).text) === a.kind),
      (x) => !!a.name && x.alias.toLowerCase().includes(a.name.toLowerCase()),
      (x) => !!a.kind && applianceKind(x.alias) === a.kind,
      (x) => !!a.area && x.ents.some((e) => info(e).area === a.area && [null, a.kind].includes(applianceKind(info(e).text)))
    ];
    for (const ok of tests) { const hit = list.find(ok); if (hit) return hit; }
    return null;
  }
  alexaRow(a, t) {
    if (!this.hass.user?.is_admin) return nothing;
    this._loadAlexaAutos();
    const au = this._alexaFind(a);
    const st = au && this.hass.states[au.id], on = st?.state === 'on';
    return html`<div class="alexa">${ic('speaker', 'i s')}<span class="grow txt">${t('alexaDone')}</span>
      ${au ? html`<button class="switch" role="switch" aria-checked=${on ? 'true' : 'false'} aria-label=${t('alexaDone') + ' · ' + a.name} @click=${() => this._call('automation', on ? 'turn_off' : 'turn_on', { entity_id: au.id })}><span><i></i></span></button>`
        : html`<button class="btn sm" @click=${() => { history.pushState(null, '', '/config/blueprint/dashboard'); window.dispatchEvent(new CustomEvent('location-changed')); }}>${t('alexaSetup')}</button>`}</div>`;
  }
  // Older machines measured by a plug: the cycle is read from the plug's power history (start, and the end once the
  // power stayed low for 3 minutes). "Terminou" stays until acknowledged or for 3 hours.
  _plugCycles(m, now) {
    const IDLE_MS = 3 * 60000, MIN_RUN = 8 * 60000;
    this._pc ||= {};
    for (const a of m.appliances.filter((x) => x.plug && x.powerIds?.length)) {
      const pid = a.powerIds[0], lc = Date.parse(this.hass.states[pid]?.last_changed) || 0, h = this._pc[a.id];
      if (this.hass.callWS && (!h || (h.lc !== lc && Date.now() - h.at > 15000) || Date.now() - h.at > 300000) && !this._pcBusy?.[a.id]) {
        (this._pcBusy ||= {})[a.id] = true;
        this.hass.callWS({ type: 'history/history_during_period', start_time: new Date(now.getTime() - 8 * 3600000).toISOString(), entity_ids: [pid], minimal_response: true, no_attributes: true, significant_changes_only: false })
          .then((res) => {
            const pts = (res?.[pid] || []).map((x) => ({ t: 1000 * Number(x.lu ?? x.lc ?? Date.parse(x.last_changed) / 1000), v: Number(x.s ?? x.state) })).filter((x) => Number.isFinite(x.t) && Number.isFinite(x.v));
            let run = null, below = null; const runs = [];
            for (const p of pts) {
              if (p.v >= PLUG_RUN_W) { below = null; if (!run) run = { start: p.t, end: null }; }
              else if (p.v < PLUG_IDLE_W && run) { below ??= p.t; }
              if (run && below != null && p.t - below >= IDLE_MS) { run.end = below; runs.push(run); run = null; below = null; }
            }
            if (run && below != null && Date.now() - below >= IDLE_MS) { run.end = below; runs.push(run); run = null; }
            const last = run || runs.filter((r) => r.end - r.start >= MIN_RUN).pop() || null;
            this._pc[a.id] = { at: Date.now(), lc, run: last };
          }).catch(() => { this._pc[a.id] = { at: Date.now(), lc, run: null }; })
          .finally(() => { this._pcBusy[a.id] = false; this.requestUpdate(); });
      }
      const r = this._pc[a.id]?.run;
      if (!r) continue;
      if (a.running && !r.end) { a.startAt = new Date(r.start); a.mins = null; }
      else if (!a.running && r.end && now - r.end < 3 * 3600000 && (this._prefs.cycleAck || {})[a.id] !== r.end) { a.done = true; a.idle = false; a.endedAt = new Date(r.end); a.runEnd = r.end; a.status = 'plugdone'; }
    }
  }
  // Owner 2026-11-18 ("o alarme da casa … em drop-down … bonito e elegante"): a quiet pill beside 3D/Planta with the
  // alarm state; it opens a small menu with the modes the panel supports. Nothing is sent until a mode is tapped.
  alarmMenu({ m, t }) {
    const a = m.alarms[0], st = a.state, f = a.attrs.supported_features || 0, open = this._ui.alarmOpen;
    const all = [['disarmed', 'alarm_disarm', t('disarmed'), 0], ['armed_home', 'alarm_arm_home', t('armHome'), 1], ['armed_away', 'alarm_arm_away', t('armAway'), 2], ['armed_night', 'alarm_arm_night', t('armNight'), 4], ['armed_vacation', 'alarm_arm_vacation', t('modeVacation'), 32]];
    const opts = all.filter(([, , , bit]) => !bit || !f || (f & bit));
    const label = st === 'triggered' ? t('triggered') : (all.find(([s2]) => s2 === st)?.[2] || (/arming|pending/.test(st) ? t('alarmArming') : st));
    const armed = /^armed/.test(st), alert = st === 'triggered', code = (this._ui.alarmCode || '').trim();
    const pick = (svc) => { if (a.needsCode && !code) return; this._call('alarm_control_panel', svc, { entity_id: a.id, ...(code ? { code } : {}) }); this._set({ alarmOpen: false, alarmCode: '' }); };
    return html`<span class="alw">
      <button class=${'alp' + (armed ? ' on' : '') + (alert ? ' alert' : '')} aria-haspopup="menu" aria-expanded=${open ? 'true' : 'false'} aria-label=${a.name + ' · ' + label} @click=${(e) => { e.stopPropagation(); this._set({ alarmOpen: !open }); }}>
        ${ic('shield', 'i s')}<span class="txt"><small>${a.name}</small><b>${label}</b></span>${ic('down', 'i s alc')}</button>
      ${open ? html`<div class="alm rise" role="menu" @click=${(e) => e.stopPropagation()}>
        <span class="eyebrow" style="font-size:10px;padding:4px 8px 2px">${a.name}</span>
        ${a.needsCode ? html`<input class="alcode" type="password" inputmode="numeric" autocomplete="off" .value=${this._ui.alarmCode || ''} placeholder=${t('code')} aria-label=${t('code')} @input=${(e) => this._set({ alarmCode: e.target.value })}>` : nothing}
        ${opts.map(([s2, svc, n]) => html`<button role="menuitemradio" aria-checked=${st === s2 ? 'true' : 'false'} ?disabled=${st === s2 || (a.needsCode && !code)} @click=${() => pick(svc)}><i aria-hidden="true"></i>${n}${st === s2 ? ic('check', 'i s') : nothing}</button>`)}
      </div>` : nothing}</span>`;
  }
  // "Back to top" (owner 2026-11-18): a round button pinned bottom-right once the page is scrolled. It lives in
  // document.body because the dashboard host is a size container, which would trap position:fixed.
  _mountTop() {
    if (this._topBtn) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'aureon-top';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
    Object.assign(b.style, { position: 'fixed', right: 'max(20px, env(safe-area-inset-right))', bottom: 'calc(20px + env(safe-area-inset-bottom))', zIndex: '4', width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(18,18,20,.82)', color: '#E2C98F', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 12px 30px -8px rgba(0,0,0,.8)', backdropFilter: 'blur(12px)', webkitBackdropFilter: 'blur(12px)', opacity: '0', transform: 'translateY(12px)', pointerEvents: 'none', transition: 'opacity .25s, transform .25s' });
    const scrollers = () => { const out = [document.scrollingElement || document.documentElement]; let n = this; while (n) { if (n instanceof Element && n.scrollHeight > n.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) out.push(n); n = n.parentNode || n.host; } return out; };
    const offset = () => scrollers().reduce((mx, el) => Math.max(mx, el.scrollTop || 0), window.scrollY || 0);
    const update = () => { const on = this.isConnected && offset() > 500; b.style.opacity = on ? '1' : '0'; b.style.transform = on ? 'none' : 'translateY(12px)'; b.style.pointerEvents = on ? 'auto' : 'none'; b.tabIndex = on ? 0 : -1; };
    b.addEventListener('click', () => { for (const el of scrollers()) el.scrollTo?.({ top: 0, behavior: 'smooth' }); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    this._topScroll = () => { if (!this._topRaf) this._topRaf = requestAnimationFrame(() => { this._topRaf = null; update(); }); };
    document.addEventListener('scroll', this._topScroll, { capture: true, passive: true });
    document.body.appendChild(b); this._topBtn = b; update();
  }
  _unmountTop() { if (!this._topBtn) return; document.removeEventListener('scroll', this._topScroll, { capture: true }); this._topBtn.remove(); this._topBtn = null; }
  // AUREON Music page (owner 2026-11-16: the home shows a short list; "ver mais" opens a complete music page).
  _musicPage(open) {
    if (open) { try { history.pushState({ ...(history.state || {}), aureonMusic: true }, '', location.pathname + location.search + '#aureon-music'); } catch { /* ok */ } }
    else if (location.hash === '#aureon-music') { history.back(); return; }
    this._set({ musicPage: open, libMore: open }); this.requestUpdate();
    requestAnimationFrame(() => { (this.closest?.('hui-view') || window).scrollTo?.({ top: 0 }); window.scrollTo({ top: 0 }); });
  }
  _onPop = () => { const want = location.hash === '#aureon-music'; if (want !== !!this._ui.musicPage) { this._set({ musicPage: want, libMore: want }); this.requestUpdate(); } };
  _moreInfo(id) { this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); }
  _loadLabels() {
    this.hass.callWS({ type: 'config/label_registry/list' }).then((list) => {
      const o = {}, c = {}, meta = {};
      for (const l of list || []) { o[l.label_id] = l.name; c[l.label_id] = l.color || ''; meta[l.label_id] = { name: l.name, description: l.description || '', icon: l.icon || '', color: l.color || '' }; }
      o.__roles = labelRoles(meta);
      this._labels = o; this._labelColors = c; this._labelMeta = meta; this.requestUpdate();
    }).catch(() => {});
  }
  _labelList(m) {
    const ids = new Set(Object.keys(this._labels || {}).filter((k) => k !== '__roles'));
    for (const k of ['lights', 'plugs', 'climate', 'covers', 'openings', 'locks', 'cams', 'speakers', 'tvs', 'scenes']) for (const d of m[k]) for (const l of d.labels || []) ids.add(l);
    const n = {}; for (const k of ['lights', 'plugs', 'climate', 'covers', 'openings', 'locks', 'cams', 'speakers', 'tvs', 'scenes']) for (const d of m[k]) for (const l of d.labels || []) n[l] = (n[l] || 0) + 1;
    return [...ids].map((id) => ({ id, name: this._labels?.[id] || id, color: this._labelColors?.[id] || '', icon: this._labelMeta?.[id]?.icon || '', desc: this._labelMeta?.[id]?.description || '', role: this._labels?.__roles?.[id] || '', count: n[id] || 0 })).sort((a, b) => a.name.localeCompare(b.name));
  }
  settings(ctx) {
    const { m, t } = ctx, ui = this._ui, prefs = this._prefs, tab = ui.settings;
    const sw = (on, fn, label) => html`<button class="switch" role="switch" aria-checked=${on ? 'true' : 'false'} aria-label=${label} @click=${fn}><span><i></i></span></button>`;
    const tabs = [['geral', t('stGeneral')], ['modos', t('modeTitle')], ['aparelhos', t('stAppliances')], ['secoes', t('stSections')], ['etiquetas', t('stLabels')], ['dispositivos', t('stDevices')], ['sobre', t('stAbout')]];
    const secNames = { lights: t('lights'), climate: t('climate'), plugs: t('plugs'), energy: t('energy'), covers: t('covers'), openings: t('openings'), security: t('security'), tv: t('tvs'), music: 'AUREON Music', scenes: t('scenes') };
    let body = nothing;
    const hints = { geral: t('stHintGeneral'), modos: t('stHintModes'), aparelhos: t('stHintAppl'), secoes: t('stHintSections'), etiquetas: t('stHintLabels'), dispositivos: t('stHintDevices'), sobre: t('stHintAbout') };
    const icons = { geral: 'palette', modos: 'home', aparelhos: 'washer', secoes: 'grip', etiquetas: 'eye', dispositivos: 'plug', sobre: 'gear' };
    if (tab === 'home') {
      // Owner 2026-11-18: a start page for Settings; "Voltar" in any tab returns here, "Fechar" closes.
      body = html`<div class="sthome">${tabs.map(([k, n]) => html`<button class="sthi" @click=${() => this._set({ settings: k })}>
        <span class="ic">${ic(icons[k], 'i s')}</span><span class="grow txt"><b>${n}</b><small>${hints[k]}</small></span>${ic('right', 'i s')}</button>`)}</div>`;
    } else if (tab === 'geral') {
      const weathers = Object.keys(this.hass.states).filter((e) => e.startsWith('weather.'));
      const rk = { arrivals: t('rkArrivals'), lights: t('lights'), openings: t('openings'), locks: t('locked'), appliances: t('cycleDone'), waste: t('waste'), ...{} };
      const kinds = prefs.reminderKinds || {};
      body = html`
        <span class="eyebrow" style="font-size:10px">${t('theme')}</span>
        <div class="wrapRow">${THEMES.map((x) => html`<button class="dc" aria-pressed=${prefs.theme === x.id ? 'true' : 'false'} style=${prefs.theme === x.id ? 'border-color:var(--accent);color:var(--fg)' : ''} @click=${() => this._save({ theme: x.id })}><span style=${`display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:${x.ha ? 'var(--primary-color,#03a9f4)' : x.accent}`}></span>${x.name}</button>`)}</div>
        <div class="chk"><span class="grow txt"><b>${t('stDefaultView')}</b></span><span class="seg"><button aria-pressed=${prefs.view !== '2d' ? 'true' : 'false'} @click=${() => this._save({ view: '3d' })}>3D</button><button aria-pressed=${prefs.view === '2d' ? 'true' : 'false'} @click=${() => this._save({ view: '2d' })}>${t('plan').toUpperCase()}</button></span></div>
        ${weathers.length > 1 ? html`<div class="chk"><span class="grow txt"><b>${t('forecastT')}</b></span><select style="min-height:40px;border-radius:10px;background:var(--sunk);color:var(--fg);border:1px solid var(--line2);padding:0 10px;font:inherit" @change=${(e) => { this._save({ weather: e.target.value }); this._fcFor = null; this.requestUpdate(); }}>${weathers.map((w) => html`<option value=${w} ?selected=${(prefs.weather || weathers[0]) === w}>${this.hass.states[w].attributes.friendly_name || w}</option>`)}</select></div>` : nothing}
        <span class="eyebrow" style="font-size:10px;padding-top:6px">${t('reminders')}</span>
        <div class="chk"><span class="grow txt"><b>${t('stPushMin')}</b></span>${sw(!!prefs.pushMin, () => this._save({ pushMin: !prefs.pushMin }), t('stPushMin'))}</div>
        ${Object.entries(rk).map(([k, n]) => html`<div class="chk"><span class="grow txt"><b>${n}</b></span>${sw(kinds[k] !== false, () => this._save({ reminderKinds: { ...kinds, [k]: kinds[k] === false } }), n)}</div>`)}`;
    } else if (tab === 'secoes') {
      const hiddenS = new Set(prefs.secHidden || []);
      body = html`<span class="muted txt" style="font-size:13px">${t('stSectionsHint')}</span>
        ${prefs.secOrder.map((k, i) => html`<div class="chk"><span class="grow txt"><b>${secNames[k]}</b></span>
          <button class="ib sm" ?disabled=${i === 0} aria-label=${t('sectionUp') + ' · ' + secNames[k]} @click=${() => this._moveSection(k, -1)}>${ic('up', 'i s')}</button>
          <button class="ib sm" ?disabled=${i === prefs.secOrder.length - 1} aria-label=${t('sectionDown') + ' · ' + secNames[k]} @click=${() => this._moveSection(k, 1)}>${ic('down', 'i s')}</button>
          ${sw(!hiddenS.has(k), () => { hiddenS.has(k) ? hiddenS.delete(k) : hiddenS.add(k); this._save({ secHidden: [...hiddenS] }); }, secNames[k])}</div>`)}`;
    } else if (tab === 'modos') {
      const defs = this._modeDefs(t), cur = defs.find((d) => d.id === (ui.modeTab || 'away')) || defs[1];
      body = html`<span class="muted txt" style="font-size:13px;line-height:1.55">${t('stModesHint')}</span>
        <div class="sttabs" role="tablist" style="background:transparent">${defs.map((d) => html`<button role="tab" aria-selected=${cur.id === d.id ? 'true' : 'false'} @click=${() => this._set({ modeTab: d.id })}>${d.name}</button>`)}</div>
        ${this.modeConfig(ctx, cur)}`;
    } else if (tab === 'aparelhos') {
      const map = prefs.applMap || {}, hid = prefs.applHidden || {};
      const kinds = ['washer', 'dish', 'dryer'];
      body = html`<span class="muted txt" style="font-size:13px;line-height:1.55">${t('stApplHint')}</span>
        ${kinds.map((k) => { const auto = m.appliances.find((a) => a.kind === k && !map[k]); return html`<div class="applcfg">
          <div class="row sp" style="gap:12px"><span class="row" style="gap:10px"><span class="ic" style="width:36px;height:36px">${ic(k === 'dish' ? 'dish' : 'washer', 'i s')}</span><b style="font-weight:500">${t('kind_' + k)}</b></span>
            ${sw(!hid[k], () => this._save({ applHidden: { ...hid, [k]: !hid[k] } }), t('kind_' + k))}</div>
          ${hid[k] ? html`<span class="muted" style="font-size:12px">${t('applHiddenTxt')}</span>` : html`<label class="lbsel"><span class="eyebrow" style="font-size:10px">${t('applSource')}</span>
            <select @change=${(e) => this._save({ applMap: { ...map, [k]: e.target.value } })}>
              <option value="" ?selected=${!map[k]}>${auto ? t('applAuto', { n: auto.name }) : t('applAutoNone')}</option>
              ${m.appliances.filter((a) => !a.plug || a.kind === k).length ? html`<optgroup label=${t('applDevices')}>${m.appliances.filter((a) => !a.plug).map((a) => html`<option value=${a.id} ?selected=${map[k] === a.id}>${a.name}${a.areaName ? ' · ' + a.areaName : ''}</option>`)}</optgroup>` : nothing}
              <optgroup label=${t('applPlugs')}>${m.plugs.slice().sort((x, y) => (y.w != null) - (x.w != null) || x.name.localeCompare(y.name)).map((p) => html`<option value=${p.id} ?selected=${map[k] === p.id}>${p.name}${p.areaName ? ' · ' + p.areaName : ''}${p.w != null ? ' · ' + p.w + ' W' : ''}</option>`)}</optgroup>
            </select></label>`}
        </div>`; })}`;
    } else if (tab === 'etiquetas') {
      const labels = this._labelList(m), rules = prefs.labelRules || {};
      const sec = ui.labelSec || 'all';
      const rule = rules[sec] || { include: [], exclude: [] };
      const toggle = (kind, id) => { const cur = new Set(rule[kind] || []); cur.has(id) ? cur.delete(id) : cur.add(id); const other = kind === 'include' ? 'exclude' : 'include'; const o = new Set(rule[other] || []); o.delete(id); this._save({ labelRules: { ...rules, [sec]: { ...rule, [kind]: [...cur], [other]: [...o] } } }); };
      // Owner 2026-11-18 ("tá feio"): one calm row per label with a 3-way choice, the section picked from a menu.
      const SYS = { no_dboard: t('lbSysHide'), protegida: t('lbSysProtect'), immer_an: t('lbSysProtect'), always_on: t('lbSysProtect'), no_off: t('lbSysProtect'), steckdosen_dashboard: t('lbSysOutlet') };
      const HA = { red: '#E57373', pink: '#F48FB1', purple: '#BA68C8', 'deep-purple': '#9575CD', indigo: '#7986CB', blue: '#64B5F6', 'light-blue': '#4FC3F7', cyan: '#4DD0E1', teal: '#4DB6AC', green: '#81C784', 'light-green': '#AED581', lime: '#DCE775', yellow: '#FFF176', amber: '#FFD54F', orange: '#FFB74D', 'deep-orange': '#FF8A65', brown: '#A1887F', grey: '#9E9E9E', 'blue-grey': '#90A4AE', primary: 'var(--accent)', accent: 'var(--accent)' };
      const col = (c) => (!c ? 'var(--line2)' : HA[c] || c);
      const state = (id) => ((rule.include || []).includes(id) ? 'include' : (rule.exclude || []).includes(id) ? 'exclude' : 'normal');
      const setState = (id, st) => { const inc = new Set(rule.include || []), exc = new Set(rule.exclude || []); inc.delete(id); exc.delete(id); if (st === 'include') inc.add(id); if (st === 'exclude') exc.add(id); this._save({ labelRules: { ...rules, [sec]: { include: [...inc], exclude: [...exc] } } }); };
      const ROLE_TXT = { hide: t('lbSysHide'), protect: t('lbSysProtect'), outlet: t('lbSysOutlet') };
      const user = labels.filter((l) => !l.role && !SYS[l.id]), sys = labels.filter((l) => l.role || SYS[l.id]);
      const opts = [['all', t('stAllSections')], ...Object.entries(secNames).filter(([k]) => k !== 'energy')];
      const secLabel = sec === 'all' ? t('stEverywhere') : secNames[sec];
      body = html`<span class="muted txt" style="font-size:13px;line-height:1.55">${t('stLabelsHint2')}</span>
        <label class="lbsel"><span class="eyebrow" style="font-size:10px">${t('stApplyTo')}</span>
          <select .value=${sec} @change=${(e) => this._set({ labelSec: e.target.value })}>${opts.map(([k, n]) => html`<option value=${k} ?selected=${sec === k}>${n}${(rules[k]?.include?.length || rules[k]?.exclude?.length) ? ' •' : ''}</option>`)}</select></label>
        ${!user.length ? html`<span class="muted" style="font-size:13px">${t('stNoLabels')}</span>` : html`<div class="lblist">${user.map((l) => { const st = state(l.id); return html`<div class=${'lbrow ' + st}>
          <span class="lbic" style=${'--lc:' + col(l.color)}>${l.icon ? html`<ha-icon .icon=${l.icon}></ha-icon>` : nothing}</span>
          <span class="grow txt"><b>${l.name}</b><span class="muted">${[t('stLabelCount', { n: l.count }), l.desc].filter(Boolean).join(' · ')}</span></span>
          <span class="lbseg" role="radiogroup" aria-label=${l.name}>${[['normal', t('stLbNormal')], ['include', t('stLbOnly')], ['exclude', t('stLbHide')]].map(([k, n]) => html`<button role="radio" aria-checked=${st === k ? 'true' : 'false'} class=${k} @click=${() => setState(l.id, k)}>${n}</button>`)}</span>
          <span class="lbexp">${st === 'include' ? t('stLbExpOnly', { s: secLabel, l: l.name }) : st === 'exclude' ? t('stLbExpHide', { s: secLabel, l: l.name }) : t('stLbExpNormal', { l: l.name })}</span></div>`; })}</div>`}
        ${sys.length ? html`<div class="lbsys"><span class="eyebrow" style="font-size:10px">${t('stLbSystem')}</span>${sys.map((l) => html`<span class="row" style="gap:10px;font-size:13px"><span class="lbic sm" style=${'--lc:' + col(l.color)}>${l.icon ? html`<ha-icon .icon=${l.icon}></ha-icon>` : nothing}</span><b style="font-weight:500">${l.name}</b><span class="muted">${ROLE_TXT[l.role] || SYS[l.id]}</span></span>`)}</div>` : nothing}`;
    } else if (tab === 'dispositivos') {
      const q = (ui.setQ || '').toLowerCase(), hid = new Set(prefs.hidden || []), force = new Set(prefs.forceShow || []);
      const groups = [['lights', t('lights'), m.lights], ['plugs', t('plugs'), m.plugs], ['climate', t('climate'), m.climate], ['covers', t('covers'), m.covers], ['openings', t('openings'), m.openings], ['security', t('security'), [...m.locks, ...m.cams]], ['tv', t('tvs'), m.tvs], ['music', t('speakersAll'), m.speakers], ['scenes', t('scenes'), m.scenes]];
      const mcd = this._mc?.devices || [], ch = new Set(prefs.connectHidden || []);
      if (this._mc && !mcd.length && !this._mc.pending?.has('devices') && !this._connAsked) { this._connAsked = true; this._mc.loadDevices?.(false); }
      const match = (d) => !q || (d.name + ' ' + d.id + ' ' + (d.areaName || '')).toLowerCase().includes(q);
      body = html`<input type="search" .value=${ui.setQ || ''} placeholder=${t('stSearch')} aria-label=${t('stSearch')} @input=${(e) => this._set({ setQ: e.target.value })} style="min-height:44px;padding:0 14px;border-radius:12px;border:1px solid var(--line2);background:var(--sunk);color:var(--fg);font:inherit">
        ${groups.map(([k, n, list]) => { const f = list.filter(match); if (!f.length && !(k === 'music' && m.hiddenMedia.length)) return nothing; return html`<span class="eyebrow" style="font-size:10px;padding-top:8px">${n} · ${f.length}</span>
          ${f.map((d) => html`<div class="chk"><span class="grow txt"><b>${d.name}</b><span class="muted" style="display:block;font-size:11px">${[d.areaName, d.id].filter(Boolean).join(' · ')}${force.has(d.id) ? ' · ' + t('stHiddenInHa') : ''}</span></span>
            ${sw(!hid.has(d.id), () => this._toggleHidden(d.id), d.name)}</div>`)}
          ${k === 'music' ? m.hiddenMedia.filter(match).map((d) => html`<div class="chk" style="opacity:.75"><span class="grow txt"><b>${d.name}</b><span class="muted" style="display:block;font-size:11px">${d.id} · ${t('stHiddenInHa')}</span></span>
            ${sw(false, () => this._save({ forceShow: [...new Set([...(prefs.forceShow || []), d.id])] }), d.name)}</div>`) : nothing}`; })}
        ${mcd.length ? html`<span class="eyebrow" style="font-size:10px;padding-top:8px">${t('stOutputs')} · ${mcd.filter((d) => !ch.has(d.name)).length}</span>
          <span class="muted txt" style="font-size:12px">${t('stOutputsHint')}</span>
          ${mcd.map((d) => html`<div class="chk"><span class="grow txt"><b>${d.name}</b></span>${sw(!ch.has(d.name), () => { ch.has(d.name) ? ch.delete(d.name) : ch.add(d.name); this._save({ connectHidden: [...ch] }); }, d.name)}</div>`)}` : nothing}`;
    } else {
      body = html`<div class="chk"><span class="grow txt"><b>AUREON Noir</b><span class="muted" style="display:block;font-size:12px">${VERSION} · ${BUILD}</span></span></div>
        <span class="muted txt" style="font-size:13px;line-height:1.5">${t('stAboutHint')}</span>
        <div class="wrapRow"><button class="btn" @click=${() => { try { navigator.clipboard.writeText(JSON.stringify(this._prefs)); this._toast(t('stCopied'), ''); } catch { /* ok */ } }}>${t('stExport')}</button>
          <button class="btn" @click=${() => { const v = prompt(t('stImport')); if (!v) return; try { const p = JSON.parse(v); if (p && typeof p === 'object') { this._save(p); this._toast(t('stImported'), ''); } } catch { this._toast(t('stImportFail'), ''); } }}>${t('stImport')}</button>
          <button class="btn" @click=${() => { if (confirm(t('stResetQ'))) { this._prefs = null; try { localStorage.removeItem(this._key); } catch { /* ok */ } this._loadPrefs(); this._pushPrefs(); this.requestUpdate(); } }}>${t('stReset')}</button></div>`;
    }
    return html`<div class="overlay" @click=${(e) => { if (e.target === e.currentTarget) this._set({ settings: null }); }}>
      <div class="sheet rise" role="dialog" aria-modal="true" aria-label=${t('settings')} style="width:min(720px,100%)">
        <div class="sthead">
          <div class="row" style="gap:10px;min-width:0">
            ${tab !== 'home' ? html`<button class="btn sm" aria-label=${t('goBack')} @click=${() => this._set({ settings: 'home' })}>${ic('left', 'i s')}${t('goBack')}</button>` : nothing}
            <span class="grow" style="font-size:24px;font-weight:300;letter-spacing:-.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tab === 'home' ? t('settings') : (tabs.find(([k]) => k === tab)?.[1] || t('settings'))}</span>
            <button class="ib sm stclose" aria-label=${t('closeS')} title=${t('closeS')} @click=${() => this._set({ settings: null })}>${ic('x', 'i s')}</button>
          </div>
          ${tab !== 'home' ? html`<div class="sttabs" role="tablist">${tabs.map(([k, n]) => html`<button role="tab" aria-selected=${tab === k ? 'true' : 'false'} @click=${() => this._set({ settings: k })}>${n}</button>`)}</div>` : nothing}
        </div>
        ${body}
        <div class="stfoot">${this._savedAt && Date.now() - this._savedAt < 2500
          ? html`<span class=${'saved ' + (this._savedState || 'all')} role="status">${ic('check', 'i s')}${this._savedState === 'local' ? t('savedLocal') : t('savedAll')}</span>`
          : html`<span class="dim txt">${this._synced ? t('stSynced') : t('stLocal')}</span>`}</div>

      </div></div>`;
  }

  // ── scenes ───────────────────────────────────────────────────────────────
  scenes({ m, t, now }) {
    const list = this._visible('scenes', this._sorted('scenes', m.scenes).map((s) => ({ ...s, area: this._ui.room === 'all' ? s.area : (s.area || this._ui.room) })));
    const ids = list.map((s) => s.id);
    const recent = m.scenes.map((s) => Date.parse(s.state)).filter(Number.isFinite);
    const last = recent.length ? Math.max(...recent) : 0;
    if (!list.length) return nothing;
    return html`<section class="sec" aria-label=${t('scenes')}><h2 class="eyebrow" style="margin:0;padding:0 4px;font-weight:400">${t('scenes')}</h2>
      <div class="scenes">${repeat(list, (s) => s.id, (s, i) => {
        const glow = SCENE_GLOW[i % SCENE_GLOW.length];
        const on = Date.parse(s.state) === last && now - last < 2 * 3600e3;
        const ta = this.tileAttrs('scenes', s, ids);
        return html`<div class=${'tile' + ta.cls} style="padding:0;border:0;background:transparent;overflow:visible" draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end}>
          ${this.editBar('scenes', s, ids, t)}
          <button class="scene" aria-label=${t('scene') + ' ' + s.name} @click=${() => this._call('scene', 'turn_on', { entity_id: s.id })}
            style=${on ? `border-color:rgba(${glow},.45);box-shadow:0 24px 70px -30px rgba(${glow},.65);transform:translateY(-2px)` : ''}>
            <span class="orb" style=${`background:radial-gradient(circle, rgba(${glow},.55) 0%, rgba(${glow},0) 65%);opacity:${on ? 1 : 0.18}`}></span>
            <span class="tag" style=${`position:relative;color:${on ? `rgb(${glow})` : 'var(--dim)'}`}>${on ? '● ' + t('active') : t('scene')}</span><b>${s.name}</b></button></div>`;
      })}</div></section>`;
  }

  // ── happening now ────────────────────────────────────────────────────────
  live(ctx) {
    const { m, t, lang, now } = ctx;
    const cards = [];
    // Owner 2026-11-16: no music card here — AUREON Music below already plays and shows it.
    const hiddenK = this._prefs.applHidden || {};
    const KINDS = ['washer', 'dish', ...new Set(m.appliances.map((a) => a.kind).filter((k) => k !== 'washer' && k !== 'dish'))];
    const applCards = [];
    for (const kind of KINDS) {
      if (hiddenK[kind]) continue;
      const list = m.appliances.filter((a) => a.kind === kind);
      if (!list.length) { applCards.push({ placeholder: kind }); continue; }
      applCards.push(...list);
    }
    for (const a of applCards.filter((x) => x.placeholder)) {
      const icon = a.placeholder === 'dish' ? 'dish' : 'washer';
      cards.push(html`<article class="act ph">
        <div class="row" style="gap:16px;align-items:center"><div class="ring">${svg`<svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="31" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="5" stroke-dasharray="4 6"></circle></svg>`}<span style="color:var(--mut)">${ic(icon)}</span></div>
          <div class="grow" style="display:flex;flex-direction:column;gap:3px"><span class="tag" style="color:var(--mut)">${t('notSetUp')}</span><span class="ttl">${t('kind_' + a.placeholder)}</span><span class="muted txt" style="font-size:13px">${t('notSetUpHint')}</span></div></div>
        <button class="btn" style="align-self:flex-start" @click=${() => this._set({ settings: 'aparelhos' })}>${ic('gear', 'i s')}${t('setUp')}</button></article>`);
    }
    for (const a of applCards.filter((x) => !x.placeholder)) {
      const C = 2 * Math.PI * 31, pct = a.done ? 100 : a.pct != null ? a.pct : null;
      const icon = a.kind === 'dish' ? 'dish' : 'washer';
      const dev = { ...a, isDevice: true };
      const hm = (d) => d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
      const idle = !a.running && !a.done;
      const detail = idle ? (a.plug ? [t('applIdle'), a.w ? a.w + ' W' : null].filter(Boolean).join(' · ') : [t('applIdle'), a.status && !/^(off|aus|inactive|ready|bereit)$/i.test(a.status) ? a.status : null].filter(Boolean).join(' · ')) : a.plug ? (a.done ? t('plugDone', { t: hm(a.endedAt) }) : [a.startAt ? t('plugSince', { m: Math.max(1, Math.round((now - a.startAt) / 60000)) }) : t('running'), a.w + ' W ' + t('nowS')].join(' · ')) : a.done ? [a.program, t('cycleDone')].filter(Boolean).join(' · ') : [a.program || null, a.mins != null ? t('remaining', { m: Math.round(a.mins) }) : null, a.endAt ? t('endsAt', { t: a.endAt.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) }) : null, !a.mins && !a.endAt ? a.status : null].filter(Boolean).join(' · ');
      cards.push(html`<article class="act" style=${a.done ? `border-color:var(--accent);box-shadow:0 24px 70px -30px ${rgba(ctx.aRgb, 0.6)}` : ''}>
        ${this.editBar('appliances', dev, [], t)}
        <div class="row" style="gap:16px;align-items:center"><div class="ring">${svg`<svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="31" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="5"></circle>${pct != null ? svg`<circle cx="36" cy="36" r="31" fill="none" stroke-width="5" stroke-linecap="round" stroke=${a.done ? 'var(--accent)' : '#8FB8FF'} stroke-dasharray=${(C * pct / 100).toFixed(1) + ' ' + C.toFixed(1)}></circle>` : a.running ? svg`<circle class="spinarc" cx="36" cy="36" r="31" fill="none" stroke-width="5" stroke-linecap="round" stroke="#8FB8FF" stroke-dasharray=${(C * 0.28).toFixed(1) + ' ' + C.toFixed(1)}></circle>` : nothing}</svg>`}
          <span style=${a.done ? 'color:var(--accent)' : idle ? 'color:var(--mut)' : 'color:#C9D8F5'}>${ic(icon)}</span></div>
          <div class="grow" style="display:flex;flex-direction:column;gap:3px"><span class="tag" style=${a.done ? 'color:var(--accent)' : 'color:var(--mut)'}>${a.done ? '● ' + t('cycleDone') : (a.areaName ? a.areaName + ' · ' : '') + (idle ? t('applIdleTag') : pct != null ? Math.round(pct) + '%' : t('running'))}</span>
            <span class="ttl">${a.name}</span><span class="muted txt" style="font-size:13px">${detail}</span>
            ${a.plug ? html`<span class="byplug">${ic('plug', 'i s')}${t('byPlug')}</span>` : nothing}</div></div>
        ${a.plug && a.done ? html`<button class="btn sm" style="align-self:flex-start" @click=${() => this._save({ cycleAck: { ...(this._prefs.cycleAck || {}), [a.id]: a.runEnd } })}>${ic('check', 'i s')}${t('okS')}</button>` : nothing}
        ${this.alexaRow(a, t)}</article>`);
    }
    if (m.waste.length) {
      // Owner 2026-11-16: the next pickup as a big, refined bin; today is always stated; the next days on a shelf.
      const ack = this._prefs.wasteAck || {};
      const byDay = new Map();
      for (const w of m.waste) { if (!byDay.has(w.days)) byDay.set(w.days, { date: w.date, days: w.days, items: [] }); const d = byDay.get(w.days); if (!d.items.some((x) => x.type === w.type)) d.items.push(w); }
      const days = [...byDay.values()].sort((x, y) => x.days - y.days);
      const hero = days[0], keys = hero.items.map((x) => hero.date + x.type), out = keys.every((k) => ack[k]);
      const wd = (date, opt) => new Date(date + 'T12:00:00').toLocaleDateString(lang, opt);
      // Owner 2026-11-18: "Hoje", "Amanhã", otherwise just the date (20.11).
      const dmy = (date) => { const [, mo, dd] = String(date).split('-'); return dd + '.' + mo; };
      const dayLabel = (w) => (w.days === 0 ? t('today') : w.days === 1 ? t('tomorrow') : dmy(w.date));
      const when = dayLabel(hero);
      const urgent = hero.days <= 1 && !out;
      const today = byDay.get(0);
      const sub = hero.days === 0 ? (out ? t('wasteOut') : t('wasteToday')) : today ? '' : t('wasteTodayNone');
      const shelf = days.filter((d) => d !== hero).flatMap((d) => d.items.map((w) => ({ ...w }))).slice(0, 4);
      cards.push(html`<article class=${'act wst' + (urgent ? ' urgent' : '')}>
        <span class="wglow" aria-hidden="true" style=${'background:radial-gradient(closest-side,' + binColor(hero.items[0].type) + '55,transparent)'}></span>
        <div class="wwrap"><span class="tag wtag">${t('waste')} · ${when}</span>
        <div class="whero">
          <span class="wbins" aria-hidden="true">${hero.items.slice(0, 2).map((w, i) => binSvg(binColor(w.type), urgent, 'h' + i, i ? 'back' : ''))}</span>
          <div class="wtxt">
            <span class="wname txt">${hero.items.map((w) => shortBin(w.type)).join(' + ')}</span>
            ${sub ? html`<span class="wsub txt">${sub}</span>` : nothing}
            ${hero.days <= 1 ? (out ? html`<span class="wok">${ic('check', 'i s')}${t('wasteOut')}</span>` : html`<button class="wbtn" @click=${() => this._save({ wasteAck: { ...ack, ...Object.fromEntries(keys.map((k) => [k, true])) } })}>${ic('check', 'i s')}${t('wasteDoneS')}</button>`) : nothing}
          </div>
        </div>
        ${shelf.length ? html`<div class="wshelf">${shelf.map((w, i) => html`<span class="wsi"><i class="wdot" style=${'background:' + binColor(w.type)}></i><b class="txt">${shortBin(w.type)}</b><span class="mono">${dayLabel(w)}</span></span>`)}</div>` : nothing}
      </div></article>`);
    }
    for (const v of m.vacuums) {
      const st = v.state, cleaning = st === 'cleaning', bat = v.attrs.battery_level ?? v.battery;
      const vr = vacuumRooms(v.attrs), active = ['cleaning', 'paused', 'returning'].includes(st);
      // Owner 2026-11-18: every live card the same size; the map opens in the Home Assistant dialog.
      const curRoom = vr && vr.cur >= 0 ? vr.list[vr.cur] : null;
      const label = { cleaning: t('cleaning'), docked: t('docked'), returning: t('returning'), paused: t('vPaused'), error: t('vError'), idle: t('idle') }[st] || st;
      cards.push(html`<article class="act" style=${cleaning ? 'border-color:rgba(126,224,168,.35)' : ''}>
        <div class="row sp" style="align-items:flex-start;gap:12px"><div class="grow" style="display:flex;flex-direction:column;gap:3px">
          <span class="tag" style=${cleaning ? 'color:#7EE0A8' : 'color:var(--mut)'}>${cleaning ? '● ' : ''}${label}${curRoom && active ? ' · ' + curRoom : v.areaName ? ' · ' + v.areaName : ''}</span>
          <span class="ttl">${v.name}</span><span class="muted txt" style="font-size:13px">${vr && active ? [vr.whole ? t('wholeHome') : null, vr.cur >= 0 ? t('roomOf', { a: vr.cur + 1, b: vr.list.length }) : null, bat != null ? t('battery') + ' ' + Math.round(bat) + '%' : null].filter(Boolean).join(' · ') : [bat != null ? t('battery') + ' ' + Math.round(bat) + '%' : null, ...(v.facts || [])].filter(Boolean).join(' · ')}</span></div>
          <span style="position:relative;width:56px;height:56px;flex:none" aria-hidden="true"><span style="position:absolute;inset:0;border-radius:50%;border:1px dashed var(--line2)"></span>
            <span class="orbit" style=${'position:absolute;inset:0;' + (cleaning ? 'animation:orbit 5s linear infinite' : 'opacity:0')}><span style="position:absolute;left:50%;top:-6px;margin-left:-9px;width:18px;height:18px;border-radius:50%;background:var(--card);border:1.5px solid var(--accent)"></span></span>
            <span style=${`position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:${cleaning ? 'var(--accent)' : '#7EE0A8'}`}></span></span></div>
        ${vr && active ? html`<div class="vrooms" role="list" aria-label=${t('roomOf', { a: vr.cur + 1, b: vr.list.length })}>${vr.list.map((r, i) => html`<span role="listitem" class=${'vr' + (i < vr.cur ? ' done' : i === vr.cur ? ' now' : '')}><i></i><span class="txt">${r}</span></span>`)}</div>` : nothing}
        <div class="wrapRow">
          ${cleaning ? html`<button class="btn" @click=${() => this._call('vacuum', 'pause', { entity_id: v.id })}>${ic('pause', 'i s f')}${t('stop')}</button>` : html`<button class="btn pri" @click=${() => this._call('vacuum', 'start', { entity_id: v.id })}>${ic('play', 'i s f')}${t('start')}</button>`}
          ${st !== 'docked' ? html`<button class="btn" @click=${() => this._call('vacuum', 'return_to_base', { entity_id: v.id })}>${ic('home', 'i s')}${t('dock')}</button>` : nothing}
          ${v.map ? html`<button class="btn" @click=${() => this._moreInfo(v.map.id)}>${ic('mapI', 'i s')}${t('robotMap')}</button>` : nothing}</div>
        ${false ? html`<button class="robmap" aria-label=${t('robotMap')} @click=${() => this._moreInfo(v.map.id)}><img src=${this._url(v.map.attrs.entity_picture) + (v.map.attrs.entity_picture.includes('?') ? '&' : '?') + 't=' + Math.floor(now.getTime() / 15000)} alt="" loading="lazy"></button>` : nothing}</article>`);
    }
    for (const c of m.covers.filter((x) => x.moving).slice(0, 2)) {
      const closedPart = (100 - c.pos) / 2;
      cards.push(html`<article class="act rise" style="border-color:rgba(201,216,245,.25)"><div style="display:flex;flex-direction:column;gap:3px">
        <span class="tag" style="color:#C9D8F5">${c.state === 'opening' ? t('opening') : t('closing')}</span><span class="ttl">${c.name}</span><span class="muted" style="font-size:13px">${c.areaName} · ${Math.round(c.pos)}%</span></div>
        <div aria-hidden="true" style="position:relative;height:64px;border-radius:12px;overflow:hidden;background:linear-gradient(180deg,#1B2233 0%,#121620 100%);border:1px solid #222838">
          <span style=${`position:absolute;top:0;bottom:0;left:0;width:${closedPart}%;background:repeating-linear-gradient(90deg,#E7DCC6 0 6px,#CFC3AA 6px 9px);transition:width 1s linear`}></span>
          <span style=${`position:absolute;top:0;bottom:0;right:0;width:${closedPart}%;background:repeating-linear-gradient(90deg,#E7DCC6 0 6px,#CFC3AA 6px 9px);transition:width 1s linear`}></span></div></article>`);
    }
    if (!cards.length) return nothing;
    return html`<section class="sec" aria-label=${t('now')}><div class="row" style="padding:0 4px;gap:10px"><span class="pulse" style="width:7px;height:7px;border-radius:50%;background:#7EE0A8"></span><h2 class="eyebrow" style="margin:0;font-weight:400">${t('now')}</h2></div><div class="live">${cards}</div></section>`;
  }

  // ── filters ──────────────────────────────────────────────────────────────
  filters({ m, t }, show) {
    const ui = this._ui;
    const roomsOrd = this._sorted('rooms', m.areas.map((a) => ({ ...a, name: a.name })));
    const chips = [{ id: 'all', name: t('allHome') }, ...roomsOrd];
    const doms = [['all', t('all')], ['lights', t('lightsShort')], ['climate', t('climateShort')], ['plugs', t('plugsShort')], ['energy', t('energyShort')], ['covers', t('coversShort')], ['openings', t('openingsShort')], ['security', t('securityShort')], ['tv', t('tvs')], ['music', t('musicShort')]].filter(([k]) => k === 'all' || show[k]);
    const inR = (list) => list.filter((d) => ui.room === 'all' || d.area === ui.room).length;
    const counts = { lights: inR(m.lights), climate: inR(m.climate), plugs: inR(m.plugs), energy: inR(m.metered), covers: inR(m.covers), openings: inR(m.openings), security: inR(m.cams) + inR(m.locks) + m.alarms.length, tv: inR(m.tvs), music: inR(m.speakers) };
    return html`<div class="filters">
      <div class="scroller" role="group" aria-label=${t('room')}>${chips.map((c) => {
        const lit = c.id === 'all' ? m.lights.some((l) => l.on) : m.lights.some((l) => l.on && l.area === c.id);
        const th = m.climate.find((x) => x.area === c.id);
        const meta = c.id === 'all' ? String(m.total) : th?.cur != null ? th.cur.toFixed(1).replace('.', ',') + '°' : String((m.byArea[c.id] || []).length);
        return html`<button class="rc" aria-pressed=${ui.room === c.id ? 'true' : 'false'} @click=${() => this._set({ room: c.id })}><i style=${lit ? 'background:var(--accent);box-shadow:0 0 8px var(--accent)' : 'background:var(--line2)'}></i>${c.name}<small>${meta}</small></button>`;
      })}</div>
      <div class="scroller" role="group" aria-label=${t('devices')}>${doms.map(([k, n]) => html`<button class="dc" aria-pressed=${ui.domain === k ? 'true' : 'false'} style=${ui.domain === k ? `border-color:var(--accent);background:${rgba(this._theme().ha ? this._accentRgb : hexRgb(this._theme().accent), 0.12)}` : ''} @click=${() => this._set({ domain: k })}>${n} <span class="mono" style="opacity:.7">${k === 'all' ? '' : counts[k]}</span></button>`)}</div>
    </div>`;
  }
  // Owner 2026-11-18 ("quando eu toco nao abre nada"): the room was filtered far below the map, out of sight —
  // now tapping a room in the map also brings its devices into view.
  async _pickRoom(id) {
    this._set({ room: id });
    if (id === 'all') return;
    await this.updateComplete;
    // Land just below the sticky room/device chips so the room name is never hidden under them.
    const head = this.renderRoot.querySelector('.roomhead'), bar = this.renderRoot.querySelector('.filters'); if (!head) return;
    const hb = head.getBoundingClientRect(), top = (bar?.getBoundingClientRect().height || 0) + 6;
    let sc = null; for (let n = this.parentNode || this.host; n && !sc; n = n.parentNode || n.host) if (n instanceof Element && n.scrollHeight > n.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) sc = n;
    (sc || window).scrollBy({ top: hb.top - top - 12, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  roomHead({ m, t }) {
    const a = m.areas.find((x) => x.id === this._ui.room); if (!a) return nothing;
    const ls = m.lights.filter((l) => l.area === a.id), th = m.climate.find((c) => c.area === a.id), op = m.openings.filter((o) => o.area === a.id);
    const sum = [ls.length ? t('ofOn', { a: ls.filter((l) => l.on).length, b: ls.length }) : null, th?.cur != null ? th.cur.toFixed(1).replace('.', ',') + '°' : null, op.length ? (op.some((o) => o.open) ? t('openHead', { a: op.filter((o) => o.open).length, b: op.length }) : t('allClosed')) : null].filter(Boolean).join(' · ');
    return html`<div class="rise wrapRow sp roomhead" style="align-items:flex-end;padding:4px;scroll-margin-top:72px"><div style="display:flex;flex-direction:column;gap:6px;min-width:0"><span class="eyebrow" style="color:var(--accent)">${t('room')}</span>
      <h2 class="txt" style="margin:0;font-size:clamp(36px,5vw,64px);font-weight:200;letter-spacing:-.05em;line-height:.95">${a.name}</h2><span class="muted txt" style="font-size:14px">${sum}</span></div>
      <button class="btn" @click=${() => this._set({ room: 'all' })}>${t('seeAll')}</button></div>`;
  }

  // ── lights ───────────────────────────────────────────────────────────────
  sLights({ m, t }) {
    const list = this._visible('lights', this._sorted('lights', m.lights)), ids = list.map((x) => x.id);
    if (!list.length) return nothing;
    const onN = list.filter((l) => l.on).length;
    const head = this.secHead('lights', t('lights'), t('ofOn', { a: onN, b: list.length }), onN ? html`<button class="btn sm" @click=${() => this._call('light', 'turn_off', { entity_id: list.filter((l) => l.on).map((l) => l.id) })}>${t('allOff')}</button>` : null, t);
    if (!this._ui.edit) return html`<section class="sec">${head}${this.roomGroups('light', list, m, t, {
      icon: 'bulb', lit: (l) => l.on,
      dotStyle: (on) => { if (!on.length) return ''; const top = on.slice().sort((x, y) => y.b - x.b)[0], rgb = top.rgb.join(','); return `background:rgb(${rgb});color:#1A1408;box-shadow:0 0 18px ${rgba(rgb, 0.45)}`; },
      metaFn: (items, on) => html`${on.length}/${items.length}`,
      rowFn: (l) => {
        const rgb = l.rgb.join(','), b = this._local[l.id] ?? l.b;
        return html`<div class=${'prow lrow' + (l.on ? ' on' : '') + (l.unavailable ? ' na' : '')} style=${l.on ? `--lc:${rgb}` : ''}>
          <button class="lname" aria-label=${l.name + ' · ' + t('details')} @click=${() => this._moreInfo(l.id)}><i class="lbulb" aria-hidden="true"></i><span class="pnm txt">${l.name}</span></button>
          <span class="pst">${l.unavailable ? t('notAvailable') : l.on ? (l.dimmable ? b + '%' : t('on')) : t('off')}</span>
          <button class="switch" role="switch" aria-checked=${l.on ? 'true' : 'false'} ?disabled=${l.unavailable} aria-label=${l.name + ' · ' + l.areaName} @click=${() => this._call('light', 'toggle', { entity_id: l.id })}><span><i></i></span></button>
          ${l.on && l.dimmable && !l.unavailable ? html`<input class="rng lrng" type="range" min="1" max="100" .value=${String(b)} aria-label=${t('brightness') + ' · ' + l.name}
            style=${`background:linear-gradient(90deg, rgb(${rgb}) ${b}%, var(--line2) ${b}%)`}
            @input=${(e) => { this._local[l.id] = Number(e.target.value); this.requestUpdate(); }}
            @change=${(e) => { const v = Number(e.target.value); this._call('light', 'turn_on', { entity_id: l.id, brightness_pct: v }).finally(() => { setTimeout(() => { delete this._local[l.id]; this.requestUpdate(); }, 1500); }); }}>` : nothing}
        </div>`;
      } })}</section>`;
    return html`<section class="sec">${head}
      <div class="grid">${repeat(list, (l) => l.id, (l) => {
        const rgb = l.rgb.join(','), k = l.on ? l.b / 100 : 0, ta = this.tileAttrs('lights', l, ids);
        const loc = this._local[l.id];
        const b = loc != null ? loc : l.b;
        return html`<div class=${'tile' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end} style=${l.on ? `border-color:${rgba(rgb, 0.18 + 0.25 * k)}` : ''}>
          <span class="orb" style=${`background:radial-gradient(circle, ${rgba(rgb, 0.55)} 0%, ${rgba(rgb, 0)} 65%);opacity:${l.on ? (0.25 + 0.75 * k).toFixed(2) : 0}`}></span>
          ${this.editBar('lights', l, ids, t)}
          <button class="tbtn" aria-pressed=${l.on ? 'true' : 'false'} ?disabled=${l.unavailable} aria-label=${l.name + ' · ' + l.areaName} @click=${() => this._call('light', 'toggle', { entity_id: l.id })}>
            <span class="ic" style=${l.on ? `background:rgb(${rgb});color:#1A1408;box-shadow:0 0 24px ${rgba(rgb, 0.1 + 0.45 * k)}` : ''}>${ic('bulb')}</span>
            <span class="nm"><b>${l.name}</b><span>${l.areaName ? l.areaName + ' · ' : ''}${l.unavailable ? t('notAvailable') : l.on ? (l.dimmable ? b + '%' : t('on')) : t('off')}</span></span></button>
          ${l.dimmable && !l.unavailable ? html`<input class="rng" type="range" min="1" max="100" .value=${String(b)} aria-label=${t('brightness') + ' · ' + l.name}
            style=${`background:linear-gradient(90deg, ${l.on ? `rgb(${rgb})` : 'var(--dim)'} ${b}%, var(--line2) ${b}%)`}
            @input=${(e) => { this._local[l.id] = Number(e.target.value); this.requestUpdate(); }}
            @change=${(e) => { const v = Number(e.target.value); this._call('light', 'turn_on', { entity_id: l.id, brightness_pct: v }).finally(() => { setTimeout(() => { delete this._local[l.id]; this.requestUpdate(); }, 1500); }); }}>` : nothing}
          ${l.ct && !l.unavailable ? html`<div class="cts" role="group" aria-label=${t('warm') + ' / ' + t('cool')}>${[['warm', 2700], ['neutral', 4000], ['cool', 6000]].map(([n, kv]) => { const kk = Math.max(l.minK, Math.min(l.maxK, kv)); const act = l.on && l.kelvin && Math.abs(l.kelvin - kk) < 400; return html`<button aria-pressed=${act ? 'true' : 'false'} style=${act ? 'border-color:var(--accent);color:var(--fg)' : ''} @click=${() => this._call('light', 'turn_on', { entity_id: l.id, color_temp_kelvin: kk })}><i style=${`background:rgb(${n === 'warm' ? '245,190,110' : n === 'neutral' ? '255,234,204' : '196,218,255'})`}></i>${t(n)}</button>`; })}</div>` : nothing}
        </div>`;
      })}</div></section>`;
  }

  // ── climate ──────────────────────────────────────────────────────────────
  sClimate({ m, t }) {
    const list = this._visible('climate', this._sorted('climate', m.climate)), ids = list.map((x) => x.id);
    if (!list.length) return nothing;
    const heatN = list.filter((c) => c.action === 'heating').length;
    return html`<section class="sec">${this.secHead('climate', t('climate'), t('thermostats', { n: list.length }) + ' · ' + (heatN ? t('heatingN', { n: heatN }) : t('allAtTarget')), null, t)}
      <div class="grid w">${repeat(list, (c) => c.id, (c) => {
        const target = this._pendingTarget[c.id] ?? c.target, heating = c.action === 'heating', off = c.mode === 'off', ta = this.tileAttrs('climate', c, ids);
        const span = Math.max(1, c.max - c.min), fr = target != null ? Math.max(0, Math.min(1, (target - c.min) / span)) : 0, fc = c.cur != null ? Math.max(0, Math.min(1, (c.cur - c.min) / span)) : 0;
        const col = off ? '120,120,130' : heating ? '255,150,90' : '143,184,255', dg = (270 * fr).toFixed(1), dc = (270 * fc).toFixed(1);
        const setT = (v) => { const nv = Math.round(Math.max(c.min, Math.min(c.max, v)) / c.step) * c.step; this._pendingTarget[c.id] = nv; this.requestUpdate(); clearTimeout(this['_tt' + c.id]); this['_tt' + c.id] = setTimeout(() => { this._call('climate', 'set_temperature', { entity_id: c.id, temperature: nv }).finally(() => { setTimeout(() => { delete this._pendingTarget[c.id]; this.requestUpdate(); }, 2500); }); }, 700); };
        return html`<div class=${'tile' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end} style=${heating ? 'border-color:rgba(255,150,90,.28)' : ''}>
          <span class="orb" style=${`left:auto;top:auto;right:-70px;bottom:-110px;width:200px;height:200px;background:radial-gradient(circle, rgba(${col},.4) 0%, rgba(${col},0) 65%);opacity:${heating ? 1 : 0.35}`}></span>
          ${this.editBar('climate', c, ids, t)}
          <div class="row sp" style="position:relative;align-items:flex-start"><span class="nm"><b>${c.areaName || c.name}</b><span>${c.name}${c.hum != null ? ' · ' + Math.round(c.hum) + '%' : ''}</span></span>
            <span class="badge" style=${heating ? 'background:rgba(255,150,90,.14);color:#FFB48A;border-color:transparent' : off ? '' : 'background:rgba(143,184,255,.12);color:#B5CCFF;border-color:transparent'}>${heating ? ic('flame', 'i s f') : nothing}${off ? t('offMode') : heating ? t('heating') : t('atTarget')}</span></div>
          <div class="row sp" style="position:relative;gap:10px">
            <div class="dial"><div class="t" style=${`background:repeating-conic-gradient(from 225deg, transparent 0deg 3deg, var(--card) 3deg 6deg), conic-gradient(from 225deg, rgb(${col}) 0deg ${dc}deg, rgba(${col},.35) ${dc}deg ${dg}deg, var(--line2) ${dg}deg 270deg, transparent 270deg 360deg)`}></div>
              <div class="c"><b>${c.cur != null ? c.cur.toFixed(1).replace('.', ',') + '°' : '—'}</b><span class="mono muted" style="font-size:9px;letter-spacing:.1em">${t('nowShort')}</span></div></div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
              <button class="ib" ?disabled=${target == null || c.unavailable} aria-label=${t('raise') + ' · ' + (c.areaName || c.name)} @click=${() => setT((target ?? c.cur ?? 20) + c.step)}>${ic('up', 'i s')}</button>
              <span aria-live="polite" style=${`font-size:18px;letter-spacing:-.02em;${heating ? 'color:#FFB48A' : ''}`}>${target != null ? Number(target).toFixed(1).replace('.', ',') + '°' : '—'}</span>
              <button class="ib" ?disabled=${target == null || c.unavailable} aria-label=${t('lower') + ' · ' + (c.areaName || c.name)} @click=${() => setT((target ?? c.cur ?? 20) - c.step)}>${ic('down', 'i s')}</button></div></div></div>`;
      })}</div></section>`;
  }

  // ── plugs ────────────────────────────────────────────────────────────────
  // Room groups (owner 2026-11-16: long lists on the phone). Folded on phones, open on wide screens, open when one
  // room is filtered. rowFn renders one device; metaFn the right side of the room header.
  roomGroups(key, list, m, t, { icon, lit, metaFn, rowFn, dotStyle }) {
    const groups = [];
    for (const d of list) { let g = groups.find((x) => x.area === (d.area || '')); if (!g) groups.push(g = { area: d.area || '', name: d.areaName || t('noArea'), items: [] }); g.items.push(d); }
    const order = new Map(m.areas.map((a, i) => [a.id, i]));
    groups.sort((x, y) => (order.get(x.area) ?? 999) - (order.get(y.area) ?? 999));
    const st = this._ui[key + 'Open'] || {}, single = groups.length === 1 || this._ui.room !== 'all';
    return html`<div class="pgrid">${groups.map((g) => {
      const isOpen = single || (st[g.area] ?? (this.clientWidth >= 900)), on = g.items.filter(lit);
      return html`<div class=${'pgrp' + (isOpen ? ' open' : '') + (on.length ? ' lit' : '')}>
        <button class="phead" aria-expanded=${isOpen ? 'true' : 'false'} ?disabled=${single} @click=${() => this._set({ [key + 'Open']: { ...st, [g.area]: !isOpen } })}>
          <span class="pdot" aria-hidden="true" style=${dotStyle ? dotStyle(on) : ''}>${ic(icon, 'i s')}</span>
          <span class="pname txt">${g.name}</span>
          <span class="pmeta">${metaFn(g.items, on)}</span>
          ${single ? nothing : html`<span class="pchev" aria-hidden="true">${ic('down', 'i s')}</span>`}
        </button>
        ${isOpen ? html`<div class="plist">${repeat(g.items, (d) => d.id, rowFn)}</div>` : nothing}
      </div>`;
    })}</div>`;
  }
  sPlugs({ m, t }) {
    const list = this._visible('plugs', this._sorted('plugs', m.plugs)), ids = list.map((x) => x.id);
    if (!list.length) return nothing;
    const onN = list.filter((p) => p.on).length, prot = list.filter((p) => p.locked).length;
    const head = this.secHead('plugs', t('plugs'), t('plugsHead', { a: onN, b: list.length }), prot ? html`<span class="row muted" style="font-size:12px;gap:6px">${ic('lock', 'i s')}${t('protectedHint')}</span>` : null, t);
    // Owner 2026-11-16 ("no celular a lista está infinita"): outside edit mode, compact lists per room.
    if (!this._ui.edit) return html`<section class="sec">${head}${this.roomGroups('plug', list, m, t, {
      icon: 'plug', lit: (p) => p.on,
      metaFn: (items, on) => { const w = Math.round(on.reduce((s2, p) => s2 + (p.w || 0), 0)); return html`${w ? html`<b>${w} W</b> · ` : nothing}${on.length}/${items.length}`; },
      rowFn: (p) => html`<div class=${'prow' + (p.on ? ' on' : '') + (p.unavailable ? ' na' : '')}>
          <span class="pnm txt">${p.name}</span>
          <span class="pst">${p.unavailable ? t('notAvailable') : p.on ? (p.w != null ? p.w + ' W' : t('plugOn')) : t('plugOff')}</span>
          ${p.locked && p.on ? html`<span class="plock" title=${t('protectedTitle')} aria-label=${t('protected')}>${ic('lock', 'i s')}</span>`
            : html`<button class="switch" role="switch" aria-checked=${p.on ? 'true' : 'false'} ?disabled=${p.unavailable} aria-label=${p.name + ' · ' + p.areaName} @click=${() => this._call('switch', p.on ? 'turn_off' : 'turn_on', { entity_id: p.id })}><span><i></i></span></button>`}
        </div>` })}</section>`;
    return html`<section class="sec">${head}
      <div class="grid">${repeat(list, (p) => p.id, (p) => {
        const ta = this.tileAttrs('plugs', p, ids);
        return html`<div class=${'tile' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end} style=${p.locked ? 'border-style:dashed;border-color:var(--line2)' : p.on ? `border-color:${rgba(this._theme().ha ? this._accentRgb : hexRgb(this._theme().accent), 0.28)}` : ''}>
          ${this.editBar('plugs', p, ids, t)}
          <div class="row sp" style="align-items:flex-start;gap:10px">
            <span class="ic" style=${p.on ? 'background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)' : ''}>${ic('plug')}</span>
            ${p.locked && p.on ? html`<span class="badge" title=${t('protectedTitle')}>${ic('lock', 'i s')}${t('protected')}</span>`
              : html`<button class="switch" role="switch" aria-checked=${p.on ? 'true' : 'false'} ?disabled=${p.unavailable} aria-label=${p.name + ' · ' + p.areaName} @click=${() => this._call('switch', p.on ? 'turn_off' : 'turn_on', { entity_id: p.id })}><span><i></i></span></button>`}</div>
          <div class="row sp" style="align-items:flex-end;gap:8px"><span class="nm"><b>${p.name}</b><span>${p.areaName}</span></span>
            <span style=${`font-size:18px;font-weight:300;letter-spacing:-.03em;white-space:nowrap;color:${p.on ? 'var(--fg)' : 'var(--dim)'}`}>${p.unavailable ? t('notAvailable') : p.on ? (p.w != null ? p.w + ' W' : t('plugOn')) : t('plugOff')}</span></div></div>`;
      })}</div></section>`;
  }

  // ── energy ───────────────────────────────────────────────────────────────
  sEnergy({ m, t, aRgb, lang }) {
    const ui = this._ui, inRoom = (d) => ui.room === 'all' || d.area === ui.room;
    const plugs = m.metered.filter(inRoom), total = Math.round(plugs.reduce((s, p) => s + (p.on && p.w ? p.w : 0), 0));
    if (!plugs.length && m.solarW == null) return nothing;
    const hasSolar = m.solarW != null, solar = m.solarW || 0, house = ui.room === 'all' ? m.plugW : total;
    const gridNet = m.gridW != null ? m.gridW : house - solar;
    const maxW = Math.max(1, ...plugs.map((p) => p.w || 0));
    const flow = (on, rev, dur) => on ? `opacity:1;animation:flow ${dur}s linear infinite${rev ? ' reverse' : ''}` : 'opacity:0';
    const areaName = ui.room === 'all' ? '' : (m.areas.find((a) => a.id === ui.room)?.name || '');
    const byRoom = m.areas.map((a) => ({ n: a.name, w: Math.round(m.metered.filter((p) => p.area === a.id && p.on).reduce((s, p) => s + (p.w || 0), 0)) })).filter((x) => m.metered.some((p) => p.area && m.areas.find((a) => a.name === x.n)?.id === p.area));
    return html`<section class="sec">${this.secHead('energy', t('energy'), t('plugsMetered', { n: plugs.length }), html`<span class="tag row" style="gap:6px;color:#7EE0A8"><span class="pulse" style="width:6px;height:6px;border-radius:50%;background:#7EE0A8"></span>${t('live')}</span>`, t)}
      <div class="wrapRow" style="align-items:stretch;gap:12px">
        <div class="tile" style="flex:3 1 440px;padding:22px;gap:16px;border-radius:24px">
          <div class="row sp" style="align-items:flex-start;gap:12px;flex-wrap:wrap"><span style="display:flex;flex-direction:column;gap:4px"><span class="eyebrow" style="font-size:10px">${t('nowW')}</span>
            <span class="row" style="align-items:baseline;gap:6px"><span style="font-size:56px;font-weight:200;letter-spacing:-.06em;line-height:.9">${house}</span><span class="muted" style="font-size:16px">W</span></span>
            <span class="muted txt" style="font-size:12px">${areaName ? t('sumPlugsRoom', { r: areaName }) : t('sumPlugs')}</span></span>
            ${hasSolar ? nothing : html`<span class="badge" style="border-style:dashed">${svg`<svg class="i s" viewBox="0 0 24 24" aria-hidden="true" style="color:#F5D08A"><path d=${P.sun}></path></svg>`}${t('solarReady')}</span>`}</div>
          <div class="flowbox" role="img" aria-label=${hasSolar ? `${t('solar')} ${solar} W · ${t('grid')} ${gridNet} W · ${t('home')} ${house} W` : `${t('grid')} → ${t('home')} ${house} W`}>
            ${svg`<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0" aria-hidden="true">
              <path d="M16 20 C 45 20, 50 50, 80 50" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="2" vector-effect="non-scaling-stroke"></path>
              <path d="M16 20 C 45 20, 50 50, 80 50" fill="none" stroke="#F5D08A" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round" vector-effect="non-scaling-stroke" style=${flow(solar > 0, false, 1.1)}></path>
              <path d="M16 80 C 45 80, 50 50, 80 50" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="2" vector-effect="non-scaling-stroke"></path>
              <path d="M16 80 C 45 80, 50 50, 80 50" fill="none" stroke="#8FB8FF" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round" vector-effect="non-scaling-stroke" style=${flow(gridNet !== 0, gridNet < 0, 2.2)}></path>
              <path d="M48 92 C 60 92, 66 60, 80 50" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="2" vector-effect="non-scaling-stroke"></path></svg>`}
            <div class="node" style=${`left:16%;top:20%;opacity:${hasSolar ? 1 : 0.4}`}><span class="o" style=${hasSolar ? 'background:#1E1A12;border:1px solid #4A3C22;color:#F5D08A;box-shadow:0 0 32px -6px rgba(245,208,138,.5)' : 'border:1px dashed var(--dim);color:#F5D08A'}>${ic('sun')}</span><span style="font-size:13px">${hasSolar ? solar + ' W' : t('soon')}</span><span class="tag muted" style="font-size:9px">${t('solar')}</span></div>
            <div class="node" style="left:16%;top:80%"><span class="o" style="background:#121826;border:1px solid #2A3A5A;color:#8FB8FF">${ic('grid')}</span><span style="font-size:13px">${Math.abs(gridNet)} W</span><span class="tag muted" style="font-size:9px">${gridNet < 0 ? t('gridSelling') : t('grid')}</span></div>
            <div class="node" style=${`left:48%;top:92%;flex-direction:row;opacity:${hasSolar && m.batterySoc != null ? 1 : 0.4}`}><span class="o" style=${'width:44px;height:44px;color:#7EE0A8;' + (hasSolar && m.batterySoc != null ? 'background:#12201A;border:1px solid #2B5A40' : 'border:1px dashed var(--dim)')}>${ic('batt', 'i s')}</span><span style="display:flex;flex-direction:column;text-align:left"><span style="font-size:13px">${hasSolar && m.batterySoc != null ? Math.round(m.batterySoc) + '%' : t('soon')}</span><span class="tag muted" style="font-size:9px">${t('batteryS')}</span></span></div>
            <div class="node" style="left:80%;top:50%"><span class="o" style=${`width:92px;height:92px;background:var(--raise);border:1px solid var(--line2);flex-direction:column;gap:2px;box-shadow:0 0 60px -10px ${rgba(aRgb, Math.min(0.55, 0.12 + house / 3000).toFixed(2))}`}>${ic('home')}<b style="font-size:15px;font-weight:500">${house} W</b></span><span class="tag muted" style="font-size:10px">${t('home')}</span></div>
          </div>
          ${(() => {
            const nf = (v, d = 1) => v == null ? '—' : Number(v).toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d });
            const today = m.energyToday?.v, cost = m.costToday?.v ?? (today != null && m.price?.v != null ? today * m.price.v : null), cur = m.costToday?.unit || m.price?.unit || '€';
            return html`<div class="ekv">
              <div><span class="tag muted">${t('todayE')}</span><b>${nf(today)} <small>${m.energyToday?.unit || 'kWh'}</small></b></div>
              <div><span class="tag muted">${t('costToday')}</span><b>${nf(cost, 2)} <small>${cur}</small></b></div>
              <div><span class="tag muted">${t('thisMonth')}</span><b>${nf(m.energyMonth?.v, 0)} <small>${m.energyMonth?.unit || 'kWh'}</small></b></div>
              <div class=${hasSolar ? '' : 'soon'}><span class="tag muted">${t('solarToday')}</span><b>${hasSolar ? '—' : t('soon')}</b></div>
              <div class=${hasSolar ? '' : 'soon'}><span class="tag muted">${t('selfUse')}</span><b>${hasSolar ? '—' : t('soon')}</b></div>
            </div>`;
          })()}
        </div>
        <div class="tile" style="flex:2 1 300px;padding:22px;border-radius:24px">
          <span class="row sp"><span class="eyebrow" style="font-size:10px">${t('whoNow')}</span><span class="dim" style="font-size:12px">${t('byPlugs')}</span></span>
          ${plugs.slice().sort((a, b) => (b.on ? b.w || 0 : 0) - (a.on ? a.w || 0 : 0)).slice(0, 8).map((p) => { const w = p.on ? p.w || 0 : 0; return html`<div style="display:flex;flex-direction:column;gap:6px">
            <span class="row sp" style="gap:8px;font-size:13px;align-items:flex-start"><span class="txt">${p.name} <span class="dim" style="font-size:11px">${p.areaName}</span></span><span style="white-space:nowrap">${w} W <span class="dim">· ${total ? Math.round(100 * w / total) : 0}%</span></span></span>
            <span class="bar" style="height:4px"><i style=${`width:${Math.round(100 * w / maxW)}%;background:${p.locked ? '#8FB8FF' : 'var(--accent)'}`}></i></span></div>`; })}
          ${ui.room === 'all' && byRoom.length ? html`<span class="eyebrow" style="font-size:10px;padding-top:10px;border-top:1px solid var(--line)">${t('byRoom')}</span>
            <div class="kv" style="grid-template-columns:repeat(auto-fit,minmax(96px,1fr))">${byRoom.map((r) => html`<div><span class="muted txt" style="font-size:11px">${r.n}</span><b style="font-size:15px">${r.w} W</b></div>`)}</div>` : nothing}
        </div></div></section>`;
  }

  // ── covers ───────────────────────────────────────────────────────────────
  sCovers({ m, t }) {
    const list = this._visible('covers', this._sorted('covers', m.covers)), ids = list.map((x) => x.id);
    if (!list.length) return nothing;
    const openN = list.filter((c) => c.pos > 0).length;
    return html`<section class="sec">${this.secHead('covers', t('covers'), t('coversHead', { a: openN, b: list.length }), html`<button class="btn sm" @click=${() => this._call('cover', 'open_cover', { entity_id: ids })}>${t('openAll')}</button><button class="btn sm" @click=${() => this._call('cover', 'close_cover', { entity_id: ids })}>${t('closeAll')}</button>`, t)}
      <div class="grid w">${repeat(list, (c) => c.id, (c) => {
        const ta = this.tileAttrs('covers', c, ids), loc = this._local[c.id], pos = loc != null ? loc : c.pos;
        const st = c.moving ? (c.state === 'opening' ? t('opening') : t('closing')) : c.pos === 0 ? t('closed') : c.pos === 100 ? t('opened') : t('partial');
        return html`<div class=${'tile' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end}>
          ${this.editBar('covers', c, ids, t)}
          <div class="row" style="align-items:stretch;gap:14px"><div class="blind" aria-hidden="true"><i style=${`height:${100 - c.pos}%;background:${c.curtain ? 'repeating-linear-gradient(90deg,#E7DCC6 0 5px,#CFC3AA 5px 7px)' : 'repeating-linear-gradient(180deg,#D9D3C7 0 4px,#A8A196 4px 5px)'}`}></i></div>
            <div class="grow" style="display:flex;flex-direction:column;gap:8px">
              <span class="row sp" style="align-items:baseline;gap:8px"><b class="txt" style="font-size:14px;font-weight:500">${c.name}</b><span style=${`font-size:16px;font-weight:300;${c.moving ? 'color:#C9D8F5' : ''}`}>${Math.round(c.pos)}%</span></span>
              <span class="txt" style=${`font-size:12px;color:${c.moving ? '#C9D8F5' : 'var(--mut)'}`}>${c.areaName} · ${st}</span>
              ${c.hasPos ? html`<input class="rng" type="range" min="0" max="100" step="5" .value=${String(pos)} aria-label=${c.name} style=${`background:linear-gradient(90deg,#C9D8F5 ${pos}%, var(--line2) ${pos}%)`}
                @input=${(e) => { this._local[c.id] = Number(e.target.value); this.requestUpdate(); }}
                @change=${(e) => { const v = Number(e.target.value); this._call('cover', 'set_cover_position', { entity_id: c.id, position: v }).finally(() => setTimeout(() => { delete this._local[c.id]; this.requestUpdate(); }, 1500)); }}>`
              : html`<span class="wrapRow" style="gap:6px"><button class="btn sm" @click=${() => this._call('cover', 'open_cover', { entity_id: c.id })}>${ic('up', 'i s')}</button><button class="btn sm" @click=${() => this._call('cover', 'stop_cover', { entity_id: c.id })}>■</button><button class="btn sm" @click=${() => this._call('cover', 'close_cover', { entity_id: c.id })}>${ic('down', 'i s')}</button></span>`}
            </div></div></div>`;
      })}</div></section>`;
  }

  // ── doors & windows ──────────────────────────────────────────────────────
  sOpenings({ m, t, now }) {
    const list = this._visible('openings', this._sorted('openings', m.openings)), ids = list.map((x) => x.id);
    if (!list.length) return nothing;
    const openN = list.filter((o) => o.open).length;
    const ago = (iso) => { const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60000)); return mins < 60 ? mins + ' ' + t('min') : mins < 1440 ? Math.round(mins / 60) + ' h' : Math.round(mins / 1440) + ' d'; };
    return html`<section class="sec">${this.secHead('openings', t('openings'), openN ? t('openHead', { a: openN, b: list.length }) : t('allClosed'), null, t)}
      <div class="grid w">${repeat(list, (o) => o.id, (o) => {
        const ta = this.tileAttrs('openings', o, ids);
        return html`<div class=${'tile' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end} style=${(o.open ? 'border-color:var(--accent);' : '') + 'padding:14px 16px'}>
          ${this.editBar('openings', o, ids, t)}
          <div class="row" style="gap:12px"><span class="ic" style=${'width:36px;height:36px;' + (o.open ? 'background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)' : '')}>${ic(o.door ? 'door' : 'win', 'i s')}</span>
            <span class="nm grow"><b>${o.name}</b><span>${o.areaName}</span></span>
            <span class="pill" style=${o.open ? 'background:var(--accent);color:var(--on-accent);border-color:var(--accent)' : ''}>${o.unavailable ? t('notAvailable') : o.open ? t('open') + ' · ' + ago(o.st.last_changed) : t('shut')}</span></div></div>`;
      })}</div></section>`;
  }

  // ── security & cameras ───────────────────────────────────────────────────
  sSecurity({ m, t, now }) {
    const ui = this._ui;
    const cams = this._visible('cams', this._sorted('cams', m.cams)), locks = this._visible('locks', this._sorted('locks', m.locks));
    const camIds = cams.map((x) => x.id), lockIds = locks.map((x) => x.id);
    const alarm = m.alarms[0];
    if (!cams.length && !locks.length) return nothing; // the alarm lives in the hero menu (owner 2026-11-18)
    const st = alarm?.state;
    const stLabel = !alarm ? '' : st === 'disarmed' ? t('disarmed') : st === 'armed_home' ? t('armHome') : st === 'armed_away' ? t('armAway') : st === 'armed_night' ? t('armNight') : st === 'triggered' ? t('triggered') : st;
    const modes = alarm ? [['disarmed', 'alarm_disarm', t('disarmed')], ['armed_home', 'alarm_arm_home', t('armHome')], ['armed_away', 'alarm_arm_away', t('armAway')], ['armed_night', 'alarm_arm_night', t('armNight')]] : [];
    const refresh = Math.floor(now.getTime() / 10000);
    return html`<section class="sec">${this.secHead('security', t('security'), alarm ? alarm.name + ' · ' + stLabel : '', null, t)}
      <div class="grid w">
        ${repeat(cams, (c) => c.id, (c) => { const ta = this.tileAttrs('cams', c, camIds), off = c.unavailable || c.state === 'off' || !c.attrs.entity_picture; const src = off ? '' : this._url(c.attrs.entity_picture) + (c.attrs.entity_picture.includes('?') ? '&' : '?') + 't=' + refresh;
          return html`<div class=${'cam' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end}>
            ${!ui.edit ? html`<button class="camhit" aria-label=${t('openCam') + ' · ' + c.name} @click=${() => this._moreInfo(c.id)}></button>` : nothing}
            ${off ? html`<span style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--mut);font-size:12px">${ic('camOff')}${t('camOff')}</span>` : html`<img src=${src} alt=${c.name} loading="lazy"><span class="livep"><i class="pulse"></i>${t('live')}</span>`}
            ${this.editBar('cams', c, camIds, t, true)}
            <span class="foot"><span class="txt" style="display:flex;flex-direction:column;gap:1px"><b style="font-size:14px;font-weight:500">${c.name}</b><span style="font-size:11px;opacity:.75">${c.areaName}</span></span><span class="mono" style="font-size:10px;opacity:.75">${now.toLocaleTimeString(this.hass.locale?.language, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></span></div>`; })}
        ${repeat(locks, (l) => l.id, (l) => { const ta = this.tileAttrs('locks', l, lockIds), armed = ui.unlockArm === l.id;
          const tap = () => { if (l.locked) { if (armed) { this._set({ unlockArm: null }); this._call('lock', 'unlock', { entity_id: l.id }); } else { this._set({ unlockArm: l.id }); setTimeout(() => { if (this._ui.unlockArm === l.id) this._set({ unlockArm: null }); }, 4000); } } else this._call('lock', 'lock', { entity_id: l.id }); };
          return html`<div class=${'tile' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end} style=${l.locked ? '' : 'border-color:rgba(255,107,94,.5);background:linear-gradient(rgba(255,107,94,.06),rgba(255,107,94,.06)),var(--card)'}>
            ${this.editBar('locks', l, lockIds, t)}
            <button class="tbtn" style="flex-direction:column;align-items:flex-start;gap:16px" aria-pressed=${l.locked ? 'true' : 'false'} ?disabled=${l.unavailable} @click=${tap}>
              <span style=${l.locked ? 'color:#7EE0A8' : 'color:#FF8A80'}>${svg`<svg class="i" style="width:36px;height:36px;stroke-width:1.3" viewBox="0 0 24 24" aria-hidden="true"><path d=${l.locked ? P.lock : P.unlock}></path></svg>`}</span>
              <span class="nm"><span class="tag muted">${l.name}</span><b style="font-size:24px;font-weight:300;letter-spacing:-.03em">${l.locked ? t('locked') : t('unlocked')}</b><span>${armed ? t('confirmUnlock') : l.locked ? t('tapUnlock') : t('tapLock')}</span></span></button></div>`; })}
      </div></section>`;
  }

  // ── AUREON Music (SpotifyPlus via the original AUREON MusicController) ──
  // Next / previous. Echo speakers and Alexa groups (e.g. a whole-flat group) often restart the same song when Spotify
  // is asked to skip, so when the music plays on an Alexa Media Player speaker the skip goes to that speaker.
  _alexaFor(source) {
    const name = String(source || '').trim().toLowerCase();
    if (!name) return null;
    for (const [id, e] of Object.entries(this.hass.entities || {})) {
      if (!id.startsWith('media_player.') || e.platform !== 'alexa_media') continue;
      const st = this.hass.states[id];
      if (st && st.state !== 'unavailable' && String(st.attributes.friendly_name || '').trim().toLowerCase() === name) return id;
    }
    return null;
  }
  _skip(dir) {
    const mc = this._mc, alexa = this._alexaFor(mc.state?.attributes?.source);
    if (alexa) return this._call('media_player', dir === 'next' ? 'media_next_track' : 'media_previous_track', { entity_id: alexa });
    return mc.command(dir);
  }
  // Rotary volume knob (owner 2026-11-16: "o botão do volume tem como ter um outro?"). Turn it with a finger or the
  // mouse (circular drag), or arrow keys; the speaker only gets the value when the hand lets go.
  // Volume (owner 2026-11-16 picked "between A and E"): − button, slim golden line you can drag, + button, number.
  volLine(vol, t) {
    const set = (v) => { this._local['vol:acct'] = Math.max(0, Math.min(100, Math.round(v))); this.requestUpdate(); };
    const send = (delay = 0) => { clearTimeout(this._knobT); this._knobT = setTimeout(() => { const v = this._local['vol:acct']; if (v == null) return; this._mc.command('volume', v / 100).finally(() => setTimeout(() => { delete this._local['vol:acct']; this.requestUpdate(); }, 1500)); }, delay); };
    const step = (d) => { set((this._local['vol:acct'] ?? vol) + d); send(450); };
    return html`<div class="vline">
      <button class="vpm" aria-label=${t('volume') + ' −'} @click=${() => step(-5)}>${ic('minus', 'i s')}</button>
      <input class="vrange" type="range" min="0" max="100" .value=${String(vol)} aria-label=${t('volume')} style=${`--v:${vol}%`}
        @input=${(e) => set(Number(e.target.value))} @change=${() => send(0)}>
      <button class="vpm" aria-label=${t('volume') + ' +'} @click=${() => step(5)}>${ic('plus', 'i s')}</button>
      <span class="mono vnum">${vol}</span></div>`;
  }
  knob(vol, t) {
    const A0 = -135, SW = 270, ang = A0 + SW * vol / 100;
    const pt = (deg, r) => { const rad = (deg - 90) * Math.PI / 180; return [32 + r * Math.cos(rad), 32 + r * Math.sin(rad)]; };
    const arc = (d0, d1, r) => { const [x0, y0] = pt(d0, r), [x1, y1] = pt(d1, r); return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
    const set = (v) => { this._local['vol:acct'] = Math.max(0, Math.min(100, Math.round(v))); this.requestUpdate(); };
    const send = () => { const v = this._local['vol:acct']; if (v == null) return; this._mc.command('volume', v / 100).finally(() => setTimeout(() => { delete this._local['vol:acct']; this.requestUpdate(); }, 1500)); };
    const fromPointer = (e, el) => { const r = el.getBoundingClientRect(); let d = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI; d = Math.max(A0, Math.min(A0 + SW, d)); return (d - A0) / SW * 100; };
    const down = (e) => { const el = e.currentTarget; el.setPointerCapture?.(e.pointerId); el._drag = true; set(fromPointer(e, el)); e.preventDefault(); };
    const move = (e) => { const el = e.currentTarget; if (el._drag) set(fromPointer(e, el)); };
    const up = (e) => { const el = e.currentTarget; if (!el._drag) return; el._drag = false; send(); };
    const key = (e) => { const d = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5, PageUp: 10, PageDown: -10 }[e.key]; if (d == null) return; e.preventDefault(); set((this._local['vol:acct'] ?? vol) + d); clearTimeout(this._knobT); this._knobT = setTimeout(send, 450); };
    return html`<span class="kwrap"><span class="mono kval">${vol}</span>
      <span class="knob" role="slider" tabindex="0" aria-label=${t('volume')} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${String(vol)}
        @pointerdown=${down} @pointermove=${move} @pointerup=${up} @pointercancel=${up} @keydown=${key}>
        <svg viewBox="0 0 64 64" aria-hidden="true"><path class="ktrack" d=${arc(A0, A0 + SW, 29)}></path>${vol > 0 ? svg`<path class="kval2" d=${arc(A0, Math.max(A0 + 0.5, ang), 29)}></path>` : nothing}</svg>
        <span class="kcap" style=${`transform:rotate(${ang}deg)`}><i></i></span></span></span>`;
  }
  // Televisions (owner 2026-11-18): their own section — power, volume, mute; the name opens the HA dialog.
  sTV({ m, t }) {
    const list = this._visible('tv', this._sorted('tv', m.tvs)), ids = list.map((x) => x.id);
    if (!list.length) return nothing;
    const F = { VOL_SET: 4, MUTE: 8, ON: 128, OFF: 256, VOL_STEP: 1024 };
    return html`<section class="sec">${this.secHead('tv', t('tvs'), t('plugsHead', { a: list.filter((x) => x.state !== 'off' && !x.unavailable && x.state !== 'standby').length, b: list.length }), null, t)}
      <div class="grid sgrid">${repeat(list, (d) => d.id, (d) => {
        const ta = this.tileAttrs('tv', d, ids), on = !d.unavailable && !['off', 'standby'].includes(d.state);
        const muted = !!d.attrs?.is_volume_muted;
        return html`<div class=${'tile mini' + ta.cls + (d.unavailable ? ' ghosted' : '')} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end}>
          ${this.editBar('tv', d, ids, t)}
          <div class="row" style="gap:12px">
            <span class="ic" style=${on ? 'background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)' : ''}>${ic('tv', 'i')}</span>
            <button class="lname grow" aria-label=${d.name + ' · ' + t('details')} @click=${() => this._moreInfo(d.id)}><span class="txt" style="display:flex;flex-direction:column;gap:2px"><b class="txt" style="font-weight:500">${d.name}</b><span class="muted txt" style="font-size:12px">${[d.areaName, d.unavailable ? t('notAvailable') : on ? (d.attrs?.source || t('plugOn')) : t('plugOff')].filter(Boolean).join(' · ')}</span></span></button>
            ${(d.features & (F.ON | F.OFF)) && !d.unavailable ? html`<button class="ib sm" aria-label=${(on ? t('plugOff') : t('plugOn')) + ' · ' + d.name} style=${on ? 'color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)' : ''} @click=${() => this._call('media_player', on ? 'turn_off' : 'turn_on', { entity_id: d.id })}>${ic('power', 'i s')}</button>` : nothing}
          </div>
          ${on && (d.features & (F.VOL_STEP | F.VOL_SET)) ? html`<div class="row" style="gap:8px">
            ${d.features & F.MUTE ? html`<button class="ib sm ghost" aria-pressed=${muted ? 'true' : 'false'} aria-label=${t('mute') + ' · ' + d.name} style=${muted ? 'color:var(--accent)' : 'color:var(--mut)'} @click=${() => this._call('media_player', 'volume_mute', { entity_id: d.id, is_volume_muted: !muted })}>${ic('vol', 'i s')}</button>` : nothing}
            <button class="vpm" aria-label=${t('volume') + ' − · ' + d.name} @click=${() => this._call('media_player', 'volume_down', { entity_id: d.id })}>${ic('minus', 'i s')}</button>
            <button class="vpm" aria-label=${t('volume') + ' + · ' + d.name} @click=${() => this._call('media_player', 'volume_up', { entity_id: d.id })}>${ic('plus', 'i s')}</button>
            ${d.vol != null ? html`<span class="mono vnum">${d.vol}</span>` : nothing}</div>` : nothing}
        </div>`;
      })}</div></section>`;
  }
  sMusic({ m, t, now, aRgb }, full = false) {
    const ui = this._ui, mc = this._mc;
    const acct = mc.state;
    const spIds = new Set(mc.players.filter((p) => isSpotifyPlus(this.hass, p.entity_id)).map((p) => p.entity_id));
    const all = this._sorted('speakers', m.speakers.filter((s) => !spIds.has(s.id)));
    const list = this._visible('speakers', all), ids = list.map((x) => x.id);
    if (!acct && !all.length) return nothing;
    const a = acct?.attributes || {}, playing = mc.isPlaying, pos = position(acct, now.getTime());
    const art = artworkUrl(a.entity_picture_local || a.entity_picture || a.sp_nowplaying_image_url, this.hass);
    const mmss = (x) => Math.floor(x / 60) + ':' + p2(Math.floor(x % 60));
    const fr = pos.duration ? pos.value / pos.duration : 0;
    const vol = this._local['vol:acct'] ?? (a.volume_level != null ? Math.round(a.volume_level * 100) : null);
    const speakersOn = all.filter((s) => s.playing && !s.tv);
    const status = speakersOn.length > 1 && speakersOn.length === all.filter((s) => !s.tv).length ? t('everywhere') : speakersOn.length > 1 ? t('inSpeakers', { n: speakersOn.length }) : playing ? t('playing') : t('paused');
    const groupable = all.filter((s) => !s.tv && (s.features & F.GROUP));
    const lead = groupable.find((s) => s.playing) || groupable[0], members = lead?.attrs.group_members || [], grouped = members.length > 1;
    // Library: the account's own Spotify data, read only after the Music section is on screen.
    if (mc.spotify && !this._libAsked && mc.advanced('get_playlist_favorites')) { this._libAsked = mc.entityId; mc.browse('playlists'); }
    const kinds = [['playlists', 'Playlists', 'get_playlist_favorites'], ['recent', t('recentS'), 'get_player_recent_tracks'], ['albums', t('albumsS'), 'get_album_favorites'], ['favorites', t('likedS'), 'get_track_favorites'], ['podcasts', 'Podcasts', 'get_show_favorites']].filter(([, , s]) => mc.advanced(s));
    const panel = ui.musicPanel || 'library', busy = mc.pending.has('browse');
    const imgOf = (it) => artworkUrl((it.images || it.icons || it.album?.images)?.[0]?.url || it.image_url, this.hass);
    const accounts = mc.players.filter((p) => spIds.has(p.entity_id));
    return html`<section class="sec">${this.secHead('music', html`<span style="letter-spacing:.28em;font-size:15px;font-weight:500;color:var(--accent)">AUREON</span> ${t('music')}`, status, html`
        ${accounts.length > 1 ? html`<span class="seg" role="group" aria-label="Spotify">${accounts.map((p) => html`<button aria-pressed=${p.entity_id === mc.entityId ? 'true' : 'false'} style="font-family:inherit;font-size:12px;letter-spacing:0" @click=${() => { mc.select(p.entity_id); this._libAsked = null; }}>${p.attributes.friendly_name || p.entity_id}</button>`)}</span>` : nothing}
        ${groupable.length > 1 ? html`<button class="btn sm" @click=${() => grouped ? this._call('media_player', 'unjoin', { entity_id: members.filter((x) => x !== lead.id) }) : this._call('media_player', 'join', { entity_id: lead.id, group_members: groupable.filter((s) => s.id !== lead.id).map((s) => s.id) })}>${grouped ? t('ungroup') : t('groupAll')}</button>` : nothing}`, t)}
      ${acct ? html`<div class=${'mcard jzc' + (full ? '' : ' cmp')}>
        <div class=${'stg' + (playing ? ' on' : '')}>
          <span class="sglow" aria-hidden="true"></span>
          <div class="bigv" aria-hidden="true"><div class="vinyl"><span class="label" style=${art ? `background:center/cover url("${art}")` : `background:radial-gradient(circle at 35% 30%, ${rgba(aRgb, 0.95)} 0%, ${rgba(aRgb, 0.5)} 100%)`}></span></div><span class="sheen"></span><span class="spindle"></span></div>
          <svg class="arm" aria-hidden="true" viewBox="0 0 120 230">
            <rect class="cw" x="104" y="-16" width="13" height="14" rx="3"></rect>
            <circle class="base" cx="110" cy="10" r="10"></circle><circle class="hub" cx="110" cy="10" r="4"></circle>
            <path class="rod" d="M110 10 L42 166 Q32 186 20 194"></path>
            <rect class="head" x="8" y="190" width="18" height="10" rx="2" transform="rotate(-40 17 195)"></rect>
          </svg>
          <div class="stxt">
            <span class="jtag txt"><span class=${'eq' + (playing ? '' : ' off')}><i></i><i></i><i></i></span>${a.source || a.friendly_name || 'Spotify'}</span>
            <span class="jtitle txt">${a.media_title || t('nothingPlaying')}</span>
            <span class="jartist txt">${[a.media_artist, a.media_album_name].filter(Boolean).join(' · ')}</span>
            ${pos.duration ? html`<span class="mono stime">${mmss(pos.value)} / ${mmss(pos.duration)}</span>` : nothing}
          </div>
          <div class="sctl">
            ${mc.can('previous') ? html`<button class="ib sm" style="border-radius:50%" aria-label=${t('prev')} ?disabled=${mc.pending.has('transport:previous')} @click=${() => this._skip('previous')}>${ic('prev', 'i s f')}</button>` : nothing}
            <button class="play jplay" aria-label=${playing ? t('pause') : t('play')} ?disabled=${!mc.ready} @click=${() => mc.command(playing ? 'pause' : 'play')}>${ic(playing ? 'pause' : 'play', 'i f')}</button>
            ${mc.can('next') ? html`<button class="ib sm" style="border-radius:50%" aria-label=${t('next')} ?disabled=${mc.pending.has('transport:next')} @click=${() => this._skip('next')}>${ic('next', 'i s f')}</button>` : nothing}
          </div>
          ${pos.duration ? html`<input class="sprog" type="range" min="0" max=${String(Math.round(pos.duration))} .value=${String(Math.round(pos.value))} ?disabled=${!mc.can('seek')} aria-label=${a.media_title || 'position'} style=${`--p:${(fr * 100).toFixed(1)}%`} @change=${(e) => mc.command('seek', Number(e.target.value))}>` : nothing}
        </div>
        <div class="mctl">
          <div class="row" style="gap:4px">
            ${mc.can('shuffle') ? html`<button class="ib sm ghost" aria-pressed=${a.shuffle ? 'true' : 'false'} aria-label=${t('shuffle')} style=${a.shuffle ? 'color:var(--accent)' : 'color:var(--mut)'} @click=${() => mc.command('shuffle')}>${ic('shuffle', 'i s')}</button>` : nothing}
            ${mc.can('repeat') ? html`<button class="ib sm ghost" aria-pressed=${a.repeat && a.repeat !== 'off' ? 'true' : 'false'} aria-label=${t('repeat') + ': ' + t('repeat_' + (a.repeat || 'off'))} title=${t('repeat_' + (a.repeat || 'off'))} style=${'position:relative;' + (a.repeat && a.repeat !== 'off' ? 'color:var(--accent)' : 'color:var(--mut)')} @click=${() => mc.command('repeat')}>${ic('repeat', 'i s')}${a.repeat === 'one' ? html`<b style="position:absolute;right:6px;top:5px;font-size:9px;font-weight:600">1</b>` : nothing}</button>` : nothing}
            ${mc.advanced('save_track_favorites') && a.media_title ? html`<button class="ib sm ghost" aria-pressed=${mc.favorite ? 'true' : 'false'} aria-label=${t('likedS')} style=${mc.favorite ? 'color:#FF8FA3' : 'color:var(--mut)'} @click=${() => mc.toggleFavorite()}>${svg`<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style=${mc.favorite ? 'fill:currentColor' : ''}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"></path></svg>`}</button>` : nothing}
          </div>
          ${mc.can('volume') && vol != null ? this.volLine(vol, t) : nothing}
        </div>
        ${mc.error ? html`<span class="txt" style="position:relative;font-size:12px;color:#FF8A80">${mc.error}</span>` : nothing}
        <div class="mlib">
          <div class="mchips">
            ${kinds.map(([k, n]) => { const on = (full || ui.libSheet) && panel === 'library' && mc.libraryKind === k && mc.view === 'library' && !ui.musicSearch; return html`<button class="dc" aria-pressed=${on ? 'true' : 'false'} style=${on ? 'border-color:var(--accent);color:var(--fg)' : ''} @click=${() => { this._set({ musicPanel: 'library', musicSearch: false, libSheet: !full }); mc.browse(k); }}>${n}</button>`; })}
            ${mc.advanced('get_spotify_connect_devices') ? html`<button class="dc" aria-pressed=${(full || ui.libSheet) && panel === 'devices' ? 'true' : 'false'} style=${(full || ui.libSheet) && panel === 'devices' ? 'border-color:var(--accent);color:var(--fg)' : ''} @click=${() => { this._set({ musicPanel: 'devices', musicSearch: false, libSheet: !full }); mc.loadDevices(false); }}>${ic('speaker', 'i s')} ${t('whereToPlay')}</button>` : nothing}
            ${mc.advanced('search_tracks') ? html`<button class="dc" aria-pressed=${ui.musicSearch ? 'true' : 'false'} aria-label=${t('searchS')} style=${ui.musicSearch ? 'border-color:var(--accent);color:var(--fg)' : ''} @click=${() => { const on = full ? !ui.musicSearch : true; this._set({ musicSearch: on, musicPanel: 'library', libSheet: !full }); if (on) setTimeout(() => this.renderRoot.querySelector('.msearch')?.focus(), 80); }}>${ic('search', 'i s')}</button>` : nothing}
          </div>
          ${full ? html`
          ${(ui.musicSearch || full) && mc.advanced('search_tracks') ? html`<input class="msearch" type="search" .value=${ui.musicQuery || ''} placeholder=${t('searchS')} aria-label=${t('searchS')} @input=${(e) => this._set({ musicQuery: e.target.value })} @keydown=${(e) => { if (e.key === 'Enter' && e.target.value.trim()) { mc.browse('search', e.target.value); } }}
            style="min-height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--line2);background:var(--sunk);color:var(--fg);font:inherit;font-size:13px">` : nothing}
          ${panel === 'devices' ? html`<div class="mrow">${mc.pending.has('devices') ? html`<span class="muted" style="font-size:13px">${t('loadingS')}</span>` : nothing}
              ${mc.devices.filter((d) => d.active || !(this._prefs.connectHidden || []).includes(d.name)).map((d) => html`<button class="dc" style=${'min-height:44px;' + (d.active ? 'border-color:var(--accent);color:var(--fg)' : '')} aria-pressed=${d.active ? 'true' : 'false'} ?disabled=${mc.pending.has('transfer')} @click=${() => { mc.transfer(d.id); if (!full) setTimeout(() => this._set({ libSheet: false }), 600); }}>${ic('speaker', 'i s')} ${d.name}${d.active ? ' · ' + t('playing') : d.ready ? '' : ' · ' + t('openSpotify')}</button>`)}
              ${!mc.pending.has('devices') && !mc.devices.length ? html`<span class="muted txt" style="font-size:13px">${t('noDevices')}</span>` : nothing}</div>`
          : (() => {
              // Owner 2026-11-16 ("playlists daquele jeito tá feio"): a calm list — small cover, name, who/what, play.
              const sub = (it) => [it.owner?.display_name, (it.artists || it.album?.artists || []).map((x) => x.name).join(', '), it.publisher, it.tracks?.total ? t('tracksN', { n: it.tracks.total }) : null].filter(Boolean).slice(0, 2).join(' · ');
              const nowUri = a.media_context_content_id || a.sp_context_uri || a.media_content_id || '';
              const all = mc.results.slice(0, full ? 50 : 20), more = full, shown = all;
              return html`<div class="mlist">${busy && !all.length ? html`<span class="muted" style="font-size:13px">${t('loadingS')}</span>` : nothing}
              ${shown.map((it) => { const im = imgOf(it), starting = mc.startingUri === it.uri, cur = it.uri && nowUri === it.uri; return html`<button class=${'mli' + (cur ? ' cur' : '')} aria-label=${t('play') + ' · ' + it.name} ?disabled=${starting} @click=${() => { mc.playItem(it); if (!full) setTimeout(() => this._set({ libSheet: false }), 600); }}>
                <span class="mcov" style=${`background:${im ? `center/cover url("${im}")` : `radial-gradient(70% 70% at 25% 25%, ${rgba(aRgb, 0.7)} 0%, ${rgba(aRgb, 0)} 70%), var(--raise)`}`}>${starting ? html`<span class="pulse" style="position:absolute;inset:0;background:rgba(0,0,0,.35)"></span>` : nothing}</span>
                <span class="mtx"><b class="txt">${it.name}</b>${sub(it) ? html`<span class="txt">${sub(it)}</span>` : nothing}</span>
                <span class="mplay" aria-hidden="true">${cur && playing ? html`<span class="eq"><i></i><i></i><i></i></span>` : ic('play', 'i s f')}</span></button>`; })}
              </div>
              ${!full ? html`<button class="mall" @click=${() => this._musicPage(true)}><span>${t('seeAllMusic')}</span>${ic('right', 'i s')}</button>` : nothing}
              ${(mc.pageIndex > 0 || mc.hasNext) ? html`<div class="row" style="gap:8px;justify-content:center">
                ${mc.pageIndex > 0 ? html`<button class="ib" aria-label=${t('back')} @click=${() => mc.changePage(-1)}>${ic('left', 'i s')}</button>` : nothing}
                ${mc.hasNext ? html`<button class="ib" aria-label=${t('fwd')} @click=${() => mc.changePage(1)}>${ic('right', 'i s')}</button>` : nothing}</div>` : nothing}
              ${!busy && !mc.results.length && !kinds.length && !mc.spotify ? html`<span class="muted txt" style="font-size:13px">${t('noSpotify')}</span>` : nothing}`;
            })()}
` : nothing}
        </div>
        ${!full && ui.libSheet ? html`<div class="msheet" role="dialog" aria-label=${panel === 'devices' ? t('whereToPlay') : ui.musicSearch ? t('searchS') : (kinds.find(([k]) => k === mc.libraryKind) || [, ''])[1]} @keydown=${(e) => { if (e.key === 'Escape') this._set({ libSheet: false }); }}>
          <div class="mshead"><span class="mstitle txt">${panel === 'devices' ? t('whereToPlay') : ui.musicSearch ? t('searchS') : (kinds.find(([k]) => k === mc.libraryKind) || [, ''])[1]}</span><button class="ib sm" aria-label=${t('close')} @click=${() => this._set({ libSheet: false })}>${ic('x', 'i s')}</button></div>
          <div class="msbody">
          ${(ui.musicSearch || full) && mc.advanced('search_tracks') ? html`<input class="msearch" type="search" .value=${ui.musicQuery || ''} placeholder=${t('searchS')} aria-label=${t('searchS')} @input=${(e) => this._set({ musicQuery: e.target.value })} @keydown=${(e) => { if (e.key === 'Enter' && e.target.value.trim()) { mc.browse('search', e.target.value); } }}
            style="min-height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--line2);background:var(--sunk);color:var(--fg);font:inherit;font-size:13px">` : nothing}
          ${panel === 'devices' ? html`<div class="mrow">${mc.pending.has('devices') ? html`<span class="muted" style="font-size:13px">${t('loadingS')}</span>` : nothing}
              ${mc.devices.filter((d) => d.active || !(this._prefs.connectHidden || []).includes(d.name)).map((d) => html`<button class="dc" style=${'min-height:44px;' + (d.active ? 'border-color:var(--accent);color:var(--fg)' : '')} aria-pressed=${d.active ? 'true' : 'false'} ?disabled=${mc.pending.has('transfer')} @click=${() => { mc.transfer(d.id); if (!full) setTimeout(() => this._set({ libSheet: false }), 600); }}>${ic('speaker', 'i s')} ${d.name}${d.active ? ' · ' + t('playing') : d.ready ? '' : ' · ' + t('openSpotify')}</button>`)}
              ${!mc.pending.has('devices') && !mc.devices.length ? html`<span class="muted txt" style="font-size:13px">${t('noDevices')}</span>` : nothing}</div>`
          : (() => {
              // Owner 2026-11-16 ("playlists daquele jeito tá feio"): a calm list — small cover, name, who/what, play.
              const sub = (it) => [it.owner?.display_name, (it.artists || it.album?.artists || []).map((x) => x.name).join(', '), it.publisher, it.tracks?.total ? t('tracksN', { n: it.tracks.total }) : null].filter(Boolean).slice(0, 2).join(' · ');
              const nowUri = a.media_context_content_id || a.sp_context_uri || a.media_content_id || '';
              const all = mc.results.slice(0, full ? 50 : 20), more = full, shown = all;
              return html`<div class="mlist">${busy && !all.length ? html`<span class="muted" style="font-size:13px">${t('loadingS')}</span>` : nothing}
              ${shown.map((it) => { const im = imgOf(it), starting = mc.startingUri === it.uri, cur = it.uri && nowUri === it.uri; return html`<button class=${'mli' + (cur ? ' cur' : '')} aria-label=${t('play') + ' · ' + it.name} ?disabled=${starting} @click=${() => { mc.playItem(it); if (!full) setTimeout(() => this._set({ libSheet: false }), 600); }}>
                <span class="mcov" style=${`background:${im ? `center/cover url("${im}")` : `radial-gradient(70% 70% at 25% 25%, ${rgba(aRgb, 0.7)} 0%, ${rgba(aRgb, 0)} 70%), var(--raise)`}`}>${starting ? html`<span class="pulse" style="position:absolute;inset:0;background:rgba(0,0,0,.35)"></span>` : nothing}</span>
                <span class="mtx"><b class="txt">${it.name}</b>${sub(it) ? html`<span class="txt">${sub(it)}</span>` : nothing}</span>
                <span class="mplay" aria-hidden="true">${cur && playing ? html`<span class="eq"><i></i><i></i><i></i></span>` : ic('play', 'i s f')}</span></button>`; })}
              </div>
              ${!full ? html`<button class="mall" @click=${() => this._musicPage(true)}><span>${t('seeAllMusic')}</span>${ic('right', 'i s')}</button>` : nothing}
              ${(mc.pageIndex > 0 || mc.hasNext) ? html`<div class="row" style="gap:8px;justify-content:center">
                ${mc.pageIndex > 0 ? html`<button class="ib" aria-label=${t('back')} @click=${() => mc.changePage(-1)}>${ic('left', 'i s')}</button>` : nothing}
                ${mc.hasNext ? html`<button class="ib" aria-label=${t('fwd')} @click=${() => mc.changePage(1)}>${ic('right', 'i s')}</button>` : nothing}</div>` : nothing}
              ${!busy && !mc.results.length && !kinds.length && !mc.spotify ? html`<span class="muted txt" style="font-size:13px">${t('noSpotify')}</span>` : nothing}`;
            })()}
          </div></div>` : nothing}
      </div>` : nothing}
      ${list.length ? html`<span class="eyebrow" style="padding:6px 4px 0;font-size:10px">${t('speakers')}</span>
      <div class="grid sgrid">${repeat(list.slice().sort((x, y) => (x.unavailable ? 1 : 0) - (y.unavailable ? 1 : 0)), (s) => s.id, (s) => {
        const ta = this.tileAttrs('speakers', s, ids), v = this._local['vol:' + s.id] ?? s.vol;
        return html`<div class=${'tile mini' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end} style=${s.playing ? `border-color:${rgba(aRgb, 0.3)}` : ''}>
          ${this.editBar('speakers', s, ids, t)}
          <div class="tbtn" style="cursor:default">
            <span class="ic" style=${s.playing ? 'background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)' : ''}>${ic(s.tv ? 'tv' : 'speaker')}</span>
            <span class="nm grow"><b>${s.name}</b><span>${[s.areaName, s.unavailable ? t('notAvailable') : s.playing ? (s.attrs.media_title || t('playing')) : s.state === 'paused' ? t('paused') : ''].filter(Boolean).join(' · ')}</span></span>
            ${s.features & (F.PAUSE | F.PLAY) && !s.unavailable ? html`<button class="ib sm" aria-label=${(s.playing ? t('pause') : t('play')) + ' · ' + s.name} @click=${() => this._call('media_player', 'media_play_pause', { entity_id: s.id })}>${ic(s.playing ? 'pause' : 'play', 'i s f')}</button>` : nothing}</div>
          ${v != null && s.features & F.VOL && (s.playing || s.state === 'paused' || this._local['vol:' + s.id] != null) ? html`<div class="row">${ic('vol', 'i s')}<input class="rng" type="range" min="0" max="100" .value=${String(v)} aria-label=${t('volume') + ' · ' + s.name} style=${`background:linear-gradient(90deg, ${s.playing ? 'var(--accent)' : 'var(--dim)'} ${v}%, var(--line2) ${v}%)`}
            @input=${(e) => { this._local['vol:' + s.id] = Number(e.target.value); this.requestUpdate(); }}
            @change=${(e) => { const nv = Number(e.target.value); this._call('media_player', 'volume_set', { entity_id: s.id, volume_level: nv / 100 }).finally(() => setTimeout(() => { delete this._local['vol:' + s.id]; this.requestUpdate(); }, 1500)); }}><span class="mono muted" style="font-size:11px;min-width:26px;text-align:right">${v}</span></div>` : nothing}
        </div>`;
      })}</div>` : nothing}</section>`;
  }
}

class AureonMusicCard extends AureonDashboard {
  render() {
    if (!this.hass) return html``;
    if (!this._prefs) this._loadPrefs();
    const lang = localeOf(this.hass), t = translator(lang), now = new Date();
    const m = buildModel(this.hass, { now, labels: this._labels, aliases: this._prefs.aliases, hidden: this._prefs.hidden, forceShow: this._prefs.forceShow, noAreaName: t('noArea') });
    const th = this._theme(), aRgb = th.ha ? this._accentRgb : hexRgb(th.accent);
    const vars = th.ha ? '--bg:var(--primary-background-color);--card:var(--card-background-color);--card2:var(--secondary-background-color);--sunk:var(--primary-background-color);--raise:var(--secondary-background-color);--line:var(--divider-color);--line2:var(--divider-color);--fg:var(--primary-text-color);--fg2:var(--primary-text-color);--mut:var(--secondary-text-color);--dim:var(--secondary-text-color);--accent:var(--primary-color);--on-accent:#fff;'
      : `--bg:${th.bg};--card:${th.card};--card2:${th.card2};--sunk:${th.sunk};--raise:${th.raise};--line:${th.line};--line2:${th.line2};--fg:#F2F2F3;--fg2:#D4D4D8;--mut:#A1A1AA;--dim:#8A8A94;--accent:${th.accent};--on-accent:#1A1408;`;
    return html`<div style=${vars + 'padding:12px;background:var(--bg);border-radius:24px'}>${this.sMusic({ m, t, now, aRgb })}</div>`;
  }
}

class AureonDashboardStrategy extends HTMLElement {
  static async generate() {
    return { title: 'AUREON', views: [{ title: 'AUREON', path: 'home', icon: 'mdi:home-assistant', type: 'panel', cards: [{ type: 'custom:aureon-dashboard' }] }] };
  }
}

if (!customElements.get('aureon-dashboard')) customElements.define('aureon-dashboard', AureonDashboard);
if (!customElements.get('aureon-music-player')) customElements.define('aureon-music-player', AureonMusicCard);
if (!customElements.get('ll-strategy-aureon-dashboard')) customElements.define('ll-strategy-aureon-dashboard', AureonDashboardStrategy);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'aureon-dashboard')) window.customCards.push({ type: 'aureon-dashboard', name: 'AUREON Dashboard', description: 'AUREON Noir — the whole home on one page', preview: false });
if (!window.customCards.some((c) => c.type === 'aureon-music-player')) window.customCards.push({ type: 'aureon-music-player', name: 'AUREON Music', description: 'AUREON Music player and speakers', preview: false });
window.AUREON_BUILD_INFO = Object.freeze({ version: VERSION, build: BUILD, file: 'aureon-dashboard.js' });
console.info(`%c AUREON %c ${VERSION} · ${BUILD} `, 'background:#E6CC9A;color:#1A1408;font-weight:600;border-radius:4px 0 0 4px;padding:2px 6px', 'background:#111114;color:#E6CC9A;border-radius:0 4px 4px 0;padding:2px 6px');
