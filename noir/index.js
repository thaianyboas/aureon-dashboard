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
import { BUILTIN_CARDS, installedCards, stubConfig, configElement, createCard, toYaml, fromYaml } from './cards.js';
import { MusicController, isSpotifyPlus, artworkUrl, position } from '../floor-studio/dashboard/music/controller.mjs';

// Owner 2026-11-18: lights on and waste day are already visible on the map and in the waste card, so they are no
// reminder unless switched on in Settings → Geral.
const RK_OFF = ['lights', 'waste'];
const reminderOn = (kinds, k) => (RK_OFF.includes(k) ? kinds[k] === true : kinds[k] !== false);
export const VERSION = '1.7.6';
export const BUILD = 'AUREON-NOIR-20261122e';

export const THEMES = [
  { id: 'aureon', name: 'Aureon', desc: 'Ouro · grafite', accent: '#E6CC9A', bg: '#08080A', card: '#111114', card2: '#0E0E11', sunk: '#0B0B0D', raise: '#17171B', line: '#1C1C21', line2: '#26262C' },
  { id: 'ambar', name: 'Âmbar', desc: 'Vela · café', accent: '#F5B65C', bg: '#0A0806', card: '#15110D', card2: '#110E0A', sunk: '#0C0A07', raise: '#1C1712', line: '#241E17', line2: '#30281F' },
  { id: 'oceano', name: 'Oceano', desc: 'Azul gelo · noite', accent: '#8FB8FF', bg: '#06080C', card: '#0F131A', card2: '#0B0F15', sunk: '#080B10', raise: '#151B24', line: '#1B2230', line2: '#253144' },
  { id: 'ametista', name: 'Ametista', desc: 'Lilás · ameixa', accent: '#B9A8FF', bg: '#08070C', card: '#121019', card2: '#0E0C14', sunk: '#0A0910', raise: '#18151F', line: '#211D2C', line2: '#2D2740' },
  { id: 'jade', name: 'Jade', desc: 'Menta · floresta', accent: '#7EE0A8', bg: '#060A08', card: '#0F1512', card2: '#0B110E', sunk: '#080D0A', raise: '#141C18', line: '#1B2721', line2: '#25362D' },
  { id: 'rose', name: 'Rosé', desc: 'Rosa antigo · vinho', accent: '#F2A7B5', bg: '#0B0708', card: '#161012', card2: '#120C0E', sunk: '#0D090A', raise: '#1D1517', line: '#271C20', line2: '#36282C' },
  { id: 'platina', name: 'Platina', desc: 'Preto · branco', accent: '#F2F2F3', bg: '#070707', card: '#111111', card2: '#0D0D0D', sunk: '#0A0A0A', raise: '#171717', line: '#1E1E1E', line2: '#2A2A2A' },
  // Owner 2026-11-18 ("mais temas elegantes"): eight more, same calm dark base, each with its own metal or stone.
  { id: 'champagne', name: 'Champagne', desc: 'Marfim · ônix', accent: '#EBD9B4', bg: '#090807', card: '#131210', card2: '#0F0E0C', sunk: '#0B0A09', raise: '#191714', line: '#221F1B', line2: '#2E2A24' },
  { id: 'cobre', name: 'Cobre', desc: 'Cobre · carvão', accent: '#E39468', bg: '#0A0706', card: '#15100E', card2: '#110D0B', sunk: '#0C0908', raise: '#1C1512', line: '#261C18', line2: '#342620' },
  { id: 'bordo', name: 'Bordô', desc: 'Vinho · ouro velho', accent: '#E2B57A', bg: '#0C0608', card: '#180D11', card2: '#130A0D', sunk: '#0E0709', raise: '#201117', line: '#2B1820', line2: '#3B212C' },
  { id: 'esmeralda', name: 'Esmeralda', desc: 'Verde joia · veludo', accent: '#4FD1A5', bg: '#040A08', card: '#0C1612', card2: '#09120E', sunk: '#060D0A', raise: '#111D18', line: '#172821', line2: '#20372D' },
  { id: 'safira', name: 'Safira', desc: 'Azul real · meia-noite', accent: '#7FA2FF', bg: '#05060D', card: '#0E1120', card2: '#0B0D19', sunk: '#080A13', raise: '#141829', line: '#1B2036', line2: '#262C49' },
  { id: 'aurora', name: 'Aurora', desc: 'Turquesa · noite polar', accent: '#86E3DC', bg: '#04090B', card: '#0C1518', card2: '#091114', sunk: '#060C0E', raise: '#111C20', line: '#17262B', line2: '#20343A' },
  { id: 'oliva', name: 'Oliva', desc: 'Latão · musgo', accent: '#CDBE7E', bg: '#080906', card: '#12140F', card2: '#0E100B', sunk: '#0A0B08', raise: '#181B14', line: '#21251B', line2: '#2D3224' },
  { id: 'grafite', name: 'Grafite', desc: 'Aço azulado · grafite', accent: '#AEB9CC', bg: '#08090B', card: '#111317', card2: '#0D0F12', sunk: '#0A0B0E', raise: '#171A1F', line: '#1E2228', line2: '#2A2F37' },
  // Owner 2026-11-20 ("mais temas bonitos e elegantes").
  { id: 'onix', name: 'Ônix', desc: 'Preto profundo · prata', accent: '#D8D4CC', bg: '#030303', card: '#0C0C0C', card2: '#090909', sunk: '#060606', raise: '#121212', line: '#191919', line2: '#242424' },
  { id: 'perola', name: 'Pérola', desc: 'Nácar · cinza lunar', accent: '#E9E2F2', bg: '#09090B', card: '#141418', card2: '#101014', sunk: '#0C0C0F', raise: '#1A1A20', line: '#23232A', line2: '#303038' },
  { id: 'ourorose', name: 'Ouro rosé', desc: 'Rosé gold · cacau', accent: '#E9B49E', bg: '#0A0707', card: '#161011', card2: '#120D0E', sunk: '#0D0A0A', raise: '#1D1516', line: '#271D1E', line2: '#352829' },
  { id: 'titanio', name: 'Titânio', desc: 'Metal frio · aço', accent: '#C9D2DC', bg: '#070809', card: '#101214', card2: '#0C0E10', sunk: '#090A0C', raise: '#16191C', line: '#1D2125', line2: '#292E33' },
  { id: 'rubi', name: 'Rubi', desc: 'Vermelho joia · ônix', accent: '#FF7A88', bg: '#0A0506', card: '#160C0E', card2: '#12090B', sunk: '#0D0708', raise: '#1E1013', line: '#29161A', line2: '#381E24' },
  { id: 'terracota', name: 'Terracota', desc: 'Barro · areia', accent: '#E0957A', bg: '#0A0706', card: '#17110E', card2: '#130E0B', sunk: '#0D0A08', raise: '#1E1713', line: '#291F1A', line2: '#382A23' },
  { id: 'petroleo', name: 'Petróleo', desc: 'Azul-petróleo · profundo', accent: '#5FC2CE', bg: '#03080A', card: '#0B1518', card2: '#081114', sunk: '#060C0E', raise: '#101D21', line: '#16282D', line2: '#1F363C' },
  { id: 'indigo', name: 'Índigo', desc: 'Violeta azulado · noite', accent: '#9FA8FF', bg: '#06060C', card: '#10101C', card2: '#0C0C17', sunk: '#090912', raise: '#161627', line: '#1D1D33', line2: '#282845' },
  { id: 'ha', name: 'Home Assistant', desc: 'Segue o tema do HA', ha: true }
];
// Theme gallery families (owner 2026-11-20: "uma visualização melhor").
const THEME_FAMS = [
  ['famClassic', ['aureon', 'champagne', 'onix', 'platina', 'perola', 'grafite']],
  ['famMetal', ['ambar', 'cobre', 'ourorose', 'titanio', 'oliva', 'terracota']],
  ['famStone', ['ametista', 'jade', 'esmeralda', 'safira', 'rubi', 'bordo']],
  ['famNight', ['oceano', 'aurora', 'petroleo', 'indigo', 'rose']],
  ['famHa', ['ha']]
];
const SECTIONS = ['lights', 'climate', 'plugs', 'energy', 'covers', 'openings', 'security', 'tv', 'music'];
const SCENE_GLOW = ['245,208,138', '169,155,255', '255,160,100', '143,184,255', '126,224,168', '242,167,181'];
const F = { PAUSE: 1, SEEK: 2, VOL: 4, PREV: 16, NEXT: 32, SOURCE: 2048, PLAY: 16384, SHUFFLE: 32768, GROUP: 524288 };

const P = {
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  power: 'M12 3v9M6.3 7.3a8 8 0 1 0 11.4 0',
  mute: 'M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6',
  mlist: 'M4 6h12M4 11h12M4 16h7M17 14v6M17 20a2 2 0 1 1-2-2h2', mclock: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18M12 7v5l3 2',
  mdisc: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5M7 9a5.5 5.5 0 0 1 3-2.6',
  mheart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', mmic: 'M9 4a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM6 10a6 6 0 0 0 12 0M12 16v4M9 20h6',
  fridge: 'M6 2h12v20H6zM6 10h12M9 5v2M9 13v3', wifi: 'M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M2 9.5a15 15 0 0 1 20 0M12 20h.01',
  coffee: 'M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3',
  minus: 'M5 12h14', plus: 'M12 5v14M5 12h14',
  tv: 'M3 6h18v11H3zM8 21h8M12 17v4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  plug: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4', lock: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3', unlock: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 7.5-2',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4', eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  eyeOff: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 22 12a13 13 0 0 1-2.4 3.4M6.6 6.6A13 13 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.4-1',
  left: 'M15 6l-6 6 6 6', right: 'M9 6l6 6-6 6', up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', check: 'M5 12l5 5 9-10', x: 'M6 6l12 12M18 6 6 18',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z', cloud: 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  grid: 'M8 21 12 3l4 18M9.2 15h5.6M10 11h4M6 7h12', home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z', batt: 'M3 7h16v10H3zM21 11v2M7 10v4M10.5 10v4',
  flame: 'M12 2c1 3.5 5 5 5 10a5 5 0 0 1-10 0c0-2.5 1.2-3.8 2.4-5 0 2.3 1.1 3.5 2.4 3.5 0-3.5-1.2-5.5.2-8.5z',
  win: 'M4 3h16v18H4zM12 3v18M4 12h16', door: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16M14.5 12h.01', shield: 'M12 3l8 3v6c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V6z',
  speaker: 'M7 3h10v18H7zM12 8h.01M12 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', tv: 'M3 5h18v12H3zM8 21h8', note: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  play: 'M8 5v14l11-7z', pause: 'M6 5h4v14H6zM14 5h4v14h-4z', prev: 'M7 5h2v14H7zM20 5v14L10 12z', next: 'M15 5h2v14h-2zM4 5v14l10-7z',
  sections: 'M4 5h16v5H4zM4 14h16v5H4z',
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
// Owner 2026-11-22 ("mais rico e visual"): drawn machines and robot for "Acontecendo agora". run = working;
// f = progress 0..1 (null = unknown → a soft spinning arc); disp = text in the little display.
const washerSvg = (run, f, disp, key) => svg`<svg class="apill" viewBox="0 0 128 150" aria-hidden="true"><defs>
  <linearGradient id=${'wb' + key} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2F3F1"></stop><stop offset=".55" stop-color="#D7DAD6"></stop><stop offset="1" stop-color="#AEB2AE"></stop></linearGradient>
  <radialGradient id=${'wg' + key} cx=".4" cy=".35"><stop offset="0" stop-color=${run ? '#9CC2FF' : '#3A4146'}></stop><stop offset="1" stop-color=${run ? '#1E3A66' : '#0E1214'}></stop></radialGradient>
  <clipPath id=${'wc' + key}><circle cx="64" cy="88" r="29"></circle></clipPath></defs>
  <rect x="6" y="4" width="116" height="142" rx="12" fill=${'url(#wb' + key + ')'}></rect><rect x="6" y="4" width="116" height="28" rx="12" fill="#E9EBE8"></rect><rect x="6" y="26" width="116" height="2" fill="#C4C8C4"></rect>
  <rect x="16" y="12" width="34" height="9" rx="2" fill="#1A1E20"></rect><text x="33" y="19" fill=${run ? '#9CC2FF' : '#5B6266'} font-size="7" font-family="ui-monospace,monospace" text-anchor="middle">${disp || '--:--'}</text>
  <circle cx="102" cy="16" r="7" fill="#CDD1CD" stroke="#9EA39F"></circle><circle cx="64" cy="88" r="42" fill="#C9CDC9" stroke="#A4A9A5"></circle>
  ${run ? (f != null ? svg`<circle class="apr" cx="64" cy="88" r="40" fill="none" stroke-width="3" stroke-linecap="round" stroke-dasharray=${(Math.max(0.02, f) * 251).toFixed(0) + ' 252'} transform="rotate(-90 64 88)"></circle>` : svg`<circle class="apr spin" cx="64" cy="88" r="40" fill="none" stroke-width="3" stroke-linecap="round" stroke-dasharray="70 252"></circle>`) : nothing}
  <circle cx="64" cy="88" r="33" fill="#2A2F32"></circle><circle cx="64" cy="88" r="29" fill=${'url(#wg' + key + ')'}></circle>
  ${run ? svg`<g clip-path=${'url(#wc' + key + ')'}><path class="wave" d="M20 96 Q38 84 56 94 T92 90 T128 94 L128 124 L20 124Z" fill="#6E9BE8" opacity=".55"></path></g><path d="M48 80 a16 16 0 0 1 28 -4" stroke="#CFE0FF" stroke-width="2" fill="none" opacity=".6"></path>` : svg`<circle cx="64" cy="88" r="20" fill="none" stroke="#1C2124" stroke-width="2" stroke-dasharray="2 5"></circle>`}
  <path d="M44 70 A28 28 0 0 1 70 60" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"></path></svg>`;
const dishSvg = (run, f, disp, key) => svg`<svg class="apill" viewBox="0 0 128 150" aria-hidden="true"><defs>
  <linearGradient id=${'db' + key} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E4E6E3"></stop><stop offset=".5" stop-color="#C3C7C3"></stop><stop offset="1" stop-color="#8F948F"></stop></linearGradient></defs>
  <rect x="10" y="4" width="108" height="142" rx="10" fill=${'url(#db' + key + ')'}></rect><rect x="10" y="4" width="108" height="22" rx="10" fill="#2A2E30"></rect><rect x="10" y="18" width="108" height="8" fill="#2A2E30"></rect>
  <rect x="20" y="10" width="38" height="8" rx="2" fill="#121516"></rect><text x="39" y="16.5" fill=${run ? '#9CC2FF' : '#5B6266'} font-size="6.5" font-family="ui-monospace,monospace" text-anchor="middle">${disp || '--:--'}</text>
  ${[0, 1, 2, 3].map((i) => svg`<circle cx=${72 + i * 11} cy="14" r="2.6" fill=${run && i === 1 ? '#8FB8FF' : '#4A5054'}></circle>`)}
  <rect x="40" y="36" width="48" height="6" rx="3" fill="#9DA29E" stroke="#7E837F"></rect><path d="M14 30 H114" stroke="#fff" stroke-opacity=".25"></path>
  ${run ? svg`<rect x="20" y="132" width="88" height="3" rx="1.5" fill="#25292B"></rect>${f != null ? svg`<rect class="apb" x="20" y="132" width=${(88 * Math.max(0.03, f)).toFixed(0)} height="3" rx="1.5"></rect>` : svg`<rect class="apb spinb" x="20" y="132" width="26" height="3" rx="1.5"></rect>`}<path class="apglow" d="M12 146 h104" stroke-width="2"></path>` : nothing}
  <path d="M20 50 L40 140" stroke="#fff" stroke-opacity=".12" stroke-width="10"></path></svg>`;
const robotSvg = (bat, on, key) => { const f = bat != null ? Math.max(0, Math.min(1, bat / 100)) : 0; return svg`<svg class="robill" viewBox="0 0 128 128" aria-hidden="true"><defs>
  <radialGradient id=${'rb' + key} cx=".4" cy=".3"><stop offset="0" stop-color="#3A3F42"></stop><stop offset="1" stop-color="#121516"></stop></radialGradient>
  <radialGradient id=${'rt' + key} cx=".4" cy=".35"><stop offset="0" stop-color="#5A6064"></stop><stop offset="1" stop-color="#1E2224"></stop></radialGradient></defs>
  <circle cx="64" cy="64" r="60" fill="none" stroke="var(--line2)" stroke-width="4"></circle>
  ${bat != null ? svg`<circle class=${'rbat' + (f <= 0.2 ? ' low' : '')} cx="64" cy="64" r="60" fill="none" stroke-width="4" stroke-linecap="round" stroke-dasharray=${(f * 377).toFixed(0) + ' 378'} transform="rotate(-90 64 64)"></circle>` : nothing}
  <g class=${on ? 'rspin' : ''}><circle cx="64" cy="64" r="48" fill=${'url(#rb' + key + ')'} stroke="#2C3133" stroke-width="2"></circle><path d="M28 50 A40 40 0 0 1 100 50" stroke="#fff" stroke-opacity=".12" stroke-width="5" fill="none" stroke-linecap="round"></path>
  <circle cx="64" cy="56" r="13" fill=${'url(#rt' + key + ')'} stroke="#33393C"></circle><circle class="reye" cx="64" cy="56" r="4"></circle>
  <path d="M36 82 Q64 96 92 82" stroke="#2E3436" stroke-width="3" fill="none"></path><circle class="reye" cx="54" cy="86" r="2"></circle><circle cx="64" cy="88" r="2" fill="#4A5054"></circle><circle cx="74" cy="86" r="2" fill="#4A5054"></circle></g></svg>`; };
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
// Owner 2026-11-21: doors and windows show as open/closed drawings. The door leaf swings on its hinge, the window
// sashes open outwards; a warm light shows through the gap. CSS in styles.js (.opi); still under reduced motion.
// Energy rows (owner 2026-11-21): a drawn icon per consumer, guessed from its name in any language; plug otherwise.
const DEV_IC = [['tv', /\btv\b|fernseh|televis|ps5|playstation|xbox|beamer|projektor|projetor|monitor/i], ['fridge', /k(ü|ue)hl|gefrier|fridge|freezer|geladeira|congelador/i],
  ['wifi', /router|fritz|modem|internet|wlan|wi-?fi|mesh|switch/i], ['washer', /wasch(?!becken)|washer|washing|lavar|lavadora|trockner|dryer|secadora/i], ['dish', /sp(ü|ue)l|dish|lou(ç|c)a/i],
  ['coffee', /kaffee|coffee|caf(é|e)|espresso|nespresso/i], ['robot', /robo|roomba|saug|vacuum|aspirador|isg/i], ['speaker', /alexa|echo|sonos|speaker|lautsprecher|caixa de som|homepod/i],
  ['bulb', /licht|lamp|led|light|luz|leuchte/i], ['flame', /heiz|heater|ofen|oven|airfryer|fritadeira|mikrow|microw|toaster|herd|kocher|fogão|forno/i], ['note', /klavier|piano|keyboard/i], ['wind', /f(ö|oe)hn|hair ?dryer|secador|ventil|fan\b/i]];
const devIc = (name) => (DEV_IC.find(([, re]) => re.test(String(name || ''))) || ['plug'])[0];
const opIc = (door, open, cls = 'i') => door
  ? svg`<svg class=${cls + ' opi door' + (open ? ' open' : '')} viewBox="0 0 24 24" aria-hidden="true"><rect class="gap" x="6" y="3.5" width="12" height="17" rx=".5"></rect><path d="M5 21V3h14v18M3 21h18"></path><g class="leaf"><path d="M6 20.5v-17h12v17z"></path><path d="M15.2 12.2h.01"></path></g></svg>`
  : svg`<svg class=${cls + ' opi win' + (open ? ' open' : '')} viewBox="0 0 24 24" aria-hidden="true"><rect class="gap" x="4.5" y="3.5" width="15" height="17"></rect><path d="M3.5 3h17v18h-17z"></path><g class="sl"><path d="M4.5 4h7.5v16H4.5zM4.5 12H12"></path></g><g class="sr"><path d="M12 4h7.5v16H12zM12 12h7.5"></path></g></svg>`;
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
    // Owner cards (HA / HACS) need every hass update, like in a normal HA dashboard.
    for (const v of (this._cardEls || new Map()).values()) if (v.el && v.el.hass !== this.hass) v.el.hass = this.hass;
    for (const el of [this._prevEl, this._cfgEl]) if (el && el.hass !== this.hass) el.hass = this.hass;
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
  // ── Edit everything (owner 2026-11-18, "editar todos e qualquer coisa … mover, adicionar, remover, trocar nome") ──
  // Page blocks can be moved, hidden and (where they have a title) renamed; hero parts can be hidden; the greeting can
  // be rewritten. Everything lives in prefs.layout, so it syncs to every device; "Restaurar" brings the default back.
  _layout() { return this._prefs.layout || {}; }
  _saveLayout(patch) { this._save({ layout: { ...this._layout(), ...patch } }); }
  _blockOrder() {
    const def = ['pushes', 'hero', 'scenes', 'live', 'music', 'mycards', 'devices'], o = (this._layout().order || []).filter((k) => def.includes(k));
    return [...o, ...def.filter((k) => !o.includes(k))];
  }
  _title(key, def) { return (this._layout().names || {})[key] || def; }
  _moveBlock(k, d) { const o = this._blockOrder(), i = o.indexOf(k), j = i + d; if (j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; this._saveLayout({ order: o }); }
  renameField(key, def, t) {
    const ui = this._ui;
    if (ui.renaming !== key) return html`<button class="ib sm" aria-label=${t('rename') + ' · ' + this._title(key, def)} title=${t('rename')} @click=${() => this._set({ renaming: key, rdraft: this._title(key, def) })}>${ic('pencil', 'i s')}</button>`;
    const done = (v) => { const names = { ...(this._layout().names || {}) }; const x = (v ?? '').trim(); if (!x || x === def) delete names[key]; else names[key] = x; this._saveLayout({ names }); this._set({ renaming: null }); };
    return html`<span class="rnbox"><input .value=${ui.rdraft || ''} aria-label=${t('rename')} @input=${(e) => this._set({ rdraft: e.target.value })} @keydown=${(e) => { if (e.key === 'Enter') done(e.target.value); if (e.key === 'Escape') this._set({ renaming: null }); }}>
      <button class="ib sm" style="color:var(--accent)" aria-label=${t('save')} @click=${() => done(ui.rdraft)}>${ic('check', 'i s')}</button>
      <button class="ib sm ghost" aria-label=${t('stDefault')} title=${t('stDefault')} @click=${() => done('')}>${ic('x', 'i s')}</button></span>`;
  }
  blk(k, ctx, render) {
    const { t } = ctx, ui = this._ui, L = this._layout(), hidden = !!(L.hidden || {})[k];
    if (!ui.edit) return hidden || !render ? nothing : render();
    const o = this._blockOrder(), i = o.indexOf(k);
    const names = { pushes: t('reminders'), hero: t('blkHero'), scenes: t('scenes'), live: t('now'), music: 'AUREON Music', mycards: t('myCards'), devices: t('blkDevices') };
    const renamable = { scenes: t('scenes'), live: t('now'), mycards: t('myCards') };
    return html`<div class=${'blk' + (hidden ? ' off' : '')}>
      <div class="blkbar" role="group" aria-label=${names[k]}>
        <span class="eyebrow grow txt">${renamable[k] ? this._title(k, renamable[k]) : names[k]}${hidden ? ' · ' + t('blkHidden') : ''}</span>
        ${renamable[k] && !hidden ? this.renameField(k, renamable[k], t) : nothing}
        <button class="ib sm" ?disabled=${i === 0} aria-label=${t('sectionUp') + ' · ' + names[k]} @click=${() => this._moveBlock(k, -1)}>${ic('up', 'i s')}</button>
        <button class="ib sm" ?disabled=${i === o.length - 1} aria-label=${t('sectionDown') + ' · ' + names[k]} @click=${() => this._moveBlock(k, 1)}>${ic('down', 'i s')}</button>
        <button class="ib sm" aria-pressed=${hidden ? 'true' : 'false'} aria-label=${(hidden ? t('blkShow') : t('blkHide')) + ' · ' + names[k]} title=${hidden ? t('blkShow') : t('blkHide')} @click=${() => this._saveLayout({ hidden: { ...(L.hidden || {}), [k]: !hidden } })}>${ic(hidden ? 'eyeOff' : 'eye', 'i s')}</button>
      </div>
      ${hidden || !render ? nothing : render()}</div>`;
  }
  // ── Own cards: HA built-ins and HACS cards (owner 2026-11-18, edit stage 2) ─────────────────────────────────
  _cards() { return this._layout().cards || []; }
  _saveCards(cards) { this._saveLayout({ cards }); }
  _cardEl(c) {
    const json = JSON.stringify(c.config), cache = (this._cardEls ||= new Map()), hit = cache.get(c.id);
    if (hit && hit.json === json) return hit.el || hit.ph;
    const ph = document.createElement('div'); ph.className = 'cardph';
    cache.set(c.id, { json, el: null, ph });
    createCard(c.config, this.hass).then((el) => { const cur = cache.get(c.id); if (cur && cur.json === json) { cur.el = el; this.requestUpdate(); } })
      .catch(() => { const cur = cache.get(c.id); if (cur) { cur.ph.textContent = '⚠ ' + c.config.type; cur.ph.classList.add('err'); } });
    return ph;
  }
  myCards(ctx) {
    const { t } = ctx, ui = this._ui, cards = this._cards();
    if (!cards.length && !ui.edit) return nothing;
    const move = (i, d) => { const a = cards.slice(), j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; this._saveCards(a); };
    return html`<section class="sec" aria-label=${this._title('mycards', t('myCards'))}>
      <h2 class="eyebrow" style="margin:0;padding:0 4px;font-weight:400">${this._title('mycards', t('myCards'))}</h2>
      ${cards.length ? html`<div class="mycards">${repeat(cards, (c) => c.id, (c, i) => html`<div class=${'mycard' + (c.wide ? ' wide' : '')}>
        ${ui.edit ? html`<div class="mcbar"><span class="eyebrow grow txt">${c.config.type.replace('custom:', '')}</span>
          <button class="ib sm" ?disabled=${i === 0} aria-label=${t('moveBack')} @click=${() => move(i, -1)}>${ic('up', 'i s')}</button>
          <button class="ib sm" ?disabled=${i === cards.length - 1} aria-label=${t('moveFwd')} @click=${() => move(i, 1)}>${ic('down', 'i s')}</button>
          <button class="ib sm" aria-pressed=${c.wide ? 'true' : 'false'} aria-label=${t('cardWide')} title=${t('cardWide')} @click=${() => this._saveCards(cards.map((x) => (x.id === c.id ? { ...x, wide: !x.wide } : x)))}>${ic('grip', 'i s')}</button>
          <button class="ib sm" aria-label=${t('cardEdit')} title=${t('cardEdit')} @click=${() => this._openCardEditor(c)}>${ic('pencil', 'i s')}</button>
          <button class="ib sm" aria-label=${t('cardRemove')} title=${t('cardRemove')} @click=${() => { if (confirm(t('cardRemoveQ'))) this._saveCards(cards.filter((x) => x.id !== c.id)); }}>${ic('x', 'i s')}</button></div>` : nothing}
        ${this._cardEl(c)}</div>`)}</div>` : nothing}
      ${ui.edit ? html`<button class="btn addcard" @click=${() => this._set({ cardEd: { id: null, step: 'pick', q: '' } })}>${ic('plus', 'i s')}${t('addCard')}</button>` : nothing}
    </section>`;
  }
  async _openCardEditor(card, type) {
    const config = card ? card.config : await stubConfig(type, this.hass);
    this._set({ cardEd: { id: card?.id || null, step: 'cfg', config, yaml: toYaml(config), err: '' } });
    this._cfgEl = null; this._prevEl = null; this._prevJson = '';
    const el = await configElement(config.type, this.hass);
    if (el) {
      try { el.setConfig(config); } catch { /* the YAML box still works */ }
      el.addEventListener('config-changed', (e) => { const c = e.detail?.config; if (c) this._setCardCfg({ ...c, type: c.type || config.type }, true); });
      this._cfgEl = el; this.requestUpdate();
    }
  }
  _setCardCfg(config, fromVisual) {
    const ed = this._ui.cardEd; if (!ed) return;
    this._set({ cardEd: { ...ed, config, yaml: toYaml(config), err: '' } });
    if (!fromVisual && this._cfgEl) { try { this._cfgEl.setConfig(config); } catch { /* fine */ } }
  }
  _preview(config) {
    const json = JSON.stringify(config);
    if (json !== this._prevJson) {
      this._prevJson = json; clearTimeout(this._prevT);
      this._prevT = setTimeout(() => createCard(config, this.hass).then((el) => { if (this._prevJson === json) { this._prevEl = el; this.requestUpdate(); } }).catch(() => {}), 300);
    }
    return this._prevEl || html`<div class="cardph"></div>`;
  }
  cardEditor({ t }) {
    const ed = this._ui.cardEd, close = () => { this._set({ cardEd: null }); this._cfgEl = null; this._prevEl = null; };
    let body;
    if (ed.step === 'pick') {
      const q = (ed.q || '').toLowerCase(), inst = installedCards(), bi = BUILTIN_CARDS.map(([k, n]) => ({ type: k, name: n, description: '' }));
      const f = (l) => l.filter((c) => !q || (c.name + ' ' + c.type + ' ' + c.description).toLowerCase().includes(q));
      const item = (c) => html`<button class="cpick" @click=${() => this._openCardEditor(null, c.type)}><b>${c.name}</b><small>${c.description || c.type.replace('custom:', '')}</small></button>`;
      body = html`<input type="search" class="cq" .value=${ed.q || ''} placeholder=${t('cardSearch')} aria-label=${t('cardSearch')} @input=${(e) => this._set({ cardEd: { ...ed, q: e.target.value } })}>
        <span class="eyebrow" style="font-size:10px">${t('cardsInstalled')} · ${f(inst).length}</span>
        ${inst.length ? html`<div class="cpicks">${f(inst).map(item)}</div>` : html`<span class="muted txt" style="font-size:13px">${t('cardsNoneInstalled')}</span>`}
        <span class="eyebrow" style="font-size:10px">${t('cardsBuiltin')}</span>
        <div class="cpicks">${f(bi).map(item)}</div>`;
    } else {
      body = html`<div class="cedit">
        <div class="cprev"><span class="eyebrow" style="font-size:10px">${t('cardPreview')}</span>${this._preview(ed.config)}</div>
        <div class="ccfg">${this._cfgEl ? html`<span class="eyebrow" style="font-size:10px">${t('cardVisual')}</span>${this._cfgEl}` : nothing}
          <span class="eyebrow" style="font-size:10px">YAML</span>
          <textarea class="cyaml" spellcheck="false" .value=${ed.yaml} aria-label="YAML" @input=${(e) => { try { const c = fromYaml(e.target.value); this._set({ cardEd: { ...this._ui.cardEd, config: c, yaml: e.target.value, err: '' } }); if (this._cfgEl) { try { this._cfgEl.setConfig(c); } catch { /* fine */ } } } catch (er) { this._set({ cardEd: { ...this._ui.cardEd, yaml: e.target.value, err: t('cardYamlErr') } }); } }}></textarea>
          ${ed.err ? html`<span class="cerr" role="alert">${ed.err}</span>` : nothing}</div></div>
        <div class="row" style="gap:8px;justify-content:flex-end;flex-wrap:wrap">
          ${!ed.id ? html`<button class="btn" @click=${() => this._set({ cardEd: { id: null, step: 'pick', q: '' } })}>${ic('left', 'i s')}${t('goBack')}</button>` : nothing}
          <button class="btn" @click=${close}>${t('cancel')}</button>
          <button class="btn pri" ?disabled=${!!ed.err} @click=${() => { const cards = this._cards(); this._saveCards(ed.id ? cards.map((c) => (c.id === ed.id ? { ...c, config: ed.config } : c)) : [...cards, { id: 'c' + Date.now().toString(36), config: ed.config }]); close(); }}>${t('save')}</button></div>`;
    }
    return html`<div class="overlay" @click=${(e) => { if (e.target === e.currentTarget) close(); }}>
      <div class="sheet rise" role="dialog" aria-modal="true" aria-label=${ed.id ? t('cardEdit') : t('addCard')} style="width:min(860px,100%)">
        <div class="row sp" style="gap:10px"><span style="font-size:24px;font-weight:300;letter-spacing:-.03em">${ed.id ? t('cardEdit') : t('addCard')}</span>
          <button class="ib sm stclose" aria-label=${t('closeS')} @click=${close}>${ic('x', 'i s')}</button></div>
        ${body}</div></div>`;
  }
  // A hero part (date, clock, greeting, people, weather, house mode, map): hidden outside edit mode, dimmed with an eye in it.
  hp(key, content, t, extra) {
    const hid = !!(this._layout().heroHidden || {})[key];
    if (!this._ui.edit) return hid ? nothing : content;
    return html`<div class=${'hp' + (hid ? ' off' : '')}><span class="hpbar">${extra || nothing}<button class="ib sm" aria-pressed=${hid ? 'true' : 'false'} aria-label=${(hid ? t('blkShow') : t('blkHide')) + ' · ' + t('hp_' + key)} title=${t('hp_' + key)} @click=${() => this._saveLayout({ heroHidden: { ...(this._layout().heroHidden || {}), [key]: !hid } })}>${ic(hid ? 'eyeOff' : 'eye', 'i s')}</button></span>${content}</div>`;
  }
  secHead(key, title, sub, extra, t) {
    // Owner 2026-11-16: every section folds with a tap on its title; the choice is remembered.
    const defTitle = title; title = this._title('sec_' + key, title);
    const closed = !this._ui.musicPage && !this._ui.edit && !!(this._prefs.secClosed || {})[key];
    return html`<div class=${'sech' + (closed ? ' closed' : '')}><h2 class="h2"><button class="sectog" aria-expanded=${closed ? 'false' : 'true'} @click=${() => this._save({ secClosed: { ...(this._prefs.secClosed || {}), [key]: !closed } })}><span class="txt">${title} ${sub ? html`<small>${sub}</small>` : nothing}</span><span class="secchev" aria-hidden="true">${ic('down', 'i s')}</span></button></h2>
      <div class="wrapRow" style=${closed ? 'display:none' : ''}>${this._ui.edit && typeof defTitle === 'string' ? this.renameField('sec_' + key, defTitle, t) : nothing}${this._ui.edit ? html`<button class="ib sm" aria-label=${t('sectionUp') + ' · ' + title} @click=${() => this._moveSection(key, -1)}>${ic('up', 'i s')}</button><button class="ib sm" aria-label=${t('sectionDown') + ' · ' + title} @click=${() => this._moveSection(key, 1)}>${ic('down', 'i s')}</button>` : nothing}${extra || nothing}</div></div>`;
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
      lights: m.lights.length, climate: m.climate.length, plugs: m.plugs.length, energy: m.metered.length || m.loosePower.length || m.energyMeters.length || m.solarW != null || m.energyToday != null,
      covers: m.covers.length, openings: m.openings.length, security: m.cams.length + m.locks.length + m.alarms.length, tv: m.tvs.length, music: m.speakers.length || m.accounts.length
    };
    const secRender = { lights: () => this.sLights(ctx), climate: () => this.sClimate(ctx), plugs: () => this.sPlugs(ctx), energy: () => this.sEnergy(ctx), covers: () => this.sCovers(ctx), openings: () => this.sOpenings(ctx), security: () => this.sSecurity(ctx), tv: () => this.sTV(ctx), music: () => this.sMusic(ctx) };
    const secs = prefs.secOrder.filter((k) => show[k] && !(prefs.secHidden || []).includes(k) && (ui.domain === 'all' || ui.domain === k));
    // Owner 2026-11-18: AUREON Music sits above the room / device chips — the chips belong to the device sections.
    const musicTop = show.music && !(prefs.secHidden || []).includes('music');
    return html`<div lang=${lang} class="page ${ui.edit ? 'editing' : ''}" style=${vars + pagebg} @click=${(e) => { if (ui.themeOpen && !e.composedPath().some((n) => n.classList?.contains('themeWrap'))) this._set({ themeOpen: false }); if (ui.alarmOpen && !e.composedPath().some((n) => n.classList?.contains('alw'))) this._set({ alarmOpen: false, alarmCode: '' }); }}>
      <div class="wrap">
        ${ui.musicPage ? html`<div class="mpage">
          <div class="mpbar"><button class="btn sm" @click=${() => this._musicPage(false)}>${ic('left', 'i s')}${t('backHome')}</button></div>
          ${this.sMusic(ctx, true)}</div>` : html`
        ${this.header(ctx)}
        ${ui.edit ? this.banner(t) : nothing}
        ${ui.modeSheet ? this.modeSheet(ctx, this._modeDefs(t).find((d) => d.id === ui.modeSheet)) : nothing}
        ${this._blockOrder().map((k) => this.blk(k, ctx, {
          pushes: () => this.pushes(ctx),
          hero: () => this.hero(ctx),
          scenes: () => (m.scenes.length ? this.scenes(ctx) : nothing),
          live: () => this.live(ctx),
          music: () => (musicTop ? secRender.music() : nothing),
          mycards: () => this.myCards(ctx),
          devices: () => html`${this.filters(ctx, show)}
            ${ui.room !== 'all' ? this.roomHead(ctx) : nothing}
            ${secs.filter((k2) => k2 !== 'music').map((k2) => secRender[k2]())}
            ${!secs.filter((k2) => k2 !== 'music').length ? html`<div class="empty">${t('nothingHere')}</div>` : nothing}`
        }[k]))}`}
      </div>
      ${ui.settings ? this.settings(ctx) : nothing}
      ${ui.battOpen ? this.battSheet(ctx) : nothing}
      ${ui.cardEd ? this.cardEditor(ctx) : nothing}
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
    return html`<header class="top">
      <span class="wordmark">AUREON</span>
      <div class="wrapRow" style="justify-content:flex-end">
        <button class="btn" aria-label=${t('settings')} @click=${() => this._set({ settings: 'home', themeOpen: false })}>${ic('gear', 'i s')}<span class="hideNarrow">${t('settings')}</span></button>
        <button class=${'btn' + (ui.edit ? ' pri' : '')} aria-pressed=${ui.edit ? 'true' : 'false'} @click=${() => this._set({ edit: !ui.edit, editing: null, confirm: null })}>${ic('pencil', 'i s')}${ui.edit ? t('doneEdit') : t('edit')}</button>
        ${m.batteries.length ? this.battChip({ m, t }) : nothing}
        ${m.metered.length || m.loosePower.length ? html`<span class="chip">${svg`<svg class="i s" viewBox="0 0 24 24" aria-hidden="true" style="color:var(--accent)"><path d=${P.bolt}></path></svg>`}${m.liveW} W</span>` : nothing}
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
        <button class="btn sm pri" @click=${() => this._set({ cardEd: { id: null, step: 'pick', q: '' } })}>${ic('plus', 'i s')}${t('addCard')}</button>
        <button class="btn sm" @click=${() => this._set({ showHidden: !ui.showHidden })}>${ic(ui.showHidden ? 'eyeOff' : 'eye', 'i s')}${ui.showHidden ? t('hideHidden') : t('showHidden')}</button>
        <button class="btn sm" @click=${() => { if (confirm(t('layoutResetQ'))) this._save({ order: {}, secOrder: SECTIONS.slice(), hidden: [], layout: {} }); }}>${ic('undo', 'i s')}${t('reset')}</button>
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
    const autoGreet = (hr < 5 ? t('evening') : hr < 12 ? t('morning') : hr < 18 ? t('afternoon') : t('evening')) + (user ? ', ' + user : '') + '.';
    const custom = (this._layout().names || {}).greet, greet = custom ? custom.replace(/\{(nome|name)\}/gi, user) : autoGreet;
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
        <div class="hmL">${this.hp('house', this.houseMenu(ctx, 'L'), t)}</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${this.hp('date', html`<span class="eyebrow">${date}</span>`, t)}${this.hp('clock', html`<span class="clock">${time}</span>`, t)}
          ${this.hp('greet', ui.renaming === 'greet' ? html`<span class="row" style="gap:8px;flex-wrap:wrap">${this.renameField('greet', '', t)}<span class="dim" style="font-size:11px">${t('greetHint')}</span></span>` : html`<h1 class="greet txt">${greet}</h1>`, t, ui.edit && ui.renaming !== 'greet' ? html`<button class="ib sm" aria-label=${t('rename') + ' · ' + t('hp_greet')} @click=${() => this._set({ renaming: 'greet', rdraft: custom || autoGreet.replace(user, '{nome}') })}>${ic('pencil', 'i s')}</button>` : nothing)}
          ${m.people.length ? this.hp('people', html`<div class="ppl" role="list" aria-label=${t('homePeople')}>${m.people.slice(0, 6).map((p) => { const pic = p.attrs.entity_picture, home = p.state === 'home';
            const where = home ? t('homeS') : p.etaMin != null && p.etaMin <= 60 ? t('onTheWay', { m: p.etaMin }) : p.state === 'not_home' ? t('awayS') : p.state === 'unknown' || p.state === 'unavailable' ? '—' : p.state;
            return html`<button class=${'pp' + (home ? ' home' : p.etaMin != null ? ' coming' : '')} role="listitem" aria-label=${p.name + ' · ' + where + ' · ' + t('showMap')} @click=${() => this._moreInfo(p.id)}><span class="ppav" style=${pic ? `background-image:url("${this._url(pic)}");color:transparent` : ''}>${(p.name || '?').charAt(0)}</span><span class="txt"><b>${p.name}</b><small>${where}</small></span>${!home && p.attrs.latitude != null ? html`<span class="ppmap" aria-hidden="true">${ic('mapI', 'i s')}</span>` : nothing}</button>`; })}</div>`, t) : nothing}
          ${this.hp('weather', m.weather ? this.weatherBlock(ctx) : html`<p class="story txt">${parts.join(', ')}.</p>`, t)}
        </div>
      </div>
      <div class="heroR">
        <div class="row" style="flex-wrap:wrap;gap:8px;justify-content:flex-end">
          <span class="row" style="gap:8px;flex-wrap:wrap"><span class="hmR">${this.hp('house', this.houseMenu(ctx), t)}</span>
          <span class="seg" role="group" aria-label=${t('house3d') + ' / ' + t('plan')}>
            <button aria-pressed=${is3d ? 'true' : 'false'} @click=${() => this._save({ view: '3d' })}>3D</button>
            <button aria-pressed=${!is3d ? 'true' : 'false'} @click=${() => this._save({ view: '2d' })}>${t('plan').toUpperCase()}</button></span></span></div>
        ${this.hp('map', is3d ? html`<div class="stage" role="group" aria-label=${t('house3d')}><div class="iso"><div class="ground" aria-hidden="true"></div>
          ${layout.map((r) => this.room3d(r, ctx))}</div>
          <div class="lbls" aria-hidden="true">${layout.map((r) => this.label3d(r, ctx))}</div></div>`
          : html`<div class=${'plan2d ps-' + (prefs.planStyle || 'b')} role="group" aria-label=${t('plan')}>${layout.map((r) => this.room2d(r, ctx))}</div>`, t)}
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
  // Owner 2026-11-18 ("o modo planta … deixando a desejar"): the plan draws rooms as a floor plan; colour and glow
  // come from CSS variables (--rgb light colour, --k brightness) so each style stays in the stylesheet.
  room2d(r, { m, t }) {
    const a = r.area, L = this._roomLook(a, m), sel = this._ui.room === a.id;
    const cls = 'r2' + (L.lit ? ' lit' : '') + (a.outdoor ? ' out' : '') + (sel ? ' sel' : '');
    return html`<button class=${cls} aria-pressed=${sel ? 'true' : 'false'} aria-label=${`${a.name}: ${t('ofOn', { a: L.on.length, b: L.ls.length })}`} @click=${() => this._pickRoom(sel ? 'all' : a.id)}
      style=${`left:calc(${r.x}% + var(--g));top:calc(${r.y}% + var(--g));width:calc(${r.w}% - 2 * var(--g));height:calc(${r.h}% - 2 * var(--g));--rgb:${L.rgb};--k:${L.k.toFixed(2)}`}>
      <span class="pool" aria-hidden="true"></span>
      <span class="n">${a.name}</span>
      ${L.temp != null ? html`<span class="tp">${L.temp.toFixed(1).replace('.', ',')}<small>°</small></span>` : html`<span class="tp none"></span>`}
      <span class="mt"><span class=${'lc' + (L.lit ? ' on' : '')}>${ic('bulb', 'i s')}${L.on.length}/${L.ls.length}</span><span class="dots">${L.dots.map((c) => html`<i style=${'background:' + c}></i>`)}</span></span></button>`;
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
    const kinds = this._prefs.reminderKinds || {}, rkOn = (k) => reminderOn(kinds, k);
    if (rkOn('lights')) for (const l of m.lights) if (l.on && !l.hidden && this._rulesOk('lights', l)) (byRoom[l.area] ||= []).push(l);
    const heatingRooms = new Set(m.climate.filter((c) => c.action === 'heating').map((c) => c.area));
    for (const [area, ls] of Object.entries(byRoom).sort((a, b) => b[1].length - a[1].length)) {
      const room = ls[0].areaName || t('noArea');
      list.push({ key: 'L:' + area + ':' + ls.map((l) => l.id).join(','), icon: 'bulb', tone: 'var(--accent)', title: ls.length === 1 ? t('lightRoom', { r: room }) : t('lightsRoom', { n: ls.length, r: room }), body: ls.map((l) => l.name).join(' · '), action: t('turnOff'), act: () => this._call('light', 'turn_off', { entity_id: ls.map((l) => l.id) }) });
    }
    for (const o of m.openings.filter((x) => rkOn('openings') && x.open && !x.hidden && this._rulesOk('openings', x))) {
      const mins = Math.max(0, Math.round((now - Date.parse(o.st.last_changed)) / 60000));
      const heat = heatingRooms.has(o.area);
      list.push({ key: 'O:' + o.id + ':' + o.st.last_changed, icon: o.door ? 'door' : 'win', tone: heat ? '#FF9A5A' : 'var(--accent)', title: t('openedIn', { n: o.name, r: o.areaName }), body: t('since', { t: mins < 60 ? mins + ' ' + t('min') : Math.round(mins / 60) + ' h' }) + (heat ? ' · ' + t('heatingWaste') : ''), action: t('okS'), act: null });
    }
    for (const l of m.locks.filter((x) => rkOn('locks') && !x.locked && !x.unavailable)) list.push({ key: 'K:' + l.id + ':' + l.st.last_changed, icon: 'unlock', tone: '#FF8A80', title: t('unlockedN', { n: l.name }), body: l.areaName, action: t('lockS'), act: () => this._call('lock', 'lock', { entity_id: l.id }) });
    for (const a of m.appliances.filter((x) => rkOn('appliances') && x.done)) list.push({ key: 'A:' + a.id + ':' + a.status, icon: a.kind === 'dish' ? 'dish' : 'washer', tone: 'var(--accent)', title: t('finished', { n: a.name }), body: t('cycleDone') + (a.areaName ? ' · ' + a.areaName : ''), action: t('okS'), act: null });
    for (const p of m.people.filter((x) => rkOn('arrivals') && x.etaMin != null && x.etaMin <= 30 && x.state !== 'home' && x.id !== this._meId())) list.unshift({ key: 'P:' + p.id + ':' + Math.round(p.etaMin / 5), icon: 'home', tone: '#7EE0A8', title: t('arriving', { n: p.name, m: p.etaMin }), body: t('arrivingBody', { d: p.distM >= 1000 ? (p.distM / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(p.distM) + ' m' }), action: t('okS'), act: null });
    const nb = m.waste[0];
    if (rkOn('waste') && nb && nb.days <= 1 && !ack[nb.date + nb.type]) list.push({ key: 'W:' + nb.date + nb.type, icon: 'trash', tone: binColor(nb.type), title: shortBin(nb.type), body: nb.days === 0 ? t('wasteToday') : t('wasteTomorrow'), action: t('doneS'), act: () => this._save({ wasteAck: { ...ack, [nb.date + nb.type]: true } }) });
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

  // ── batteries (owner 2026-11-18) ─────────────────────────────────────────
  // A battery glyph that shows the level: red practically empty, yellow critical, green charged.
  battGlyph(b, big) {
    const col = { red: '#FF6B6B', yellow: '#F2C14E', green: '#6FD49A' }[b.tone], f = b.level != null ? Math.max(0.08, b.level / 100) : (b.low ? 0.1 : 1);
    const w = big ? 34 : 22, h = big ? 16 : 11;
    return svg`<svg class="bglyph" width=${w} height=${h} viewBox="0 0 34 16" aria-hidden="true"><rect x="1" y="1" width="28" height="14" rx="3.5" fill="none" stroke=${col} stroke-opacity=".55" stroke-width="1.5"></rect><rect x="30.5" y="5" width="2.5" height="6" rx="1" fill=${col} fill-opacity=".55"></rect><rect x="3.5" y="3.5" width=${(23 * f).toFixed(1)} height="9" rx="2" fill=${col}></rect></svg>`;
  }
  battChip({ m, t }) {
    const need = m.batteries.filter((b) => b.tone !== 'green'), worst = m.batteries[0];
    const tone = worst.tone, label = need.length ? t('battNeed', { n: need.length }) : t('battAllOk');
    return html`<button class=${'chip bchip ' + tone} aria-label=${t('batteries') + ' · ' + label} @click=${() => this._set({ battOpen: true })}>${this.battGlyph(worst)}<span class="hideNarrow">${need.length ? need.length : t('battOkShort')}</span></button>`;
  }
  battSheet({ m, t }) {
    const groups = [['red', t('battEmpty'), t('battEmptyHint')], ['yellow', t('battLow'), t('battLowHint')], ['green', t('battOk'), '']];
    return html`<div class="overlay" @click=${(e) => { if (e.target === e.currentTarget) this._set({ battOpen: false }); }}>
      <div class="sheet rise bsheet" role="dialog" aria-modal="true" aria-label=${t('batteries')}>
        <div class="row sp" style="gap:10px"><span style="font-size:24px;font-weight:300;letter-spacing:-.03em">${t('batteries')}</span>
          <button class="ib sm stclose" aria-label=${t('closeS')} @click=${() => this._set({ battOpen: false })}>${ic('x', 'i s')}</button></div>
        <div class="bsum">${groups.map(([k, n]) => { const c = m.batteries.filter((b) => b.tone === k).length; return html`<span class=${'bs ' + k}><b>${c}</b><small>${n}</small></span>`; })}</div>
        ${groups.map(([k, n, hint]) => { const list = m.batteries.filter((b) => b.tone === k); if (!list.length) return nothing; return html`
          <span class=${'eyebrow bgh ' + k}>${n}${hint ? html` · <span style="text-transform:none;letter-spacing:0">${hint}</span>` : nothing}</span>
          <div class="blist">${list.map((b) => html`<button class=${'brow ' + b.tone} @click=${() => this._moreInfo(b.id)}>
            ${this.battGlyph(b, true)}<span class="grow txt"><b>${b.name}</b><small>${b.areaName || t('noArea')}</small></span>
            <span class="bpct">${b.level != null ? b.level + '%' : b.low ? t('battLowWord') : 'OK'}</span></button>`)}</div>`; })}
        <span class="dim txt" style="font-size:11px;text-align:center">${t('battFoot')}</span>
      </div></div>`;
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
  _modeEffect({ m, t }, d) {
    const c = this._modeCfg(d), e = [], alarm = m.alarms[0];
    if (alarm) e.push(d.id === 'home' ? t('effAlarmOff') : d.id === 'night' ? t('effAlarmNight') : t('effAlarmOn'));
    if (c.lightsOff) e.push(t('effLights'));
    const n = (c.plugs || []).filter((id) => m.plugs.some((p) => p.id === id && !p.locked)).length;
    if (n) e.push(n === 1 ? t('effPlug') : t('effPlugs', { n }));
    if (d.id === 'home' && c.restore && (this._prefs.modeOff || []).length) e.push(t('effRestore'));
    return e.join(' · ') || '—';
  }
  modes(ctx) {
    const { m, t } = ctx, defs = this._modeDefs(t), active = this._activeMode(m), alarm = m.alarms[0];
    const effect = (d) => this._modeEffect(ctx, d);
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
    // Owner 2026-11-22: a small round bell in the card's corner; green light = Alexa speaks when the cycle ends.
    // Tap = turn that automation on/off. Without an automation: a dim bell that opens the blueprints.
    return au ? html`<button class=${'alx' + (on ? ' on' : '')} role="switch" aria-checked=${on ? 'true' : 'false'} title=${t('alexaDone') + ': ' + t(on ? 'on' : 'off')} aria-label=${t('alexaDone') + ' · ' + a.name} @click=${() => this._call('automation', on ? 'turn_off' : 'turn_on', { entity_id: au.id })}>${ic('bell', 'i s')}<i aria-hidden="true"></i></button>`
      : html`<button class="alx setup" title=${t('alexaSetup')} aria-label=${t('alexaSetup') + ' · ' + a.name} @click=${() => { history.pushState(null, '', '/config/blueprint/dashboard'); window.dispatchEvent(new CustomEvent('location-changed')); }}>${ic('bell', 'i s')}${ic('plus', 'i s pl')}</button>`;
  }
  // Owner 2026-11-22 ("a sua ideia é ótima"): a machine measured only by a plug has no end time. The panel learns
  // how long a cycle usually takes from the plug's own statistics (5-minute means, last 10 days): every stretch above
  // the working power that ends with ≥ 10 min of rest is one cycle; the median of cycles ≥ 20 min is "typical".
  // Needs ≥ 2 cycles; re-read every 6 h. Read-only.
  _plugLearn(a) {
    const pid = a.powerIds?.[0]; if (!pid || !this.hass?.callWS) return null;
    this._pl ||= {}; const h = this._pl[a.id];
    if ((!h || Date.now() - h.at > 6 * 3600000) && !h?.busy) {
      this._pl[a.id] = { ...(h || {}), at: Date.now(), busy: true };
      const end = new Date(), start = new Date(end.getTime() - 10 * 86400000);
      this.hass.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(), end_time: end.toISOString(), statistic_ids: [pid], period: '5minute', types: ['mean', 'max'] })
        .then((res) => {
          const pts = (res?.[pid] || []).map((r) => ({ t: typeof r.start === 'number' ? r.start : Date.parse(r.start), v: Math.max(Number(r.mean) || 0, Number(r.max) >= PLUG_RUN_W * 3 ? PLUG_RUN_W : 0) })).filter((x) => Number.isFinite(x.t)).sort((x, y) => x.t - y.t);
          const runs = []; let run = null, low = 0;
          for (const p of pts) {
            if (p.v >= PLUG_RUN_W) { if (!run) run = { s: p.t, e: p.t + 300000 }; else run.e = p.t + 300000; low = 0; }
            else if (run) { low += 1; if (low >= 2) { runs.push(run); run = null; low = 0; } }
          }
          const mins = runs.map((r) => (r.e - r.s) / 60000).filter((d) => d >= 20 && d <= 360).sort((x, y) => x - y);
          const med = mins.length >= 2 ? mins[Math.floor(mins.length / 2)] : null;
          this._pl[a.id] = { at: Date.now(), busy: false, mins: med != null ? Math.round(med / 5) * 5 : null, n: mins.length };
        }).catch(() => { this._pl[a.id] = { at: Date.now(), busy: false, mins: null, n: 0 }; })
        .finally(() => this.requestUpdate());
    }
    const r = this._pl[a.id]; return r?.mins ? r : null;
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
      if (a.running && !r.end) {
        a.startAt = new Date(r.start); a.mins = null;
        const L = this._plugLearn(a);
        if (L) { const endMs = r.start + L.mins * 60000; a.estEnd = new Date(Math.max(endMs, now.getTime() + 60000)); a.estN = L.n; a.pct = Math.min(97, Math.max(2, Math.round(100 * (now - r.start) / (L.mins * 60000)))); }
      }
      else if (!a.running && r.end && now - r.end < 3 * 3600000 && (this._prefs.cycleAck || {})[a.id] !== r.end) { a.done = true; a.idle = false; a.endedAt = new Date(r.end); a.runEnd = r.end; a.status = 'plugdone'; }
    }
  }
  // Owner 2026-11-18 ("esse alarme é o nosso modo casa, não precisa repetir em baixo"): one elegant pill beside
  // 3D / Planta shows the active house mode (and the alarm state when there is one). It opens a small menu with the
  // modes; picking one opens the same confirmation sheet as before — nothing is switched until "Ativar" is tapped.
  houseMenu(ctx, slot = 'R') {
    const { m, t } = ctx, defs = this._modeDefs(t), active = this._activeMode(m), cur = defs.find((d) => d.id === active), a = m.alarms[0], open = this._ui.alarmOpen === slot;
    const st = a?.state, alert = st === 'triggered', armed = /^armed/.test(st || '') || (!a && active !== 'home');
    const sub = alert ? t('triggered') : /arming|pending/.test(st || '') ? t('alarmArming') : null;
    return html`<span class="alw">
      <button class=${'alp' + (armed ? ' on' : '') + (alert ? ' alert' : '')} aria-haspopup="menu" aria-expanded=${open ? 'true' : 'false'} aria-label=${t('modeTitle') + ' · ' + cur.name} @click=${(e) => { e.stopPropagation(); this._set({ alarmOpen: open ? false : slot }); }}>
        ${ic(a ? 'shield' : cur.icon, 'i s')}<span class="txt"><small>${t('modeTitle')}</small><b>${cur.name}${sub ? ' · ' + sub : ''}</b></span>${ic('down', 'i s alc')}</button>
      ${open ? html`<div class="alm rise" role="menu" @click=${(e) => e.stopPropagation()}>
        <span class="eyebrow" style="font-size:10px;padding:4px 8px 2px">${t('modeTitle')}${a ? ' · ' + a.name : ''}</span>
        ${defs.map((d) => html`<button role="menuitemradio" aria-checked=${d.id === active ? 'true' : 'false'} @click=${() => this._set({ alarmOpen: false, modeSheet: d.id, modeCode: '' })}>
          <span class="alic">${ic(d.icon, 'i s')}</span><span class="grow txt"><b>${d.name}</b><small>${this._modeEffect(ctx, d)}</small></span>${d.id === active ? ic('check', 'i s') : nothing}</button>`)}
        <button class="alset" @click=${() => this._set({ alarmOpen: false, settings: 'modos' })}>${ic('gear', 'i s')}${t('stHintModes')}</button>
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
  _moreInfo(id, view) { this.dispatchEvent(new CustomEvent('hass-more-info', { detail: view ? { entityId: id, view } : { entityId: id }, bubbles: true, composed: true })); }
  // Owner 2026-11-21 ("quando eu clico na tomada … colocar algum cômodo … para tudo no dashboard"): every device name
  // opens Home Assistant's details; without a room it opens straight on HA's settings, where the area is chosen.
  nmLink(d, inner, t) {
    const noArea = !d.area || !d.areaName, go = (e) => { e.stopPropagation(); this._moreInfo(d.id, noArea ? 'settings' : undefined); };
    return html`<span class="nmlink" role="button" tabindex="0" aria-label=${d.name + ' · ' + (noArea ? t('setRoom') : t('details'))} @click=${go} @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } }}>${inner}</span>`;
  }
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
    // Owner 2026-11-18 ("cada título tem que ter drop down … em todo lugar da configuração"): every settings heading
    // folds; what is folded is remembered (synced) per tab and heading.
    const fold = prefs.stFold || {};
    const grp = (key, title, content, defClosed = false) => { const k = tab + ':' + key, closed = fold[k] ?? defClosed;
      return html`<div class=${'sgrp' + (closed ? ' closed' : '')}><button class="stgh" aria-expanded=${closed ? 'false' : 'true'} @click=${() => this._save({ stFold: { ...(this._prefs.stFold || {}), [k]: !closed } })}><span class="eyebrow">${title}</span>${ic('down', 'i s')}</button>${closed ? nothing : html`<div class="stgb">${content}</div>`}</div>`; };
    const hints = { geral: t('stHintGeneral'), modos: t('stHintModes'), aparelhos: t('stHintAppl'), secoes: t('stHintSections'), etiquetas: t('stHintLabels'), dispositivos: t('stHintDevices'), sobre: t('stHintAbout') };
    const icons = { geral: 'palette', modos: 'home', aparelhos: 'washer', secoes: 'sections', etiquetas: 'eye', dispositivos: 'plug', sobre: 'gear' };
    if (tab === 'home') {
      // Owner 2026-11-18: a start page for Settings; "Voltar" in any tab returns here, "Fechar" closes.
      body = html`<div class="sthome">${tabs.map(([k, n]) => html`<button class="sthi" @click=${() => this._set({ settings: k })}>
        <span class="ic">${ic(icons[k], 'i s')}</span><span class="grow txt"><b>${n}</b><small>${hints[k]}</small></span>${ic('right', 'i s')}</button>`)}</div>`;
    } else if (tab === 'geral') {
      const weathers = Object.keys(this.hass.states).filter((e) => e.startsWith('weather.'));
      const rk = { arrivals: t('rkArrivals'), lights: t('lights'), openings: t('openings'), locks: t('locked'), appliances: t('cycleDone'), waste: t('waste'), ...{} };
      const kinds = prefs.reminderKinds || {};
      body = html`
        ${grp('theme', t('theme'), html`
        ${THEME_FAMS.map(([fk, ids]) => html`<span class="thfam">${t(fk)}</span>
        <div class="thgal">${ids.map((id) => THEMES.find((x) => x.id === id)).filter(Boolean).map((x) => { const on = (prefs.theme || 'aureon') === x.id;
          const pv = x.ha ? '--pb:var(--primary-background-color,#111);--pc:var(--card-background-color,#1c1c1c);--pa:var(--primary-color,#03a9f4);--pl:rgba(255,255,255,.08)' : `--pb:${x.bg};--pc:${x.card};--pa:${x.accent};--pl:${x.line2}`;
          return html`<button class=${'thc' + (on ? ' on' : '')} aria-pressed=${on ? 'true' : 'false'} aria-label=${x.name + ' · ' + x.desc} style=${pv} @click=${() => this._save({ theme: x.id })}>
            <span class="thpv" aria-hidden="true"><span class="thglow"></span><span class="thcard"><i class="thclock">21:39</i><i class="thline"></i><i class="thdots"><b></b><b></b><b></b></i></span><span class="thpill"></span></span>
            <span class="thtx"><b>${x.name}</b><small>${x.desc}</small></span>${on ? html`<span class="thok">${ic('check', 'i s')}</span>` : nothing}</button>`; })}</div>`)}
        <div class="chk"><span class="grow txt"><b>${t('stDefaultView')}</b></span><span class="seg"><button aria-pressed=${prefs.view !== '2d' ? 'true' : 'false'} @click=${() => this._save({ view: '3d' })}>3D</button><button aria-pressed=${prefs.view === '2d' ? 'true' : 'false'} @click=${() => this._save({ view: '2d' })}>${t('plan').toUpperCase()}</button></span></div>
        ${weathers.length > 1 ? html`<div class="chk"><span class="grow txt"><b>${t('forecastT')}</b></span><select style="min-height:40px;border-radius:10px;background:var(--sunk);color:var(--fg);border:1px solid var(--line2);padding:0 10px;font:inherit" @change=${(e) => { this._save({ weather: e.target.value }); this._fcFor = null; this.requestUpdate(); }}>${weathers.map((w) => html`<option value=${w} ?selected=${(prefs.weather || weathers[0]) === w}>${this.hass.states[w].attributes.friendly_name || w}</option>`)}</select></div>` : nothing}
        `)}
        ${grp('energy', t('energy'), html`
        <div class="chk"><span class="grow txt"><b>${t('stPrice')}</b><small>${t('stPriceHint')}</small></span>
          <span class="row" style="gap:6px"><input class="numin" type="number" inputmode="decimal" min="0" step="0.01" aria-label=${t('stPrice')} .value=${prefs.energyPrice != null ? String(prefs.energyPrice) : ''} placeholder="0.35"
            @change=${(e) => { const v = parseFloat(String(e.target.value).replace(',', '.')); this._save({ energyPrice: Number.isFinite(v) && v >= 0 ? v : null }); }}>
          <select class="numin" style="width:auto" aria-label=${t('currency')} @change=${(e) => this._save({ energyCur: e.target.value })}>${['€', 'R$', '$', 'CHF', '£'].map((c) => html`<option ?selected=${(prefs.energyCur || '€') === c}>${c}</option>`)}</select><span class="dim">/kWh</span></span></div>
        `)}
        ${grp('ediag', t('diagShow'), this.energyDiag(ctx), true)}
        ${grp('rem', t('reminders'), html`
        <div class="chk"><span class="grow txt"><b>${t('stPushMin')}</b></span>${sw(!!prefs.pushMin, () => this._save({ pushMin: !prefs.pushMin }), t('stPushMin'))}</div>
        ${Object.entries(rk).map(([k, n]) => html`<div class="chk"><span class="grow txt"><b>${n}</b></span>${sw(reminderOn(kinds, k), () => this._save({ reminderKinds: { ...kinds, [k]: !reminderOn(kinds, k) } }), n)}</div>`)}`)}`;
    } else if (tab === 'secoes') {
      const hiddenS = new Set(prefs.secHidden || []);
      body = html`${grp('sections', tabs.find(([k]) => k === 'secoes')[1], html`<span class="muted txt" style="font-size:13px">${t('stSectionsHint')}</span>
        ${prefs.secOrder.map((k, i) => html`<div class="chk"><span class="grow txt"><b>${secNames[k]}</b></span>
          <button class="ib sm" ?disabled=${i === 0} aria-label=${t('sectionUp') + ' · ' + secNames[k]} @click=${() => this._moveSection(k, -1)}>${ic('up', 'i s')}</button>
          <button class="ib sm" ?disabled=${i === prefs.secOrder.length - 1} aria-label=${t('sectionDown') + ' · ' + secNames[k]} @click=${() => this._moveSection(k, 1)}>${ic('down', 'i s')}</button>
          ${sw(!hiddenS.has(k), () => { hiddenS.has(k) ? hiddenS.delete(k) : hiddenS.add(k); this._save({ secHidden: [...hiddenS] }); }, secNames[k])}</div>`)}`)}`;
    } else if (tab === 'modos') {
      const defs = this._modeDefs(t), cur = defs.find((d) => d.id === (ui.modeTab || 'away')) || defs[1];
      body = html`<span class="muted txt" style="font-size:13px;line-height:1.55">${t('stModesHint')}</span>
        <div class="sttabs" role="tablist" style="background:transparent">${defs.map((d) => html`<button role="tab" aria-selected=${cur.id === d.id ? 'true' : 'false'} @click=${() => this._set({ modeTab: d.id })}>${d.name}</button>`)}</div>
        ${this.modeConfig(ctx, cur)}`;
    } else if (tab === 'aparelhos') {
      const map = prefs.applMap || {}, hid = prefs.applHidden || {};
      const kinds = ['washer', 'dish', 'dryer'];
      body = html`<span class="muted txt" style="font-size:13px;line-height:1.55">${t('stApplHint')}</span>
        ${kinds.map((k) => { const auto = m.appliances.find((a) => a.kind === k && !map[k]); return grp('appl_' + k, t('kind_' + k), html`<div class="applcfg">
          <div class="row sp" style="gap:12px"><span class="row" style="gap:10px"><span class="ic" style="width:36px;height:36px">${ic(k === 'dish' ? 'dish' : 'washer', 'i s')}</span><b style="font-weight:500">${t('kind_' + k)}</b></span>
            ${sw(!hid[k], () => this._save({ applHidden: { ...hid, [k]: !hid[k] } }), t('kind_' + k))}</div>
          ${hid[k] ? html`<span class="muted" style="font-size:12px">${t('applHiddenTxt')}</span>` : html`<label class="lbsel"><span class="eyebrow" style="font-size:10px">${t('applSource')}</span>
            <select @change=${(e) => this._save({ applMap: { ...map, [k]: e.target.value } })}>
              <option value="" ?selected=${!map[k]}>${auto ? t('applAuto', { n: auto.name }) : t('applAutoNone')}</option>
              ${m.appliances.filter((a) => !a.plug || a.kind === k).length ? html`<optgroup label=${t('applDevices')}>${m.appliances.filter((a) => !a.plug).map((a) => html`<option value=${a.id} ?selected=${map[k] === a.id}>${a.name}${a.areaName ? ' · ' + a.areaName : ''}</option>`)}</optgroup>` : nothing}
              <optgroup label=${t('applPlugs')}>${m.plugs.slice().sort((x, y) => (y.w != null) - (x.w != null) || x.name.localeCompare(y.name)).map((p) => html`<option value=${p.id} ?selected=${map[k] === p.id}>${p.name}${p.areaName ? ' · ' + p.areaName : ''}${p.w != null ? ' · ' + p.w + ' W' : ''}</option>`)}</optgroup>
            </select></label>`}
        </div>`); })}`;
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
        ${grp('mine', t('stLbMine'), !user.length ? html`<span class="muted" style="font-size:13px">${t('stNoLabels')}</span>` : html`<div class="lblist">${user.map((l) => { const st = state(l.id); return html`<div class=${'lbrow ' + st}>
          <span class="lbic" style=${'--lc:' + col(l.color)}>${l.icon ? html`<ha-icon .icon=${l.icon}></ha-icon>` : nothing}</span>
          <span class="grow txt"><b>${l.name}</b><span class="muted">${[t('stLabelCount', { n: l.count }), l.desc].filter(Boolean).join(' · ')}</span></span>
          <span class="lbseg" role="radiogroup" aria-label=${l.name}>${[['normal', t('stLbNormal')], ['include', t('stLbOnly')], ['exclude', t('stLbHide')]].map(([k, n]) => html`<button role="radio" aria-checked=${st === k ? 'true' : 'false'} class=${k} @click=${() => setState(l.id, k)}>${n}</button>`)}</span>
          <span class="lbexp">${st === 'include' ? t('stLbExpOnly', { s: secLabel, l: l.name }) : st === 'exclude' ? t('stLbExpHide', { s: secLabel, l: l.name }) : t('stLbExpNormal', { l: l.name })}</span></div>`; })}</div>`)}
        ${sys.length ? grp('sys', t('stLbSystem'), html`<div class="lbsys">${sys.map((l) => html`<span class="row" style="gap:10px;font-size:13px"><span class="lbic sm" style=${'--lc:' + col(l.color)}>${l.icon ? html`<ha-icon .icon=${l.icon}></ha-icon>` : nothing}</span><b style="font-weight:500">${l.name}</b><span class="muted">${ROLE_TXT[l.role] || SYS[l.id]}</span></span>`)}</div>`) : nothing}`;
    } else if (tab === 'dispositivos') {
      const q = (ui.setQ || '').toLowerCase(), hid = new Set(prefs.hidden || []), force = new Set(prefs.forceShow || []);
      const groups = [['lights', t('lights'), m.lights], ['plugs', t('plugs'), m.plugs], ['climate', t('climate'), m.climate], ['covers', t('covers'), m.covers], ['openings', t('openings'), m.openings], ['security', t('security'), [...m.locks, ...m.cams]], ['tv', t('tvs'), m.tvs], ['music', t('speakersAll'), m.speakers], ['scenes', t('scenes'), m.scenes]];
      const mcd = this._mc?.devices || [], ch = new Set(prefs.connectHidden || []);
      if (this._mc && !mcd.length && !this._mc.pending?.has('devices') && !this._connAsked) { this._connAsked = true; this._mc.loadDevices?.(false); }
      const match = (d) => !q || (d.name + ' ' + d.id + ' ' + (d.areaName || '')).toLowerCase().includes(q);
      body = html`<input type="search" .value=${ui.setQ || ''} placeholder=${t('stSearch')} aria-label=${t('stSearch')} @input=${(e) => this._set({ setQ: e.target.value })} style="min-height:44px;padding:0 14px;border-radius:12px;border:1px solid var(--line2);background:var(--sunk);color:var(--fg);font:inherit">
        ${groups.map(([k, n, list]) => { const f = list.filter(match); if (!f.length && !(k === 'music' && m.hiddenMedia.length)) return nothing; return grp('dev_' + k, n + ' · ' + f.length, html`
          ${f.map((d) => html`<div class="chk"><span class="grow txt"><b>${d.name}</b><span class="muted" style="display:block;font-size:11px">${[d.areaName, d.id].filter(Boolean).join(' · ')}${force.has(d.id) ? ' · ' + t('stHiddenInHa') : ''}</span></span>
            ${sw(!hid.has(d.id), () => this._toggleHidden(d.id), d.name)}</div>`)}
          ${k === 'music' ? m.hiddenMedia.filter(match).map((d) => html`<div class="chk" style="opacity:.75"><span class="grow txt"><b>${d.name}</b><span class="muted" style="display:block;font-size:11px">${d.id} · ${t('stHiddenInHa')}</span></span>
            ${sw(false, () => this._save({ forceShow: [...new Set([...(prefs.forceShow || []), d.id])] }), d.name)}</div>`) : nothing}`); })}
        ${mcd.length ? grp('outputs', t('stOutputs') + ' · ' + mcd.filter((d) => !ch.has(d.name)).length, html`
          <span class="muted txt" style="font-size:12px">${t('stOutputsHint')}</span>
          ${mcd.map((d) => html`<div class="chk"><span class="grow txt"><b>${d.name}</b></span>${sw(!ch.has(d.name), () => { ch.has(d.name) ? ch.delete(d.name) : ch.add(d.name); this._save({ connectHidden: [...ch] }); }, d.name)}</div>`)}`) : nothing}`;
    } else {
      body = html`${grp('about', t('stAbout'), html`<div class="chk"><span class="grow txt"><b>AUREON Noir</b><span class="muted" style="display:block;font-size:12px">${VERSION} · ${BUILD}</span></span></div>
        <span class="muted txt" style="font-size:13px;line-height:1.5">${t('stAboutHint')}</span>
        <div class="wrapRow"><button class="btn" @click=${() => { try { navigator.clipboard.writeText(JSON.stringify(this._prefs)); this._toast(t('stCopied'), ''); } catch { /* ok */ } }}>${t('stExport')}</button>
          <button class="btn" @click=${() => { const v = prompt(t('stImport')); if (!v) return; try { const p = JSON.parse(v); if (p && typeof p === 'object') { this._save(p); this._toast(t('stImported'), ''); } } catch { this._toast(t('stImportFail'), ''); } }}>${t('stImport')}</button>
          <button class="btn" @click=${() => { if (confirm(t('stResetQ'))) { this._prefs = null; try { localStorage.removeItem(this._key); } catch { /* ok */ } this._loadPrefs(); this._pushPrefs(); this.requestUpdate(); } }}>${t('stReset')}</button></div>`)}`;
    }
    return html`<div class="overlay" @click=${(e) => { if (e.target === e.currentTarget) this._set({ settings: null }); }}>
      <div class="sheet rise" role="dialog" aria-modal="true" aria-label=${t('settings')} style="width:min(720px,100%)" @scroll=${(e) => { const up = e.currentTarget.scrollTop > 320; if (up !== !!this._shUp) { this._shUp = up; this.requestUpdate(); } }}>
        <div class="sthead">
          <div class="row" style="gap:10px;min-width:0">
            ${tab !== 'home' ? html`<button class="btn sm" aria-label=${t('goBack')} @click=${() => this._set({ settings: 'home' })}>${ic('left', 'i s')}${t('goBack')}</button>` : nothing}
            <span class="grow" style="font-size:24px;font-weight:300;letter-spacing:-.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tab === 'home' ? t('settings') : (tabs.find(([k]) => k === tab)?.[1] || t('settings'))}</span>
            <button class="ib sm stclose" aria-label=${t('closeS')} title=${t('closeS')} @click=${() => { this._shUp = false; this._set({ settings: null }); }}>${ic('x', 'i s')}</button>
          </div>
          ${tab !== 'home' ? html`<div class="sttabs" role="tablist">${tabs.map(([k, n]) => html`<button role="tab" aria-selected=${tab === k ? 'true' : 'false'} @click=${() => this._set({ settings: k })}>${n}</button>`)}</div>` : nothing}
        </div>
        ${body}
        <div class="stfoot">${this._shUp ? html`<button class="ib shtop" aria-label=${t('toTop')} title=${t('toTop')} @click=${(e) => e.currentTarget.closest('.sheet').scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>${ic('up', 'i s')}</button>` : nothing}${this._savedAt && Date.now() - this._savedAt < 2500
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
    return html`<section class="sec" aria-label=${t('scenes')}><h2 class="eyebrow" style="margin:0;padding:0 4px;font-weight:400">${this._title('scenes', t('scenes'))}</h2>
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
    const appl = [];
    for (const a of applCards.filter((x) => !x.placeholder)) {
      const C = 2 * Math.PI * 31, pct = a.done ? 100 : a.pct != null ? a.pct : null;
      const icon = a.kind === 'dish' ? 'dish' : 'washer';
      const dev = { ...a, isDevice: true };
      const hm = (d) => d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
      const idle = !a.running && !a.done;
      const detail = idle ? (a.plug ? [t('applIdle'), a.w ? a.w + ' W' : null].filter(Boolean).join(' · ') : [t('applIdle'), a.status && !/^(off|aus|inactive|ready|bereit)$/i.test(a.status) ? a.status : null].filter(Boolean).join(' · ')) : a.plug ? (a.done ? t('plugDone', { t: hm(a.endedAt) }) : [a.startAt ? t('plugSince', { m: Math.max(1, Math.round((now - a.startAt) / 60000)) }) : t('running'), a.estEnd ? t('endsAbout', { t: hm(a.estEnd) }) : null, a.w + ' W ' + t('nowS')].filter(Boolean).join(' · ')) : a.done ? [a.program, t('cycleDone')].filter(Boolean).join(' · ') : [a.program || null, a.mins != null ? t('remaining', { m: Math.round(a.mins) }) : null, a.endAt ? t('endsAt', { t: a.endAt.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) }) : null, !a.mins && !a.endAt ? a.status : null].filter(Boolean).join(' · ');
      // Owner 2026-11-22 ("mais rico e visual"): the machine itself is drawn; working = water / light, progress ring,
      // the remaining or elapsed time in its display; done = accent glow + OK.
      const elapsed = a.plug && a.running && a.startAt ? Math.max(1, Math.round((now - a.startAt) / 60000)) : null;
      // Owner 2026-11-22: the little display shows WHEN it finishes (end time); a plug machine has no end time, so it
      // shows how long it has been running.
      const endT = a.endAt || (a.mins != null ? new Date(now.getTime() + a.mins * 60000) : null);
      const disp = a.done ? 'END' : a.running ? (endT ? hm(endT) : a.estEnd ? '≈' + hm(a.estEnd) : elapsed != null ? elapsed + ' min' : '') : '';
      const fr = a.running && pct != null ? pct / 100 : null, key = String(a.id).replace(/\W/g, '');
      appl.push(html`<article class=${'act ap' + (a.running ? ' run' : '') + (a.done ? ' done' : '')}>
        ${this.editBar('appliances', dev, [], t)}
        <button class=${'apinfo' + (this._ui.apInfo === a.id ? ' on' : '')} aria-expanded=${this._ui.apInfo === a.id ? 'true' : 'false'} aria-label=${t('details') + ' · ' + a.name} @click=${() => this._set({ apInfo: this._ui.apInfo === a.id ? null : a.id })}>i</button>
        ${this.alexaRow(a, t)}
        <span class="apbox">${icon === 'dish' ? dishSvg(a.running, fr, disp, key) : washerSvg(a.running, fr, disp, key)}${a.done ? html`<span class="apok" aria-hidden="true">${ic('check', 'i s')}</span>` : nothing}</span>
        <span class="aptx"><span class="ttl txt">${a.name}</span>
          <span class="apst txt">${a.done ? [a.areaName, t('cycleDone')].filter(Boolean).join(' · ') : [a.areaName, idle ? t('applIdleTag').toLowerCase() : null].filter(Boolean).join(' · ')}</span>
          ${this._ui.apInfo === a.id ? html`<span class="apmore" role="note">${!(a.done && !a.program) ? html`<span>${a.done ? a.program : detail}</span>` : nothing}${a.plug ? html`<span class="byplug">${ic('plug', 'i s')}${t('byPlug')}</span>` : nothing}</span>` : nothing}</span>
        ${a.running && pct != null ? html`<span class="approg" aria-hidden="true"><i style=${`width:${Math.round(pct)}%`}></i></span>` : nothing}
        ${a.plug && a.done ? html`<button class="btn sm" @click=${() => this._save({ cycleAck: { ...(this._prefs.cycleAck || {}), [a.id]: a.runEnd } })}>${ic('check', 'i s')}${t('okS')}</button>` : nothing}
      </article>`);
    }
    if (appl.length) cards.unshift(html`<div class=${'apgrid' + (appl.length === 1 ? ' one' : '')}>${appl}</div>`);
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
            ${hero.days >= 1 ? html`<span class="wcd" aria-label=${t('inDays', { n: hero.days })}><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" class="bg"></circle><circle cx="32" cy="32" r="28" class="fg" stroke-dasharray=${(Math.max(0.08, 1 - hero.days / 7) * 176).toFixed(0) + ' 176'} transform="rotate(-90 32 32)"></circle></svg><b>${hero.days}</b><small>${t(hero.days === 1 ? 'dayS' : 'daysS')}</small></span>` : nothing}
        </div>
        ${shelf.length ? html`<div class="wshelf">${shelf.map((w, i) => html`<span class="wsi">${binSvg(binColor(w.type), false, 's' + i, 'mini')}<b class="txt">${shortBin(w.type)}</b><span class="mono">${dayLabel(w)}</span></span>`)}</div>` : nothing}
      </div></article>`);
    }
    for (const v of m.vacuums) {
      const st = v.state, cleaning = st === 'cleaning', bat = v.attrs.battery_level ?? v.battery;
      const vr = vacuumRooms(v.attrs), active = ['cleaning', 'paused', 'returning'].includes(st);
      // Owner 2026-11-18: every live card the same size; the map opens in the Home Assistant dialog.
      const curRoom = vr && vr.cur >= 0 ? vr.list[vr.cur] : null;
      const label = { cleaning: t('cleaning'), docked: t('docked'), returning: t('returning'), paused: t('vPaused'), error: t('vError'), idle: t('idle') }[st] || st;
      cards.push(html`<article class=${'act rob' + (cleaning ? ' on' : '')}>
        <div class="robrow"><div class="grow" style="display:flex;flex-direction:column;gap:3px;min-width:0">
          <span class="tag" style=${cleaning ? 'color:#7EE0A8' : 'color:var(--mut)'}>${cleaning ? '● ' : ''}${label}${curRoom && active ? ' · ' + curRoom : v.areaName ? ' · ' + v.areaName : ''}</span>
          <span class="ttl">${v.name}</span><span class="muted txt" style="font-size:13px">${vr && active ? [vr.whole ? t('wholeHome') : null, vr.cur >= 0 ? t('roomOf', { a: vr.cur + 1, b: vr.list.length }) : null, bat != null ? t('battery') + ' ' + Math.round(bat) + '%' : null].filter(Boolean).join(' · ') : [bat != null ? t('battery') + ' ' + Math.round(bat) + '%' : null, ...(v.facts || [])].filter(Boolean).join(' · ')}</span></div>
          <span class="robbox">${robotSvg(bat, cleaning, String(v.id).replace(/\W/g, ''))}</span></div>
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
    return html`<section class="sec" aria-label=${t('now')}><div class="row" style="padding:0 4px;gap:10px"><span class="pulse" style="width:7px;height:7px;border-radius:50%;background:#7EE0A8"></span><h2 class="eyebrow" style="margin:0;font-weight:400">${this._title('live', t('now'))}</h2></div><div class="live">${cards}</div></section>`;
  }

  // ── filters ──────────────────────────────────────────────────────────────
  filters({ m, t }, show) {
    const ui = this._ui;
    const roomsOrd = this._sorted('rooms', m.areas.map((a) => ({ ...a, name: a.name })));
    const chips = [{ id: 'all', name: t('allHome') }, ...roomsOrd];
    const doms = [['all', t('all')], ['lights', t('lightsShort')], ['climate', t('climateShort')], ['plugs', t('plugsShort')], ['energy', t('energyShort')], ['covers', t('coversShort')], ['openings', t('openingsShort')], ['security', t('securityShort')], ['tv', t('tvs')], ['music', t('musicShort')]].filter(([k]) => k === 'all' || show[k]);
    const inR = (list) => list.filter((d) => ui.room === 'all' || d.area === ui.room).length;
    const counts = { lights: inR(m.lights), climate: inR(m.climate), plugs: inR(m.plugs), energy: Math.max(inR(m.metered) + inR(m.loosePower), m.energyMeters.filter((e) => ui.room === 'all' || e.area === ui.room).length), covers: inR(m.covers), openings: inR(m.openings), security: inR(m.cams) + inR(m.locks) + m.alarms.length, tv: inR(m.tvs), music: inR(m.speakers) };
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
    // Owner 2026-11-22 chose Luzes "1 · linhas do C + A": each light is a full-width row that fills with its own
    // colour up to its brightness; drag sideways on the row to dim, tap the row or the switch to turn it on/off.
    if (!this._ui.edit) return html`<section class="sec">${head}${this.roomGroups('light', list, m, t, {
      icon: 'bulb', lit: (l) => l.on, grpCls: 'pgx lgx', listCls: 'lbxs',
      grpStyle: (on) => { if (!on.length) return ''; const top = on.slice().sort((x, y) => y.b - x.b)[0]; return `--lc:${top.rgb.join(',')}`; },
      dotStyle: (on) => { if (!on.length) return ''; const top = on.slice().sort((x, y) => y.b - x.b)[0], rgb = top.rgb.join(','); return `background:${rgba(rgb, 0.16)};color:rgb(${rgb});border-color:${rgba(rgb, 0.4)};box-shadow:0 0 20px -6px ${rgba(rgb, 0.9)}`; },
      metaFn: (items, on) => html`<span class="pxw"><small>${t('ofOn', { a: on.length, b: items.length })}</small></span>`,
      rowFn: (l) => {
        const rgb = l.rgb.join(','), b = this._local[l.id] ?? l.b, canDim = l.on && l.dimmable && !l.unavailable;
        const send = (v) => this._call('light', 'turn_on', { entity_id: l.id, brightness_pct: v }).finally(() => { setTimeout(() => { delete this._local[l.id]; this.requestUpdate(); }, 1500); });
        const down = (e) => {
          if (l.unavailable || e.button > 0 || e.target.closest('button,input')) return;
          const row = e.currentTarget, r = row.getBoundingClientRect(), x0 = e.clientX; let moved = false;
          const pct = (x) => Math.max(1, Math.min(100, Math.round(((x - r.left) / r.width) * 100)));
          const mv = (ev) => { if (!canDim) return; if (!moved && Math.abs(ev.clientX - x0) < 8) return; moved = true; this._local[l.id] = pct(ev.clientX); this.requestUpdate(); };
          const up = (ev) => { row.removeEventListener('pointermove', mv); row.removeEventListener('pointerup', up); row.removeEventListener('pointercancel', cancel);
            if (moved) send(pct(ev.clientX)); else this._call('light', 'toggle', { entity_id: l.id }); };
          const cancel = () => { row.removeEventListener('pointermove', mv); row.removeEventListener('pointerup', up); row.removeEventListener('pointercancel', cancel); if (moved) { delete this._local[l.id]; this.requestUpdate(); } };
          try { row.setPointerCapture(e.pointerId); } catch (_) {}
          row.addEventListener('pointermove', mv); row.addEventListener('pointerup', up); row.addEventListener('pointercancel', cancel);
        };
        return html`<div class=${'lbx' + (l.on ? ' on' : '') + (l.unavailable ? ' na' : '') + (canDim ? ' dim' : '')} style=${`--lc:${rgb};--b:${l.on ? b / 100 : 0}`} @pointerdown=${down}>
          ${l.on ? html`<span class="lfl" aria-hidden="true" style=${`width:${l.dimmable ? Math.max(7, b) : 100}%`}></span>` : nothing}
          <span class="lbi" aria-hidden="true">${ic('bulb')}</span>
          <span class="lnx"><button class="lname" aria-label=${l.name + ' · ' + (l.areaName ? t('details') : t('setRoom'))} @click=${() => this._moreInfo(l.id, l.areaName ? undefined : 'settings')}><b class="txt">${l.name}</b></button>
            <small>${l.unavailable ? t('notAvailable') : l.on ? (canDim ? t('brightness') : t('on')) : t('off')}</small></span>
          ${canDim ? html`<span class="lpc">${b}<small>%</small></span>` : nothing}
          <button class="switch" role="switch" aria-checked=${l.on ? 'true' : 'false'} ?disabled=${l.unavailable} aria-label=${l.name + ' · ' + l.areaName} @click=${() => this._call('light', 'toggle', { entity_id: l.id })}><span><i></i></span></button>
          ${canDim ? html`<input class="lrng sr" type="range" min="1" max="100" .value=${String(b)} aria-label=${t('brightness') + ' · ' + l.name}
            @input=${(e) => { this._local[l.id] = Number(e.target.value); this.requestUpdate(); }} @change=${(e) => send(Number(e.target.value))}>` : nothing}
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
            <span class="nm">${this.nmLink(l, html`<b>${l.name}</b>`, t)}<span>${l.areaName ? l.areaName + ' · ' : ''}${l.unavailable ? t('notAvailable') : l.on ? (l.dimmable ? b + '%' : t('on')) : t('off')}</span></span></button>
          ${l.dimmable && !l.unavailable ? html`<input class="rng" type="range" min="1" max="100" .value=${String(b)} aria-label=${t('brightness') + ' · ' + l.name}
            style=${`background:linear-gradient(90deg, ${l.on ? `rgb(${rgb})` : 'var(--dim)'} ${b}%, var(--line2) ${b}%)`}
            @input=${(e) => { this._local[l.id] = Number(e.target.value); this.requestUpdate(); }}
            @change=${(e) => { const v = Number(e.target.value); this._call('light', 'turn_on', { entity_id: l.id, brightness_pct: v }).finally(() => { setTimeout(() => { delete this._local[l.id]; this.requestUpdate(); }, 1500); }); }}>` : nothing}
          ${l.ct && !l.unavailable ? html`<div class="cts" role="group" aria-label=${t('warm') + ' / ' + t('cool')}>${[['warm', 2700], ['neutral', 4000], ['cool', 6000]].map(([n, kv]) => { const kk = Math.max(l.minK, Math.min(l.maxK, kv)); const act = l.on && l.kelvin && Math.abs(l.kelvin - kk) < 400; return html`<button aria-pressed=${act ? 'true' : 'false'} style=${act ? 'border-color:var(--accent);color:var(--fg)' : ''} @click=${() => this._call('light', 'turn_on', { entity_id: l.id, color_temp_kelvin: kk })}><i style=${`background:rgb(${n === 'warm' ? '245,190,110' : n === 'neutral' ? '255,234,204' : '196,218,255'})`}></i>${t(n)}</button>`; })}</div>` : nothing}
        </div>`;
      })}</div></section>`;
  }

  // ── climate ──────────────────────────────────────────────────────────────
  // Owner 2026-11-21 (Clima premium): the last 6 hours of each thermostat's measured temperature, from HA history,
  // for the trend ("↑ 0,4° em 1 h"), the mini chart and the time to target while heating. Read-only, 10 min cache.
  _climHist(ids) {
    const sig = ids.join(',');
    if (!ids.length || !this.hass?.callWS) return this._cH || {};
    if (this._cHSig === sig && Date.now() - (this._cHAt || 0) < 600000) return this._cH || {};
    this._cHSig = sig; this._cHAt = Date.now();
    const end = new Date(), start = new Date(end.getTime() - 6 * 3600000);
    this.hass.callWS({ type: 'history/history_during_period', start_time: start.toISOString(), end_time: end.toISOString(), entity_ids: ids, minimal_response: false, no_attributes: false, significant_changes_only: false })
      .then((res) => {
        const out = {};
        for (const id of ids) {
          let last;
          out[id] = (res?.[id] || []).map((x) => { if (x.a) last = x.a; const a = x.a || x.attributes || last || {}; return { t: (x.lu ?? x.lc ?? 0) * 1000 || Date.parse(x.last_updated || x.last_changed || ''), v: Number(a.current_temperature) }; })
            .filter((x) => Number.isFinite(x.t) && Number.isFinite(x.v));
        }
        this._cH = out; this.requestUpdate();
      }).catch(() => {});
    return this._cH || {};
  }
  sClimate({ m, t, lang }) {
    const list = this._visible('climate', this._sorted('climate', m.climate)), ids = list.map((x) => x.id);
    if (!list.length) return nothing;
    const heatN = list.filter((c) => c.action === 'heating').length;
    const atT = (c) => c.mode === 'off' || c.unavailable || c.cur == null || c.target == null || Math.abs(c.cur - c.target) <= 0.5;
    const head = this.secHead('climate', t('climate'), t('thermostats', { n: list.length }) + ' · ' + (heatN ? t('heatingN', { n: heatN }) : list.every(atT) ? t('allAtTarget') : t('noneHeating')), null, t);
    // Owner 2026-11-21 chose Clima concept A premium: a lit dial, the trend, a mini chart with the target line, a glass pill.
    if (!this._ui.edit) {
      const hist = this._climHist(ids), now = Date.now(), dec = (v) => Number(v).toFixed(1).replace('.', ',');
      return html`<section class="sec">${head}<div class="clgrid">${repeat(list, (c) => c.id, (c) => {
        const target = this._pendingTarget[c.id] ?? c.target, heating = c.action === 'heating', off = c.mode === 'off', na = c.unavailable;
        const k = off || na ? 'off' : heating ? 'heat' : 'cool', col = k === 'heat' ? '#F2A35E' : k === 'off' ? '#8A948F' : '#8FB8FF', lite = k === 'heat' ? '#FCE1BD' : k === 'off' ? '#C4CAC7' : '#E2EBFC';
        const setT = (v) => { const nv = Math.round(Math.max(c.min, Math.min(c.max, v)) / c.step) * c.step; this._pendingTarget[c.id] = nv; this.requestUpdate(); clearTimeout(this['_tt' + c.id]); this['_tt' + c.id] = setTimeout(() => { this._call('climate', 'set_temperature', { entity_id: c.id, temperature: nv }).finally(() => { setTimeout(() => { delete this._pendingTarget[c.id]; this.requestUpdate(); }, 2500); }); }, 700); };
        // Status from the numbers (owner: "no alvo" was shown for a room far above its target).
        const diff = c.cur != null && target != null ? c.cur - target : null;
        const stTxt = na ? t('notAvailable') : off ? t('offMode') : heating ? t('heating') : diff == null ? t('atTarget') : Math.abs(diff) <= 0.5 ? t('atTarget') : diff > 0 ? t('aboveTarget') : t('belowTarget');
        // History: trend over the last hour, mini chart, time to target.
        const pts = (hist[c.id] || []).filter((p) => now - p.t <= 6 * 3600000);
        const ago = (ms) => { let v = null; for (const p of pts) if (p.t <= now - ms) v = p.v; return v; };
        const h1 = ago(3600000), trend = c.cur != null && h1 != null ? Math.round((c.cur - h1) * 10) / 10 : null;
        let eta = null; if (heating && trend != null && trend >= 0.05 && diff != null && diff < 0) { const mins = Math.round((-diff / trend) * 60); if (mins <= 600) eta = mins < 60 ? mins + ' ' + t('min') : (Math.round(mins / 30) / 2).toLocaleString(lang) + ' h'; }
        const series = []; if (pts.length) { for (let i = 0; i <= 24; i++) { const at = now - 6 * 3600000 + i * 900000; let v = null; for (const p of pts) if (p.t <= at) v = p.v; if (v == null && i === 0) v = pts[0].v; series.push(v ?? series[series.length - 1] ?? null); } if (c.cur != null) series[series.length - 1] = c.cur; }
        const sv = series.filter((v) => v != null), showSpark = sv.length > 3 && Math.max(...sv) - Math.min(...sv) >= 0.05;
        let spark = nothing;
        if (showSpark) {
          const tIn = target != null && Math.abs(target - (sv.reduce((a, b) => a + b, 0) / sv.length)) <= 2.5;
          const mn = Math.min(...sv, tIn ? target : Infinity) - 0.15, mx = Math.max(...sv, tIn ? target : -Infinity) + 0.15, W = 200, H = 34;
          const X = (i) => (i / (series.length - 1)) * W, Y = (v) => H - ((v - mn) / (mx - mn)) * (H - 6);
          let d = ''; series.forEach((v, i) => { if (v == null) return; if (!d) { d = `M${X(i).toFixed(1)} ${Y(v).toFixed(1)}`; return; } const pv = series[i - 1] ?? v, xm = (X(i - 1) + X(i)) / 2; d += ` C${xm.toFixed(1)} ${Y(pv).toFixed(1)} ${xm.toFixed(1)} ${Y(v).toFixed(1)} ${X(i).toFixed(1)} ${Y(v).toFixed(1)}`; });
          const ly = Y(series[series.length - 1]);
          spark = html`<div class="clspark" role="img" aria-label=${t('last6h')}><svg viewBox="0 0 200 38" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id=${'clf' + k} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color=${col} stop-opacity=".28"></stop><stop offset="1" stop-color=${col} stop-opacity="0"></stop></linearGradient><linearGradient id=${'cll' + k} x1="0" x2="1"><stop offset="0" stop-color=${col} stop-opacity=".3"></stop><stop offset="1" stop-color=${lite}></stop></linearGradient></defs>
            ${tIn ? svg`<line x1="0" x2="200" y1=${Y(target).toFixed(1)} y2=${Y(target).toFixed(1)} stroke=${col} stroke-opacity=".45" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"></line>` : nothing}
            <path d=${d + ' L200 38 L0 38Z'} fill=${`url(#clf${k})`}></path><path d=${d} fill="none" stroke=${`url(#cll${k})`} stroke-width="1.8" vector-effect="non-scaling-stroke"></path></svg>
            ${tIn && Math.abs(Y(target) - ly) > 9 ? html`<span class="cltl" style=${`top:${(Y(target) / 38 * 100 - 32).toFixed(1)}%;color:${col}`}>${t('targetShort')}</span>` : nothing}
            <i style=${`top:calc(${(ly / 38 * 100).toFixed(1)}% - 4px);background:#fff;box-shadow:0 0 10px ${col},0 0 0 3px ${col}44`}></i></div>`;
        }
        // Dial (thermostat's own min..max): ticks light up to the current temperature, target as a white dot.
        const span = Math.max(1, c.max - c.min), f = (v) => Math.max(0, Math.min(1, (v - c.min) / span)), C = 71, pt = (fr, r) => { const a = (135 + 270 * fr) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
        const fc = c.cur != null ? f(c.cur) : 0, [gx0, gy0] = pt(0, 58), [gx1, gy1] = pt(fc, 58);
        const ticks = Array.from({ length: 61 }, (_, i) => { const fr = i / 60, on = c.cur != null && fr <= fc + 0.0001, near = on && fc - fr < 0.06, [x1, y1] = pt(fr, near ? 50 : i % 5 ? 54 : 52), [x2, y2] = pt(fr, 64), op = on ? 0.25 + 0.75 * Math.pow(fr / Math.max(0.01, fc), 1.6) : 1;
          return svg`<line x1=${x1.toFixed(2)} y1=${y1.toFixed(2)} x2=${x2.toFixed(2)} y2=${y2.toFixed(2)} stroke=${on ? (near ? lite : col) : 'var(--line2)'} stroke-opacity=${op.toFixed(2)} stroke-width=${i % 5 ? 1.6 : 2.2} stroke-linecap="round"></line>`; });
        const [tx, ty] = target != null ? pt(f(target), 71) : [0, 0];
        const glow = fc > 0.01 ? `M${gx0.toFixed(2)} ${gy0.toFixed(2)}A58 58 0 ${fc * 270 > 180 ? 1 : 0} 1 ${gx1.toFixed(2)} ${gy1.toFixed(2)}` : '';
        const [lx0, ly0] = pt(0, 72), [lx1, ly1] = pt(1, 72);
        return html`<div class=${'clc ' + k}>
          <div class="cldial" aria-hidden="true"><svg viewBox="0 0 142 142"><defs><radialGradient id=${'clin' + k} cx=".5" cy=".38"><stop offset="0" stop-color=${col} stop-opacity=${k === 'heat' ? '.2' : '.12'}></stop><stop offset=".7" stop-color=${col} stop-opacity="0"></stop></radialGradient></defs>
            <circle cx="71" cy="71" r="47" fill=${`url(#clin${k})`}></circle><circle cx="71" cy="71" r="47" fill="none" stroke="rgba(255,255,255,.05)"></circle>
            ${glow ? svg`<path d=${glow} fill="none" stroke=${col} stroke-width="12" opacity=".22" class="clblur"></path>` : nothing}${ticks}
            ${target != null ? svg`<circle cx=${tx.toFixed(1)} cy=${ty.toFixed(1)} r="10" fill="none" stroke=${col} stroke-opacity=".35"></circle><circle cx=${tx.toFixed(1)} cy=${ty.toFixed(1)} r="12" fill=${col} opacity=".3" class="clblur"></circle><circle cx=${tx.toFixed(1)} cy=${ty.toFixed(1)} r="4.5" fill="#fff"></circle>` : nothing}
            <text x=${lx0.toFixed(1)} y=${(ly0 + 10).toFixed(1)} class="cllab">${Math.round(c.min)}</text><text x=${lx1.toFixed(1)} y=${(ly1 + 10).toFixed(1)} class="cllab">${Math.round(c.max)}</text></svg>
            <div class="clv"><b>${c.cur != null ? dec(c.cur) + '°' : '—'}</b><small>${t('nowShort')}</small>${trend != null ? html`<em>${t('trend1h', { d: (trend > 0 ? '↑ ' : trend < 0 ? '↓ ' : '= ') + dec(Math.abs(trend)) + '°' })}</em>` : nothing}</div></div>
          <div class="clinfo">
            <div class="clnm">${this.nmLink(c, html`<b class="txt">${c.areaName || c.name}</b>`, t)}<span class="clst">${stTxt}</span></div>
            ${eta || c.hum != null ? html`<span class="clmeta">${eta ? html`<span>${t('reachIn')} <b>~${eta}</b></span>` : nothing}${c.hum != null ? html`<span>${t('humidity')} <b>${Math.round(c.hum)}%</b></span>` : nothing}</span>` : nothing}
            ${spark}
            <div class="clpill"><button ?disabled=${target == null || na} aria-label=${t('lower') + ' · ' + (c.areaName || c.name)} @click=${() => setT((target ?? c.cur ?? 20) - c.step)}>${ic('minus', 'i s')}</button>
              <b aria-live="polite">${target != null ? dec(target) + '°' : '—'}<small>${t('targetShort')}</small></b>
              <button ?disabled=${target == null || na} aria-label=${t('raise') + ' · ' + (c.areaName || c.name)} @click=${() => setT((target ?? c.cur ?? 20) + c.step)}>${ic('plus', 'i s')}</button></div>
          </div></div>`;
      })}</div></section>`;
    }
    return html`<section class="sec">${head}
      <div class="grid w">${repeat(list, (c) => c.id, (c) => {
        const target = this._pendingTarget[c.id] ?? c.target, heating = c.action === 'heating', off = c.mode === 'off', ta = this.tileAttrs('climate', c, ids);
        const span = Math.max(1, c.max - c.min), fr = target != null ? Math.max(0, Math.min(1, (target - c.min) / span)) : 0, fc = c.cur != null ? Math.max(0, Math.min(1, (c.cur - c.min) / span)) : 0;
        const col = off ? '120,120,130' : heating ? '255,150,90' : '143,184,255', dg = (270 * fr).toFixed(1), dc = (270 * fc).toFixed(1);
        const setT = (v) => { const nv = Math.round(Math.max(c.min, Math.min(c.max, v)) / c.step) * c.step; this._pendingTarget[c.id] = nv; this.requestUpdate(); clearTimeout(this['_tt' + c.id]); this['_tt' + c.id] = setTimeout(() => { this._call('climate', 'set_temperature', { entity_id: c.id, temperature: nv }).finally(() => { setTimeout(() => { delete this._pendingTarget[c.id]; this.requestUpdate(); }, 2500); }); }, 700); };
        return html`<div class=${'tile' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end} style=${heating ? 'border-color:rgba(255,150,90,.28)' : ''}>
          <span class="orb" style=${`left:auto;top:auto;right:-70px;bottom:-110px;width:200px;height:200px;background:radial-gradient(circle, rgba(${col},.4) 0%, rgba(${col},0) 65%);opacity:${heating ? 1 : 0.35}`}></span>
          ${this.editBar('climate', c, ids, t)}
          <div class="row sp" style="position:relative;align-items:flex-start"><span class="nm">${this.nmLink(c, html`<b>${c.areaName || c.name}</b>`, t)}<span>${c.name}${c.hum != null ? ' · ' + Math.round(c.hum) + '%' : ''}</span></span>
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
  roomGroups(key, list, m, t, { icon, lit, metaFn, rowFn, dotStyle, grpCls = '', listCls = 'plist', grpStyle }) {
    const groups = [];
    for (const d of list) { let g = groups.find((x) => x.area === (d.area || '')); if (!g) groups.push(g = { area: d.area || '', name: d.areaName || t('noArea'), items: [] }); g.items.push(d); }
    const order = new Map(m.areas.map((a, i) => [a.id, i]));
    groups.sort((x, y) => (order.get(x.area) ?? 999) - (order.get(y.area) ?? 999));
    const st = this._ui[key + 'Open'] || {}, single = groups.length === 1 || this._ui.room !== 'all';
    return html`<div class="pgrid">${groups.map((g) => {
      const isOpen = single || (st[g.area] ?? (this.clientWidth >= 900)), on = g.items.filter(lit);
      return html`<div class=${'pgrp' + (grpCls ? ' ' + grpCls : '') + (isOpen ? ' open' : '') + (on.length ? ' lit' : '')} style=${grpStyle ? grpStyle(on) : ''}>
        <button class="phead" aria-expanded=${isOpen ? 'true' : 'false'} ?disabled=${single} @click=${() => this._set({ [key + 'Open']: { ...st, [g.area]: !isOpen } })}>
          <span class="pdot" aria-hidden="true" style=${dotStyle ? dotStyle(on) : ''}>${ic(icon, 'i s')}</span>
          <span class="pname txt">${g.name}</span>
          <span class="pmeta">${metaFn(g.items, on)}</span>
          ${single ? nothing : html`<span class="pchev" aria-hidden="true">${ic('down', 'i s')}</span>`}
        </button>
        ${isOpen ? html`<div class=${listCls}>${!g.items[0]?.areaName ? html`<span class="nahint">${ic('pin', 'i s')}${t('noAreaHint')}</span>` : nothing}${repeat(g.items, (d) => d.id, rowFn)}</div>` : nothing}
      </div>`;
    })}</div>`;
  }
  sPlugs({ m, t }) {
    const list = this._visible('plugs', this._sorted('plugs', m.plugs)), ids = list.map((x) => x.id);
    if (!list.length) return nothing;
    const onN = list.filter((p) => p.on).length, prot = list.filter((p) => p.locked).length;
    const head = this.secHead('plugs', t('plugs'), t('plugsHead', { a: onN, b: list.length }), prot ? html`<span class="row muted" style="font-size:12px;gap:6px">${ic('lock', 'i s')}${t('protectedHint')}</span>` : null, t);
    // Owner 2026-11-16 ("no celular a lista está infinita"): outside edit mode, compact lists per room.
    // Owner 2026-11-22 chose Tomadas concept A "Painel": per room a glass card, each device a tile with its own icon
    // (lit when on), its watts and the switch; protected ones show a lock label instead of the switch.
    if (!this._ui.edit) return html`<section class="sec">${head}${this.roomGroups('plug', list, m, t, {
      icon: 'plug', lit: (p) => p.on, grpCls: 'pgx', listCls: 'ptg',
      metaFn: (items, on) => { const w = Math.round(on.reduce((s2, p) => s2 + (p.w || 0), 0)); return html`<span class="pxw">${w ? html`<b>${w} W</b>` : nothing}<small>${t('plugsHead', { a: on.length, b: items.length })}</small></span>`; },
      rowFn: (p) => html`<div class=${'ptl' + (p.on ? ' on' : '') + (p.unavailable ? ' na' : '')}>
          <div class="ptop"><span class="pti" aria-hidden="true">${ic(devIc(p.name))}</span>
            ${p.locked && p.on ? html`<span class="plk" title=${t('protectedTitle')}>${ic('lock', 'i s')}${t('protected')}</span>`
              : html`<button class="switch" role="switch" aria-checked=${p.on ? 'true' : 'false'} ?disabled=${p.unavailable} aria-label=${p.name + ' · ' + p.areaName} @click=${() => this._call('switch', p.on ? 'turn_off' : 'turn_on', { entity_id: p.id })}><span><i></i></span></button>`}</div>
          <span class="pnx">${this.nmLink(p, html`<b class="txt">${p.name}</b>`, t)}
            <small>${p.unavailable ? t('notAvailable') : p.on ? (p.w != null ? html`<em>${p.w} W</em>` : t('plugOn')) : t('plugOff')}</small>
            ${!p.area || !p.areaName ? html`<span class="noarea">${t('setRoom')}</span>` : nothing}</span>
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
          <div class="row sp" style="align-items:flex-end;gap:8px"><span class="nm">${this.nmLink(p, html`<b>${p.name}</b>`, t)}<span>${p.areaName || t('noArea')}</span></span>
            <span style=${`font-size:18px;font-weight:300;letter-spacing:-.03em;white-space:nowrap;color:${p.on ? 'var(--fg)' : 'var(--dim)'}`}>${p.unavailable ? t('notAvailable') : p.on ? (p.w != null ? p.w + ' W' : t('plugOn')) : t('plugOff')}</span></div></div>`;
      })}</div></section>`;
  }

  // ── energy ───────────────────────────────────────────────────────────────
  // Owner 2026-11-18: today's and this month's kWh come from Home Assistant's long-term statistics of every
  // meter (the same numbers the HA Energy page uses), refreshed every 5 minutes. Read-only.
  _energyStats(m) {
    const ids = m.energyMeters.map((e) => e.id), sig = ids.join(',') + '|' + new Date().toDateString();
    if (!ids.length || !this.hass?.callWS || (this._eSig === sig && Date.now() - (this._eAt || 0) < 300000)) return this._eStats || null;
    this._eSig = sig; this._eAt = Date.now();
    const one = (id, period) => this.hass.callWS({ type: 'recorder/statistic_during_period', statistic_id: id, calendar: { period }, types: ['change'], units: { energy: 'kWh' } }).then((r) => (typeof r?.change === 'number' ? r.change : null)).catch(() => null);
    Promise.all(ids.map(async (id) => [id, await one(id, 'day'), await one(id, 'month')])).then((rows) => {
      const day = {}, month = {};
      for (const [id, d, mo] of rows) { if (d != null) day[id] = Math.max(0, d); if (mo != null) month[id] = Math.max(0, mo); }
      this._eStats = { day, month, ok: rows.some(([, d, mo]) => d != null || mo != null) }; this.requestUpdate();
    });
    return this._eStats || null;
  }
  // Owner 2026-11-18 (0 W with 12 meters): a device that only has a kWh counter gets an ESTIMATED power from how
  // much its counter rose in the last 30 minutes (Home Assistant history). Shown with "≈" and "estimado", never as
  // a measurement. Needs two different counter readings in the window; otherwise no value.
  _powerEstimates(ids) {
    const sig = ids.join(',');
    if (!ids.length || !this.hass?.callWS) return this._pEst || {};
    if (this._pSig === sig && Date.now() - (this._pAt || 0) < 120000) return this._pEst || {};
    this._pSig = sig; this._pAt = Date.now();
    const end = new Date(), start = new Date(end.getTime() - 30 * 60000);
    this.hass.callWS({ type: 'history/history_during_period', start_time: start.toISOString(), end_time: end.toISOString(), entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false })
      .then((res) => {
        const out = {};
        for (const id of ids) {
          const unit = this.hass.states[id]?.attributes?.unit_of_measurement || 'kWh', k = unit === 'Wh' ? 0.001 : unit === 'MWh' ? 1000 : 1;
          const pts = (res?.[id] || []).map((x) => ({ v: Number(x.s ?? x.state), t: (x.lu ?? x.lc ?? 0) * 1000 || Date.parse(x.last_changed || x.last_updated || '') })).filter((x) => Number.isFinite(x.v) && Number.isFinite(x.t));
          if (pts.length < 2) continue;
          const first = pts[0], last = pts[pts.length - 1], hours = (Date.now() - first.t) / 3600000, dk = (last.v - first.v) * k;
          if (hours < 0.08 || dk < 0) continue; // counter reset or too little time: no estimate
          out[id] = Math.round((dk / hours) * 1000);
        }
        this._pEst = out; this.requestUpdate();
      }).catch(() => {});
    return this._pEst || {};
  }
  // Owner 2026-11-21 (Energy concept A premium): hour-by-hour kWh of every meter for yesterday and today, from HA's
  // statistics. Gives the day curve, the peak hour, the average and the comparison with yesterday. Read-only, 10 min cache.
  _energyHours(m) {
    const ids = m.energyMeters.map((e) => e.id), sig = ids.join(',') + '|' + new Date().toDateString();
    if (!ids.length || !this.hass?.callWS) return this._eHr || null;
    if (this._hSig === sig && Date.now() - (this._hAt || 0) < 600000) return this._eHr || null;
    this._hSig = sig; this._hAt = Date.now();
    const n = new Date(), y0 = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1);
    this.hass.callWS({ type: 'recorder/statistics_during_period', start_time: y0.toISOString(), statistic_ids: ids, period: 'hour', types: ['change'], units: { energy: 'kWh' } }).then((res) => {
      const per = {};
      for (const id of ids) per[id] = (res?.[id] || []).map((r) => ({ t: typeof r.start === 'number' ? r.start : Date.parse(r.start), v: typeof r.change === 'number' ? Math.max(0, r.change) : null })).filter((r) => Number.isFinite(r.t) && r.v != null);
      this._eHr = { ok: ids.some((id) => per[id].length), per, y0: y0.getTime() }; this.requestUpdate();
    }).catch(() => { this._eHr = { ok: false, per: {}, y0: y0.getTime() }; });
    return this._eHr || null;
  }
  // Owner 2026-11-18 ("mostra consumo no mês/ano?"): month-by-month (12) and day-by-day (30) sums of all meters, from
  // the long-term statistics Home Assistant already keeps. Refreshed every 30 minutes. Read-only.
  _energySeries(m) {
    const ids = m.energyMeters.map((e) => e.id), sig = ids.join(',') + '|' + new Date().toDateString();
    if (!ids.length || !this.hass?.callWS) return this._eSer || null;
    if (this._sSig === sig && Date.now() - (this._sAt || 0) < 1800000) return this._eSer || null;
    this._sSig = sig; this._sAt = Date.now();
    const now = new Date(), mStart = new Date(now.getFullYear(), now.getMonth() - 11, 1), dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    const ask = (period, start) => this.hass.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(), statistic_ids: ids, period, types: ['change'], units: { energy: 'kWh' } }).catch(() => null);
    Promise.all([ask('month', mStart), ask('day', dStart)]).then(([mo, dy]) => {
      const fold = (res, keyOf) => { const out = {}; for (const id of ids) for (const r of (res?.[id] || [])) { const t0 = typeof r.start === 'number' ? r.start : Date.parse(r.start); if (!Number.isFinite(t0) || typeof r.change !== 'number') continue; const k = keyOf(new Date(t0)); out[k] = (out[k] || 0) + Math.max(0, r.change); } return out; };
      const months = fold(mo, (d) => d.getFullYear() + '-' + d.getMonth()), days = fold(dy, (d) => d.toDateString());
      const mList = Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1); return { d, v: months[d.getFullYear() + '-' + d.getMonth()] ?? null }; });
      const dList = Array.from({ length: 30 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29 + i); return { d, v: days[d.toDateString()] ?? null }; });
      this._eSer = { ok: !!(mo || dy), months: mList, days: dList }; this.requestUpdate();
    });
    return this._eSer || null;
  }
  // Owner 2026-11-18 ("quero poder fechar essas informações"): parts of Energy fold from their title, remembered.
  efold(key, title, right, content) {
    // "Quem consome agora" stays closed until the owner opens it (owner 2026-11-18); the rest starts open.
    const f = this._prefs.eFold || {}, closed = f[key] ?? key === 'who';
    return html`<div class=${'efold' + (closed ? ' closed' : '')}><button class="efh" aria-expanded=${closed ? 'false' : 'true'} @click=${() => this._save({ eFold: { ...(this._prefs.eFold || {}), [key]: !closed } })}>
      <span class="eyebrow" style="font-size:10px">${title}</span><span class="row" style="gap:8px">${closed ? nothing : right || nothing}${ic('down', 'i s')}</span></button>${closed ? nothing : content}</div>`;
  }
  energyChart({ t, lang }, ser, price, cur, right = nothing) {
    if (!ser?.ok) return nothing;
    const mode = this._ui.eChart || 'months', list = mode === 'months' ? ser.months : ser.days, max = Math.max(0.001, ...list.map((x) => x.v || 0));
    const lbl = (d) => mode === 'months' ? d.toLocaleDateString(lang, { month: 'short' }).replace('.', '') : String(d.getDate());
    const fmt = (v) => v == null ? '—' : v.toLocaleString(lang, { maximumFractionDigits: v < 10 ? 1 : 0 }) + ' kWh' + (price != null ? ' · ' + (v * price).toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + cur : '');
    return this.efold('chart', mode === 'months' ? t('last12m') : t('last30d'), right, html`<div class="echart">
      <div class="row" style="justify-content:flex-end"><span class="seg"><button aria-pressed=${mode === 'days' ? 'true' : 'false'} @click=${() => this._set({ eChart: 'days' })}>${t('days30')}</button><button aria-pressed=${mode === 'months' ? 'true' : 'false'} @click=${() => this._set({ eChart: 'months' })}>${t('months12')}</button></span></div>
      <div class=${'ebars ' + mode} role="img" aria-label=${(mode === 'months' ? t('last12m') : t('last30d')) + ': ' + list.map((x) => lbl(x.d) + ' ' + fmt(x.v)).join(', ')}>
        ${list.map((x, i) => html`<div class=${'eb' + (i === list.length - 1 ? ' now' : '') + (x.v == null ? ' none' : '')} title=${(mode === 'months' ? x.d.toLocaleDateString(lang, { month: 'long', year: 'numeric' }) : x.d.toLocaleDateString(lang, { day: 'numeric', month: 'short' })) + ' · ' + fmt(x.v)}>
          <i style=${`height:${x.v == null ? 0 : Math.max(2, Math.round(100 * x.v / max))}%`}></i>${mode === 'months' || i % 5 === 4 || i === list.length - 1 ? html`<small>${lbl(x.d)}</small>` : html`<small></small>`}</div>`)}
      </div></div>`);
  }
  sEnergy({ m, t, aRgb, lang }) {
    const ui = this._ui, inRoom = (d) => ui.room === 'all' || d.area === ui.room;
    // Measured consumers: every device with a live power value (plugs with a sensor/attribute, devices without switch).
    const measured = [...m.metered, ...m.loosePower].filter(inRoom).map((p) => ({ ...p, w: Math.max(0, p.w), est: false }));
    const measuredDevs = new Set(measured.map((p) => p.device).filter(Boolean));
    // kWh-only devices → estimate.
    const estMeters = m.energyMeters.filter((e) => !(e.device && measuredDevs.has(e.device)) && !m.loosePower.some((x) => x.device && x.device === e.device));
    const est = this._powerEstimates(estMeters.map((e) => e.id).sort());
    const estimated = estMeters.filter(inRoom).filter((e) => est[e.id] != null).map((e) => ({ id: e.id, device: e.device, name: e.name, area: e.area, areaName: e.areaName, w: est[e.id], est: true }));
    const rows = [...measured, ...estimated].sort((x, y) => y.w - x.w);
    const mW = Math.round(measured.reduce((s, p) => s + p.w, 0)), eW = Math.round(estimated.reduce((s, p) => s + p.w, 0)), total = mW + eW;
    const known = measured.length + estimated.length;
    if (!known && !m.energyMeters.length && m.solarW == null && m.gridW == null && m.energyToday == null) return nothing;
    const hasSolar = m.solarW != null, hasGrid = m.gridW != null;
    const maxW = Math.max(1, ...rows.map((p) => p.w));
    const nf = (v, d = 1) => v == null ? '—' : Number(v).toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d });
    const areaName = ui.room === 'all' ? '' : (m.areas.find((a) => a.id === ui.room)?.name || '');
    const byRoom = ui.room === 'all' ? m.areas.map((a) => ({ n: a.name, w: rows.filter((p) => p.area === a.id).reduce((s, p) => s + p.w, 0), any: rows.some((p) => p.area === a.id) })).filter((x) => x.any) : [];
    const kwhToday = (dev) => { const e = this._eStats?.ok && m.energyMeters.find((x) => x.device && x.device === dev); const v = e ? this._eStats.day[e.id] : null; return v != null ? ' · ' + v.toLocaleString(lang, { maximumFractionDigits: 2 }) + ' kWh ' + t('todayShort') : ''; };
    const sub = known ? [measured.length ? t('monitoredOf', { n: measured.length }) : '', estimated.length ? t('estFrom', { n: estimated.length }) : '', areaName ? areaName : t('notWholeHouse')].filter(Boolean).join(' · ') : t('noLivePower');
    // History (statistics) and costs.
    const es = this._energyStats(m), meters = m.energyMeters.filter(inRoom);
    const sum = (k) => (es?.ok ? meters.reduce((a2, e) => a2 + (es[k][e.id] || 0), 0) : null);
    const today = sum('day') ?? (ui.room === 'all' ? m.energyToday?.v : null), month = sum('month') ?? (ui.room === 'all' ? m.energyMonth?.v : null);
    const price = this._prefs.energyPrice ?? m.price?.v ?? null, cur = this._prefs.energyCur || m.price?.unit || m.costToday?.unit || '€';
    const cost = price != null && today != null ? today * price : (ui.room === 'all' ? m.costToday?.v : null), mcost = price != null && month != null ? month * price : null;
    const ser = this._energySeries(m), yNow = new Date().getFullYear();
    const lastM = ser?.ok ? ser.months[10]?.v ?? null : null;
    const yList = ser?.ok ? ser.months.filter((x) => x.d.getFullYear() === yNow && x.v != null) : [];
    const yearV = yList.length ? yList.reduce((a2, x) => a2 + x.v, 0) : null;
    const setPrice = html`<button class="linkbtn" @click=${() => this._set({ settings: 'geral' })}>${t('setPrice')}</button>`;
    const flow = (on, rev, dur) => on ? `opacity:1;animation:flow ${dur}s linear infinite${rev ? ' reverse' : ''}` : 'opacity:0';
    const money = (v) => v == null ? null : v.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + cur;
    // Owner 2026-11-21 chose Energy concept A (premium): a dial, the day curve, today / this month with forecast.
    const hr = this._energyHours(m), now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let curve = [], peak = null, vsY = null, yTot = null;
    if (hr?.ok) {
      const tH = new Array(24).fill(null), yH = new Array(24).fill(null);
      for (const e of meters) for (const r of hr.per[e.id] || []) { const h = Math.floor((r.t - (r.t >= d0 ? d0 : hr.y0)) / 3600000); if (h < 0 || h > 23) continue; const arr = r.t >= d0 ? tH : yH; arr[h] = (arr[h] || 0) + r.v; }
      const done = tH.reduce((k, v, i) => (v != null ? i + 1 : k), 0);
      curve = tH.slice(0, done).map((v) => Math.round((v || 0) * 1000));
      if (curve.length) peak = Math.max(...curve);
      if (yH.some((v) => v != null)) {
        yTot = yH.reduce((x, v) => x + (v || 0), 0);
        const a1 = tH.slice(0, done).reduce((x, v) => x + (v || 0), 0), b1 = yH.slice(0, done).reduce((x, v) => x + (v || 0), 0);
        if (done >= 2 && b1 > 0.01) vsY = Math.round(100 * (a1 - b1) / b1);
      }
    }
    if (known) peak = Math.max(peak || 0, total);
    const hoursIn = (now.getTime() - d0) / 3600000, avgW = today != null && hoursIn >= 1 ? Math.round(today * 1000 / hoursIn) : null;
    const nice = [100, 200, 300, 500, 800, 1000, 1500, 2000, 3000, 5000, 8000, 10000, 15000, 20000, 30000];
    const scaleMax = nice.find((v) => v >= Math.max(total, peak || 0, 1) * 1.1) || Math.ceil(Math.max(total, peak || 0) / 10000) * 10000;
    const pt = (f) => { const a2 = Math.PI * (1 - Math.min(1, Math.max(0, f))); return [150 + 120 * Math.cos(a2), 170 - 120 * Math.sin(a2)]; };
    const fNow = known ? total / scaleMax : 0, [tx, ty] = pt(fNow), fPk = peak != null ? peak / scaleMax : null;
    const arcTo = fNow > 0.004 ? `M30 170A120 120 0 0 1 ${tx.toFixed(1)} ${ty.toFixed(1)}` : '';
    const ticks = Array.from({ length: 41 }, (_, i) => { const a2 = Math.PI * (1 - i / 40), r1 = i % 5 ? 136 : 131; return svg`<line x1=${(150 + r1 * Math.cos(a2)).toFixed(1)} y1=${(170 - r1 * Math.sin(a2)).toFixed(1)} x2=${(150 + 142 * Math.cos(a2)).toFixed(1)} y2=${(170 - 142 * Math.sin(a2)).toFixed(1)} class=${i / 40 <= fNow ? 'on' : ''}></line>`; });
    const pk = fPk != null ? (() => { const a2 = Math.PI * (1 - Math.min(1, fPk)); return svg`<line class="pk" x1=${(150 + 104 * Math.cos(a2)).toFixed(1)} y1=${(170 - 104 * Math.sin(a2)).toFixed(1)} x2=${(150 + 112 * Math.cos(a2)).toFixed(1)} y2=${(170 - 112 * Math.sin(a2)).toFixed(1)}></line>`; })() : nothing;
    // Day curve: the hourly averages of the meters (the live value comes from more devices, so it is not mixed in).
    const cPts = curve, cMax = Math.max(1, ...cPts), cx = (i) => (cPts.length < 2 ? 0 : (i / (cPts.length - 1)) * 346), cy = (v) => 40 - (v / cMax) * 34;
    const cLine = cPts.map((v, i) => (i ? 'L' : 'M') + cx(i).toFixed(1) + ' ' + cy(v).toFixed(1)).join(' ');
    // Month forecast from the pace so far (from day 3 on).
    const mLen = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), mFrac = (now.getDate() - 1 + hoursIn / 24) / mLen;
    const fcast = month != null && now.getDate() >= 3 && mFrac > 0 ? month / mFrac : null;
    // Consumers: the active ones as rows with a ring; the ones in standby (≤ 5 W) folded into one line.
    const IDLE_W = 5, active = rows.length > 5 ? rows.filter((p) => p.w > IDLE_W) : rows, idle = rows.filter((p) => !active.includes(p)), idleW = Math.round(idle.reduce((x, p) => x + p.w, 0));
    const ring = (p, i) => { const f = total ? p.w / total : 0; return html`<span class="ering" aria-hidden="true"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" class="bg"></circle>${f > 0.005 ? svg`<circle cx="22" cy="22" r="20" class=${'fg' + (p.est ? ' est' : '') + (i === 0 ? ' lead' : '')} stroke-dasharray=${`${Math.max(2, f * 125.7).toFixed(1)} 126`} transform="rotate(-90 22 22)"></circle>` : nothing}</svg>${ic(devIc(p.name), 'i')}</span>`; };
    const row = (p, i) => html`<button class="ewho" @click=${() => this._moreInfo(p.powerId || p.id)}>${ring(p, i)}
      <span class="txt"><b>${p.name}</b><small>${[p.areaName, kwhToday(p.device).replace(/^ · /, '')].filter(Boolean).join(' · ')}</small></span>
      <span class=${'ewv' + (i === 0 && p.w > IDLE_W ? ' lead' : '')}>${p.est ? html`<span class="esttag">${t('estimated')}</span> ≈ ` : ''}${p.w} <small>W</small><small class="pc">${total ? Math.round(100 * p.w / total) : 0}%</small></span></button>`;
    const showIdle = !!this._ui.eIdle;
    const maxRoom = Math.max(1, ...byRoom.map((r) => r.w));
    return html`<section class="sec">${this.secHead('energy', t('energy'), known ? t('devicesMeasuring', { n: known }) : '', known ? html`<span class="elive">${t('live')}</span>` : nothing, t)}
      <div class="egrid">
        <div class="ecard ehero">
          <div class="edial">
            <svg viewBox="0 0 300 190" aria-hidden="true"><defs><linearGradient id="aurEg" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".25"></stop><stop offset=".7" stop-color="var(--accent)"></stop><stop offset="1" stop-color="#fff" stop-opacity=".85"></stop></linearGradient>
              <radialGradient id="aurEt"><stop offset="0" stop-color="#fff"></stop><stop offset=".45" stop-color="var(--accent)" stop-opacity=".6"></stop><stop offset="1" stop-color="var(--accent)" stop-opacity="0"></stop></radialGradient></defs>
              <g class="tk">${ticks}</g><path class="trk" d="M30 170A120 120 0 0 1 270 170"></path>
              ${arcTo ? svg`<path class="glo" d=${arcTo}></path><path class="arc" d=${arcTo}></path><circle cx=${tx.toFixed(1)} cy=${ty.toFixed(1)} r="16" fill="url(#aurEt)" opacity=".7"></circle><circle cx=${tx.toFixed(1)} cy=${ty.toFixed(1)} r="5.5" fill="#fff"></circle>` : nothing}${pk}</svg>
            <div class="edv"><b>${known ? (eW && !mW ? '≈' : '') + total : '—'}</b>${known ? html`<small>W</small>` : nothing}<span class="txt">${t('monitoredNow')}</span></div>
          </div>
          <div class="escale"><span>0</span>${peak != null && known ? html`<span class="pk">${t('peakToday', { w: peak + ' W' })}</span>` : html`<span></span>`}<span>${scaleMax >= 1000 ? scaleMax / 1000 + ' kW' : scaleMax}</span></div>
          <span class="esub txt">${sub}</span>
          ${vsY != null || avgW != null ? html`<div class="echips">${vsY != null ? html`<span class=${'echip' + (vsY > 10 ? ' up' : '')}><b>${vsY > 0 ? '↑' : vsY < 0 ? '↓' : '='} ${Math.abs(vsY)}%</b> ${t('vsYesterday')}</span>` : nothing}${avgW != null ? html`<span class="echip">${t('avgShort')} <b>${avgW} W</b></span>` : nothing}</div>` : nothing}
          ${cPts.length >= 3 ? html`<div class="ecurve" role="img" aria-label=${t('dayCurve')}><svg viewBox="0 0 346 44" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="aurEa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"></stop><stop offset="1" stop-color="var(--accent)" stop-opacity="0"></stop></linearGradient></defs>
            <path d=${cLine + ` L${cx(cPts.length - 1).toFixed(1)} 44 L0 44Z`} fill="url(#aurEa)"></path><path d=${cLine} class="ln"></path></svg>
            <span class="eticks"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>${t('nowShort')}</span></span></div>` : nothing}
          ${hasSolar || hasGrid ? html`<div class="flowbox" role="img" aria-label=${[hasSolar ? `${t('solar')} ${m.solarW} W` : '', hasGrid ? `${t('grid')} ${m.gridW} W` : '', `${t('home')} ${total} W`].filter(Boolean).join(' · ')}>
            ${svg`<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0" aria-hidden="true">
              ${hasSolar ? svg`<path d="M16 20 C 45 20, 50 50, 80 50" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="2" vector-effect="non-scaling-stroke"></path><path d="M16 20 C 45 20, 50 50, 80 50" fill="none" stroke="#F5D08A" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round" vector-effect="non-scaling-stroke" style=${flow(m.solarW > 0, false, 1.1)}></path>` : nothing}
              ${hasGrid ? svg`<path d="M16 80 C 45 80, 50 50, 80 50" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="2" vector-effect="non-scaling-stroke"></path><path d="M16 80 C 45 80, 50 50, 80 50" fill="none" stroke="#8FB8FF" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round" vector-effect="non-scaling-stroke" style=${flow(m.gridW !== 0, m.gridW < 0, 2.2)}></path>` : nothing}</svg>`}
            ${hasSolar ? html`<div class="node" style="left:16%;top:20%"><span class="o" style="background:#1E1A12;border:1px solid #4A3C22;color:#F5D08A">${svg`<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d=${P.sun}></path></svg>`}</span><span style="font-size:13px">${m.solarW} W</span><span class="tag muted" style="font-size:9px">${t('solar')}</span></div>` : nothing}
            ${hasGrid ? html`<div class="node" style="left:16%;top:80%"><span class="o" style="background:#121826;border:1px solid #2A3A5A;color:#8FB8FF">${ic('grid')}</span><span style="font-size:13px">${Math.abs(m.gridW)} W</span><span class="tag muted" style="font-size:9px">${t('grid')}</span></div>` : nothing}
            <div class="node" style="left:80%;top:50%"><span class="o" style=${`width:92px;height:92px;background:var(--raise);border:1px solid var(--line2);flex-direction:column;gap:2px;box-shadow:0 0 60px -10px ${rgba(aRgb, Math.min(0.55, 0.12 + total / 3000))}`}>${ic('home')}<b style="font-size:14px;font-weight:500">${known ? total + ' W' : '—'}</b></span><span class="tag muted" style="font-size:9px">${t('home')}</span></div>
          </div>` : nothing}
          <div class="eduo">
            <div class="ecell"><span class="eyebrow">${t('todayE')}</span><b>${nf(today)} <small>kWh</small></b>
              ${price == null && cost == null ? setPrice : html`<span class="eur">${money(cost)}</span>`}
              ${yTot != null && today != null ? html`<span class="eprog"><i style=${`width:${Math.min(100, Math.round(100 * today / Math.max(0.01, yTot)))}%`}></i></span><small class="esm">${t('yesterdayKwh', { v: nf(yTot) })}</small>` : nothing}</div>
            <div class="ecell"><span class="eyebrow">${t('thisMonth')}</span><b>${nf(month, month != null && month < 10 ? 1 : 0)} <small>kWh</small></b>
              ${price == null ? setPrice : html`<span class="eur">${money(mcost)}${fcast != null ? html`<small> → ~${Math.round(fcast * price)} ${cur}</small>` : nothing}</span>`}
              ${month != null ? html`<span class="eprog"><i style=${`width:${Math.round(100 * Math.min(1, mFrac))}%`}></i></span><small class="esm">${fcast != null ? t('forecastTo', { d: mLen, v: nf(fcast, 0) }) : t('monthSoFar')}</small>` : nothing}</div>
          </div>
          ${m.energyMeters.length ? html`<span class="dim txt" style="font-size:11px">${t(m.energyByLabel ? 'meterHintLabel' : 'meterHintAll', { n: m.energyMeters.length })}${m.mainMeters.length ? ' · ' + t('mainMeterApart', { n: m.mainMeters.length }) : ''}${price != null ? ' · ' + nf(price, 2) + ' ' + cur + '/kWh' : ''}</span>` : nothing}
        </div>
        <div class="ecol">
          ${ui.room === 'all' && ser?.ok ? html`<div class="ecard">${this.energyChart({ t, lang }, ser, price, cur, yearV != null ? html`<span class="etot">${nf(yearV, 0)} kWh${price != null ? html` <em>${money(yearV * price)}</em>` : nothing}</span>` : nothing)}
            ${lastM != null ? html`<div class="efoot"><span>${t('lastMonth')} <b>${nf(lastM, lastM < 10 ? 1 : 0)} kWh${price != null ? ' · ' + money(lastM * price) : ''}</b></span>${price != null ? html`<span>${nf(price, 2)} ${cur}/kWh</span>` : nothing}</div>` : nothing}</div>` : nothing}
          <div class="ecard">
            ${this.efold('who', t('whoNow'), html`<span class="dim" style="font-size:12px">${t('ofMonitored')}</span>`, rows.length ? html`<div class="ewlist">
              ${active.map((p, i) => row(p, i))}
              ${idle.length ? html`<button class="eidle" aria-expanded=${showIdle ? 'true' : 'false'} @click=${() => this._set({ eIdle: !showIdle })}><span class="edots" aria-hidden="true">${idle.slice(0, 4).map((p) => html`<i>${ic(devIc(p.name), 'i s')}</i>`)}</span>
                <span class="txt"><b>${t('idleN', { n: idle.length })}</b> · ${t('idleTogether', { w: idleW + ' W' })}</span>${ic(showIdle ? 'up' : 'down', 'i s')}</button>
                ${showIdle ? idle.map((p) => row(p, 99)) : nothing}` : nothing}</div>`
              : html`<span class="muted txt" style="font-size:13px">${t('noLivePowerLong')}</span>`)}
            ${byRoom.length ? this.efold('rooms', t('byRoom'), nothing, html`<div class="erooms">${byRoom.sort((x, y) => y.w - x.w).map((r) => html`<div class="erm"><span class="txt">${r.n}</span><span class="et"><i style=${`width:${Math.max(1, Math.round(100 * r.w / maxRoom))}%`}></i></span><b>${Math.round(r.w)} W</b></div>`)}</div>`) : nothing}
          </div>
        </div></div></section>`;
  }
  // Diagnosis (owner 2026-11-18): per device, what Home Assistant actually gives the dashboard — read-only.
  energyDiag({ m, t }) {
    const S = this.hass.states, list = [], est = this._pEst || {};
    const liveDevs = new Set([...m.metered, ...m.loosePower].map((p) => p.device).filter(Boolean));
    const estMeters = m.energyMeters.filter((e) => !(e.device && liveDevs.has(e.device)));
    for (const p of m.plugs) {
      const e = m.energyMeters.find((x) => x.device && x.device === p.device);
      list.push({ name: p.name, area: p.areaName, power: p.wSrc === 'sensor' ? `${p.w} W · ${p.powerId}` : p.wSrc === 'attribute' ? `${p.w} W · ${t('diagAttr')}` : p.wSrc === 'unavailable' ? `${t('diagUnavail')} · ${p.powerId}` : (e && est[e.id] != null ? `≈ ${est[e.id]} W · ${t('estimated')}` : t('diagNoPower')), energy: e ? `${S[e.id]?.state ?? '—'} ${S[e.id]?.attributes?.unit_of_measurement || ''} · ${e.id}` : '—', bad: p.wSrc === 'none' || p.wSrc === 'unavailable' });
    }
    for (const x of m.loosePower) list.push({ name: x.name, area: x.areaName, power: `${x.w} W · ${x.powerId}`, energy: '', bad: false });
    for (const e of estMeters.filter((x) => !m.plugs.some((p) => p.device && p.device === x.device))) list.push({ name: e.name, area: e.areaName, power: est[e.id] != null ? `≈ ${est[e.id]} W · ${t('estimated')}` : t('diagNoPower'), energy: `${S[e.id]?.state ?? '—'} ${S[e.id]?.attributes?.unit_of_measurement || ''} · ${e.id}`, bad: est[e.id] == null });
    return html`<div class="ediag">${list.map((r) => html`<div class=${'edr' + (r.bad ? ' bad' : '')}><b>${r.name} <small>${r.area}</small></b><span>${t('diagPower')}: ${r.power}</span>${r.energy ? html`<span>${t('diagEnergy')}: ${r.energy}</span>` : nothing}</div>`)}
      <span class="dim txt" style="font-size:11px">${t('diagFoot')}</span></div>`;
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
    const head = this.secHead('openings', t('openings'), openN ? t('openHead', { a: openN, b: list.length }) : t('allClosed'), null, t);
    // Owner 2026-11-21 chose concept A "Escudo": one card, a shield that glows, one small tile per door/window.
    if (!this._ui.edit) {
      const last = list.map((o) => Date.parse(o.st?.last_changed || '')).filter(Number.isFinite).sort((a, b) => b - a)[0];
      const opened = list.filter((o) => o.open);
      return html`<section class="sec">${head}
        <div class=${'shieldc' + (openN ? ' warn' : '')}>
          <div class="shhd"><span class="shring" aria-hidden="true">${openN ? opIc(!!opened[0].door, true, 'i') : ic('shield', 'i')}</span>
            <span class="grow txt">
              <b class="shbig">${openN ? (openN === 1 ? opened[0].name + ' · ' + (opened[0].areaName || '') : t('openHead', { a: openN, b: list.length })) : t('allClosed')}</b>
              <small>${t('sensorsN', { n: list.length })}${last ? ' · ' + t('lastChange', { t: ago(new Date(last).toISOString()) }) : ''}</small></span></div>
          <div class="shrooms">${repeat(list, (o) => o.id, (o) => html`<button class=${'shr' + (o.open ? ' open' : '') + (o.unavailable ? ' na' : '')} aria-label=${o.name + ' · ' + (o.areaName || t('noArea')) + ' · ' + (o.unavailable ? t('notAvailable') : o.open ? t('open') : t('shut'))} @click=${() => this._moreInfo(o.id, o.areaName ? undefined : 'settings')}>
            ${opIc(!!o.door, o.open && !o.unavailable, 'i s')}<span class="txt">${o.areaName || o.name}</span>${o.open ? html`<small>${ago(o.st.last_changed)}</small>` : nothing}</button>`)}</div>
        </div></section>`;
    }
    return html`<section class="sec">${head}
      <div class="grid w">${repeat(list, (o) => o.id, (o) => {
        const ta = this.tileAttrs('openings', o, ids);
        return html`<div class=${'tile' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end} style=${(o.open ? 'border-color:var(--accent);' : '') + 'padding:14px 16px'}>
          ${this.editBar('openings', o, ids, t)}
          <div class="row" style="gap:12px"><span class="ic" style=${'width:36px;height:36px;' + (o.open ? 'background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)' : '')}>${ic(o.door ? 'door' : 'win', 'i s')}</span>
            <span class="nm grow">${this.nmLink(o, html`<b>${o.name}</b>`, t)}<span>${o.areaName || t('noArea')}</span></span>
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
              <span class="nm">${this.nmLink(l, html`<span class="tag muted">${l.name}</span>`, t)}<b style="font-size:24px;font-weight:300;letter-spacing:-.03em">${l.locked ? t('locked') : t('unlocked')}</b><span>${armed ? t('confirmUnlock') : l.locked ? t('tapUnlock') : t('tapLock')}</span></span></button></div>`; })}
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
    const head = this.secHead('tv', t('tvs'), t('plugsHead', { a: list.filter((x) => x.state !== 'off' && !x.unavailable && x.state !== 'standby').length, b: list.length }), null, t);
    // Owner 2026-11-21 chose concept A "Cinema": the source in large italic, a glowing power button, volume line and
    // source chips. Every button is a direct tap by the owner.
    if (!this._ui.edit) return html`<section class="sec">${head}<div class="cinegrid">${repeat(list, (d) => d.id, (d) => {
      const on = !d.unavailable && !['off', 'standby'].includes(d.state), muted = !!d.attrs?.is_volume_muted;
      const src = d.attrs?.source || d.attrs?.app_name || d.attrs?.media_title || '', srcs = (d.attrs?.source_list || []).slice(0, 8);
      const canPow = (d.features & (F.ON | F.OFF)) && !d.unavailable, canVol = on && (d.features & (F.VOL_STEP | F.VOL_SET));
      return html`<div class=${'cine' + (on ? ' on' : '') + (d.unavailable ? ' ghosted' : '')}>
        <div class="cart">
          ${this.nmLink(d, html`<span class="eyebrow" style="font-size:10px">${d.name}${d.areaName ? ' · ' + d.areaName : ''}</span>`, t)}
          <span class="csrc">${d.unavailable ? t('notAvailable') : on ? (src || t('on')) : t('tvOff')}</span>
          ${canPow ? html`<button class="cpow" aria-pressed=${on ? 'true' : 'false'} aria-label=${(on ? t('plugOff') : t('plugOn')) + ' · ' + d.name} @click=${() => this._call('media_player', on ? 'turn_off' : 'turn_on', { entity_id: d.id })}>${ic('power', 'i')}</button>` : nothing}
        </div>
        ${canVol ? html`<div class="cbody"><div class="cvol">
          ${d.features & F.MUTE ? html`<button class="vpm" aria-pressed=${muted ? 'true' : 'false'} aria-label=${t('mute') + ' · ' + d.name} style=${muted ? 'color:var(--accent);border-color:var(--accent)' : ''} @click=${() => this._call('media_player', 'volume_mute', { entity_id: d.id, is_volume_muted: !muted })}>${ic(muted ? 'mute' : 'vol', 'i s')}</button>` : nothing}
          <button class="vpm" aria-label=${t('volume') + ' − · ' + d.name} @click=${() => this._call('media_player', 'volume_down', { entity_id: d.id })}>${ic('minus', 'i s')}</button>
          <span class="cline" role=${d.features & F.VOL_SET ? 'slider' : 'presentation'} aria-label=${t('volume') + ' · ' + d.name} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${d.vol ?? 0} @click=${(e) => { if (!(d.features & F.VOL_SET)) return; const r = e.currentTarget.getBoundingClientRect(), v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); this._call('media_player', 'volume_set', { entity_id: d.id, volume_level: Math.round(v * 100) / 100 }); }}><i style=${`width:${Math.max(0, Math.min(100, d.vol ?? 0))}%`}></i></span>
          <button class="vpm" aria-label=${t('volume') + ' + · ' + d.name} @click=${() => this._call('media_player', 'volume_up', { entity_id: d.id })}>${ic('plus', 'i s')}</button>
          ${d.vol != null ? html`<span class="mono vnum">${d.vol}</span>` : nothing}</div>
          ${srcs.length ? html`<div class="csrcs" role="group" aria-label=${t('tvSource')}>${srcs.map((x) => html`<button class=${'chipb' + (x === d.attrs?.source ? ' on' : '')} aria-pressed=${x === d.attrs?.source ? 'true' : 'false'} @click=${() => this._call('media_player', 'select_source', { entity_id: d.id, source: x })}>${x}</button>`)}</div>` : nothing}
        </div>` : nothing}
      </div>`; })}</div></section>`;
    return html`<section class="sec">${head}
      <div class="grid sgrid">${repeat(list, (d) => d.id, (d) => {
        const ta = this.tileAttrs('tv', d, ids), on = !d.unavailable && !['off', 'standby'].includes(d.state);
        const muted = !!d.attrs?.is_volume_muted;
        return html`<div class=${'tile mini' + ta.cls + (d.unavailable ? ' ghosted' : '')} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end}>
          ${this.editBar('tv', d, ids, t)}
          <div class="row" style="gap:12px">
            <span class="ic" style=${on ? 'background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)' : ''}>${ic('tv', 'i')}</span>
            <button class="lname grow" aria-label=${d.name + ' · ' + (d.areaName ? t('details') : t('setRoom'))} @click=${() => this._moreInfo(d.id, d.areaName ? undefined : 'settings')}><span class="txt" style="display:flex;flex-direction:column;gap:2px"><b class="txt" style="font-weight:500">${d.name}</b><span class="muted txt" style="font-size:12px">${[d.areaName, d.unavailable ? t('notAvailable') : on ? (d.attrs?.source || t('plugOn')) : t('plugOff')].filter(Boolean).join(' · ')}</span></span></button>
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
  // Owner 2026-11-22: the standard speaker. When nothing is active on Spotify, Play (or a playlist) is sent to it.
  // Stored in the synced prefs (musicDefault = Spotify Connect name). Returns true when it already started playback.
  async _toDefaultSpeaker(play = true) {
    const mc = this._mc, name = this._prefs.musicDefault, st = mc?.state?.state;
    if (!name || !mc?.advanced('player_transfer_playback') || !mc.advanced('get_spotify_connect_devices') || st === 'playing' || st === 'paused') return false;
    try { await mc.loadDevices(false); } catch (_) { return false; }
    if (mc.devices.some((d) => d.active)) return false;
    const d = mc.devices.find((x) => x.name === name); if (!d) return false;
    try { await mc.callSpotify('player_transfer_playback', { device_id: d.id, play }); return true; } catch (_) { return false; }
  }
  _musicPlay() { const mc = this._mc; if (mc.isPlaying) return mc.command('pause'); this._toDefaultSpeaker(true).then((done) => { if (!done) mc.command('play'); }); }
  _musicItem(it) { const mc = this._mc; this._toDefaultSpeaker(false).finally(() => mc.playItem(it)); }
  // Owner 2026-11-22: the speaker window (speaker button). Spotify Connect speakers (the Alexas) with the one playing
  // in gold (equalizer + volume); a star makes one the standard speaker. Other HA speakers follow; unavailable last.
  speakerSheet({ t, all, vol, playing, full }) {
    const mc = this._mc, hid = new Set(this._prefs.connectHidden || []), def = this._prefs.musicDefault || '';
    const devs = mc.devices.filter((d) => d.active || !hid.has(d.name));
    const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '');
    const others = all.filter((s) => !devs.some((d) => norm(d.name) === norm(s.name))).sort((x, y) => (x.unavailable ? 1 : 0) - (y.unavailable ? 1 : 0));
    const star = (name) => html`<button class=${'spdef' + (def === name ? ' on' : '')} aria-pressed=${def === name ? 'true' : 'false'} aria-label=${t('defaultSpeaker') + ' · ' + name} title=${t('defaultSpeaker')} @click=${(e) => { e.stopPropagation(); this._save({ musicDefault: def === name ? '' : name }); }}>${svg`<svg class="i s" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"></path></svg>`}<span>${def === name ? t('defaultOn') : t('defaultSet')}</span></button>`;
    return html`<div class="spks">
      ${mc.pending.has('devices') && !devs.length ? html`<span class="muted" style="font-size:13px">${t('loadingS')}</span>` : nothing}
      ${devs.length ? html`<span class="eyebrow spkh">Spotify</span>` : nothing}
      ${devs.map((d) => { const on = d.active && playing; return html`<div class=${'spr' + (d.active ? ' on' : '')} role="button" tabindex="0" aria-pressed=${d.active ? 'true' : 'false'} @click=${() => { if (!d.active) { mc.transfer(d.id); if (!full) setTimeout(() => this._set({ libSheet: false }), 700); } }} @keydown=${(e) => { if ((e.key === 'Enter' || e.key === ' ') && !d.active) { e.preventDefault(); mc.transfer(d.id); } }}>
        <span class="spi">${ic(/tv|fernseh/i.test(d.name) ? 'tv' : 'speaker', 'i s')}</span>
        <span class="spn"><b class="txt">${d.name}</b><small class="txt">${d.active ? (playing ? t('playing') : t('paused')) : d.ready ? t('readyS') : t('openSpotify')}</small>
          ${d.active && vol != null && mc.can('volume') ? html`<span class="spvl" @click=${(e) => e.stopPropagation()}>${this.volLine(vol, t)}</span>` : nothing}</span>
        ${on ? html`<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>` : nothing}${star(d.name)}</div>`; })}
      ${others.length ? html`<span class="eyebrow spkh">${t('otherSpeakers')}</span>` : nothing}
      ${others.map((s2) => { const v = this._local['vol:' + s2.id] ?? s2.vol; return html`<div class=${'spr' + (s2.playing ? ' on' : '') + (s2.unavailable ? ' na' : '')}>
        <span class="spi">${ic(s2.tv ? 'tv' : 'speaker', 'i s')}</span>
        <span class="spn">${this.nmLink(s2, html`<b class="txt">${s2.name}</b>`, t)}<small class="txt">${[s2.areaName, s2.unavailable ? t('notAvailable') : s2.playing ? (s2.attrs.media_title || t('playing')) : s2.state === 'paused' ? t('paused') : ''].filter(Boolean).join(' · ')}</small>
          ${v != null && s2.features & F.VOL && (s2.playing || s2.state === 'paused') ? html`<input class="rng spv" type="range" min="0" max="100" .value=${String(v)} aria-label=${t('volume') + ' · ' + s2.name} style=${`background:linear-gradient(90deg,var(--accent) ${v}%,var(--line2) ${v}%)`}
            @input=${(e) => { this._local['vol:' + s2.id] = Number(e.target.value); this.requestUpdate(); }} @change=${(e) => { const nv = Number(e.target.value); this._call('media_player', 'volume_set', { entity_id: s2.id, volume_level: nv / 100 }).finally(() => setTimeout(() => { delete this._local['vol:' + s2.id]; this.requestUpdate(); }, 1500)); }}>` : nothing}</span>
        ${s2.features & (F.PAUSE | F.PLAY) && !s2.unavailable ? html`<button class="ib sm" aria-label=${(s2.playing ? t('pause') : t('play')) + ' · ' + s2.name} @click=${() => this._call('media_player', 'media_play_pause', { entity_id: s2.id })}>${ic(s2.playing ? 'pause' : 'play', 'i s f')}</button>` : nothing}</div>`; })}
      ${!mc.pending.has('devices') && !devs.length && !others.length ? html`<span class="muted txt" style="font-size:13px">${t('noDevices')}</span>` : nothing}
      ${devs.length ? html`<span class="muted txt" style="font-size:11.5px">${t('defaultHint')}</span>` : nothing}
    </div>`;
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
            <span class="stl">${pos.duration ? html`<span class="mono stime">${mmss(pos.value)} / ${mmss(pos.duration)}</span>` : nothing}
            ${mc.advanced('save_track_favorites') && a.media_title ? html`<button class="ib sm ghost sheart" aria-pressed=${mc.favorite ? 'true' : 'false'} aria-label=${t('likedS')} style=${mc.favorite ? 'color:#FF8FA3' : 'color:var(--mut)'} @click=${() => mc.toggleFavorite()}>${svg`<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style=${mc.favorite ? 'fill:currentColor' : ''}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"></path></svg>`}</button>` : nothing}</span>
          </div>
          <div class="sctl">
            ${mc.can('shuffle') ? html`<button class="ib sm ghost" aria-pressed=${a.shuffle ? 'true' : 'false'} aria-label=${t('shuffle')} style=${a.shuffle ? 'color:var(--accent)' : 'color:var(--mut)'} @click=${() => mc.command('shuffle')}>${ic('shuffle', 'i s')}</button>` : nothing}
            ${mc.can('previous') ? html`<button class="ib sm" style="border-radius:50%" aria-label=${t('prev')} ?disabled=${mc.pending.has('transport:previous')} @click=${() => this._skip('previous')}>${ic('prev', 'i s f')}</button>` : nothing}
            <button class="play jplay" aria-label=${playing ? t('pause') : t('play')} ?disabled=${!mc.ready} @click=${() => this._musicPlay()}>${ic(playing ? 'pause' : 'play', 'i f')}</button>
            ${mc.can('next') ? html`<button class="ib sm" style="border-radius:50%" aria-label=${t('next')} ?disabled=${mc.pending.has('transport:next')} @click=${() => this._skip('next')}>${ic('next', 'i s f')}</button>` : nothing}
            ${mc.can('repeat') ? html`<button class="ib sm ghost" aria-pressed=${a.repeat && a.repeat !== 'off' ? 'true' : 'false'} aria-label=${t('repeat') + ': ' + t('repeat_' + (a.repeat || 'off'))} title=${t('repeat_' + (a.repeat || 'off'))} style=${'position:relative;' + (a.repeat && a.repeat !== 'off' ? 'color:var(--accent)' : 'color:var(--mut)')} @click=${() => mc.command('repeat')}>${ic('repeat', 'i s')}${a.repeat === 'one' ? html`<b style="position:absolute;right:6px;top:5px;font-size:9px;font-weight:600">1</b>` : nothing}</button>` : nothing}
          </div>
          ${pos.duration ? html`<input class="sprog" type="range" min="0" max=${String(Math.round(pos.duration))} .value=${String(Math.round(pos.value))} ?disabled=${!mc.can('seek')} aria-label=${a.media_title || 'position'} style=${`--p:${(fr * 100).toFixed(1)}%`} @change=${(e) => mc.command('seek', Number(e.target.value))}>` : nothing}
        </div>

        ${mc.error ? html`<span class="txt" style="position:relative;font-size:12px;color:#FF8A80">${mc.error}</span>` : nothing}
        <div class="mlib">
          <div class="mchips mdock" role="toolbar" aria-label=${t('music')}>
            ${mc.advanced('get_spotify_connect_devices') || all.length ? html`<button class=${'dc dk spk' + ((full || ui.libSheet) && panel === 'devices' ? ' on' : '')} aria-pressed=${(full || ui.libSheet) && panel === 'devices' ? 'true' : 'false'} aria-label=${t('speakersShort') + (a.source ? ' · ' + a.source : '')} title=${a.source || t('speakersShort')} @click=${() => { this._set({ musicPanel: 'devices', musicSearch: false, libSheet: !full }); mc.loadDevices(false); }}><span class="dki">${ic('speaker', 'i')}${playing ? html`<i class="dkdot" aria-hidden="true"></i>` : nothing}</span><span class="dkl txt">${t('speakerS')}</span></button>` : nothing}
            ${kinds.map(([k, n]) => { const on = (full || ui.libSheet) && panel === 'library' && mc.libraryKind === k && mc.view === 'library' && !ui.musicSearch; const icn = { playlists: 'mlist', recent: 'mclock', albums: 'mdisc', favorites: 'mheart', podcasts: 'mmic' }[k] || 'mlist'; return html`<button class=${'dc dk' + (on ? ' on' : '')} aria-pressed=${on ? 'true' : 'false'} aria-label=${n} @click=${() => { this._set({ musicPanel: 'library', musicSearch: false, libSheet: !full }); mc.browse(k); }}><span class="dki">${ic(icn, 'i')}</span><span class="dkl txt">${n}</span></button>`; })}
            ${mc.advanced('search_tracks') ? html`<button class=${'dc dk' + (ui.musicSearch ? ' on' : '')} aria-pressed=${ui.musicSearch ? 'true' : 'false'} aria-label=${t('searchS')} @click=${() => { const on = full ? !ui.musicSearch : true; this._set({ musicSearch: on, musicPanel: 'library', libSheet: !full }); if (on) setTimeout(() => this.renderRoot.querySelector('.msearch')?.focus(), 80); }}><span class="dki">${ic('search', 'i')}</span><span class="dkl txt">${t('findS')}</span></button>` : nothing}
          </div>
          ${full ? html`
          ${(ui.musicSearch || full) && mc.advanced('search_tracks') ? html`<input class="msearch" type="search" .value=${ui.musicQuery || ''} placeholder=${t('searchS')} aria-label=${t('searchS')} @input=${(e) => this._set({ musicQuery: e.target.value })} @keydown=${(e) => { if (e.key === 'Enter' && e.target.value.trim()) { mc.browse('search', e.target.value); } }}
            style="min-height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--line2);background:var(--sunk);color:var(--fg);font:inherit;font-size:13px">` : nothing}
          ${panel === 'devices' ? this.speakerSheet({ t, all, vol, playing, full })
          : (() => {
              // Owner 2026-11-16 ("playlists daquele jeito tá feio"): a calm list — small cover, name, who/what, play.
              const sub = (it) => [it.owner?.display_name, (it.artists || it.album?.artists || []).map((x) => x.name).join(', '), it.publisher, it.tracks?.total ? t('tracksN', { n: it.tracks.total }) : null].filter(Boolean).slice(0, 2).join(' · ');
              const nowUri = a.media_context_content_id || a.sp_context_uri || a.media_content_id || '';
              const all = mc.results.slice(0, full ? 50 : 20), more = full, shown = all;
              return html`<div class="mlist">${busy && !all.length ? html`<span class="muted" style="font-size:13px">${t('loadingS')}</span>` : nothing}
              ${shown.map((it) => { const im = imgOf(it), starting = mc.startingUri === it.uri, cur = it.uri && nowUri === it.uri; return html`<button class=${'mli' + (cur ? ' cur' : '')} aria-label=${t('play') + ' · ' + it.name} ?disabled=${starting} @click=${() => { this._musicItem(it); if (!full) setTimeout(() => this._set({ libSheet: false }), 600); }}>
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
        ${!full && ui.libSheet ? html`<div class=${'msheet' + (panel === 'devices' ? ' tall' : '')} role="dialog" aria-label=${panel === 'devices' ? t('whereToPlay') : ui.musicSearch ? t('searchS') : (kinds.find(([k]) => k === mc.libraryKind) || [, ''])[1]} @keydown=${(e) => { if (e.key === 'Escape') this._set({ libSheet: false }); }}>
          <div class="mshead"><span class="mstitle txt">${panel === 'devices' ? t('speakersShort') : ui.musicSearch ? t('searchS') : (kinds.find(([k]) => k === mc.libraryKind) || [, ''])[1]}</span><button class="ib sm" aria-label=${t('close')} @click=${() => this._set({ libSheet: false })}>${ic('x', 'i s')}</button></div>
          <div class="msbody">
          ${(ui.musicSearch || full) && mc.advanced('search_tracks') ? html`<input class="msearch" type="search" .value=${ui.musicQuery || ''} placeholder=${t('searchS')} aria-label=${t('searchS')} @input=${(e) => this._set({ musicQuery: e.target.value })} @keydown=${(e) => { if (e.key === 'Enter' && e.target.value.trim()) { mc.browse('search', e.target.value); } }}
            style="min-height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--line2);background:var(--sunk);color:var(--fg);font:inherit;font-size:13px">` : nothing}
          ${panel === 'devices' ? this.speakerSheet({ t, all, vol, playing, full })
          : (() => {
              // Owner 2026-11-16 ("playlists daquele jeito tá feio"): a calm list — small cover, name, who/what, play.
              const sub = (it) => [it.owner?.display_name, (it.artists || it.album?.artists || []).map((x) => x.name).join(', '), it.publisher, it.tracks?.total ? t('tracksN', { n: it.tracks.total }) : null].filter(Boolean).slice(0, 2).join(' · ');
              const nowUri = a.media_context_content_id || a.sp_context_uri || a.media_content_id || '';
              const all = mc.results.slice(0, full ? 50 : 20), more = full, shown = all;
              return html`<div class="mlist">${busy && !all.length ? html`<span class="muted" style="font-size:13px">${t('loadingS')}</span>` : nothing}
              ${shown.map((it) => { const im = imgOf(it), starting = mc.startingUri === it.uri, cur = it.uri && nowUri === it.uri; return html`<button class=${'mli' + (cur ? ' cur' : '')} aria-label=${t('play') + ' · ' + it.name} ?disabled=${starting} @click=${() => { this._musicItem(it); if (!full) setTimeout(() => this._set({ libSheet: false }), 600); }}>
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
      ${list.length && (this._ui.edit || !acct) ? html`<span class="eyebrow" style="padding:6px 4px 0;font-size:10px">${t('speakers')}</span>
      <div class="grid sgrid">${repeat(list.slice().sort((x, y) => (x.unavailable ? 1 : 0) - (y.unavailable ? 1 : 0)), (s) => s.id, (s) => {
        const ta = this.tileAttrs('speakers', s, ids), v = this._local['vol:' + s.id] ?? s.vol;
        return html`<div class=${'tile mini' + ta.cls} draggable=${ta.draggable} @dragstart=${ta.h.start} @dragover=${ta.h.over} @drop=${ta.h.drop} @dragend=${ta.h.end} style=${s.playing ? `border-color:${rgba(aRgb, 0.3)}` : ''}>
          ${this.editBar('speakers', s, ids, t)}
          <div class="tbtn" style="cursor:default">
            <span class="ic" style=${s.playing ? 'background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)' : ''}>${ic(s.tv ? 'tv' : 'speaker')}</span>
            <span class="nm grow">${this.nmLink(s, html`<b>${s.name}</b>`, t)}<span>${[s.areaName, s.unavailable ? t('notAvailable') : s.playing ? (s.attrs.media_title || t('playing')) : s.state === 'paused' ? t('paused') : ''].filter(Boolean).join(' · ')}</span></span>
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
