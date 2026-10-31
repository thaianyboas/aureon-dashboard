// Acceptance flow against a REAL Home Assistant instance (use a disposable/test instance, never production by accident).
// HA_URL=http://127.0.0.1:8123 HA_TOKENS=/path/tokens.json CHROME_BIN=... node scripts/ha-acceptance-flow.mjs
// Floor Studio (original NeonPlan3D panel) → save → AUREON Startseite → reload → edit again → Startseite.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
const url=process.env.HA_URL||'http://127.0.0.1:8123',tokens=JSON.parse(readFileSync(process.env.HA_TOKENS,'utf8')),dash=process.env.AUREON_PATH||'/aureon-home';
const out='build/ha-acceptance';mkdirSync(out,{recursive:true});
const checks=[];const note=(t)=>{checks.push(t);console.log('✓',t);};
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const stored=JSON.stringify({access_token:tokens.access_token,token_type:'Bearer',expires_in:1800,hassUrl:url,clientId:url+'/',expires:Date.now()+3600e3,refresh_token:tokens.refresh_token});
const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'de-DE',timezoneId:'Europe/Berlin'});
await ctx.addInitScript(t=>{try{localStorage.setItem('hassTokens',t);}catch{}},stored);
const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const ws=(msg)=>page.evaluate(m=>document.querySelector('home-assistant').hass.callWS(m),msg);
const plan=async()=>(await ws({type:'neonplan3d/building/get'})).building;
try{
 // 1. Floor Studio: the original NeonPlan3D panel inside Home Assistant.
 await page.goto(url+'/neonplan3d');
 const editor=page.locator('fp3d-editor');await editor.waitFor({timeout:60000});
 await page.locator('fp3d-editor button',{hasText:'Nicht jetzt'}).click({timeout:5000}).catch(()=>{});
 const before=await plan();
 if(!before.floors.length){await page.locator('fp3d-editor .fp3d-seg-menu button').first().click();await page.locator('fp3d-editor button',{hasText:'Etage hinzufügen'}).click();}
 await page.waitForFunction(()=>document.querySelector('home-assistant').hass&&true);
 const canvas=page.locator('fp3d-editor .fp3d-canvas-wrap');await canvas.waitFor();const box=await canvas.boundingBox();
 const draw=async(x0,y0,x1,y1)=>{await page.locator('fp3d-editor button',{hasText:/^Bauen/}).click();await page.locator('fp3d-editor button',{hasText:/^Raum/}).first().click();await page.locator('fp3d-editor button',{hasText:/^Rechteck$/}).click();await page.mouse.move(box.x+x0,box.y+y0);await page.mouse.down();await page.mouse.move(box.x+x1,box.y+y1,{steps:12});await page.mouse.up();};
 const rooms0=(await plan()).floors[0]?.rooms.length||0;
 await draw(180,160,520,420);await draw(520,160,760,420);
 await page.waitForFunction(async n=>{const b=(await document.querySelector('home-assistant').hass.callWS({type:'neonplan3d/building/get'})).building;return (b.floors[0]?.rooms.length||0)>=n;},rooms0+2,{timeout:30000,polling:1000});
 const saved=await plan();note(`Floor Studio desenhou e salvou ${saved.floors[0].rooms.length} cômodos no armazenamento do NeonPlan3D`);
 await page.screenshot({path:out+'/01-floor-studio-editado.png'});
 // 2. AUREON Startseite shows the same plan from the same store.
 await page.goto(url+dash);
 const cardRooms=()=>page.evaluate(()=>{const deep=(root,sel)=>{const q=[root];while(q.length){const n=q.shift();const f=n.querySelector?.(sel);if(f)return f;for(const el of n.querySelectorAll?.('*')||[])if(el.shadowRoot)q.push(el.shadowRoot);}return null;};const v=deep(document,'fp3d-view3d');return v?.building?.floors?.[0]?.rooms?.map(r=>r.id)||null;});
 await page.waitForFunction(()=>{const deep=(root,sel)=>{const q=[root];while(q.length){const n=q.shift();const f=n.querySelector?.(sel);if(f)return f;for(const el of n.querySelectorAll?.('*')||[])if(el.shadowRoot)q.push(el.shadowRoot);}return null;};return !!deep(document,'fp3d-view3d')?.building;},null,{timeout:60000});
 assert.deepEqual(await cardRooms(),saved.floors[0].rooms.map(r=>r.id));note('Startseite mostra exatamente os cômodos salvos no Floor Studio');
 await page.waitForTimeout(2500);await page.screenshot({path:out+'/02-startseite-apos-salvar.png'});
 // 3. Reload: persisted.
 await page.reload();await page.waitForFunction(()=>{const deep=(root,sel)=>{const q=[root];while(q.length){const n=q.shift();const f=n.querySelector?.(sel);if(f)return f;for(const el of n.querySelectorAll?.('*')||[])if(el.shadowRoot)q.push(el.shadowRoot);}return null;};return !!deep(document,'fp3d-view3d')?.building;},null,{timeout:60000});
 assert.deepEqual(await cardRooms(),saved.floors[0].rooms.map(r=>r.id));note('Após recarregar a página, a Startseite mantém a mesma planta');
 // 4. Edit again in Studio (third room), back to Startseite.
 await page.goto(url+'/neonplan3d');await editor.waitFor();await page.locator('fp3d-editor button',{hasText:'Nicht jetzt'}).click({timeout:3000}).catch(()=>{});await canvas.waitFor();
 const n=(await plan()).floors[0].rooms.length;await draw(180,420,520,600);
 await page.waitForFunction(async n=>(await document.querySelector('home-assistant').hass.callWS({type:'neonplan3d/building/get'})).building.floors[0].rooms.length>n,n,{timeout:30000,polling:1000});
 const edited=await plan();await page.goto(url+dash);
 await page.waitForFunction(()=>{const deep=(root,sel)=>{const q=[root];while(q.length){const n=q.shift();const f=n.querySelector?.(sel);if(f)return f;for(const el of n.querySelectorAll?.('*')||[])if(el.shadowRoot)q.push(el.shadowRoot);}return null;};return !!deep(document,'fp3d-view3d')?.building;},null,{timeout:60000});
 assert.deepEqual(await cardRooms(),edited.floors[0].rooms.map(r=>r.id));note(`Nova edição no Studio (${edited.floors[0].rooms.length} cômodos) aparece na Startseite`);
 await page.waitForTimeout(2500);await page.screenshot({path:out+'/03-startseite-apos-nova-edicao.png'});
 for(const [w,h] of [[1440,900],[820,1180],[390,844]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(2500);const ov=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);assert.ok(ov,'horizontal overflow at '+w);await page.screenshot({path:`${out}/startseite-de-${w}x${h}.png`,fullPage:true});}
 note('Startseite em alemão capturada em 1440/820/390 sem rolagem horizontal');
 writeFileSync(out+'/RESULTS.json',JSON.stringify({ha:url,checks,errors},null,2)+'\n');
 console.log(JSON.stringify({passed:checks.length,errors},null,2));
}finally{await browser.close();}
