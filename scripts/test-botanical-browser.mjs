import assert from 'node:assert/strict';import {createServer} from 'node:http';import {readFileSync,existsSync,mkdirSync} from 'node:fs';import {resolve,sep} from 'node:path';
import puppeteer from '../floor-studio/neonplan3d-main/frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import {build} from '../floor-studio/neonplan3d-main/frontend/node_modules/esbuild/lib/main.js';
import {setupPlatformFixture} from './platform-fixture.mjs';
const root=resolve('.'),out=resolve('build/botanical-browser');mkdirSync(out,{recursive:true});
await build({stdin:{contents:`import {emptyBuilding,newFloor} from './floor-studio/neonplan3d-main/frontend/src/model.ts';window.nativeFixtureBuilding=()=>{const b=emptyBuilding(),f=newFloor('floor','Synthetic apartment',0);f.rooms=[{id:'native-room',name:'Living room',area_id:null,points:[[0,0],[5,0],[5,5],[0,5]],floor_material:'wood'},{id:'bedroom',name:'Bedroom',points:[[5,0],[9,0],[9,3],[5,3]],floor_material:'wood'},{id:'kitchen',name:'Kitchen',points:[[5,3],[9,3],[9,5],[5,5]],floor_material:'tiles'}];const item=(id,type,x,z,w,d,h,rotation=0)=>({id,type,x,z,w,d,h,rotation,variant:null});f.furniture=[{...item('native-lamp','lamp_floor',.6,.7,.4,.4,1.7),name:'Lamp model',entity:null},item('sofa','sofa',1.7,1.1,2.4,.9,.8),item('table','table',2,2.8,1.6,.8,.75),item('bed','bed',7,1.4,1.8,2,.7),item('plant','plant',.6,4.3,.6,.6,1.2)];f.openings=[{id:'window',room_id:'native-room',edge:0,offset:2.5,width:1.8,type:'window',sill:.8,height:1.3,hinge:'left',leaves:2,swing:'in',contact2:null,contact:null,cover:null,tilt:null}];b.floors=[f];return b;};`,resolveDir:root},bundle:true,outfile:out+'/model.js'});
const server=createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname;if(pathname==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#101c18;margin:0}body>footer{display:none}</style><script src="/build/botanical-browser/model.js"></script><script type="module" src="/floor-studio/neonplan3d-main/custom_components/aureon_floor/frontend/neonplan3d.js"></script><script src="/build/dashboard/aureon-dashboard.js"></script><footer>Isolated synthetic fixture — not a Home Assistant installation</footer>');return;}const file=resolve(root,'.'+pathname);if(!file.startsWith(root+sep)||!existsSync(file)){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':file.endsWith('.webp')?'image/webp':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.woff2')?'font/woff2':file.endsWith('.json')?'application/json':'text/javascript; charset=utf-8'}).end(readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium','/tmp/chromium'].find(existsSync);if(!executablePath)throw Error('Set CHROME_BIN');browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1440,height:1100,hasTouch:true});await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle0'});await page.evaluate(setupPlatformFixture);await page.waitForFunction(()=>dashboard._platformController?.rows.length>10);

 const read=fn=>page.evaluate(fn);
 await page.evaluate(()=>{
  const h=platformHass,c=dashboard._platformController;
  h.locale={language:'pt'};h.language='pt';
  h.states['person.alex'].attributes.user_id=h.user.id;
  h.states['person.alex'].attributes.entity_picture='/scripts/demo-assets/avatar-a.svg';
  const ws=h.callWS;
  h.callWS=async msg=>{
   if(msg.type==='aureon_floor/plans/list')return {plans:[{id:'main'},{id:'test-plan',name:'Test plan'}]};
   if(msg.type==='config/area_registry/list')return [
    {area_id:'room',name:'Sala'},{area_id:'kitchen',name:'Cozinha'},{area_id:'bedroom',name:'Quarto'},
    {area_id:'bathroom',name:'Banheiro'},{area_id:'hall',name:'Flur'},{area_id:'balcony',name:'Balkon'}
   ];
   if(msg.type==='config/entity_registry/list'){
    const rows=await ws(msg);
    const extras=['kitchen','bedroom','bathroom','hall','balcony'].map(area=>{
     const id='light.'+area;
     h.states[id]={entity_id:id,state:'on',attributes:{friendly_name:area}};
     return {entity_id:id,name:area,original_name:area,area_id:area,device_id:null,platform:'fixture'};
    });
    const id='person.sam';
    h.states[id]={entity_id:id,state:'home',attributes:{friendly_name:'Sam',entity_picture:'/scripts/demo-assets/avatar-b.svg'}};
    return [...rows,...extras,{entity_id:id,name:'Sam',original_name:'Sam',area_id:null,device_id:null,platform:'person'}];
   }
   return ws(msg);
  };
  const calendarId='calendar.personal';
  h.states[calendarId]={entity_id:calendarId,state:'off',attributes:{friendly_name:'Agenda'}};
  const metadata={entity_id:calendarId,name:'Agenda',area_id:null,device_id:null,platform:'calendar'};
  const fixtureWS=h.callWS;
  h.callWS=async msg=>msg.type==='config/entity_registry/list'?[...await fixtureWS(msg),metadata]:fixtureWS(msg);
  h.callApi=async(method,url)=>{
   platformCalls.push([method,url]);
   const today=new Intl.DateTimeFormat('en-CA',{timeZone:h.config.time_zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   return [{summary:url.includes('calendar.personal')?'Compromisso':'Papel',start:{date:today}}];
  };
  h.states['weather.home'].attributes.supported_features=2;
  h.connection.subscribeMessage=async(callback,msg)=>{
   if(msg.type==='weather/subscribe_forecast')callback({forecast:Array.from({length:4},(_,hour)=>({
    datetime:new Date(Date.now()+hour*3600000).toISOString(),condition:'partlycloudy',temperature:13+hour
   }))});
   return async()=>{};
  };
  h.states['media_player.music'].attributes.entity_picture='/scripts/demo-assets/cover.svg';
  c.patch('appearance','custom');c.patch('palette','forest-botanical');
  c.patch('waste',['calendar.collection']);
  dashboard._theme={...dashboard._theme,mode:'custom',palette:'forest-botanical'};
  dashboard.hass={...h};dashboard._render();dashboard._loadRegistry(true);
  window.homeRoot=()=>dashboard.shadowRoot.querySelector('aureon-platform:not([style*="display: none"])')?.shadowRoot;
 });
 await page.waitForFunction(()=>homeRoot()?.querySelectorAll('.cine-room').length===6&&homeRoot().querySelector('.home-agenda').textContent.includes('Compromisso'));
 const path='#platform-dashboard >>> aureon-platform';
 await page.waitForFunction(()=>homeRoot()?.querySelector('slot[name=mini-player]')?.assignedElements()[0]?.shadowRoot?.querySelector('.stage'));
 await page.evaluate(()=>homeRoot().querySelector('.cine-room').click());
 await page.waitForFunction(()=>homeRoot()?.querySelector('[data-platform-page="rooms"]'));
 await page.evaluate(()=>dashboard._navigate('Einstellungen'));
 await page.evaluate(()=>homeRoot().querySelector('[data-settings-tab="start"]').click());
 await page.waitForSelector(path+' >>> .set-choices');
 await page.evaluate(()=>homeRoot().querySelector('.set-choices button:nth-child(2)').click());
 await page.select(path+' >>> .set-panel select','test-plan');
 await page.evaluate(()=>dashboard._navigate('Início'));
 for(const withPlan of [false,true]){
  await page.evaluate(v=>dashboard._platformController.patch('home3d',v),withPlan);
  await page.waitForFunction(v=>!!homeRoot()?.querySelector('aureon-home-plan')===v,{},withPlan);
  if(withPlan)await page.waitForFunction(()=>homeRoot().querySelector('aureon-home-plan').shadowRoot.querySelector('neonplan3d-card')?.shadowRoot.querySelector('fp3d-view3d')?.shadowRoot.querySelector('canvas'),{timeout:60000});
  for(const [width,height] of [[1440,900],[1280,744],[820,1180],[390,844]]){
   await page.setViewport({width,height,hasTouch:true});
   await new Promise(r=>setTimeout(r,600));
   const layout=await read(()=>{const root=homeRoot(),shell=dashboard.shadowRoot;
    const main=shell.querySelector('main'),content=root.querySelector('.aureon-home');
    if(!getComputedStyle(shell.querySelector('.wrap'),':before').backgroundImage.includes('botanical-canopy.webp'))throw Error('Missing Botanical artwork');
    if(!root.querySelector('.home-robot')||!root.querySelector('[data-person]'))throw Error('Missing footer cards');
    return {overflow:main.scrollWidth>main.clientWidth+1||content.scrollWidth>content.clientWidth+1,
     roomsInNav:!!shell.querySelector('nav [data-route="Räume"]'),devices:!!shell.querySelector('nav [data-route="Geräte"]'),
     room:!!root.querySelector('.cine-room'),agenda:!!root.querySelector('.home-agenda'),self:!!root.querySelector('[data-person="person.alex"]')};
   });
   assert.deepEqual(layout,{overflow:false,roomsInNav:false,devices:true,room:true,agenda:true,self:true},JSON.stringify({width,withPlan,layout}));
   await page.screenshot({path:out+'/'+(withPlan?'with-plan':'without-plan')+'-'+width+'.png'});
  }
 }
 await page.reload({waitUntil:'networkidle0'});await page.evaluate(setupPlatformFixture);
 await page.waitForFunction(()=>dashboard._platformController?.rows.length>10);
 assert.equal(await read(()=>dashboard._platformController.preferences.home3d),true);
 assert.equal(await read(()=>dashboard._platformController.preferences.homePlan),'test-plan');
 assert.equal(await read(()=>dashboard._platformController.preferences.palette),'forest-botanical');
 assert.deepEqual(errors,[]);
 console.log('Botanical: two layouts, native WebGL, navigation, room access, signed-in person, persistence and four viewports.');
}finally{await browser?.close();server.close();}
