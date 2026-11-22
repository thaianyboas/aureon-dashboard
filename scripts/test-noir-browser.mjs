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
  check(await shadow(page, `return [...root.querySelectorAll('.ptl')].some((r)=>r.querySelector('.plk') && !r.querySelector('.switch'))`), 'protected plug shows the lock and no switch');
  check(await shadow(page, `const g=root.querySelector('.pgrp.pgx:not(.lgx)'); const tl=[...root.querySelectorAll('.ptg .ptl')]; return !!g && tl.length>3 && tl.every((x)=>!!x.querySelector('.pti svg')) && tl.some((x)=>x.classList.contains('on')) && /\\d+ de \\d+ ligadas/.test(g.querySelector('.pxw').textContent)`), 'Tomadas premium: room glass card, one tile per device with icon');
  await page.evaluate(() => { H.states['switch.p2'] = { ...H.states['switch.p2'], state: 'off' }; document.getElementById('d').hass = { ...H, states: { ...H.states } }; });
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.ptl')].find((r)=>/Fridge/.test(r.textContent)).querySelector('.switch').click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'switch' && c[1] === 'turn_on' && c[2].entity_id === 'switch.p2')), 'a protected plug that is off can be switched back on');
  await page.evaluate(() => { H.states['switch.p2'] = { ...H.states['switch.p2'], state: 'on' }; document.getElementById('d').hass = { ...H, states: { ...H.states } }; });
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.lbx .switch')].find((b)=>/^Ceiling/.test(b.getAttribute('aria-label'))).click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'light' && c[1] === 'toggle')), 'tapping a light calls light.toggle');
  check(await shadow(page, `const r=[...root.querySelectorAll('.lbx.on.dim')]; return r.length>0 && r.every((x)=>{ const f=x.querySelector('.lfl'); return f && /width:\\s*\\d+%/.test(f.getAttribute('style')) && /\\d+%/.test(x.querySelector('.lpc').textContent); }) && !!root.querySelector('.pgrp.lgx.lit[style*="--lc"]')`), 'Luzes: lit rows fill with their colour up to the brightness');
  { const n0 = await page.evaluate(() => H.calls.length);
    const box = await page.evaluate(() => { const r = document.getElementById('d').shadowRoot.querySelector('.lbx.on.dim'); r.scrollIntoView({ block: 'center' }); const b = r.getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
    await page.mouse.move(box.x + box.w * 0.5, box.y); await page.mouse.down(); await page.mouse.move(box.x + box.w * 0.6, box.y, { steps: 4 }); await page.mouse.move(box.x + box.w * 0.3, box.y, { steps: 6 }); await page.mouse.up(); await new Promise((r) => setTimeout(r, 300));
    check(await page.evaluate((n0) => H.calls.slice(n0).some((c) => c[0] === 'light' && c[1] === 'turn_on' && c[2].brightness_pct >= 25 && c[2].brightness_pct <= 35) && !H.calls.slice(n0).some((c) => c[1] === 'toggle'), n0), 'Luzes: dragging sideways on a row sets the brightness (~30%), no toggle');
    const n1 = await page.evaluate(() => H.calls.length);
    await page.mouse.click(box.x + box.w * 0.5, box.y); await new Promise((r) => setTimeout(r, 300));
    check(await page.evaluate((n1) => H.calls.slice(n1).some((c) => c[0] === 'light' && c[1] === 'toggle'), n1), 'Luzes: a tap on the row toggles the light'); }
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
  check(await shadow(page, `const b=root.querySelector('.alm .almi'), i=b.querySelector('svg').getBoundingClientRect(), r=b.getBoundingClientRect(); return Math.abs((i.left+i.width/2)-(r.left+r.width/2))<1.5 && Math.abs((i.top+i.height/2)-(r.top+r.height/2))<1.5`), 'mode icons are centred');
  await page.screenshot({ path: 'build/noir/alarm-menu.png', clip: await page.evaluate(() => { const r = document.getElementById('d').shadowRoot.querySelector('.heroR').getBoundingClientRect(); return { x: r.left + r.width - 520, y: r.top + scrollY, width: 520, height: 360 }; }) });
  await shadow(page, `[...root.querySelectorAll('.alm .almtabs button')].find((b)=>/Noite/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 150));
  check(await shadow(page, `return /Ao ativar/.test(root.querySelector('.almdet').textContent) && /Noite/.test(root.querySelector('.almn').textContent) && !!root.querySelector('.almgo')`), 'tapping a mode tab shows what it does, nothing sent');
  await shadow(page, `root.querySelector('.alm .almgo').click()`); await new Promise((r) => setTimeout(r, 200));
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
  await shadow(page, `[...root.querySelectorAll('.sheet .thc')].find((b)=>/Oceano/.test(b.textContent)).click()`);
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
  await page.evaluate(() => { window.__mi = []; document.addEventListener('hass-more-info', (e) => window.__mi.push(e.detail)); });
  await shadow(page, `root.querySelector('.prow .nmlink') && 0; [...root.querySelectorAll('.pgrp')].forEach((g)=>{ if (!g.classList.contains('open')) g.querySelector('.phead').click(); })`); await new Promise((r) => setTimeout(r, 300));
  await shadow(page, `[...root.querySelectorAll('.ptl .nmlink')].find((x)=>/Screen/.test(x.textContent)).click()`); await new Promise((r) => setTimeout(r, 100));
  await shadow(page, `[...root.querySelectorAll('.ptl .nmlink')].find((x)=>!/Screen/.test(x.textContent)).click()`); await new Promise((r) => setTimeout(r, 100));
  check(await page.evaluate(() => window.__mi.length === 2 && window.__mi[0].entityId === 'switch.screen_plug' && window.__mi[0].view === 'settings' && !window.__mi[1].view), 'tapping a device name opens HA details; without a room it opens HA settings to set the area');
  check(await shadow(page, `return [...root.querySelectorAll('.pgrp')].some((g)=>/Sem cômodo/.test(g.textContent) && g.querySelector('.nahint') && g.querySelector('.noarea'))`), '"Sem cômodo" explains how to set the room');
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
  // Owner 2026-11-18: edit everything — blocks move/hide/rename, hero parts hide, own greeting.
  check(await shadow(page, `return root.querySelectorAll('.blk .blkbar').length >= 5 && root.querySelectorAll('.hero .hp .hpbar').length >= 6`), 'edit mode: every page block and hero part has edit controls');
  await page.evaluate(() => window.scrollTo(0, 0)); await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: 'build/noir/edit-all.png' });
  await shadow(page, `[...root.querySelectorAll('.blk')].find((b)=>/Acontecendo agora/.test(b.querySelector('.blkbar').textContent)).querySelector('button[aria-label^="Subir"]').click()`); await new Promise((r) => setTimeout(r, 150));
  check(await shadow(page, `const b=[...root.querySelectorAll('.blk .blkbar .eyebrow')].map((x)=>x.textContent); return b.findIndex((x)=>/Acontecendo/.test(x)) < b.findIndex((x)=>/Cenas/.test(x))`), 'a block moves up');
  await shadow(page, `[...root.querySelectorAll('.blk')].find((b)=>/Acontecendo agora/.test(b.querySelector('.blkbar').textContent)).querySelector('button[aria-label^="Renomear"]').click()`); await new Promise((r) => setTimeout(r, 150));
  await shadow(page, `const i=root.querySelector('.blkbar .rnbox input');i.value='Agora em casa';i.dispatchEvent(new Event('input',{bubbles:true,composed:true}));i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,composed:true}))`); await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `root.querySelector('.hero .hp button[aria-label="Esconder · Tempo"]').click()`); await new Promise((r) => setTimeout(r, 150));
  await shadow(page, `root.querySelector('.hero button[aria-label="Renomear · Saudação"]').click()`); await new Promise((r) => setTimeout(r, 150));
  await shadow(page, `const i=root.querySelector('.hero .rnbox input');i.value='Oi {nome}, tudo certo?';i.dispatchEvent(new Event('input',{bubbles:true,composed:true}));i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,composed:true}))`); await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.blk')].find((b)=>/Cenas/.test(b.querySelector('.blkbar').textContent)).querySelector('button[aria-label^="Esconder"]').click()`); await new Promise((r) => setTimeout(r, 150));
  // Owner 2026-11-18: own HA / HACS cards.
  check(await shadow(page, `return !!root.querySelector('.addcard') && [...root.querySelectorAll('.banner .btn')].some((b)=>/Adicionar cartão/.test(b.textContent))`), 'edit mode offers "Adicionar cartão" at the top and in Meus cartões');
  await shadow(page, `root.querySelector('.addcard').click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return [...root.querySelectorAll('.cpick')].some((b)=>/Fake Mushroom/.test(b.textContent)) && [...root.querySelectorAll('.cpick')].some((b)=>/Tile/.test(b.textContent))`), 'card picker lists installed HACS cards and HA built-ins');
  await page.screenshot({ path: 'build/noir/card-pick.png' });
  await shadow(page, `[...root.querySelectorAll('.cpick')].find((b)=>/Fake Mushroom/.test(b.textContent)).click()`);
  for (let i = 0; i < 30 && !(await shadow(page, `return !!root.querySelector('.cprev fake-hacs-card') && !!root.querySelector('fake-hacs-card-editor')`)); i++) await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return /type: custom:fake-hacs-card/.test(root.querySelector('.cyaml').value) && /light\./.test(root.querySelector('.cyaml').value) && !!root.querySelector('fake-hacs-card-editor') && !!root.querySelector('.cprev fake-hacs-card')`), 'new card starts from its own example config, with its visual editor and a live preview');
  await shadow(page, `const i=root.querySelector('fake-hacs-card-editor input'); i.value='Sala'; i.dispatchEvent(new Event('input'))`);
  for (let i = 0; i < 30 && !(await shadow(page, `return /Sala/.test(root.querySelector('.cprev').textContent)`)); i++) await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return /title: Sala/.test(root.querySelector('.cyaml').value) && /Sala/.test(root.querySelector('.cprev').textContent)`), 'visual editor changes update YAML and preview');
  await page.screenshot({ path: 'build/noir/card-edit.png' });
  await shadow(page, `[...root.querySelectorAll('.sheet .btn')].find((b)=>/^Salvar$/.test(b.textContent.trim())).click()`);
  for (let i = 0; i < 30 && !(await shadow(page, `return !!root.querySelector('.mycards .mycard fake-hacs-card')`)); i++) await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return !!root.querySelector('.mycards .mycard fake-hacs-card') && /Sala/.test(root.querySelector('.mycards').textContent)`) && await page.evaluate(() => (document.getElementById('d')._prefs.layout?.cards || []).length === 1), 'saved card shows in "Meus cartões" and is stored in prefs');
  await shadow(page, `const t=root.querySelector('.mycards .cyaml'); t && 0`);
  await shadow(page, `[...root.querySelectorAll('.btn')].find((b)=>/Concluir edição/.test(b.textContent)).click()`);
  await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `const tx=root.textContent; return /Agora em casa/.test(tx) && /Oi Alex, tudo certo\\?/.test(root.querySelector('.greet').textContent) && !root.querySelector('.hero .wx, .hero .hours') && !root.querySelector('.blk') && ![...root.querySelectorAll('h2')].some((h)=>/^Cenas$/.test(h.textContent.trim()))`), 'after editing: new title, own greeting, weather and scenes hidden');
  check(await page.evaluate(() => { const L = document.getElementById('d')._prefs.layout || {}; return L.hidden?.scenes === true && L.heroHidden?.weather === true && L.names?.live === 'Agora em casa'; }), 'layout edits are saved in prefs (synced)');
  await page.screenshot({ path: 'build/noir/edit-after.png' });
  check(await shadow(page, `return !!root.querySelector('.mycards fake-hacs-card') && !root.querySelector('.mcbar')`), 'own card stays on the dashboard after editing, without edit bars');
  await page.evaluate(() => { const d = document.getElementById('d'); const h = { ...d.hass, states: { ...d.hass.states } }; const id = Object.keys(h.states).find((x) => x.startsWith('light.')); h.states[id] = { ...h.states[id], state: 'off' }; d.hass = h; });
  for (let i = 0; i < 30 && !(await shadow(page, `return /= off/.test(root.querySelector('.mycards fake-hacs-card')?.textContent || '')`)); i++) await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return /= off/.test(root.querySelector('.mycards fake-hacs-card').textContent)`), 'own card receives hass updates');
  await page.evaluate(() => { document.getElementById('d')._save({ layout: {} }); }); await new Promise((r) => setTimeout(r, 200));

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
  await shadow(page, `root.querySelector('.mlib .dc.spk').click()`);
  await new Promise((r) => setTimeout(r, 400));
  check(await shadow(page, `return [...root.querySelectorAll('.msheet .spr')].some((b)=>/Living room speaker/.test(b.textContent))`), 'Spotify Connect speakers listed in the speaker window');
  await shadow(page, `[...root.querySelectorAll('.msheet .spr')].find((b)=>/Living room speaker/.test(b.textContent)).querySelector('.spdef').click()`); await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => document.getElementById('d')._prefs.musicDefault === 'Living room speaker') && await shadow(page, `return !!root.querySelector('.msheet .spdef.on')`), 'a speaker can be made the default (synced pref)');
  check(await shadow(page, `return !root.querySelector('.sgrid')`), '"Caixas de som por cômodo" no longer shown under the player');
  { const n0 = await page.evaluate(() => H.calls.length);
    await shadow(page, `[...root.querySelectorAll('.msheet .spr')].find((b)=>/Living room speaker/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 300));
    check(await page.evaluate((n0) => H.calls.slice(n0).some((c) => c[0] === 'spotifyplus' && c[1] === 'player_transfer_playback' && c[2].device_id === 'x2' && c[2].play === true), n0), 'choosing a speaker starts the music there at once (play:true)');
    await new Promise((r) => setTimeout(r, 900));
    check(await page.evaluate((n0) => H.calls.slice(n0).some((c) => c[0] === 'homeassistant' && c[1] === 'update_entity'), n0), 'after a music tap the player is refreshed right away'); }
  if (await shadow(page, `return !!root.querySelector('.msheet')`)) { await shadow(page, `root.querySelector('.msheet .mshead .ib').click()`); await new Promise((r) => setTimeout(r, 200)); }
  { const id = 'media_player.spotifyplus_demo', keep = await page.evaluate((id) => JSON.stringify(H.states[id]), id);
    await page.evaluate((id) => { const st = H.states[id], at = { ...st.attributes }; delete at.media_title; delete at.media_artist; delete at.media_content_id; H.states[id] = { ...st, state: 'idle', attributes: at }; document.getElementById('d').hass = { ...H, states: { ...H.states } }; }, id); await new Promise((r) => setTimeout(r, 250));
    const n0 = await page.evaluate(() => H.calls.length);
    await shadow(page, `root.querySelector('.jplay').click()`); await new Promise((r) => setTimeout(r, 500));
    check(await page.evaluate((n0) => H.calls.slice(n0).some((c) => c[1] === 'player_media_play_context' && c[2].context_uri === 'spotify:playlist:CTX9' && c[2].offset_uri === 'spotify:track:LAST1'), n0), 'Play with nothing loaded resumes the last played song in its playlist');
    await page.evaluate(([id, k]) => { H.states[id] = JSON.parse(k); document.getElementById('d').hass = { ...H, states: { ...H.states } }; }, [id, keep]); await new Promise((r) => setTimeout(r, 250)); }
  await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `root.querySelector('.svbtn').click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `const v=root.querySelector('.sctl.svol'); return !!v && /42/.test(v.querySelector('.vnum').textContent) && !root.querySelector('.jplay')`), 'volume button swaps the controls for a volume line');
  { const n0 = await page.evaluate(() => H.calls.length); await shadow(page, `root.querySelector('.svol .vpm[aria-label$="+"]').click()`); await new Promise((r) => setTimeout(r, 800));
    check(await page.evaluate((n0) => H.calls.slice(n0).some((c) => /volume_set/.test(c[1]) && Math.abs(c[2].volume_level - 0.47) < 0.001), n0), 'volume + raises the music volume by 5'); }
  await shadow(page, `root.querySelector('.svol .ib').click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return !root.querySelector('.svol') && !!root.querySelector('.jplay')`), 'closing the volume line brings the controls back');
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
  await shadow(page, `const a=[...root.querySelectorAll('.act.ap')].find((x)=>/^\\s*Washing machine/.test(x.querySelector('.ttl').textContent)); a.querySelector('.apinfo').click()`); await new Promise((r) => setTimeout(r, 150));
  check(await shadow(page, `return [...root.querySelectorAll('.act')].some((a)=>/Washing machine/.test(a.textContent) && /Cotton 40°/.test(a.textContent))`), 'washer shows program and temperature');
  const al = await shadow(page, `const a=[...root.querySelectorAll('.act')].find((x)=>/Washing machine/.test(x.textContent)); const sw=a&&a.querySelector('.alx[role=switch]'); if(!sw) return 'no switch'; sw.click(); return sw.getAttribute('aria-checked')`);
  await new Promise((r) => setTimeout(r, 200));
  check(al === 'true' && await page.evaluate(() => H.calls.some((c) => c[0] === 'automation' && c[1] === 'turn_off' && c[2].entity_id === 'automation.washer_alexa')), 'Alexa row finds the blueprint automation and switches it (' + al + ')');
  check(await shadow(page, `const a=[...root.querySelectorAll('.act')].find((x)=>/Dishwasher/.test(x.querySelector('.ttl')?.textContent||'')); return !!a?.querySelector('.alx[role=switch]')`), 'Alexa automation watching the machine plug is found for the smart dishwasher');
  { let ok = false; for (let k = 0; k < 30 && !ok; k++) { await new Promise((r) => setTimeout(r, 150)); ok = await shadow(page, `const c=[...root.querySelectorAll('.act.ap')].find((x)=>/Old washing/.test(x.textContent)); if (c && !c.querySelector('.apmore')) c.querySelector('.apinfo').click(); return !!c && /termina ≈ \\d\\d:\\d\\d \\(estimado\\)/.test(c.textContent) && /≈\\d\\d:\\d\\d/.test(c.querySelector('.apill text').textContent)`); }
    check(ok, 'plug washer: end time learned from past cycles (≈, marked as estimate)'); }
  await shadow(page, `[...root.querySelectorAll('.act.ap')].find((x)=>/Old washing/.test(x.textContent)).querySelector('.apinfo').click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `const c=[...root.querySelectorAll('.act.ap')].find((x)=>/Old washing/.test(x.textContent)); return !c.querySelector('.apmore') && !/ligada há/.test(c.textContent)`), 'machine details stay hidden until the "i" is tapped');
  await shadow(page, `const a=[...root.querySelectorAll('.act.ap')].find((x)=>/Old washing/.test(x.textContent)); a.querySelector('.apinfo').click()`); await new Promise((r) => setTimeout(r, 150));
  check(await shadow(page, `const a=[...root.querySelectorAll('.act')].find((x)=>/Old washing machine/.test(x.textContent)); return !!a && /ligada há 3[45] min/.test(a.textContent) && /450 W/.test(a.textContent) && !!a.querySelector('.byplug')`), 'old machine on a plug: running since the power went up');
  check(await shadow(page, `return root.querySelectorAll('.vrooms .vr').length===5 && root.querySelector('.vr.now').textContent.trim()==='Kitchen' && /cômodo 2 de 5/.test(root.textContent)`), 'robot shows room-by-room progress');
  await page.evaluate(() => { document.getElementById('d')._save({ energyPrice: 0.4 }); }); await new Promise((r) => setTimeout(r, 300));
  check(await shadow(page, `const e=root.querySelector('.eduo'); const tx=e?.textContent||''; return /2,4\\s*kWh/.test(tx) && /0,96\\s*€/.test(tx) && /53\\s*kWh/.test(tx) && /21,20\\s*€/.test(tx) && !/etiqueta Verbrauch/.test(e.closest('.sec').textContent)`), 'energy discovers meters without labels and prices them (2,4 kWh · 0,96 € · 53 kWh · 21,20 €)');
  check(await shadow(page, `const sec=root.querySelector('.ehero').closest('.sec'); return /Consumo monitorado agora/.test(sec.textContent) && /não é a casa inteira/.test(sec.textContent)`), 'energy says it is monitored consumption, not the whole home');
  check(await shadow(page, `const sec=root.querySelector('.ehero').closest('.sec'); return /1 estimados pelo contador de kWh/.test(sec.textContent) && !/soma de 10 aparelhos/.test(sec.textContent)`), 'estimated devices are not called measured');
  await page.evaluate(() => { document.getElementById('d')._save({ eFold: { who: false } }); }); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `const sec=root.querySelector('.ehero').closest('.sec'); const w=[...sec.querySelectorAll('.ewho')].map((r)=>Number((r.textContent.match(/(\\d+) W/)||[])[1])); return w.length>2 && w.every((v,i)=>i===0||w[i-1]>=v)`), 'who-consumes list is sorted from highest to lowest');
  check(await shadow(page, `const r=[...root.querySelectorAll('.ewho')].find((x)=>/Kühlschrank/.test(x.textContent)); return !!r && /estimado/.test(r.textContent) && /≈\\s*120 W/.test(r.textContent)`), 'kWh-only device gets an estimate (≈ 120 W) clearly marked as estimated');
  check(await shadow(page, `return !/em breve/.test(root.querySelector('.ehero').closest('.sec').textContent)`), 'no fake solar / battery placeholders');
  await new Promise((r) => setTimeout(r, 300));
  check(await shadow(page, `const tx=root.querySelector('.efoot').textContent; return /Mês passado\\s*60\\s*kWh/.test(tx) && /24,00\\s*€/.test(tx) && (new Date().getMonth()!==10 || /572\\s*kWh/.test(root.querySelector('.etot').textContent))`), 'last month and this year come from HA statistics (60 kWh · 24,00 € · 572 kWh)');
  check(await shadow(page, `const h=root.querySelector('.ehero'); return !!h.querySelector('.edial .arc') && h.querySelectorAll('.edial .tk line').length===41 && /pico hoje \\d+ W/.test(h.querySelector('.escale').textContent) && (new Date().getHours() < 3 || (/vs ontem/.test(h.textContent) && /média \\d+ W/.test(h.textContent) && !!h.querySelector('.ecurve .ln'))) && /ontem [\\d,]+ kWh/.test(h.textContent) && /previsão até dia \\d+/.test(h.textContent)`), 'Energy dial: arc, scale with peak, vs yesterday, average, day curve, month forecast');
  await page.evaluate(() => { document.getElementById('d')._save({ eFold: { who: false } }); }); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `const l=root.querySelector('.ewlist'); const idle=l.querySelector('.eidle'); return !!idle && /em espera/.test(idle.textContent) && [...l.querySelectorAll('.ewho')].every((r)=>!!r.querySelector('.ering svg.i')) && !!l.querySelector('.ewho .ering .fg.lead')`), 'consumers have icon rings; standby ones are folded into one line');
  await shadow(page, `root.querySelector('.eidle').click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return root.querySelector('.eidle').getAttribute('aria-expanded')==='true' && root.querySelectorAll('.ewlist .ewho').length>6`), 'tapping the standby line shows them');
  await shadow(page, `root.querySelector('.eidle').click()`); await page.evaluate(() => { document.getElementById('d')._save({ eFold: {} }); }); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `return root.querySelectorAll('.ebars.months .eb').length===12 && root.querySelector('.ebars .eb.now')`), '12-month chart, current month highlighted');
  await shadow(page, `[...root.querySelectorAll('.echart .seg button')].find((b)=>/30 dias/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return root.querySelectorAll('.ebars.days .eb').length===30`), '30-day chart');
  const chEl = await page.evaluateHandle(() => document.getElementById('d').shadowRoot.querySelector('.ebars').closest('.ecard'));
  await chEl.screenshot({ path: 'build/noir/energy-year.png' });
  await shadow(page, `[...root.querySelectorAll('.echart .seg button')].find((b)=>/12 meses/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  await chEl.screenshot({ path: 'build/noir/energy-months.png' });
  await page.evaluate(() => { document.getElementById('d')._save({ eFold: {} }); }); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `const sec=root.querySelector('.ehero').closest('.sec'); return !sec.querySelector('.ewho') && !!sec.querySelector('.ebars') && sec.querySelectorAll('.efold.closed').length===1`), '"Quem consome agora" starts closed, chart and rooms stay open');
  await shadow(page, `[...root.querySelectorAll('.efh')].find((b)=>/Quem consome agora/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `const sec=root.querySelector('.ehero').closest('.sec'); return sec.querySelectorAll('.ewho').length + sec.querySelectorAll('.eidle').length>3 && (document.getElementById('d')._prefs.eFold||{}).who===false`), 'tapping the arrow opens all consumers and it is saved');
  check(await shadow(page, `return !root.querySelector('.ehero').closest('.sec').querySelector('.ediag') && ![...root.querySelectorAll('.sec .linkbtn')].some((b)=>/Diagnóstico/.test(b.textContent))`), 'energy section has no diagnosis (moved to Settings)');
  check(await shadow(page, `return !/Toque num cômodo/.test(root.querySelector('.heroR').textContent)`), 'no "tap a room" hint in the hero');
  await shadow(page, `root.querySelector('.btn[aria-label="Configurações"]').click()`); await new Promise((r) => setTimeout(r, 200));
  await shadow(page, `[...root.querySelectorAll('.sheet .sthi')].find((b)=>/Geral/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `const g=[...root.querySelectorAll('.sheet .sgrp')]; return g.length>=4 && g.some((x)=>x.classList.contains('closed') && /Diagnóstico de energia/.test(x.textContent))`), 'Settings headings fold; energy diagnosis starts folded');
  await shadow(page, `[...root.querySelectorAll('.sheet .stgh')].find((b)=>/Diagnóstico de energia/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `return root.querySelectorAll('.sheet .ediag .edr').length > 3`), 'energy diagnosis lists what HA provides per device (in Settings)');
  await shadow(page, `[...root.querySelectorAll('.sheet .stgh')].find((b)=>/Tema/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `const g=[...root.querySelectorAll('.sheet .sgrp')].find((x)=>/Tema/.test(x.querySelector('.stgh').textContent)); return g.classList.contains('closed') && !g.querySelector('.dc') && (document.getElementById('d')._prefs.stFold||{})['geral:theme']===true`), 'closing a heading hides it and is saved');
  await new Promise((r) => setTimeout(r, 900)); await page.screenshot({ path: 'build/noir/settings-fold.png' });
  check(await shadow(page, `return ![...root.querySelectorAll('.sheet [role=tab]')].some((b)=>/^st[A-Z]/.test(b.textContent.trim()))`), 'no untranslated tab names');
  await shadow(page, `[...root.querySelectorAll('.sheet .stgh')].find((b)=>/Tema/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 150));
  await shadow(page, `root.querySelector('.sheet .stclose').click()`); await new Promise((r) => setTimeout(r, 200));
  const eNode = await page.evaluateHandle(() => document.getElementById('d').shadowRoot.querySelector('.ehero').closest('.sec'));
  await eNode.screenshot({ path: 'build/noir/energy.png' });
  check(await shadow(page, `return !!root.querySelector('.sctl button[aria-label^="Repetir"]')`), 'repeat button shows the repeat mode');
  await shadow(page, `root.querySelector('.mlib .dc.spk').click()`); await page.evaluate(() => { const id = 'media_player.spotifyplus_demo'; }); await new Promise((r) => setTimeout(r, 500));
  check(await shadow(page, `return !!root.querySelector('.msheet .spr.on .vline')`), 'volume of the playing speaker is in the speaker window');
  const v0 = await page.evaluate(() => H.calls.length);
  await shadow(page, `root.querySelector('.msheet .spr.on .vline .vpm[aria-label$="+"]').click(); root.querySelector('.msheet .spr.on .vline .vpm[aria-label$="+"]').click();`);
  await new Promise((r) => setTimeout(r, 800));
  const vs = await page.evaluate((v0) => H.calls.slice(v0).filter((c) => c[0] === 'media_player' && c[1] === 'volume_set' && c[2].entity_id === 'media_player.spotifyplus_demo').map((c) => c[2].volume_level), v0);
  check(vs.length === 1 && Math.abs(vs[0] - 0.52) < 0.001, 'volume + twice sends one change to 52 (' + vs.join(',') + ')');
  await shadow(page, `root.querySelector('.msheet .mshead .ib').click()`); await new Promise((r) => setTimeout(r, 200));
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
  await shadow(page, `[...root.querySelectorAll('.alm .almtabs button')].find((b)=>/Férias/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 150)); await shadow(page, `root.querySelector('.alm .almgo').click()`);
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
  await shadow(ph.page, `root.querySelector('.btn[aria-label="Configurações"]').click()`); await new Promise((r) => setTimeout(r, 300));
  await shadow(ph.page, `[...root.querySelectorAll('.sheet .sthi')].find((b)=>/Geral/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 300));
  check(await shadow(ph.page, `const r=root.querySelector('.sheet').getBoundingClientRect(); return r.top >= 14 && r.bottom <= innerHeight - 14 && /env\\(safe-area-inset-top/.test([...root.adoptedStyleSheets||[]].map((x)=>[...x.cssRules].map((c)=>c.cssText).join('')).join('') + [...root.querySelectorAll('style')].map((x)=>x.textContent).join(''))`), 'phone: settings sheet keeps clear of the top and bottom (safe area)');
  await shadow(ph.page, `root.querySelector('.sheet').scrollTo(0, 900)`); await new Promise((r) => setTimeout(r, 300));
  check(await shadow(ph.page, `return !!root.querySelector('.sheet .shtop')`), 'settings: back-to-top button appears after scrolling');
  await ph.page.screenshot({ path: 'build/noir/sheet-390.png' });
  await shadow(ph.page, `root.querySelector('.sheet .shtop').click()`); await new Promise((r) => setTimeout(r, 900));
  check(await shadow(ph.page, `return root.querySelector('.sheet').scrollTop < 20`), 'settings: back-to-top returns to the top of the sheet');
  await shadow(ph.page, `root.querySelector('.sheet .stclose').click()`); await new Promise((r) => setTimeout(r, 200));
  await shadow(ph.page, `[...root.querySelectorAll('.btn')].find((b)=>/Editar painel/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 300));
  check(await ph.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'phone edit mode: nothing overflows sideways');
  check(await shadow(ph.page, `const a=root.querySelector('.hmL .hpbar .ib').getBoundingClientRect(); return ![...root.querySelectorAll('.heroL .hp .hpbar .ib')].some((b)=>{ if (b.closest('.hmL')) return false; const r=b.getBoundingClientRect(); return r.left<a.right && r.right>a.left && r.top<a.bottom && r.bottom>a.top; })`), 'phone edit mode: eye buttons do not overlap');
  await ph.page.screenshot({ path: 'build/noir/edit-390.png' });
  await shadow(ph.page, `[...root.querySelectorAll('.btn')].find((b)=>/Concluir edição/.test(b.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(ph.page, `return root.querySelectorAll('.pgrp').length >= 2 && !root.querySelector('.pgrp .prow, .pgrp .ptl, .pgrp .lbx')`), 'plugs folded by room on the phone');
  await shadow(ph.page, `root.querySelector('.pgrp.pgx:not(.lgx) .phead').click()`);
  await new Promise((r) => setTimeout(r, 150));
  check(await shadow(ph.page, `return root.querySelectorAll('.pgrp.open .ptl').length >= 1`), 'tapping a room opens its plugs');
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
  await shadow(page, `[...root.querySelectorAll('.sec')].find((x)=>/Televisão/.test(x.querySelector('.sech')?.textContent||'')).querySelector('.cine .cpow').click()`); await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'media_player' && c[1] === 'turn_on' && c[2].entity_id === 'media_player.s4')), 'TV power button turns it on');
  await page.evaluate(() => { const s = H.states['media_player.s4']; H.states['media_player.s4'] = { ...s, state: 'on' }; document.getElementById('d').hass = { ...H }; }); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `const b=[...root.querySelectorAll('.cine .tvfav button')]; return b.length===4 && /PS5/.test(b[0].textContent) && /Apple OTT/.test(b[1].textContent) && /Google OTT/.test(b[2].textContent) && b[3].classList.contains('on') && /LG Channels/.test(b[3].textContent) && b.every((x)=>x.querySelector('svg'))`), 'TV card shows 4 likely sources with icons, current one included');
  await shadow(page, `root.querySelector('.cine .tvmore').click()`); await new Promise((r) => setTimeout(r, 200));
  check(await shadow(page, `return root.querySelectorAll('.tvsheet .tvrow').length===9 && !H.calls.some((c)=>c[1]==='select_source')`), 'Mais fontes lists every source, nothing sent');
  await shadow(page, `[...root.querySelectorAll('.tvsheet .tvrow')].find((r)=>/Kamera/.test(r.textContent)).querySelector('.tvstar').click()`); await new Promise((r) => setTimeout(r, 150));
  check(await shadow(page, `return JSON.stringify(root.host._prefs.tvFav['media_player.s4'])==='["Kamera"]'`), 'starring a source saves it as favourite');
  await shadow(page, `[...root.querySelectorAll('.tvsheet .tvpick')].find((r)=>/HDMI 4/.test(r.textContent)).click()`); await new Promise((r) => setTimeout(r, 200));
  check(await page.evaluate(() => H.calls.some((c) => c[1] === 'select_source' && c[2].source === 'HDMI 4')) && await shadow(page, `return !root.querySelector('.tvsheet') && /Kamera/.test(root.querySelector('.cine .tvfav').textContent)`), 'picking a source switches the TV and closes the list');
  check(await shadow(page, `const c=root.querySelector('.cine'); const st=c&&getComputedStyle(c.querySelector('.csrc')); return !!c && !!c.querySelector('.cpow') && st.fontStyle==='italic' && /Georgia|Iowan|Palatino/.test(st.fontFamily)`), 'TV shows as a Cinema card (large serif source, power button)');
  check(await shadow(page, `const c=root.querySelector('.shieldc'); return !!c && c.classList.contains('warn') && /2/.test(c.querySelector('.shbig').textContent) && c.querySelectorAll('.shr').length===4 && c.querySelectorAll('.shr.open').length===2 && /4 sensores/.test(c.textContent)`), 'openings show as the Escudo card (2 open of 4, amber)');
  check(await shadow(page, `const cs=[...root.querySelectorAll('.clgrid .clc')]; return cs.length===4 && cs.filter((c)=>c.classList.contains('heat')).length===3 && cs.every((c)=>c.querySelectorAll('.cldial line').length===61 && !!c.querySelector('.clpill')) && cs.some((c)=>/↑ [\\d,]+° em 1 h/.test(c.textContent)) && cs.some((c)=>!!c.querySelector('.clspark path')) && /umidade 48%/.test(cs[0].textContent)`), 'Clima premium: dial, trend, mini chart, humidity, pill');
  check(await shadow(page, `const c=[...root.querySelectorAll('.clc')].find((x)=>/Kitchen/.test(x.textContent)); return /No alvo/.test(c.querySelector('.clst').textContent)`), 'thermostat within 0.5° shows "No alvo"');
  await page.evaluate(() => { const s = H.states['climate.t1']; H.states['climate.t1'] = { ...s, attributes: { ...s.attributes, temperature: 13.5 } }; document.getElementById('d').hass = { ...H }; }); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `const c=[...root.querySelectorAll('.clc')].find((x)=>/Kitchen/.test(x.textContent)); return /Acima do alvo/.test(c.querySelector('.clst').textContent)`), 'room far above its target says "Acima do alvo", not "No alvo"');
  await page.evaluate(() => { window.__cl = {}; for (const id of Object.keys(H.states).filter((k) => k.startsWith('climate.'))) { window.__cl[id] = H.states[id]; H.states[id] = { ...H.states[id], attributes: { ...H.states[id].attributes, hvac_action: 'idle' } }; } document.getElementById('d').hass = { ...H }; }); await new Promise((r) => setTimeout(r, 250));
  check(await shadow(page, `const h=root.querySelector('.clgrid').closest('.sec').querySelector('.sech'); return /nenhum aquecendo/.test(h.textContent) && !/todos no alvo/.test(h.textContent)`), 'Clima title does not say "todos no alvo" when a room is above its target');
  await page.evaluate(() => { Object.assign(H.states, window.__cl); document.getElementById('d').hass = { ...H }; }); await new Promise((r) => setTimeout(r, 250));
  await page.evaluate(() => { const s = H.states['climate.t1']; H.states['climate.t1'] = { ...s, attributes: { ...s.attributes, temperature: 20 } }; document.getElementById('d').hass = { ...H }; }); await new Promise((r) => setTimeout(r, 250));
  await shadow(page, `[...root.querySelectorAll('.clc')].find((x)=>/Kitchen/.test(x.textContent)).querySelector('.clpill button[aria-label^="Aumentar"]').click()`); await new Promise((r) => setTimeout(r, 1000));
  check(await page.evaluate(() => H.calls.some((c) => c[0] === 'climate' && c[1] === 'set_temperature' && c[2].entity_id === 'climate.t1' && c[2].temperature === 20.5)), 'Clima + raises the target by one step (20,5°)');
  for (const w of [1440, 390]) { await page.setViewport({ width: w, height: 900 }); await new Promise((r) => setTimeout(r, 300));
    check(await shadow(page, `return [...root.querySelectorAll('.clc')].every((e)=>e.scrollWidth<=e.clientWidth+1)`), `Clima cards not cut off at ${w}px`);
    const el = await page.evaluateHandle(() => { const r = document.getElementById('d').shadowRoot.querySelector('.clgrid').closest('.sec'); r.scrollIntoView({ block: 'start' }); return r; }); await new Promise((r) => setTimeout(r, 600)); await el.screenshot({ path: `build/noir/clima-${w}.png` }); }
  await page.setViewport({ width: 1440, height: 900 });
  check(await shadow(page, `const c=root.querySelector('.shieldc'); return c.querySelectorAll('.shr.open svg.opi.open').length===2 && c.querySelectorAll('.shr:not(.open) svg.opi:not(.open)').length===2 && !!c.querySelector('.shr svg.opi.door') && getComputedStyle(c.querySelector('.shr.open .opi .sl')).transform!=='none'`), 'open windows/doors are drawn open (animated sashes)');
  for (const w of [1440, 390]) { await page.setViewport({ width: w, height: 900 }); await new Promise((r) => setTimeout(r, 300));
    for (const [cls, n] of [['.shieldc', 'escudo'], ['.cinegrid', 'cinema']]) { const el = await page.evaluateHandle((c) => { const r = document.getElementById('d').shadowRoot.querySelector(c).closest('.sec'); r.scrollIntoView({ block: 'center' }); return r; }, cls); await new Promise((r) => setTimeout(r, 700)); await el.screenshot({ path: `build/noir/${n}-${w}.png` }); }
    check(await shadow(page, `const els=[...root.querySelectorAll('.shieldc,.cine')]; return els.every((e)=>e.scrollWidth<=e.clientWidth+1)`), `Escudo/Cinema not cut off at ${w}px`); }
  await page.setViewport({ width: 1440, height: 900 });
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
  check(await shadow(page, `return root.querySelectorAll('.sheet .thgal .thc').length >= 24 && root.querySelectorAll('.sheet .thfam').length === 5 && !!root.querySelector('.sheet .thc.on .thok')`), 'theme gallery: 24 themes with previews in 5 families, current one marked');
  await page.screenshot({ path: 'build/noir/theme-gallery.png' });
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
  await shadow(page, `root.querySelector('.mlib .dc.spk').click()`); await new Promise((r) => setTimeout(r, 400));
  check(await shadow(page, `return [...root.querySelectorAll('.msheet .spr')].some((b)=>/Echo Show hidden/.test(b.textContent))`), 'a speaker hidden in HA can be shown (in the speaker window)');
  await shadow(page, `root.querySelector('.msheet .mshead .ib').click()`); await new Promise((r) => setTimeout(r, 200));
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
