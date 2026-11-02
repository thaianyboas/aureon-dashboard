// Startseite visual acceptance captures (synthetic fixture, no Home Assistant installation).
// Produces build/home-reference/*.png for side-by-side comparison with the approved references and
// asserts structure, room-panel behaviour, palette coverage and absence of horizontal overflow.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import puppeteer from '../floor-studio/neonplan3d-main/frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import {setupPlatformFixture} from './platform-fixture.mjs';

const root=resolve('.'),out=resolve('build/home-reference');mkdirSync(out,{recursive:true});
if(!existsSync(resolve('build/platform-browser/model.js'))||!existsSync(resolve('build/dashboard/aureon-dashboard.js')))throw Error('Run npm run build and scripts/test-platform-browser.mjs first');
const types={'.woff2':'font/woff2','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname;if(pathname==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#0b120f;margin:0}</style><script src="/build/platform-browser/model.js"></script><script type="module" src="/floor-studio/neonplan3d-main/custom_components/neonplan3d/frontend/neonplan3d.js"></script><script src="/build/dashboard/aureon-dashboard.js"></script>');return;}const file=resolve(root,'.'+pathname);if(!file.startsWith(root+sep)||!existsSync(file)){res.writeHead(404).end();return;}const ext=Object.keys(types).find(x=>file.endsWith(x));res.writeHead(200,{'content-type':types[ext]||'text/javascript; charset=utf-8'}).end(readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const checks=[];let browser;
const platform='#platform-dashboard >>> aureon-platform';
try{
 const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);if(!executablePath)throw Error('Set CHROME_BIN');
 browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1440,height:900,hasTouch:true});
 await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle0'});
 await page.evaluate(setupPlatformFixture);
 await page.waitForFunction(()=>dashboard._platformController?.rows.length>10);
 // Representative DEMONSTRATION data (synthetic SVGs labelled DEMO): room picture, cover art, avatars, evening sun.
 await page.evaluate(()=>{const h=platformHass,pic=p=>'/scripts/demo-assets/'+p,s=h.states;
  s['person.alex'].attributes={...s['person.alex'].attributes,entity_picture:pic('avatar-a.svg'),user_id:'fixture-user'};
  s['person.sam']={entity_id:'person.sam',state:'home',attributes:{friendly_name:'Sam',entity_picture:pic('avatar-b.svg'),device_trackers:[]}};
  s['media_player.music']={...s['media_player.music'],state:'playing',attributes:{...s['media_player.music'].attributes,entity_picture:pic('cover.svg'),media_title:'Golden Hour',media_artist:'Demo Ensemble',media_album_name:'Demo',media_position:102,media_duration:236,media_position_updated_at:new Date().toISOString()}};
  s['sun.sun']={entity_id:'sun.sun',state:'below_horizon',attributes:{elevation:-14,azimuth:250}};
  const ws=h.callWS;h.callWS=async a=>{if(a.type==='config/area_registry/list')return [{area_id:'room',name:'Living room',picture:pic('room-living.svg')}];const r=await ws(a);if(a.type==='config/entity_registry/list')return [...r,{entity_id:'person.sam',name:'Sam',original_name:'Sam',platform:'person',area_id:null,device_id:null}];return r;};
  const lamp=nativePlan.floors[0].furniture.find(f=>f.id==='native-lamp');if(lamp)lamp.entity='light.desk';nativeRevision++;
  dashboard.hass={...h};dashboard._loadRegistry(true);
  const c=dashboard._platformController;c.patch('energy',{...c.preferences.energy,power:'sensor.power',total:'sensor.total',daily:'sensor.daily'});c.patch('waste',['sensor.waste','calendar.collection']);c.loadEnergy(14);c.loadCalendars(14,['calendar.collection']);
 });
 await page.evaluate(()=>{dashboard._navigate('Räume');dashboard._navigate('Início');});
 await page.waitForFunction(()=>dashboard._platformController?.areas[0]?.picture&&dashboard._platformController.list(['person']).length===2,{timeout:20000});
 const ready=()=>page.waitForFunction(()=>dashboard.shadowRoot.querySelector('aureon-platform')?.shadowRoot.querySelector('aureon-home-plan')?.shadowRoot.querySelector('neonplan3d-card')?.shadowRoot.querySelector('fp3d-view3d')?.shadowRoot.querySelector('canvas'),{timeout:30000});
 await ready();
 const calls=()=>page.evaluate(()=>platformCalls.filter(x=>Array.isArray(x)&&x[0]!=='GET').length);
 const before=await calls();
 // Structure of the reference composition.
 const structure=await page.evaluate(()=>{const r=dashboard.shadowRoot.querySelector('aureon-platform').shadowRoot;return {title:!!r.querySelector('.home-title h1'),weather:!!r.querySelector('.clock-weather'),scene:!!r.querySelector('.home-scene aureon-home-plan'),room:!!r.querySelector('.room-feature.has-photo img'),tiles:[...r.querySelectorAll('.side-tile')].map(x=>x.dataset.tile),people:r.querySelectorAll('.person').length,mini:!!dashboard.shadowRoot.querySelector('aureon-platform > aureon-music-player[slot="mini-player"]'),stage:getComputedStyle(r.querySelector('aureon-home-plan').shadowRoot.querySelector('neonplan3d-card').shadowRoot.querySelector('fp3d-view3d').shadowRoot.querySelector('.fp3d-stage')).backgroundImage};});
 assert.ok(structure.title&&structure.weather&&structure.scene&&structure.room&&structure.mini,JSON.stringify(structure));
 assert.deepEqual(structure.tiles,['security','energy']);
 assert.equal(structure.people,2);
 assert.equal(structure.stage,'none','native stage integrates into the AUREON background');
 checks.push('reference composition: greeting header, floating native plan, overlaid mini player, people, right panel with room picture, security/energy, weather');
 const sizes=[[1440,900],[1180,820],[820,1180],[390,844]];
 for(const [width,height] of sizes){await page.setViewport({width,height,hasTouch:true});await new Promise(r=>setTimeout(r,900));const w=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,vw:innerWidth}));assert.ok(w.doc<=w.vw,JSON.stringify({width,...w}));await page.screenshot({path:`${out}/home-${width}x${height}.png`,fullPage:true});}
 checks.push('Startseite without horizontal overflow at 1440/1180/820/390');
 // iSG Display Max: native 1280x800 is not necessarily the CSS viewport.
 // Reserve HA header/sidebar space and cover a scaled viewport independently.
 for(const [width,height,sidebar] of [[1280,800,0],[1280,744,256],[1024,640,0]]){
  await page.setViewport({width,height,hasTouch:true,deviceScaleFactor:1});
  await page.evaluate(sidebar=>{document.body.style.marginLeft=sidebar+'px';},sidebar);
  await new Promise(r=>setTimeout(r,900));
  const layout=await page.evaluate(()=>{
   const r=dashboard.shadowRoot.querySelector('aureon-platform').shadowRoot;
   const grid=r.querySelector('.home-grid'),scene=r.querySelector('.home-scene');
   const main=r.querySelector('.home-main').getBoundingClientRect(),side=r.querySelector('.home-side').getBoundingClientRect();
   return {overflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,sideBySide:side.left>=main.right,sceneHeight:scene.getBoundingClientRect().height,controls:[...r.querySelectorAll('.home-toolbar button,.home-toolbar select,.room-feature-stats button')].map(e=>e.getBoundingClientRect().height)};
  });
  assert.equal(layout.overflow,false,JSON.stringify({width,height,sidebar,...layout}));
  assert.equal(layout.columns,2,JSON.stringify({width,height,sidebar,...layout}));
  assert.ok(layout.sideBySide&&layout.sceneHeight>=340,JSON.stringify(layout));
  assert.ok(layout.controls.every(h=>h>=44),JSON.stringify(layout));
  await page.screenshot({path:`${out}/isg-${width}x${height}-sidebar-${sidebar}.png`,fullPage:true});
 }
 await page.evaluate(()=>{document.body.style.marginLeft='0px';});
 await page.setViewport({width:1440,height:900,hasTouch:true});
 checks.push('iSG landscape CSS simulation: 1280x800, 1280x744 with HA sidebar, 1024x640; two columns, no horizontal overflow, touch targets >=44px (not physical-device validation)');

 // Room panel: dimmed and blurred backdrop, native dialog, no service call by opening.
 for(const [width,height] of [[1440,900],[390,844]]){await page.setViewport({width,height,hasTouch:true});await new Promise(r=>setTimeout(r,500));await page.click(`${platform} >>> .room-feature-open`);await page.waitForFunction(()=>dashboard.shadowRoot.querySelector('aureon-platform').shadowRoot.querySelector('dialog.room-panel')?.open);await new Promise(r=>setTimeout(r,400));await page.screenshot({path:`${out}/room-panel-${width}x${height}.png`});const backdrop=await page.evaluate(()=>getComputedStyle(dashboard.shadowRoot.querySelector('aureon-platform').shadowRoot.querySelector('dialog.room-panel'),'::backdrop').backdropFilter);assert.match(backdrop,/blur/);await page.keyboard.press('Escape');await page.waitForFunction(()=>!dashboard.shadowRoot.querySelector('aureon-platform').shadowRoot.querySelector('dialog'));}
 assert.equal(await calls(),before,'opening the room panel issues no service call');
 checks.push('room panel opens as native dialog over dimmed/blurred backdrop at desktop and phone, without commands');
 // Palettes and modes: each one renders the same composition with readable tokens.
 await page.setViewport({width:1440,height:900,hasTouch:true});
 const palettes=await page.evaluate(()=>[...dashboard.shadowRoot.querySelector('aureon-platform').palettes].map(p=>p.id));
 assert.equal(palettes.length,23);assert.ok(palettes.includes("forest-botanical"));
 for(const [appearance,palette] of [['custom','forest'],['custom','black-gold-royal'],['custom','sapphire'],['custom','pearl'],['custom','terracotta'],['light','forest'],['dark','forest']]){
  await page.evaluate(([appearance,palette])=>{const c=dashboard._platformController;c.patch('appearance',appearance);c.patch('palette',palette);dashboard._theme={...dashboard._theme,mode:appearance,palette};dashboard._render();},[appearance,palette]);
  await ready();await new Promise(r=>setTimeout(r,900));
  const contrast=await page.evaluate(()=>{const r=dashboard.shadowRoot.querySelector('aureon-platform').shadowRoot,el=r.querySelector('.home-title h1');return {fg:getComputedStyle(el).color,bg:getComputedStyle(dashboard).getPropertyValue('--au-bg')};});
  assert.ok(contrast.fg&&contrast.bg,JSON.stringify(contrast));
  await page.screenshot({path:`${out}/palette-${appearance}-${palette}.png`});
 }
 checks.push('Startseite rendered in 5 custom palettes plus light and dark modes');
 await page.waitForFunction(()=>dashboard.shadowRoot.querySelector('aureon-platform').shadowRoot.querySelector('aureon-home-plan').shadowRoot.querySelector('neonplan3d-card')._config.theme==='real');await new Promise(r=>setTimeout(r,1200));await page.screenshot({path:`${out}/look-real.png`});
 checks.push('Real plan look captured in the Startseite (the only look)');
 assert.deepEqual(errors,[]);
 writeFileSync(`${out}/RESULTS.json`,JSON.stringify({environment:'synthetic fixture and compiled bundles; not a Home Assistant installation',passed:checks.length,checks},null,2)+'\n');
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await browser?.close();server.close();}
