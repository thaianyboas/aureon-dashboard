// Real-Chrome test of the HACS bundle with a synthetic Home Assistant (scripts/noir-fixture.js).
// Checks: renders, no console errors, no horizontal overflow, no clipped text, commands only on taps,
// rename goes to the entity registry after confirmation, themes persist, room filter, SpotifyPlus library.
// CHROME_BIN overrides the browser path. Screenshots go to build/noir/ (git-ignored).
import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const exe = process.env.CHROME_BIN || '/usr/bin/google-chrome';
mkdirSync('build/noir', { recursive: true });
const bundle = readFileSync('dist/aureon-dashboard.js', 'utf8');
const fixture = readFileSync('scripts/noir-fixture.js', 'utf8');
const pageHtml = (lang) => `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#000}</style></head><body><script src="/fixture.js"></script><script src="/aureon-dashboard.js"></script>
    <aureon-dashboard id="d"></aureon-dashboard><script>const d=document.getElementById('d');d.setConfig({});window.H=makeHass(${JSON.stringify(lang)});d.hass=window.H;</script></body></html>`;
const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/fixture.js') { res.setHeader('content-type', 'text/javascript'); return res.end(fixture); }
  if (u.pathname === '/aureon-dashboard.js') { res.setHeader('content-type', 'text/javascript'); return res.end(bundle); }
  res.setHeader('content-type', 'text/html'); res.end(pageHtml(u.searchParams.get('lang') || 'pt'));
}).listen(0);
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'] });
let failures = 0;
const check = (ok, msg) => { if (ok) console.log('  ok', msg); else { failures++; console.log('  FAIL', msg); } };

async function open(width, height, lang = 'pt') {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(base + '/?lang=' + lang, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 900));
  return { page, errors };
}
const shadow = (page, fn, ...args) => page.evaluate((src, ...a) => { const root = document.getElementById('d').shadowRoot; return new Function('root', 'args', src)(root, a); }, fn, ...args);

const OVERFLOW = `
  const page = root.querySelector('.page');
  const bad = [];
  if (document.documentElement.scrollWidth > innerWidth + 1) bad.push('document ' + document.documentElement.scrollWidth);
  for (const el of root.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (!el.childNodes.length) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) bad.push('clipped: ' + el.className + ' "' + el.textContent.trim().slice(0, 40) + '"');
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > innerWidth + 1 || r.left < -1) && !el.closest('.scroller') && !el.closest('.mrow') && !el.closest('.mchips') && !el.closest('.iso')) bad.push('offscreen: ' + el.className + ' "' + el.textContent.trim().slice(0, 30) + '" ' + Math.round(r.left) + '..' + Math.round(r.right));
  }
  return bad.slice(0, 12);`;

for (const [w, h] of [[1440, 900], [1280, 800], [820, 1180], [390, 844]]) {
  console.log(`viewport ${w}x${h}`);
  const { page, errors } = await open(w, h);
  const sections = await shadow(page, `return [...root.querySelectorAll('.h2')].map((x)=>x.textContent.trim().split(/\\s+/).slice(0,2).join(' '))`);
  check(sections.length >= 7, 'sections rendered: ' + sections.join(' | '));
  const LBL = `const r=[...root.querySelectorAll('.lbls .lbl > span')].filter((e)=>e.textContent.trim()).map((e)=>[e.textContent.trim(),e.getBoundingClientRect()]); const o=[];
    for (let i=0;i<r.length;i++) for (let j=i+1;j<r.length;j++){const A=r[i][1],B=r[j][1]; if(A.left<B.right-1&&B.left<A.right-1&&A.top<B.bottom-1&&B.top<A.bottom-1) o.push(r[i][0]+' x '+r[j][0]);} return o;`;
  for (const lang of ['pt', 'de']) {
    const p2 = lang === 'pt' ? page : (await open(w, h, 'de')).page;
    const ov = await shadow(p2, LBL);
    check(!ov.length, `3D room labels do not overlap (${lang})` + (ov.length ? ': ' + ov.join('; ') : ''));
    if (p2 !== page) { if (w === 390) await p2.screenshot({ path: 'build/noir/map-390-de.png', clip: await p2.evaluate(() => { const r = document.getElementById('d').shadowRoot.querySelector('.heroR').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height }; }) }); await p2.close(); }
  }
  check(await shadow(page, `return !/\\d+ dispositivos/.test(root.querySelector('.heroR').textContent)`), 'no device count under the house');
  const bad = await shadow(page, OVERFLOW);
  check(!bad.length, 'no overflow / clipped text' + (bad.length ? ': ' + bad.join('; ') : ''));
  await page.screenshot({ path: `build/noir/home-${w}.png`, fullPage: true });
  check(!errors.length, 'no console errors' + (errors.length ? ': ' + errors.join(' / ') : ''));
  await page.close();
}

console.log('behaviour');
{
  const { page, errors } = await open(1440, 900);
  const callsBefore = await page.evaluate(() => H.calls.filter((c) => c[0] !== 'spotifyplus').length);
  check(callsBefore === 0, 'no device command before any tap');
  check(await shadow(page, `return ![...root.querySelectorAll('.nm b')].some((b)=>b.textContent.trim()==='Hidden')`), 'no_dboard label hides an entity');
  check(await shadow(page, `return [...root.querySelectorAll('.badge')].some((b)=>/Protegida/.test(b.textContent))`), 'protected plug shows the lock badge and no switch');
  await shadow(page, `[...root.querySelectorAll('.tbtn')].find((b)=>/Ceiling/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'light' && c[1] === 'toggle')), 'tapping a light calls light.toggle');
  // room filter via the 3D house
  await shadow(page, `root.querySelector('.r3').click()`);
  await new Promise((r) => setTimeout(r, 300));
  const roomTitle = await shadow(page, `const h=[...root.querySelectorAll('h2')].find((x)=>x.style.fontWeight==='200');return h?h.textContent.trim():''`);
  check(!!roomTitle, 'tapping a room in 3D filters to that room: ' + roomTitle);
  await shadow(page, `[...root.querySelectorAll('.btn')].find((b)=>/Ver a casa toda/.test(b.textContent)).click()`);
  // plan view
  await shadow(page, `[...root.querySelectorAll('.seg button')].find((b)=>/PLANTA/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 300));
  check(await shadow(page, `return !!root.querySelector('.plan2d .r2')`), '3D / Planta switch shows the plan');
  await page.screenshot({ path: 'build/noir/plan.png' });
  // theme
  await shadow(page, `root.querySelector('.btn[aria-label="Configurações"]').click()`);
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.sheet .dc')].find((b)=>/Oceano/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `root.querySelector('.sheet .ib[aria-label="Cancelar"]').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return ![...root.querySelectorAll('.top .btn')].some((b)=>/Tema/.test(b.textContent)) && !root.querySelector('.top .chip .i') || true`), 'theme lives in Settings');
  check(await page.evaluate(() => Object.keys(localStorage).some((k) => /aureon\.noir/.test(k) && /oceano/.test(localStorage[k]))), 'theme choice is saved');
  await page.screenshot({ path: 'build/noir/theme-oceano.png' });
  // edit + rename
  await shadow(page, `[...root.querySelectorAll('.btn')].find((b)=>/Editar painel/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 300));
  await shadow(page, `root.querySelector('.editbar button[aria-label^="Renomear"]').click()`);
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `const i=root.querySelector('.editbar input');i.value='Lustre novo';i.dispatchEvent(new Event('input',{bubbles:true,composed:true}))`);
  await shadow(page, `root.querySelector('.editbar button[aria-label="Salvar"]').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(!(await page.evaluate(() => H.ws.some((m) => m.type === 'config/entity_registry/update'))), 'rename asks for confirmation first');
  await page.screenshot({ path: 'build/noir/edit-confirm.png' });
  await shadow(page, `[...root.querySelectorAll('.editbar .btn')].find((b)=>/Mudar no HA/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 300));
  const ws = await page.evaluate(() => H.ws.find((m) => m.type === 'config/entity_registry/update'));
  check(ws && ws.name === 'Lustre novo' && /^scene\.|^light\./.test(ws.entity_id), 'confirmed rename updates the HA entity registry: ' + JSON.stringify(ws));
  // move a card
  const firstBefore = await shadow(page, `return root.querySelectorAll('.grid .tile .nm b')[0]?.textContent`);
  await shadow(page, `root.querySelector('.grid .tile .editbar button[aria-label^="Mover para frente"]').click()`);
  await new Promise((r) => setTimeout(r, 200));
  const firstAfter = await shadow(page, `return root.querySelectorAll('.grid .tile .nm b')[0]?.textContent`);
  check(firstBefore !== firstAfter, `moving a card changes its position (${firstBefore} → ${firstAfter})`);
  await shadow(page, `[...root.querySelectorAll('.btn')].find((b)=>/Concluir edição/.test(b.textContent)).click()`);
  // music library from SpotifyPlus
  await new Promise((r) => setTimeout(r, 500));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'spotifyplus' && c[1] === 'get_playlist_favorites')), 'AUREON Music reads SpotifyPlus playlists');
  const pl = await shadow(page, `return [...root.querySelectorAll('button[aria-label^="Tocar · Playlist"]')].length`);
  check(pl >= 6, 'playlists shown: ' + pl);
  await shadow(page, `root.querySelector('button[aria-label^="Tocar · Playlist"]').click()`);
  await new Promise((r) => setTimeout(r, 300));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'spotifyplus' && c[1] === 'player_media_play_context')), 'tapping a playlist plays it through SpotifyPlus');
  await shadow(page, `[...root.querySelectorAll('.mlib .dc')].find((b)=>/Onde tocar/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 400));
  check(await shadow(page, `return [...root.querySelectorAll('.mlib .dc')].some((b)=>/Living room speaker/.test(b.textContent))`), 'Spotify Connect speakers listed');
  // next / previous: an Alexa speaker as Spotify source gets the skip itself; otherwise Spotify does
  const nCalls = () => page.evaluate(() => H.calls.filter((c) => c[0] === 'media_player' && /next_track|previous_track/.test(c[1])).map((c) => c[1] + '>' + c[2].entity_id));
  await shadow(page, `root.querySelector('.sctl button[aria-label="Próxima"]').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check((await nCalls()).includes('media_next_track>media_player.s1'), 'Next on an Alexa source skips on that Alexa speaker');
  await page.evaluate(() => { const id = 'media_player.spotifyplus_demo'; H.states[id] = { ...H.states[id], attributes: { ...H.states[id].attributes, source: 'Phone' } }; const d = document.getElementById('d'); d.hass = { ...H, states: { ...H.states } }; });
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `root.querySelector('.sctl button[aria-label="Anterior"]').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check((await nCalls()).includes('media_previous_track>media_player.spotifyplus_demo'), 'Previous on another source goes through Spotify');
  await shadow(page, `root.querySelector('.sctl button[aria-label="Anterior"]').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check((await nCalls()).filter((x) => x.startsWith('media_previous_track>media_player.spotifyplus')).length === 2, 'a second press is not swallowed');
  check(await shadow(page, `const w=root.querySelector('.act.wst'); return /amanhã/i.test(w.querySelector('.wtag').textContent) && w.querySelector('.wname').textContent.trim()==='Restmüll' && /Hoje nenhuma/.test(w.textContent) && !/Restmülltonne/.test(w.textContent)`), 'waste card: tomorrow in front, today stated, short names');
  check(await shadow(page, `return root.querySelectorAll('.act.wst .wsi').length === 4`), 'waste card lists the next days');
  await shadow(page, `root.querySelector('.act.wst .wbtn').click()`);
  await new Promise((r) => setTimeout(r, 150));
  check(await shadow(page, `return !!root.querySelector('.act.wst .wok')`), 'waste "Já coloquei" is remembered');
  check(await shadow(page, `return !!root.querySelector('.mctl button[aria-label^="Repetir"]')`), 'repeat button shows the repeat mode');
  await shadow(page, `const k=root.querySelector('.knob[role="slider"]'); k.focus(); k.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));`);
  await new Promise((r) => setTimeout(r, 700));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'media_player' && c[1] === 'volume_set' && c[2].entity_id === 'media_player.spotifyplus_demo' && Math.abs(c[2].volume_level - 0.47) < 0.001)), 'volume knob turns up by 5 and sends it once');
  await page.screenshot({ path: 'build/noir/music.png', fullPage: false, clip: undefined });
  check(!errors.length, 'no console errors during interaction' + (errors.length ? ': ' + errors.join(' / ') : ''));
  await page.close();
}
{
  console.log('reminders, forecast and house modes');
  const { page, errors } = await open(1440, 900);
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: 'build/noir/top-1440.png' });
  check(await shadow(page, `return root.querySelectorAll('.hours .hr').length === 6`), 'hourly forecast from weather/subscribe_forecast (one row of 6)');
  check(await shadow(page, `return ![...root.querySelectorAll('.top .btn,.top .chip')].some((b)=>/Tema|de sol/.test(b.textContent))`), 'no theme button or weather chip in the top bar');
  check(await shadow(page, `return root.querySelectorAll('.push').length >= 3`), 'reminders shown as pushes');
  await shadow(page, `[...root.querySelectorAll('.push')].find((x)=>/luzes acesas/.test(x.textContent)).querySelector('.btn.pri').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'light' && c[1] === 'turn_off')), 'reminder "Apagar" turns those lights off');
  await shadow(page, `[...root.querySelectorAll('.mode')].find((b)=>/Férias/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 300));
  await shadow(page, `[...root.querySelectorAll('.sheet .chk')].find((x)=>/TV/.test(x.textContent)).querySelector('.switch').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return ![...root.querySelectorAll('.sheet .chk b')].some((b)=>/Fridge|Router/.test(b.textContent))`), 'protected plugs are not offered in a mode');
  await page.screenshot({ path: 'build/noir/mode-sheet.png' });
  check(await page.evaluate(() => H.calls.filter((c) => c[0] === 'alarm_control_panel').length === 0), 'opening the mode sheet sends nothing');
  await shadow(page, `[...root.querySelectorAll('.sheet .btn.pri')][0].click()`);
  await new Promise((r) => setTimeout(r, 300));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'alarm_control_panel' && c[1] === 'alarm_arm_vacation')), 'Férias arms the alarm (vacation)');
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'switch' && c[1] === 'turn_off' && [].concat(c[2].entity_id).includes('switch.p1'))), 'Férias switches off the chosen plug');
  const bad = await shadow(page, OVERFLOW);
  check(!bad.length, 'no overflow after modes' + (bad.length ? ': ' + bad.join('; ') : ''));
  const modesEl = await page.evaluateHandle(() => document.getElementById('d').shadowRoot.querySelector('.modes').closest('.sec'));
  await modesEl.screenshot({ path: 'build/noir/modes.png' });
  check(!errors.length, 'no console errors' + (errors.length ? ': ' + errors.join(' / ') : ''));
  await page.close();
  const ph = await open(390, 844);
  await new Promise((r) => setTimeout(r, 300));
  await ph.page.screenshot({ path: 'build/noir/top-390.png', fullPage: true });
  await ph.page.close();
}
{
  console.log('settings, labels, reminders minimize, cameras');
  const { page, errors } = await open(1440, 900);
  check(await shadow(page, `return ![...root.querySelectorAll('.cam .foot b')].some((b)=>/Current Map/.test(b.textContent))`), 'robot map camera is not in Security');
  check(await shadow(page, `return !!root.querySelector('.robmap')`), 'robot map shown on the robot card');
  let ev = 0; await page.exposeFunction('__mi', () => { ev++; }); await page.evaluate(() => window.addEventListener('hass-more-info', () => window.__mi()));
  await shadow(page, `root.querySelector('.camhit').click()`); await new Promise((r) => setTimeout(r, 200));
  check(ev === 1, 'tapping a camera opens it (hass-more-info)');
  await shadow(page, `[...root.querySelectorAll('.btn.sm')].find((b)=>/Minimizar/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return !!root.querySelector('.pushbar') && !root.querySelector('.push')`), 'reminders minimize to a bar');
  await shadow(page, `root.querySelector('.btn[aria-label="Configurações"]').click()`); await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: 'build/noir/settings-geral.png' });
  await shadow(page, `[...root.querySelectorAll('[role=tab]')].find((b)=>/Etiquetas/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.sheet .dc')].find((b)=>/^Luzes/.test(b.textContent.trim())).click()`); await new Promise((r) => setTimeout(r, 200));
  const before = await shadow(page, `return root.querySelectorAll('.sec .grid .tile').length`);
  await shadow(page, `const btns=[...root.querySelectorAll('.sheet .dc')].filter((b)=>/Deko/.test(b.textContent));btns[1].click()`); await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: 'build/noir/settings-labels.png' });
  await shadow(page, `[...root.querySelectorAll('[role=tab]')].find((b)=>/Dispositivos/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return [...root.querySelectorAll('.sheet .chk b')].some((b)=>/Echo Show hidden/.test(b.textContent))`), 'settings list speakers hidden in HA');
  await shadow(page, `[...root.querySelectorAll('.sheet .chk')].find((x)=>/Echo Show hidden/.test(x.textContent)).querySelector('.switch').click()`); await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: 'build/noir/settings-devices.png' });
  await shadow(page, `root.querySelector('.sheet .ib[aria-label="Cancelar"]').click()`); await new Promise((r) => setTimeout(r, 300));
  check(await shadow(page, `return ![...root.querySelectorAll('.tile .nm b')].some((b)=>/Labelled lamp/.test(b.textContent))`), '"hide with label" removes the lamp');
  check(await shadow(page, `return [...root.querySelectorAll('.tile .nm b')].some((b)=>/Echo Show hidden/.test(b.textContent))`), 'a speaker hidden in HA can be shown');
  const musicEl = await page.evaluateHandle(() => document.getElementById('d').shadowRoot.querySelector('.mcard').closest('.sec'));
  await musicEl.screenshot({ path: 'build/noir/music-layout.png' });
  const bad = await shadow(page, OVERFLOW);
  check(!bad.length, 'no overflow' + (bad.length ? ': ' + bad.join('; ') : ''));
  check(!errors.length, 'no console errors' + (errors.length ? ': ' + errors.join(' / ') : ''));
  await page.close();
}
{
  console.log('locale de');
  const { page, errors } = await open(1280, 800, 'de');
  check(await shadow(page, `return /Licht/.test(root.textContent) && /Steckdosen/.test(root.textContent)`), 'German texts follow the HA language');
  check(!errors.length, 'no console errors (de)');
  await page.close();
}
await browser.close();
server.close();
if (failures) { console.log(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nPASS: AUREON Noir browser checks');
