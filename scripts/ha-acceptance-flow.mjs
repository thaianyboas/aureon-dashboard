// Acceptance flow against a REAL Home Assistant instance (use a disposable/test instance, never production by accident).
// HA_URL=http://127.0.0.1:8123 HA_TOKENS=/path/tokens.json CHROME_BIN=... node scripts/ha-acceptance-flow.mjs
// Floor Studio (original NeonPlan3D panel) → save → AUREON Startseite → reload → edit again → Startseite.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
const url=process.env.HA_URL||'http://127.0.0.1:8123',tokens=JSON.parse(readFileSync(process.env.HA_TOKENS,'utf8')),dash=process.env.AUREON_PATH||'/aureon-home';
const lang=process.env.HA_LANG||'de',L={de:{later:'Nicht jetzt',addFloor:'Etage hinzufügen',build:/^\s*Bauen/,room:/^\s*Raum/,rect:/^\s*Rechteck\s*$/,opening:/Tür & Fenster/},pt:{later:'Agora não',addFloor:'Adicionar piso',build:/^\s*Construir/,room:/^\s*Divisão/,rect:/^\s*Retângulo\s*$/,opening:/Portas e janelas/}}[lang];
const out='build/ha-acceptance/'+lang;mkdirSync(out,{recursive:true});
const checks=[];const note=(t)=>{checks.push(t);console.log('✓',t);};
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const stored=JSON.stringify({access_token:tokens.access_token,token_type:'Bearer',expires_in:1800,hassUrl:url,clientId:url+'/',expires:Date.now()+3600e3,refresh_token:tokens.refresh_token});
const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:lang==='pt'?'pt-BR':'de-DE',timezoneId:'Europe/Berlin'});
await ctx.addInitScript(([t,l])=>{try{localStorage.setItem('hassTokens',t);localStorage.setItem('selectedLanguage',JSON.stringify(l));}catch{}},[stored,lang]);
const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const ws=(msg)=>page.evaluate(m=>document.querySelector('home-assistant').hass.callWS(m),msg);
const plan=async()=>(await ws({type:'neonplan3d/building/get'})).building;
try{
 // 1. Floor Studio: the original NeonPlan3D panel inside Home Assistant.
 await page.goto(url+'/neonplan3d');
 const openEditor=async()=>{await page.locator('button',{hasText:/^Editor$/}).first().click({timeout:60000});};await openEditor();
 const editor=page.locator('fp3d-editor');await editor.waitFor({timeout:60000});
 const dismiss=async()=>{await page.waitForTimeout(2500);const later=page.locator('fp3d-editor button',{hasText:L.later});if(await later.count())await later.first().click({timeout:5000}).catch(()=>{});};await dismiss();
 const before=await plan();
 if(!before.floors.length){await page.locator('fp3d-editor .fp3d-seg-menu button').first().click();await page.locator('fp3d-editor button',{hasText:L.addFloor}).click();}
 await page.waitForFunction(()=>document.querySelector('home-assistant').hass&&true);
 const canvas=page.locator('fp3d-editor .fp3d-canvas-wrap');await canvas.waitFor();const box=await canvas.boundingBox();
 const draw=async(x0,y0,x1,y1)=>{const build=page.locator('fp3d-editor button',{hasText:L.build});if(await build.count()){await build.first().click();await page.locator('fp3d-editor button',{hasText:L.room}).first().click();await page.locator('fp3d-editor button',{hasText:L.rect}).click();}await page.mouse.move(box.x+x0,box.y+y0);await page.mouse.down();await page.mouse.move(box.x+x1,box.y+y1,{steps:12});await page.mouse.up();};
 const until=async(fn,what,ms=30000)=>{const t0=Date.now();for(;;){const b=await plan();if(fn(b))return b;if(Date.now()-t0>ms)throw Error('Timeout: '+what+' · '+JSON.stringify(b.floors?.[0]?.rooms?.map(r=>r.name)));await page.waitForTimeout(800);}};
 const floor=b=>b.floors[0]||{rooms:[],openings:[],furniture:[]};
 const r0=floor(await plan()).rooms.length;
 await draw(160,150,430,420);await until(b=>floor(b).rooms.length>=r0+1,'room A');
 await draw(520,150,760,420);const afterRooms=await until(b=>floor(b).rooms.length>=r0+2,'room B');
 const roomA=floor(afterRooms).rooms.at(-2);
 // door on a wall of room A (native "door & window" tool, default door preset)
 await page.locator('fp3d-editor button',{hasText:/^\s*(Auswählen|Selecionar)\s*$/}).first().click();
 await page.locator('fp3d-editor button',{hasText:L.build}).first().click();await page.locator('fp3d-editor button',{hasText:L.opening}).first().click();
 await page.mouse.click(box.x+295,box.y+150);const o0=floor(afterRooms).openings.length;
 await until(b=>floor(b).openings.length>o0,'door');
 // rename and change the floor material of room A in the native side panel
 await page.locator('fp3d-editor button',{hasText:/^\s*(Auswählen|Selecionar)\s*$/}).first().click();await page.mouse.click(box.x+295,box.y+300);
 const nameField=page.locator('fp3d-editor input').filter({has:page.locator(':scope')}).first();
 const name=lang==='pt'?'Sala Demo (nome próprio)':'Wohnbereich Demo (eigener Name)';
 await page.evaluate(n=>{const deep=(root,sel)=>{const q=[root];while(q.length){const x=q.shift();const f=x.querySelector?.(sel);if(f)return f;for(const el of x.querySelectorAll?.('*')||[])if(el.shadowRoot)q.push(el.shadowRoot);}return null;};const ed=deep(document,'fp3d-editor');const label=[...ed.shadowRoot.querySelectorAll('label')].find(l=>/^(Name|Nome)/.test(l.textContent.trim()));const input=label?.querySelector('input')||label?.nextElementSibling;input.value=n;input.dispatchEvent(new Event('input',{bubbles:true,composed:true}));input.dispatchEvent(new Event('change',{bubbles:true,composed:true}));},name);
 await until(b=>floor(b).rooms.some(r=>r.name===name),'rename');
 const saved=await plan();note(`Floor Studio (UI original): 2 cômodos desenhados, porta inserida e cômodo renomeado para "${name}" — salvos no armazenamento do NeonPlan3D (${floor(saved).rooms.length} cômodos, ${floor(saved).openings.length} aberturas)`);
 await page.screenshot({path:out+'/01-floor-studio-editado.png'});
 // 2. AUREON Startseite shows the same plan from the same store.
 await page.goto(url+dash);
 const cardRooms=()=>page.evaluate(()=>{const deep=(root,sel)=>{const q=[root];while(q.length){const n=q.shift();const f=n.querySelector?.(sel);if(f)return f;for(const el of n.querySelectorAll?.('*')||[])if(el.shadowRoot)q.push(el.shadowRoot);}return null;};const v=deep(document,'fp3d-view3d');const f=v?.building?.floors?.[0];return f?{rooms:f.rooms.map(r=>[r.id,r.name]),openings:f.openings.map(o=>o.id)}:null;});
 await page.waitForFunction(()=>{const deep=(root,sel)=>{const q=[root];while(q.length){const n=q.shift();const f=n.querySelector?.(sel);if(f)return f;for(const el of n.querySelectorAll?.('*')||[])if(el.shadowRoot)q.push(el.shadowRoot);}return null;};return !!deep(document,'fp3d-view3d')?.building;},null,{timeout:60000});
 assert.deepEqual(await cardRooms(),{rooms:saved.floors[0].rooms.map(r=>[r.id,r.name]),openings:saved.floors[0].openings.map(o=>o.id)});note('Startseite mostra os mesmos cômodos (IDs e nomes próprios) e aberturas salvos no Floor Studio');
 await page.waitForTimeout(2500);await page.screenshot({path:out+'/02-startseite-apos-salvar.png'});
 // 3. Reload: persisted.
 await page.reload();await page.waitForFunction(()=>{const deep=(root,sel)=>{const q=[root];while(q.length){const n=q.shift();const f=n.querySelector?.(sel);if(f)return f;for(const el of n.querySelectorAll?.('*')||[])if(el.shadowRoot)q.push(el.shadowRoot);}return null;};return !!deep(document,'fp3d-view3d')?.building;},null,{timeout:60000});
 assert.deepEqual(await cardRooms(),{rooms:saved.floors[0].rooms.map(r=>[r.id,r.name]),openings:saved.floors[0].openings.map(o=>o.id)});note('Após recarregar a página, a Startseite mantém a mesma planta');
 // 4. Edit again in Studio (third room), back to Startseite.
 await page.goto(url+'/neonplan3d');await openEditor();await editor.waitFor();await dismiss();await canvas.waitFor();
 const n=floor(await plan()).rooms.length;await draw(160,470,430,640);
 const edited=await until(b=>floor(b).rooms.length>n,'third room');await page.goto(url+dash);
 await page.waitForFunction(()=>{const deep=(root,sel)=>{const q=[root];while(q.length){const n=q.shift();const f=n.querySelector?.(sel);if(f)return f;for(const el of n.querySelectorAll?.('*')||[])if(el.shadowRoot)q.push(el.shadowRoot);}return null;};return !!deep(document,'fp3d-view3d')?.building;},null,{timeout:60000});
 assert.deepEqual(await cardRooms(),{rooms:edited.floors[0].rooms.map(r=>[r.id,r.name]),openings:edited.floors[0].openings.map(o=>o.id)});note(`Nova edição no Studio (${edited.floors[0].rooms.length} cômodos) aparece na Startseite`);
 await page.waitForTimeout(2500);await page.screenshot({path:out+'/03-startseite-apos-nova-edicao.png'});
 for(const [w,h] of [[1440,900],[820,1180],[390,844]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(2500);const ov=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);assert.ok(ov,'horizontal overflow at '+w);await page.screenshot({path:`${out}/startseite-${lang}-${w}x${h}.png`,fullPage:true});}
 note('Startseite ('+lang+') capturada em 1440/820/390 sem rolagem horizontal');
 writeFileSync(out+'/RESULTS.json',JSON.stringify({ha:url,checks,errors},null,2)+'\n');
 console.log(JSON.stringify({passed:checks.length,errors},null,2));
}catch(e){await page.screenshot({path:out+'/FAILED.png'}).catch(()=>{});throw e;}finally{await browser.close();}
