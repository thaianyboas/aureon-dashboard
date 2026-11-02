// Actual compiled native editor; synthetic plans and parent persistence only, no HA installation.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {build} from '../floor-studio/neonplan3d-main/frontend/node_modules/esbuild/lib/main.js';
import puppeteer from '../floor-studio/neonplan3d-main/frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const root=resolve('.'),out=resolve('build/loading-browser');mkdirSync(out,{recursive:true});
await build({stdin:{contents:"import {emptyBuilding} from './floor-studio/neonplan3d-main/frontend/src/model.ts';import {parseExport,exportFile} from './floor-studio/neonplan3d-main/frontend/src/transfer.ts';Object.assign(window,{emptyBuilding,parseExport,exportFile});",resolveDir:root},bundle:true,outfile:out+'/model.js'});
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://local');
 if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#101c22;color:white}header{font:12px system-ui;padding:12px}fp3d-editor{height:94vh;display:block}</style><header>Native editor · isolated synthetic plan · no Home Assistant installation</header><script src="/build/loading-browser/model.js"></script><script type="module" src="/floor-studio/neonplan3d-main/custom_components/neonplan3d/frontend/neonplan3d.js"></script>');return;}
 const file=resolve(root,'.'+url.pathname);if(!file.startsWith(root+sep)||!existsSync(file)){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':'text/javascript;charset=utf-8'}).end(readFileSync(file));
});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const checks=[];
try{
 const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium','/tmp/chromium'].find(existsSync);if(!executablePath)throw Error('Set CHROME_BIN');
 browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1440,height:1000});await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!customElements.get('neonplan3d-card'));

 await page.evaluate(()=>{
  window.reads=0;window.blocked=true;window.plan=emptyBuilding();plan.floors=[{id:'f',name:'Synthetic',height:2.7,elevation:0,cut_height:1.4,rooms:[{id:'r',name:'Room',points:[[0,0],[4,0],[4,3],[0,3]],floor_material:'wood'}],openings:[],furniture:[],walls:[],placements:[],outdoor:[]}];
  window.hassFixture={user:{name:'Fixture',is_admin:true},language:'en',states:{},areas:{},devices:{},entities:{},floors:{},connection:{subscribeMessage:async()=>async()=>{}},callWS:payload=>{
   if(payload.type==='neonplan3d/building/get'){reads++;if(blocked)return new Promise(resolve=>{window.finishOld=resolve;});return Promise.resolve({building:structuredClone(plan),revision:2});}
   if(payload.type==='neonplan3d/packs/list')return new Promise(()=>{});
   return Promise.resolve({});
  }};
  const card=document.createElement('neonplan3d-card');card.setConfig({type:'custom:neonplan3d-card',theme:'day',quality:'low',height:500});card.hass=hassFixture;document.body.append(card);window.card=card;
 });
 await page.waitForFunction(()=>card.shadowRoot.textContent.includes('Loading'));
 await page.waitForFunction(()=>card.shadowRoot.textContent.includes('12 seconds'),{timeout:16000});
 assert.equal(await page.evaluate(()=>reads),1);assert.ok(await page.$('neonplan3d-card >>> .fp3d-card-msg button'));
 checks.push('unanswered building request leaves loading within deadline, with a localized explanation and Retry');
 const start=Date.now();await page.evaluate(()=>{blocked=false;card.shadowRoot.querySelector('.fp3d-card-msg button').click();});await page.waitForFunction(()=>card.shadowRoot.querySelector('fp3d-view3d'),{timeout:5000});
 assert.ok(Date.now()-start<5000);assert.equal(await page.evaluate(()=>reads),2);
 checks.push('Retry displays the native plan without waiting for optional packs');
 await page.evaluate(()=>finishOld({building:{...plan,floors:[]},revision:1}));await page.evaluate(()=>card.updateComplete);assert.equal(await page.evaluate(()=>card.data.building.floors.length),1);
 checks.push('a late timed-out response cannot overwrite the recovered plan');
 await page.evaluate(()=>{window.freshHass={...hassFixture,connection:{subscribeMessage:async()=>async()=>{}}};card.hass=freshHass;});await page.waitForFunction(()=>reads===3);await page.waitForFunction(()=>card.data.building?.floors.length===1);
 checks.push('a new HA connection reloads the plan');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({environment:'compiled native card and synthetic WS; no owner HA',passed:checks.length,checks}));
}finally{await browser?.close();server.close();}
