// Actual compiled native editor; synthetic plans and parent persistence only, no HA installation.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {build} from '../floor-studio/neonplan3d-main/frontend/node_modules/esbuild/lib/main.js';
import puppeteer from '../floor-studio/neonplan3d-main/frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const root=resolve('.'),out=resolve('build/editor-browser');mkdirSync(out,{recursive:true});
await build({stdin:{contents:"import {emptyBuilding} from './floor-studio/neonplan3d-main/frontend/src/model.ts';import {parseExport,exportFile} from './floor-studio/neonplan3d-main/frontend/src/transfer.ts';Object.assign(window,{emptyBuilding,parseExport,exportFile});",resolveDir:root},bundle:true,outfile:out+'/model.js'});
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://local');
 if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#101c22;color:white}header{font:12px system-ui;padding:12px}fp3d-editor{height:94vh;display:block}</style><header>Native editor · isolated synthetic plan · no Home Assistant installation</header><script src="/build/editor-browser/model.js"></script><script type="module" src="/floor-studio/neonplan3d-main/custom_components/neonplan3d/frontend/neonplan3d-editor.js"></script>');return;}
 const file=resolve(root,'.'+url.pathname);if(!file.startsWith(root+sep)||!existsSync(file)){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':'text/javascript;charset=utf-8'}).end(readFileSync(file));
});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const checks=[];
try{
 const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);if(!executablePath)throw Error('Set CHROME_BIN');
 browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1440,height:1000});await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!customElements.get('fp3d-editor'));
 await page.evaluate(()=>{
  window.calls=[];window.changes=[];window.fixtureHass={user:{id:'fixture',is_admin:true},language:'en',states:{},areas:{},devices:{},entities:{},floors:{},callWS:async payload=>{calls.push(payload);return [];}};
  window.mountEditor=building=>{const e=document.createElement('fp3d-editor');e.id='editor';e.hass=fixtureHass;e.building=building;e.addEventListener('building-changed',event=>{changes.push(event.detail.building);e.building=event.detail.building;window.savedPlan=JSON.stringify(event.detail.building);});document.body.append(e);window.editor=e;};mountEditor(emptyBuilding());
 });await page.waitForFunction(()=>editor.shadowRoot.querySelector('.fp3d-canvas-wrap'));
 const clickText=async text=>{await page.evaluate(text=>{const button=[...editor.shadowRoot.querySelectorAll('button')].find(b=>b.textContent.trim()===text&&!b.disabled);if(!button)throw Error('Missing enabled button: '+text);button.click();},text);await page.evaluate(()=>editor.updateComplete);};
 await page.evaluate(()=>[...editor.shadowRoot.querySelectorAll('button')].find(b=>b.textContent.trim()==='Not now')?.click());
 assert.equal(await page.evaluate(()=>editor.building.floors.length),0);assert.deepEqual(await page.evaluate(()=>calls.map(c=>c.type)),['neonplan3d/diagnostics/get']);checks.push('starts empty without private defaults or backend writes');
 await page.click('#editor >>> .fp3d-seg-menu button');await clickText('Add floor');await page.waitForFunction(()=>editor.building.floors.length===1);checks.push('native floor menu creates a floor and emits parent change');
 await clickText('Build ▾');await clickText('Room▸');await clickText('Rectangle');
 const box=await page.$eval('#editor >>> .fp3d-canvas-wrap',e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y};});
 await page.mouse.move(box.x+100,box.y+130);await page.mouse.down();await page.mouse.move(box.x+400,box.y+350,{steps:10});await page.mouse.up();await page.waitForFunction(()=>editor.building.floors[0].rooms.length===1);
 const drawn=await page.evaluate(()=>JSON.stringify(editor.building.floors[0].rooms));assert.equal(JSON.parse(drawn)[0].points.length,4);checks.push('pointer drawing creates real room geometry');
 await page.click('#editor >>> [aria-label="Undo"]');await page.waitForFunction(()=>editor.building.floors[0].rooms.length===0);await page.click('#editor >>> [aria-label="Redo"]');await page.waitForFunction(()=>editor.building.floors[0].rooms.length===1);assert.equal(await page.evaluate(()=>JSON.stringify(editor.building.floors[0].rooms)),drawn);checks.push('toolbar undo and redo restore exact room geometry');
 await page.evaluate(()=>{editor.remove();mountEditor(parseExport(savedPlan));});await page.waitForFunction(()=>editor.shadowRoot.querySelector('.fp3d-canvas-wrap'));assert.deepEqual(await page.evaluate(()=>editor.building.floors[0].rooms.map(({id,name,points,area_id,floor_material})=>({id,name,points,area_id,floor_material}))),JSON.parse(drawn).map(({id,name,points,area_id,floor_material})=>({id,name,points,area_id,floor_material})));checks.push('serialized parent plan reloads into a fresh native editor');
 const transfer=await page.evaluate(()=>{const plan=structuredClone(editor.building);plan.floors[0].rooms[0].area_id='fixture_area';const restored=parseExport(JSON.stringify(exportFile(plan,false))),shared=exportFile(plan,true);let invalid=false;try{parseExport('{"not":"a plan"}');}catch{invalid=true;}return {rooms:restored.floors[0].rooms.length,link:restored.floors[0].rooms[0].area_id,sharedLink:shared.building.floors[0].rooms[0].area_id,invalid};});assert.deepEqual(transfer,{rooms:1,link:'fixture_area',sharedLink:null,invalid:true});checks.push('native JSON round-trip preserves own plan; share mode removes room HA link; malformed plan rejected');
 for(const width of [1440,820,390]){await page.setViewport({width,height:1000});await page.evaluate(w=>{editor.narrow=w<600;},width);await page.evaluate(()=>editor.updateComplete);await page.screenshot({path:out+'/editor-'+width+'.png',fullPage:true});assert.ok(await page.$('#editor >>> .fp3d-canvas-wrap'));}checks.push('native editor captures at desktop, tablet and mobile');
 await page.evaluate(()=>{editor.hass={...fixtureHass,user:{id:'reader',is_admin:false}};});await page.evaluate(()=>editor.updateComplete);await page.click('#editor >>> .fp3d-seg-menu button');assert.equal(await page.evaluate(()=>[...editor.shadowRoot.querySelectorAll('button')].some(b=>b.textContent.trim()==='Add floor')),false);assert.equal(await page.evaluate(()=>[...editor.shadowRoot.querySelectorAll('button')].find(b=>b.textContent.trim()==='Furniture').disabled),true);checks.push('non-admin native UI omits floor creation and disables furniture tools');
 assert.deepEqual(errors,[]);const result={environment:'actual compiled editor, synthetic parent persistence; backend permissions/storage not exercised',passed:checks.length,checks};writeFileSync(out+'/RESULTS.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser?.close();server.close();}
