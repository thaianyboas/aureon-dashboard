// Medien visual acceptance captures inside the actual dashboard candidate (synthetic fixture, no Home Assistant).
// Synthetic artwork only: generated gradients, no artist photos or provider artwork are redistributed.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import puppeteer from '../floor-studio/neonplan3d-main/frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const root=resolve('.'),out=resolve('build/media-reference');mkdirSync(out,{recursive:true});
const palette=[['#3a1f0d','#c9862f','#f2d08a'],['#0d2a3a','#2f8ec9','#a8e0f2'],['#2a0d3a','#a12fc9','#f2a8e9'],['#0d3a22','#2fc97a','#c2f2a8'],['#3a0d16','#c92f4b','#f2b0a8'],['#1d1d1d','#8a8a8a','#f0f0f0'],['#3a330d','#c9b52f','#f2eaa8'],['#0d1a3a','#4b2fc9','#b6a8f2']];
const art=i=>{const [a,b,c]=palette[i%palette.length];return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><radialGradient id="g" cx="${30+i*7%50}%" cy="${35+i*11%40}%" r="85%"><stop stop-color="${c}"/><stop offset=".35" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient></defs><rect width="600" height="600" fill="url(#g)"/><circle cx="${150+i*53%300}" cy="${380-i*37%200}" r="${90+i*13%80}" fill="${c}" opacity=".18"/><path d="M0 ${430+i*9%90} C200 ${360+i*17%80} 400 ${520-i*7%60} 600 ${420+i*5%70} V600H0z" fill="${a}" opacity=".55"/></svg>`;};
const server=createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const m=/^\/art\/(\d+)\.svg$/.exec(url.pathname);if(m){res.writeHead(200,{'content-type':'image/svg+xml'}).end(art(Number(m[1])));return;}if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#0b120f;margin:0}</style><script src="/build/dashboard/aureon-dashboard.js"></script>');return;}const path=resolve(root,'.'+url.pathname);if(!path.startsWith(root+sep)||!existsSync(path)){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':'text/javascript; charset=utf-8'}).end(readFileSync(path));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const checks=[];let browser;
try{
 const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);if(!executablePath)throw Error('Set CHROME_BIN');
 browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1440,height:1024});
 await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle0'});
 await page.evaluate(()=>{
  window.calls=[];
  const mp=['media_play','media_pause','media_next_track','media_previous_track','media_seek','volume_set','shuffle_set','repeat_set','select_source','play_media'];
  const sp=['get_browse_categorys_list','get_category_playlists','get_spotify_connect_devices','player_transfer_playback','get_playlist_favorites','get_album_favorites','get_track_favorites','search_tracks','check_track_favorites','save_track_favorites','remove_track_favorites','player_media_play_context','player_media_play_tracks'];
  const player=(id,name,state,extra={})=>({entity_id:id,state,attributes:{friendly_name:name,supported_features:1|2|4|16|32|512|2048|16384|32768|262144,volume_level:.5,...extra}});
  const states={};
  for(const s of [player('media_player.apartment','Apartment music','playing',{media_title:'Synthetic evening session',media_artist:'Fixture Ensemble',media_album_name:'Generated artwork',entity_picture:'/art/0.svg',media_position:102,media_duration:228,media_position_updated_at:new Date().toISOString(),volume_level:.65,shuffle:false,repeat:'off',sp_user_id:'fixture',media_content_id:'spotify:track:abc',source:'Living room · Kitchen'}),player('media_player.living','Living room speaker','idle',{volume_level:.5}),player('media_player.kitchen','Kitchen speaker','idle',{volume_level:.5}),player('media_player.bedroom','Bedroom radio','off',{volume_level:.3})])states[s.entity_id]=s;
  const names=['Evening glow','Focus flow','Deep house','Workout','Chill','Piano','Coastal','Classics','Morning','Productive day','Dinner','Cozy'];
  const items=(kind,n)=>Array.from({length:n},(_,i)=>({name:names[(i+kind.length)%names.length],uri:`spotify:${kind==='favorites'?'track':kind==='albums'?'album':'playlist'}:fx${kind[0]}${i}`,images:[{url:`/art/${(i+kind.length)%8}.svg`}],owner:{display_name:'Fixture'},artists:kind==='playlists'?undefined:[{name:'Fixture artist'}]}));
  window.hass={user:{id:'fixture-user',is_admin:true,name:'Fixture'},connection:{},language:'de',locale:{language:'de'},themes:{darkMode:true},config:{time_zone:'Europe/Berlin',unit_system:{temperature:'°C'}},states,services:{media_player:Object.fromEntries(mp.map(s=>[s,{}])),spotifyplus:Object.fromEntries(sp.map(s=>[s,{}]))},
   hassUrl:p=>p,
   callWS:async({type})=>type==='config/entity_registry/list'?Object.keys(states).map(id=>({entity_id:id,platform:id==='media_player.apartment'?'spotifyplus':'cast'})):[],
   callService:async(...args)=>{calls.push(args);const n=args[1];return {response:{result:n==='check_track_favorites'?{abc:false}:n==='get_browse_categorys_list'?names.slice(0,9).map((name,i)=>({id:'c'+i,name,icons:[{url:`/art/${i%8}.svg`}]})):{items:items(n.includes('album')?'albums':n.includes('track')?'favorites':'playlists',12),total:12}}};}};
  const d=document.createElement('aureon-dashboard');d.id='dashboard';d.hass=hass;d.setConfig({type:'custom:aureon-dashboard'});document.body.append(d);window.dashboard=d;
 });
 await page.waitForFunction(()=>dashboard.shadowRoot?.querySelector('nav'));
 await page.evaluate(()=>dashboard._navigate('Medien'));
 const full='#dashboard >>> aureon-music-player';
 await page.waitForFunction(()=>dashboard.shadowRoot.querySelector('aureon-music-player')?.shadowRoot?.querySelector('.now .title'));
 assert.equal(await page.evaluate(()=>calls.length),0);checks.push('opening Medien issues no service call');
 await page.click(`${full} >>> [data-action="load-library"]`);
 await page.waitForFunction(()=>dashboard.shadowRoot.querySelector('aureon-music-player').shadowRoot.querySelectorAll('.shelf').length===4);
 assert.deepEqual(await page.evaluate(()=>calls.map(c=>c[1])),['get_browse_categorys_list','get_playlist_favorites','get_track_favorites','get_album_favorites']);
 assert.ok(await page.evaluate(()=>calls.every(c=>c[0]==='spotifyplus'&&c[2].entity_id==='media_player.apartment')));
 checks.push('library shelves load only after explicit request, scoped to the selected SpotifyPlus account');
 await new Promise(r=>setTimeout(r,500));
 for(const [width,height] of [[1440,1024],[1180,820],[820,1180],[390,844]]){await page.setViewport({width,height});await new Promise(r=>setTimeout(r,500));const w=await page.evaluate(()=>{const s=dashboard.shadowRoot.querySelector('aureon-music-player').shadowRoot.querySelector('.shell');return {doc:document.documentElement.scrollWidth,vw:innerWidth,client:s.clientWidth,scroll:s.scrollWidth};});assert.ok(w.doc<=w.vw&&w.scroll<=w.client+1,JSON.stringify({width,...w}));await page.screenshot({path:`${out}/medien-${width}x${height}.png`,fullPage:true});}
 checks.push('Medien without horizontal overflow at 1440/1180/820/390');
 await page.setViewport({width:1440,height:1024});
 const before=await page.evaluate(()=>calls.length);
 await page.$eval(full,el=>{const input=el.shadowRoot.querySelectorAll('.vol-row input')[1];input.value='0.8';input.dispatchEvent(new Event('change'));});
 await page.waitForFunction(n=>calls.length===n+1,{},before);
 assert.deepEqual(await page.evaluate(()=>calls.at(-1)),['media_player','volume_set',{entity_id:'media_player.bedroom',volume_level:.8}]);
 checks.push('per-player volume targets only that player');
 await page.click(`${full} >>> [data-action="pause-all"]`);
 await page.waitForFunction(()=>calls.at(-1)[1]==='media_pause');
 assert.deepEqual(await page.evaluate(()=>calls.at(-1)[2].entity_id),['media_player.apartment']);
 checks.push('pause all pauses only playing players after explicit click');
 for(const palette of ['black-gold-royal','pearl']){await page.evaluate(p=>{const c=dashboard._platformController;c.patch('appearance','custom');c.patch('palette',p);dashboard._theme={...dashboard._theme,mode:'custom',palette:p};dashboard._render();},palette);await page.waitForFunction(()=>dashboard.shadowRoot.querySelector('aureon-music-player')?.shadowRoot?.querySelector('.now .title'));await page.evaluate(()=>dashboard._musicController.loadShelves());await new Promise(r=>setTimeout(r,700));await page.screenshot({path:`${out}/medien-palette-${palette}.png`});}
 checks.push('Medien rendered with Black & Gold and Pearl palettes');
 assert.deepEqual(errors,[]);
 writeFileSync(`${out}/RESULTS.json`,JSON.stringify({environment:'synthetic fixture and compiled dashboard; not a Home Assistant installation',passed:checks.length,checks},null,2)+'\n');
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await browser?.close();server.close();}
