// Isolated browser fixture only. Does not connect to or install Home Assistant.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import puppeteer from '../floor-studio/neonplan3d-main/frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const root=resolve('.'),out=resolve('build/music-browser');mkdirSync(out,{recursive:true});
const cover='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="#147d81"/><stop offset=".45" stop-color="#193855"/><stop offset="1" stop-color="#60396f"/></linearGradient></defs><path fill="url(#a)" d="M0 0h800v1000H0z"/><circle cx="450" cy="370" r="245" fill="none" stroke="#8addca" stroke-width="3"/><circle cx="450" cy="370" r="180" fill="#001d35"/><path d="M0 820 800 500v500H0" fill="#001522"/><text x="55" y="910" font-size="44" font-family="sans-serif" fill="#effffa" letter-spacing="9">TEST ARTWORK</text></svg>';
const server=createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/cover.svg'){res.writeHead(200,{'content-type':'image/svg+xml'}).end(cover);return;}if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#07111c;margin:0;padding:24px}aureon-music-player{display:block;margin-bottom:28px}</style><script src="/build/dashboard/aureon-dashboard.js"></script>');return;}const path=resolve(root,'.'+url.pathname);if(!path.startsWith(root+sep)||!existsSync(path)){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':'text/javascript; charset=utf-8'}).end(readFileSync(path));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const executablePath=process.env.CHROME_BIN || ['/usr/bin/google-chrome','/usr/bin/chromium','/tmp/chromium'].find(existsSync);
if(!executablePath){server.close();throw new Error('Set CHROME_BIN to run the real browser tests');}
let browser;const checks=[];
try{
 browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1440,height:1000});await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle0'});
 await page.evaluate(()=>{
  window.calls=[];window.failService=false;
  const Player=customElements.get('aureon-music-player');const controller=Player.createController();window.controller=controller;
  const services=['media_play','media_pause','media_next_track','media_previous_track','media_seek','volume_set','shuffle_set','repeat_set','select_source','play_media'];
  const state={entity_id:'media_player.fixture',state:'playing',attributes:{friendly_name:'Test player',media_title:'Browser fixture track',media_artist:'Test artist',media_album_name:'Test album',entity_picture:'/cover.svg',supported_features:1|2|4|16|32|512|2048|16384|32768|262144,media_position:92,media_duration:227,volume_level:.45,shuffle:true,repeat:'all',sp_user_id:'fixture',media_content_id:'spotify:track:abc',source_list:['Test speaker']}};
  const names=['get_browse_categorys_list','get_category_playlists','get_spotify_connect_devices','player_transfer_playback','get_playlist_favorites','get_album_favorites','get_track_favorites','search_tracks','check_track_favorites','save_track_favorites','remove_track_favorites','player_media_play_context','player_media_play_tracks'];
  window.hass={user:{id:'test-user'},connection:{},language:'en',themes:{darkMode:true},states:{[state.entity_id]:state},services:{media_player:Object.fromEntries(services.map(s=>[s,{}])),spotifyplus:Object.fromEntries(names.map(s=>[s,{}]))},callService:async(...args)=>{calls.push(args);if(failService)throw new Error('Fixture permission error');return {response:{result:args[1]==='check_track_favorites'?{abc:false}:args[1]==='get_spotify_connect_devices'?{Items:[{Id:'test-speaker',Name:'Test speaker'}]}:args[1]==='get_browse_categorys_list'?[{id:'focus',name:'Focus',icons:[{url:'/cover.svg'}]}]:{items:[{name:'Fixture playlist',uri:'spotify:playlist:fixture',images:[{url:'/cover.svg'}]}],total:args[2]?.offset?1:21,next:args[2]?.offset?null:'https://provider.invalid/next'}}};}};
  controller.setHass(hass);
  const full=document.createElement('aureon-music-player');full.id='full';full.controller=controller;
  const compact=document.createElement('aureon-music-player');compact.id='compact';compact.compact=true;compact.controller=controller;document.body.append(full,compact);
 });
 await page.waitForFunction(()=>document.querySelector('#full')?.shadowRoot?.querySelector('.title'));
 assert.equal(await page.evaluate(()=>calls.length),0);checks.push('mount performs no service calls');
 await page.click('#full >>> [data-action="pause"]');assert.equal(await page.evaluate(()=>calls.at(-1)[1]),'media_pause');checks.push('pause service payload');
 await page.evaluate(()=>{hass.states['media_player.fixture']={...hass.states['media_player.fixture'],state:'paused'};controller.setHass(hass);});
 await page.waitForFunction(()=>document.querySelector('#compact').shadowRoot.querySelector('[data-action="play"]'));checks.push('Full and Compact synchronize backend state');
 await page.click('#full >>> [data-action="favorite"]');await page.waitForFunction(()=>controller.favorite===true);checks.push('favorite checks backend before writing');
 await page.click('#full >>> [aria-label="Your library"]');await page.waitForFunction(()=>document.querySelector('#full').shadowRoot.querySelector('.item'));
 await page.click('#full >>> .item');assert.equal(await page.evaluate(()=>calls.at(-1)[1]),'player_media_play_context');checks.push('library returns real response and plays context');
 await page.click('#full >>> [aria-label="Result pages"] button:last-child');await page.waitForFunction(()=>controller.pageIndex===1&&!controller.pending.has('browse'));assert.equal(await page.evaluate(()=>calls.at(-1)[2].offset),20);checks.push('library next page uses service offset');
 await page.evaluate(()=>controller.browse('categories'));await page.waitForFunction(()=>document.querySelector('#full').shadowRoot.querySelector('.item')?.textContent.includes('Focus'));await page.click('#full >>> .item');await page.waitForFunction(()=>calls.at(-1)[1]==='get_category_playlists');assert.equal(await page.evaluate(()=>calls.at(-1)[2].category_id),'focus');checks.push('category selection browses playlists without issuing playback');
 await page.click('#full >>> [aria-label="Search"]');await page.type('#full >>> input[type="search"]','fixture');await page.click('#full >>> button[type="submit"]');await page.waitForFunction(()=>calls.some(c=>c[1]==='search_tracks'));checks.push('search explicit request');
 await page.evaluate(()=>{controller.view='player';controller.emit();});
 await page.click('#full >>> [data-action="devices"]');await page.waitForFunction(()=>controller.devices.length===1);await page.click('#full >>> .device');assert.equal(await page.evaluate(()=>calls.at(-1)[1]),'player_transfer_playback');checks.push('device selection and transfer');
 await page.evaluate(()=>{controller.view='player';controller.emit();failService=true;});await page.click('#full >>> [data-action="next"]');await page.waitForFunction(()=>!!document.querySelector('#full').shadowRoot.querySelector('[role="alert"]'));checks.push('service rejection visible');
 await page.evaluate(()=>{failService=false;controller.error='';controller.emit();});
 for(const width of [1440,820,390]){
  await page.setViewport({width,height:width===390?1500:1050});await new Promise(r=>setTimeout(r,120));
  const sizes=await page.evaluate(()=>{const e=document.querySelector('#full'),s=e.shadowRoot.querySelector('.shell');return {client:s.clientWidth,scroll:s.scrollWidth,page:document.documentElement.scrollWidth,viewport:innerWidth};});
  assert.ok(sizes.scroll<=sizes.client+1,JSON.stringify({width,...sizes}));assert.ok(sizes.page<=sizes.viewport,JSON.stringify({width,...sizes}));
  await page.screenshot({path:out+'/'+width+'.png',fullPage:true});checks.push('no horizontal overflow at '+width+'px');
 }
 await page.setViewport({width:1440,height:1000});
 await page.evaluate(()=>{hass.language='de';controller.setHass(hass);});await page.waitForFunction(()=>document.querySelector('#full').shadowRoot.querySelector('[aria-label="Nächster Titel"]'));checks.push('HA locale changes labels');
 await page.evaluate(()=>{hass.states['media_player.fixture'].attributes.media_title='<img src=x onerror="window.injected=1">';controller.setHass(hass);});
 assert.equal(await page.evaluate(()=>!!window.injected),false);assert.ok((await page.$eval('#full >>> .title',e=>e.textContent)).includes('<img'));checks.push('entity text cannot inject markup');
 const focus=await page.evaluate(()=>{const btn=document.querySelector('#full').shadowRoot.querySelector('[data-action="next"]');btn.focus();controller.setHass(hass);return new Promise(r=>requestAnimationFrame(()=>r(document.querySelector('#full').shadowRoot.activeElement===btn)));});assert.ok(focus);checks.push('state updates preserve keyboard focus');
 await page.evaluate(()=>{hass.states['media_player.fixture'].state='unavailable';controller.setHass(hass);});await page.waitForFunction(()=>document.querySelector('#full').shadowRoot.querySelector('[data-action="play"]').disabled);checks.push('unavailable disables transport');
 await page.evaluate(()=>{document.querySelector('#full').remove();document.querySelector('#compact').remove();});assert.equal(await page.evaluate(()=>controller.listeners.size),0);checks.push('unmount removes subscriptions');
 await page.evaluate(()=>{
   hass.states['media_player.fixture'].state='paused';hass.states['media_player.fixture'].attributes.media_title='Dashboard fixture';
   hass.callWS=async({type})=>type==='config/entity_registry/list'?[{entity_id:'media_player.fixture',platform:'spotifyplus'}]:[];
   const dashboard=document.createElement('aureon-dashboard');dashboard.id='dashboard';dashboard.hass=hass;dashboard.setConfig({type:'custom:aureon-dashboard'});document.body.append(dashboard);
 });
 await page.waitForFunction(()=>document.querySelector('#dashboard').shadowRoot.querySelector('aureon-music-player[compact]'));
 await page.click('#dashboard >>> aureon-music-player >>> .open-full');
 await page.waitForFunction(()=>{const p=document.querySelector('#dashboard').shadowRoot.querySelector('aureon-music-player');return p && !p.compact && p.shadowRoot.querySelector('.stage');});
 assert.equal(await page.evaluate(()=>document.querySelector('#dashboard')._page),'Medien');checks.push('Startseite Compact opens Medien Full inside actual dashboard candidate');
 await page.click('#dashboard >>> aureon-music-player >>> [data-action="play"]');assert.equal(await page.evaluate(()=>calls.at(-1)[1]),'media_play');checks.push('integrated dashboard controls reach HA service adapter');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks.length,checks,environment:'isolated browser fixture; no Home Assistant installation'},null,2));
}finally{await browser?.close();server.close();}
