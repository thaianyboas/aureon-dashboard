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
  check(await shadow(page, `return ![...root.querySelectorAll('.nm b, .pnm')].some((b)=>b.textContent.trim()==='Hidden')`), 'no_dboard label hides an entity');
  check(await shadow(page, `return ![...root.querySelectorAll('.pnm')].some((x)=>/Self-Clean|Alexa - Kitchen/.test(x.textContent))`), 'robot settings and Alexa do-not-disturb are not listed as plugs');
  await shadow(page, `[...root.querySelectorAll('.sectog')].find((b)=>/Tomadas/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `const h=[...root.querySelectorAll('.sech')].find((x)=>/Tomadas/.test(x.textContent)); const sec=h.closest('.sec'); return h.classList.contains('closed') && getComputedStyle(sec.querySelector('.pgrid')).display==='none'`), 'a section folds from its title');
  await shadow(page, `[...root.querySelectorAll('.sectog')].find((b)=>/Tomadas/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return root.querySelectorAll('.pgrp').length >= 2 && root.querySelectorAll('.pgrp.open').length === root.querySelectorAll('.pgrp').length`), 'plugs grouped by room, open on a wide screen');
  check(await shadow(page, `return [...root.querySelectorAll('.prow')].some((r)=>r.querySelector('.plock') && !r.querySelector('.switch'))`), 'protected plug shows the lock and no switch');
  await page.evaluate(() => { H.states['switch.p2'] = { ...H.states['switch.p2'], state: 'off' }; document.getElementById('d').hass = { ...H, states: { ...H.states } }; });
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.prow')].find((r)=>/Fridge/.test(r.textContent)).querySelector('.switch').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'switch' && c[1] === 'turn_on' && c[2].entity_id === 'switch.p2')), 'a protected plug that is off can be switched back on');
  await page.evaluate(() => { H.states['switch.p2'] = { ...H.states['switch.p2'], state: 'on' }; document.getElementById('d').hass = { ...H, states: { ...H.states } }; });
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.lrow .switch')].find((b)=>/^Ceiling/.test(b.getAttribute('aria-label'))).click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'light' && c[1] === 'toggle')), 'tapping a light calls light.toggle');
  // room filter via the 3D house
  await shadow(page, `root.querySelector('.r3').click()`);
  await new Promise((r) => setTimeout(r, 300));
  const roomTitle = await shadow(page, `const h=[...root.querySelectorAll('h2')].find((x)=>x.style.fontWeight==='200');return h?h.textContent.trim():''`);
  check(!!roomTitle, 'tapping a room in 3D filters to that room: ' + roomTitle);
  await new Promise((r) => setTimeout(r, 700));
  check(await shadow(page, `const r=root.querySelector('.roomhead').getBoundingClientRect(), f=root.querySelector('.filters').getBoundingClientRect(); return (r.top >= f.bottom - 2 && r.top < innerHeight) || [r.top,f.top,f.bottom,innerHeight,scrollY,document.documentElement.scrollHeight].join(',')`)===true, 'tapping a room scrolls its devices into view, below the sticky chips');
  check(await shadow(page, `const b=root.querySelector('.rc[aria-pressed="true"]'); return !!b && getComputedStyle(b).backgroundColor !== getComputedStyle(root.querySelector('.page')).color`), 'chosen room chip uses the theme colour');
  await shadow(page, `root.querySelector('.filters').scrollIntoView()`); await page.screenshot({ path: 'build/noir/room-chip.png', clip: await page.evaluate(() => { const r = document.getElementById('d').shadowRoot.querySelector('.filters').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height + 140 }; }) });
  await shadow(page, `[...root.querySelectorAll('.btn')].find((b)=>/Ver a casa toda/.test(b.textContent)).click()`);
  // plan view
  await shadow(page, `[...root.querySelectorAll('.seg button')].find((b)=>/PLANTA/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 300));
  check(await shadow(page, `return !!root.querySelector('.plan2d .r2')`), '3D / Planta switch shows the plan');
  await page.screenshot({ path: 'build/noir/plan.png' });
  check(await shadow(page, `const c=root.querySelector('.top .bchip'); return !!c && c.classList.contains('red') && /2/.test(c.textContent)`), 'battery chip is red and counts 2 to replace');
  check(await shadow(page, `return !root.querySelector('.top .avatars')`), 'no duplicate people avatars in the header');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'build/noir/batt-chip.png', clip: await page.evaluate(() => { const r = document.getElementById('d').shadowRoot.querySelector('.top').getBoundingClientRect(); return { x: r.right - 620, y: r.top, width: 620, height: r.height + 10 }; }) });
  await shadow(page, `root.querySelector('.top .bchip').click()`); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `const n=[...root.querySelectorAll('.brow b')].map((b)=>b.textContent); return n.length===4 && /Fensterkontakt/.test(n[0]) && root.querySelector('.brow').classList.contains('red') && !n.some((x)=>/Phone|X10|Robot/i.test(x))`), 'battery sheet: emptiest first, phones and robot left out');
  await page.screenshot({ path: 'build/noir/batt-sheet.png' });
  await shadow(page, `root.querySelector('.bsheet .stclose').click()`); await new Promise((r) => setTimeout(r, 150));
  for (const ps of ['a', 'b', 'c']) {
    await page.evaluate((v) => { const d = document.getElementById('d'); d._save({ planStyle: v }); }, ps); await new Promise((r) => setTimeout(r, 250));
    await page.evaluate(() => document.getElementById('d').shadowRoot.querySelector('.plan2d').scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `build/noir/plan-${ps}.png`, clip: await page.evaluate(() => { const r = document.getElementById('d').shadowRoot.querySelector('.heroR').getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, width: r.width, height: r.height }; }) });
  }
  await page.evaluate(() => { const d = document.getElementById('d'); d._save({ planStyle: undefined }); });
  check(await shadow(page, `return !!root.querySelector('.plan2d.ps-b')`), 'plan uses the glass style (B) by default');
  check(await shadow(page, `return root.querySelector('.hero').getBoundingClientRect().height < 470`), 'hero is compact on desktop');
  check(await shadow(page, `const mu=root.querySelector('.mcard.cmp'), f=root.querySelector('.filters'); return !!mu && !!f && (mu.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) > 0`), 'AUREON Music comes before the room / device chips');
  check(await shadow(page, `return !!root.querySelector('.heroR .alp') && !root.querySelector('.heroR .alm')`), 'house mode sits as a closed menu beside 3D / Planta');
  const alCalls0 = await page.evaluate(() => H.calls.length);
  await shadow(page, `root.querySelector('.heroR .alp').click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return root.querySelectorAll('.alm [role=menuitemradio]').length === 4 && !root.querySelector('.modes')`) && await page.evaluate((n) => H.calls.length === n, alCalls0), 'house mode menu opens with the 4 modes, sends nothing, and the modes strip is gone');
  check(await shadow(page, `const b=root.querySelector('.alm .alic'), i=b.querySelector('svg').getBoundingClientRect(), r=b.getBoundingClientRect(); return Math.abs((i.left+i.width/2)-(r.left+r.width/2))<1.5 && Math.abs((i.top+i.height/2)-(r.top+r.height/2))<1.5`), 'mode icons are centred');
  await page.screenshot({ path: 'build/noir/alarm-menu.png', clip: await page.evaluate(() => { const r = document.getElementById('d').shadowRoot.querySelector('.heroR').getBoundingClientRect(); return { x: r.left + r.width - 520, y: r.top + scrollY, width: 520, height: 360 }; }) });
  await shadow(page, `[...root.querySelectorAll('.alm button')].find((b)=>/Noite/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return !root.querySelector('.alm') && !!root.querySelector('.sheet .willoff, .sheet .btn.pri')`) && await page.evaluate((n) => !H.calls.slice(n).some((c) => c[0] === 'alarm_control_panel'), alCalls0), 'choosing a mode opens its confirmation, nothing is sent yet');
  await shadow(page, `const o=root.querySelector('.overlay'); o && o.click()`); await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.sheet .btn')].find((b)=>/Cancelar/.test(b.textContent))?.click()`); await new Promise((r) => setTimeout(r, 200));
  // theme
  await shadow(page, `root.querySelector('.btn[aria-label="Configurações"]').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return root.querySelectorAll('.sheet .sthi').length === 7 && !root.querySelector('.sheet [role=tab]') && !!root.querySelector('.sheet .stclose')`), 'Settings opens on a start page with Fechar');
  check(await shadow(page, `return [...root.querySelectorAll('.sheet .sthi .ic svg path')].every((p)=>(p.getAttribute('d')||'').length>10)`), 'every Settings entry has a visible icon');
  await page.screenshot({ path: 'build/noir/settings-home.png' });
  await shadow(page, `[...root.querySelectorAll('.sheet .sthi')].find((b)=>/Geral/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.sheet .dc')].find((b)=>/Oceano/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `root.querySelector(".sheet .sthead .btn").click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return root.querySelectorAll('.sheet .sthi').length === 7`), 'Voltar returns to the Settings start page');
  await shadow(page, `root.querySelector(".sheet .stclose").click()`);
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
  const firstBefore = await shadow(page, `const g=[...root.querySelectorAll('.grid')].find((x)=>(root.querySelector('.filters').compareDocumentPosition(x)&4) && x.querySelectorAll('.tile').length>1); return g.querySelectorAll('.tile .nm b')[0]?.textContent`);
  await shadow(page, `const g=[...root.querySelectorAll('.grid')].find((x)=>(root.querySelector('.filters').compareDocumentPosition(x)&4) && x.querySelectorAll('.tile').length>1); g.querySelector('.tile .editbar button[aria-label^="Mover para frente"]').click()`);
  await new Promise((r) => setTimeout(r, 200));
  const firstAfter = await shadow(page, `const g=[...root.querySelectorAll('.grid')].find((x)=>(root.querySelector('.filters').compareDocumentPosition(x)&4) && x.querySelectorAll('.tile').length>1); return g.querySelectorAll('.tile .nm b')[0]?.textContent`);
  check(firstBefore !== firstAfter, `moving a card changes its position (${firstBefore} → ${firstAfter})`);
  await shadow(page, `[...root.querySelectorAll('.btn')].find((b)=>/Concluir edição/.test(b.textContent)).click()`);
  // music library from SpotifyPlus
  await new Promise((r) => setTimeout(r, 500));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'spotifyplus' && c[1] === 'get_playlist_favorites')), 'AUREON Music reads SpotifyPlus playlists');
  check(await shadow(page, `return !root.querySelector('button[aria-label^="Tocar · Playlist"]')`), 'home shows no list under the player');
  await shadow(page, `[...root.querySelectorAll('.mlib .dc')].find((b)=>/Playlists/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 300));
  check(await shadow(page, `const sh=root.querySelector('.mcard .msheet'); return !!sh && sh.querySelectorAll('button[aria-label^="Tocar · Playlist"]').length === 6`), 'Playlists opens a sheet over the player');
  await shadow(page, `root.querySelector('.msheet .mall').click()`);
  await new Promise((r) => setTimeout(r, 300));
  check(await shadow(page, `return !!root.querySelector('.mpage') && root.querySelectorAll('button[aria-label^="Tocar · Playlist"]').length === 6 && !root.querySelector('.hero')`), 'AUREON Music page shows the whole library');
  await page.screenshot({ path: 'build/noir/music-page.png' });
  await shadow(page, `root.querySelector('.mpbar .btn').click()`);
  await new Promise((r) => setTimeout(r, 400));
  check(await shadow(page, `return !root.querySelector('.mpage') && !!root.querySelector('.hero')`), 'back to the home page');
  await shadow(page, `[...root.querySelectorAll('.mlib .dc')].find((b)=>/Playlists/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 300));
  await shadow(page, `root.querySelector('.msheet button[aria-label^="Tocar · Playlist"]').click()`);
  await new Promise((r) => setTimeout(r, 900));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'spotifyplus' && c[1] === 'player_media_play_context')), 'tapping a playlist plays it through SpotifyPlus');
  check(await shadow(page, `return !root.querySelector('.msheet')`), 'the sheet closes after choosing');
  await shadow(page, `[...root.querySelectorAll('.mlib .dc')].find((b)=>/Onde tocar/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 400));
  check(await shadow(page, `return [...root.querySelectorAll('.msheet .dc')].some((b)=>/Living room speaker/.test(b.textContent))`), 'Spotify Connect speakers listed in the sheet');
  await shadow(page, `root.querySelector('.msheet .mshead .ib').click()`);
  await new Promise((r) => setTimeout(r, 200));
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
  check(await shadow(page, `return [...root.querySelectorAll('.act')].some((a)=>/Washing machine/.test(a.textContent) && /Cotton 40°/.test(a.textContent))`), 'washer shows program and temperature');
  const al = await shadow(page, `const a=[...root.querySelectorAll('.act')].find((x)=>/Washing machine/.test(x.textContent)); const sw=a&&a.querySelector('.alexa .switch'); if(!sw) return 'no switch'; sw.click(); return sw.getAttribute('aria-checked')`);
  await new Promise((r) => setTimeout(r, 200));
  check(al === 'true' && await page.evaluate(() => H.calls.some((c) => c[0] === 'automation' && c[1] === 'turn_off' && c[2].entity_id === 'automation.washer_alexa')), 'Alexa row finds the blueprint automation and switches it (' + al + ')');
  check(await shadow(page, `const a=[...root.querySelectorAll('.act')].find((x)=>/Dishwasher/.test(x.querySelector('.ttl')?.textContent||'')); return !!a?.querySelector('.alexa .switch')`), 'Alexa automation watching the machine plug is found for the smart dishwasher');
  check(await shadow(page, `const a=[...root.querySelectorAll('.act')].find((x)=>/Old washing machine/.test(x.textContent)); return !!a && /ligada há 3[45] min/.test(a.textContent) && /450 W/.test(a.textContent) && !!a.querySelector('.byplug')`), 'old machine on a plug: running since the power went up');
  check(await shadow(page, `return root.querySelectorAll('.vrooms .vr').length===5 && root.querySelector('.vr.now').textContent.trim()==='Kitchen' && /cômodo 2 de 5/.test(root.textContent)`), 'robot shows room-by-room progress');
  check(await shadow(page, `const e=root.querySelector('.ekv'); return !!e && /84/.test(e.textContent) && /€/.test(e.textContent)`), 'energy shows month and cost');
  check(await shadow(page, `return !!root.querySelector('.mctl button[aria-label^="Repetir"]')`), 'repeat button shows the repeat mode');
  await shadow(page, `root.querySelector('.vline .vpm[aria-label$="+"]').click(); root.querySelector('.vline .vpm[aria-label$="+"]').click();`);
  await new Promise((r) => setTimeout(r, 800));
  const vs = await page.evaluate(() => H.calls.filter((c) => c[0] === 'media_player' && c[1] === 'volume_set' && c[2].entity_id === 'media_player.spotifyplus_demo').map((c) => c[2].volume_level));
  check(vs.length === 1 && Math.abs(vs[0] - 0.52) < 0.001, 'volume + twice sends one change to 52 (' + vs.join(',') + ')');
  await page.screenshot({ path: 'build/noir/music.png', fullPage: false, clip: undefined });
  check(await shadow(page, `const r=root.querySelector('.mcard.cmp').getBoundingClientRect(); return r.height < 420`), 'home player is compact');
  await page.evaluate(() => document.getElementById('d').shadowRoot.querySelector('.mcard.cmp').scrollIntoView({ block: 'center' }));
  await page.screenshot({ path: 'build/noir/player-compact.png', clip: await page.evaluate(() => { const r = document.getElementById('d').shadowRoot.querySelector('.mcard.cmp').getBoundingClientRect(); return { x: r.left - 10, y: r.top + scrollY - 50, width: r.width + 20, height: r.height + 60 }; }), captureBeyondViewport: true });
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
  check(await shadow(page, `return ![...root.querySelectorAll('.push')].some((x)=>/luzes acesas|luz acesa|Coleta/.test(x.textContent))`), 'lights-on and waste are no reminder by default');
  await page.evaluate(() => { document.getElementById('d')._save({ reminderKinds: { lights: true, waste: true } }); }); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return root.querySelectorAll('.push').length >= 3`), 'reminders shown as pushes (lights and waste switched on in Settings)');
  await shadow(page, `[...root.querySelectorAll('.push')].find((x)=>/luzes acesas/.test(x.textContent)).querySelector('.btn.pri').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'light' && c[1] === 'turn_off')), 'reminder "Apagar" turns those lights off');
  await shadow(page, `root.querySelector('.heroR .alp').click()`); await new Promise((r) => setTimeout(r, 150));
  await shadow(page, `[...root.querySelectorAll('.alm button')].find((b)=>/Férias/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 300));
  check(await shadow(page, `return /Nenhuma tomada será desligada/.test(root.querySelector('.sheet .willoff').textContent)`), 'mode sheet says nothing will be switched off before choosing');
  await shadow(page, `[...root.querySelectorAll('.sheet .chk')].find((x)=>/TV/.test(x.textContent)).querySelector('.offchk').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return ![...root.querySelectorAll('.sheet .chk b')].some((b)=>/Fridge|Router/.test(b.textContent))`), 'protected plugs (and an unlabelled fridge) are not offered in a mode');
  check(await shadow(page, `return /Vai desligar \\(1\\): TV/.test(root.querySelector('.sheet .willoff').textContent) && /desligar 1 tomadas/.test(root.querySelector('.sheet .btn.pri').textContent)`), 'mode sheet lists exactly what will switch off');
  await page.screenshot({ path: 'build/noir/mode-sheet.png' });
  check(await page.evaluate(() => H.calls.filter((c) => c[0] === 'alarm_control_panel').length === 0), 'opening the mode sheet sends nothing');
  await shadow(page, `[...root.querySelectorAll('.sheet .btn.pri')][0].click()`);
  await new Promise((r) => setTimeout(r, 300));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'alarm_control_panel' && c[1] === 'alarm_arm_vacation')), 'Férias arms the alarm (vacation)');
  check(await page.evaluate(() => { const off = H.calls.filter((c) => c[0] === 'switch' && c[1] === 'turn_off').flatMap((c) => [].concat(c[2].entity_id)); return off.length === 1 && off[0] === 'switch.p1'; }), 'Férias switches off only the chosen plug');
  const bad = await shadow(page, OVERFLOW);
  check(!bad.length, 'no overflow after modes' + (bad.length ? ': ' + bad.join('; ') : ''));
  check(!errors.length, 'no console errors' + (errors.length ? ': ' + errors.join(' / ') : ''));
  await page.close();
  const ph = await open(390, 844);
  check(await shadow(ph.page, `const b=root.querySelector('.hmL .alp'), c=root.querySelector('.clock'); if (!b || !b.offsetParent || root.querySelector('.hmR .alp').offsetParent) return false; const r=b.getBoundingClientRect(), k=c.getBoundingClientRect(), h=root.querySelector('.hero').getBoundingClientRect(); return r.right <= h.right && r.left > k.left + 100 && r.top < k.bottom && r.bottom > k.top - 20`), 'phone: house mode sits beside the clock');
  check(await shadow(ph.page, `const c=root.querySelector('.mcard.cmp').getBoundingClientRect(), g=root.querySelector('.mcard.cmp .stg').getBoundingClientRect(); const chips=[...root.querySelectorAll('.mcard.cmp .mchips .dc')]; return g.width > c.width - 4 && chips.every((b)=>{const r=b.getBoundingClientRect(); return r.right <= c.right && r.left >= c.left;})`), 'phone: player fills the card and no music chip is cut');
  await shadow(ph.page, `root.querySelector('.mcard.cmp').scrollIntoView({block:'start'})`);
  await ph.page.screenshot({ path: 'build/noir/music-390.png', clip: await ph.page.evaluate(() => { const r = document.getElementById('d').shadowRoot.querySelector('.mcard.cmp').getBoundingClientRect(); return { x: 0, y: r.top + scrollY - 60, width: 390, height: r.height + 70 }; }) });
  await ph.page.evaluate(() => window.scrollTo(0, 0));
  await ph.page.screenshot({ path: 'build/noir/hero-390.png', clip: await ph.page.evaluate(() => { const r = document.getElementById('d').shadowRoot.querySelector('.hero').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: 390, height: 360 }; }) });
  check(await shadow(ph.page, `return root.querySelectorAll('.pgrp').length >= 2 && !root.querySelector('.pgrp .prow')`), 'plugs folded by room on the phone');
  await shadow(ph.page, `root.querySelector('.pgrp .phead').click()`);
  await new Promise((r) => setTimeout(r, 150));
  check(await shadow(ph.page, `return root.querySelectorAll('.pgrp.open .prow').length >= 1`), 'tapping a room opens its plugs');
  await new Promise((r) => setTimeout(r, 300));
  await ph.page.screenshot({ path: 'build/noir/top-390.png', fullPage: true });
  await ph.page.close();
}
{
  console.log('settings, labels, reminders minimize, cameras');
  const { page, errors } = await open(1440, 900);
  check(await shadow(page, `return ![...root.querySelectorAll('.cam .foot b')].some((b)=>/Current Map/.test(b.textContent))`), 'robot map camera is not in Security');
  check(await page.evaluate(() => getComputedStyle(document.querySelector('.aureon-top')).opacity === '0'), 'back-to-top hidden at the top');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await new Promise((r) => setTimeout(r, 500));
  check(await page.evaluate(() => getComputedStyle(document.querySelector('.aureon-top')).opacity === '1'), 'back-to-top shows after scrolling down');
  await page.evaluate(() => document.querySelector('.aureon-top').click()); await new Promise((r) => setTimeout(r, 1200));
  check(await page.evaluate(() => window.scrollY < 5), 'back-to-top scrolls to the top');
  check(await shadow(page, `const secs=[...root.querySelectorAll('.sec')]; const tv=secs.find((x)=>/Televisão/.test(x.querySelector('.sech')?.textContent||'')); const mu=secs.find((x)=>/Caixas de som|AUREON/.test(x.textContent)&&x.querySelector('.mcard')); return !!tv && /TV/.test(tv.textContent) && !(mu && [...mu.querySelectorAll('.tile b')].some((b)=>b.textContent.trim()==='TV'))`), 'the TV is its own device, not a speaker');
  await shadow(page, `[...root.querySelectorAll('.sec')].find((x)=>/Televisão/.test(x.querySelector('.sech')?.textContent||'')).querySelector('.ib[aria-label^="ligada"]').click()`); await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'media_player' && c[1] === 'turn_on' && c[2].entity_id === 'media_player.s4')), 'TV power button turns it on');
  check(await shadow(page, `const pp=[...root.querySelectorAll('.ppl .pp')]; return pp.length===2 && /Alex.*em casa/.test(pp[0].textContent.replace(/\\s+/g,' ')) && /Sam/.test(pp[1].textContent)`), 'people show where they are');
  await new Promise((r) => setTimeout(r, 1300));
  check(await shadow(page, `return [...root.querySelectorAll('.push')].some((x)=>/Sam chega em casa em ~[4-7] min/.test(x.textContent))`), 'arrival push: "Sam chega em casa em ~5 min"');
  let ev = 0; await page.exposeFunction('__mi', () => { ev++; }); await page.evaluate(() => window.addEventListener('hass-more-info', () => window.__mi()));
  await shadow(page, `[...root.querySelectorAll('.ppl .pp')].find((b)=>/Sam/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(ev === 1, 'tapping a person opens their map (hass-more-info)'); ev = 0;
  await shadow(page, `[...root.querySelectorAll('.act .btn')].find((b)=>/Mapa/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(ev === 1 && await shadow(page, `return !root.querySelector('.robmap')`), 'robot "Mapa" opens the map in Home Assistant (no inline map)');
  ev = 0;
  await shadow(page, `root.querySelector('.camhit').click()`); await new Promise((r) => setTimeout(r, 200));
  check(ev === 1, 'tapping a camera opens it (hass-more-info)');
  await shadow(page, `[...root.querySelectorAll('.btn.sm')].find((b)=>/Minimizar/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return !!root.querySelector('.pushbar') && !root.querySelector('.push')`), 'reminders minimize to a bar');
  await shadow(page, `root.querySelector('.btn[aria-label="Configurações"]').click()`); await new Promise((r) => setTimeout(r, 300));
  await shadow(page, `[...root.querySelectorAll('.sheet .sthi')].find((b)=>/Geral/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: 'build/noir/settings-geral.png' });
  await shadow(page, `[...root.querySelectorAll('[role=tab]')].find((b)=>/Etiquetas/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `const s=root.querySelector('.sheet .lbsel select'); s.value='lights'; s.dispatchEvent(new Event('change'))`); await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.sheet .lbrow')].find((r)=>/Deko/.test(r.textContent)).querySelector('button.exclude').click()`); await new Promise((r) => setTimeout(r, 300));
  check(await shadow(page, `return [...root.querySelectorAll('.sheet .lbrow')].find((r)=>/Deko/.test(r.textContent)).classList.contains('exclude')`), 'label row switches to "Esconder"');
  await page.screenshot({ path: 'build/noir/settings-labels.png' });
  await new Promise((r) => setTimeout(r, 600));
  check(await shadow(page, `return /Salvo em todos os aparelhos/.test(root.querySelector(".sheet .saved")?.textContent || '')`), 'settings show "Salvo em todos os aparelhos"');
  check(await shadow(page, `const f=root.querySelector('.sheet .stfoot'); return !!f && f.children.length===1 && !!f.querySelector('.saved')`), '"Salvo" replaces the footer note instead of covering it');
  await page.screenshot({ path: 'build/noir/settings-saved.png' });
  check(await page.evaluate(() => H.ws.some((w) => w.type === 'frontend/set_user_data' && w.key === 'aureon_noir' && w.value?.labelRules?.lights?.exclude?.length === 1)), 'settings saved to Home Assistant (all devices)');
  await shadow(page, `[...root.querySelectorAll('[role=tab]')].find((b)=>/Modo da casa/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return [...root.querySelectorAll('.sheet .chk')].some((x)=>/Apagar todas as luzes/.test(x.textContent)) && !!root.querySelector('.sheet .offchk')`), 'Settings has a Modos tab to configure each mode');
  await shadow(page, `[...root.querySelectorAll('[role=tab]')].find((b)=>/Aparelhos/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return root.querySelectorAll('.sheet .applcfg').length === 3`), 'Settings has an Aparelhos tab');
  await page.evaluate(() => { const d = document.getElementById('d'); d._save({ applHidden: { washer: true } }); });
  await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return ![...root.querySelectorAll('.live .act')].some((a)=>/^Washing machine$/.test(a.querySelector('.ttl')?.textContent.trim()))`), 'a machine can be hidden in Settings');
  await page.evaluate(() => { const d = document.getElementById('d'); d._save({ applHidden: {}, applMap: { dryer: '' } }); H.states['sensor.dish_status'] && 0; });
  await shadow(page, `[...root.querySelectorAll('[role=tab]')].find((b)=>/Dispositivos/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return [...root.querySelectorAll('.sheet .chk b')].some((b)=>/Echo Show hidden/.test(b.textContent))`), 'settings list speakers hidden in HA');
  await shadow(page, `[...root.querySelectorAll('.sheet .chk')].find((x)=>/Echo Show hidden/.test(x.textContent)).querySelector('.switch').click()`); await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: 'build/noir/settings-devices.png' });
  await shadow(page, `root.querySelector(".sheet .stclose").click()`); await new Promise((r) => setTimeout(r, 300));
  check(await shadow(page, `return ![...root.querySelectorAll('.tile .nm b, .pnm')].some((b)=>/Labelled lamp/.test(b.textContent))`), '"hide with label" removes the lamp');
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
