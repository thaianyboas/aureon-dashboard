// Actual compiled native editor; synthetic plans and parent persistence only, no HA installation.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {build} from '../floor-studio/neonplan3d-main/frontend/node_modules/esbuild/lib/main.js';
import puppeteer from '../floor-studio/neonplan3d-main/frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const root=resolve('.'),out=resolve('build/contour-browser');mkdirSync(out,{recursive:true});
await build({stdin:{contents:"import {emptyBuilding} from './floor-studio/neonplan3d-main/frontend/src/model.ts';import {parseExport,exportFile} from './floor-studio/neonplan3d-main/frontend/src/transfer.ts';Object.assign(window,{emptyBuilding,parseExport,exportFile});",resolveDir:root},bundle:true,outfile:out+'/model.js'});
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://local');
 if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#101c22;color:white}header{font:12px system-ui;padding:12px}fp3d-editor{height:94vh;display:block}</style><header>Native editor · isolated synthetic plan · no Home Assistant installation</header><script src="/build/contour-browser/model.js"></script><script type="module" src="/floor-studio/neonplan3d-main/custom_components/aureon_floor/frontend/neonplan3d-editor.js"></script>');return;}
 const file=resolve(root,'.'+url.pathname);if(!file.startsWith(root+sep)||!existsSync(file)){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':'text/javascript;charset=utf-8'}).end(readFileSync(file));
});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const checks=[];
try{
 const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium','/tmp/chromium'].find(existsSync);if(!executablePath)throw Error('Set CHROME_BIN');
 browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1440,height:1000});await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!customElements.get('fp3d-editor'));
 await page.evaluate(()=>{
  window.calls=[];window.changes=[];window.fixtureHass={user:{id:'fixture',is_admin:true},language:'en',states:{},areas:{},devices:{},entities:{},floors:{},callWS:async payload=>{calls.push(payload);return [];}};
  window.mountEditor=building=>{const e=document.createElement('fp3d-editor');e.id='editor';e.hass=fixtureHass;e.building=building;e.addEventListener('building-changed',event=>{changes.push(event.detail.building);e.building=event.detail.building;window.savedPlan=JSON.stringify(event.detail.building);});document.body.append(e);window.editor=e;};mountEditor(emptyBuilding());
 });await page.waitForFunction(()=>editor.shadowRoot.querySelector('.fp3d-canvas-wrap'));

 const privatePath=process.env.AUREON_PRIVATE_PLAN;
 const imported=privatePath ? JSON.parse(readFileSync(privatePath,'utf8')) : null;
 await page.evaluate(data=>{
  const b=data ? parseExport(JSON.stringify(data)) : emptyBuilding();
  if(!data){b.settings.wall_exterior=.5;b.settings.wall_interior=.5;b.floors=[{id:'f',name:'Synthetic',elevation:0,height:2.7,cut_height:1.4,rooms:[],openings:[],furniture:[],placements:[],walls:[],outdoor:[]}];for(let i=0;i<6;i++){const x=(i%2)*4,z=Math.floor(i/2)*4;b.floors[0].rooms.push({id:'r'+i,name:'Room '+i,area_id:null,floor_material:'wood',points:[[x,z],[x+4,z],[x+4,z+4],[x,z+4]]});}b.floors[0].openings=[{id:'window',room_id:'r0',edge:3,offset:2,width:1,type:'window',height:1,sill:.8}];}
  editor.remove();mountEditor(parseExport(JSON.stringify(exportFile(b,false))));
 },imported);
 await page.waitForFunction(()=>editor.floor?.rooms.length===6);
 await page.evaluate(()=>{editor._tool='select';editor._aureonContour=false;editor._view={scale:45,ox:90,oy:70};});await page.evaluate(()=>editor.updateComplete);
 const original=await page.evaluate(()=>JSON.stringify(editor.building));
 // Every edge remains reachable even if too short, hidden by objects, or difficult to touch.
 const total=await page.evaluate(()=>editor.floor.rooms.reduce((n,r)=>n+r.points.length,0));
 for(let ri=0;ri<6;ri++){
  await page.evaluate(i=>editor.selectItem('room',editor.floor.rooms[i].id),ri);await page.evaluate(()=>editor.updateComplete);
  const n=await page.evaluate(()=>editor.room.points.length);
  for(let i=0;i<n;i++){
   await page.evaluate(i=>editor.shadowRoot.querySelector('[data-contour-edge="'+i+'"]').click(),i);await page.evaluate(()=>editor.updateComplete);
   assert.equal(await page.evaluate(()=>editor._aureonWall.index),i);
   assert.equal(await page.evaluate(()=>editor.shadowRoot.querySelectorAll('[data-contour-coordinates] input').length),4);
  }
 }
 checks.push('all '+total+' room contour edges selectable from numbered controls');
 await page.click('#editor >>> [data-contour-mode]');await page.evaluate(()=>editor.updateComplete);assert.equal(await page.evaluate(()=>editor._aureonContour),true);

 // Leftmost and lower horizontal edges of the first room, from the visible wall face.
 const first=await page.evaluate(()=>editor.floor.rooms[0]);
 const edges=first.points.map((a,i)=>({i,a,b:first.points[(i+1)%first.points.length]}));
 const left=edges.filter(e=>Math.abs(e.a[0]-e.b[0])<.001).sort((a,b)=>a.a[0]-b.a[0])[0];
 const bottom=edges.filter(e=>Math.abs(e.a[1]-e.b[1])<.001).sort((a,b)=>b.a[1]-a.a[1])[0];
 for(const edge of [left,bottom]){
  await page.evaluate(()=>{editor.selectItem('room',null);editor._aureonContour=true;editor._view={scale:60,ox:100,oy:80};});await page.evaluate(()=>editor.updateComplete);
  // the side panel may open or close with the contour mode: wait until the plan has stopped moving before measuring
  await page.evaluate(async()=>{let last='';for(let k=0;k<40;k++){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const q=editor.shadowRoot.querySelector('svg.fp3d-plan').getBoundingClientRect();const key=[q.x,q.y,q.width,q.height].join();if(key===last)return;last=key;}});
  await page.evaluate(()=>{editor._view={scale:60,ox:100,oy:80};});await page.evaluate(()=>editor.updateComplete);
  const at=await page.evaluate(i=>{const r=editor.floor.rooms[0],a=r.points[i],b=r.points[(i+1)%r.points.length];const len=Math.hypot(b[0]-a[0],b[1]-a[1]);const n=[-(b[1]-a[1])/len,(b[0]-a[0])/len];const rect=editor.shadowRoot.querySelector('svg.fp3d-plan').getBoundingClientRect();/* the frame the editor maps pointers in (localPoint) */for(const t of [.35,.65,.2,.8,.45,.55]){const p=editor.toScreen([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);p[0]+=n[0]*11;p[1]+=n[1]*11;const el=editor.shadowRoot.elementFromPoint(rect.x+p[0],rect.y+p[1]);if(el?.closest('[data-mid],[data-vertex]')||!el?.closest('svg.fp3d-plan'))continue;return {x:rect.x+p[0],y:rect.y+p[1],n,hit:editor.aureonEdgeAt(p)};}throw Error('No unobstructed wall point');},edge.i);
  assert.ok(at.hit,'visible thick wall face is selectable');
  const before=await page.evaluate(()=>JSON.stringify(editor.building.floors[0]));
  await page.mouse.move(at.x,at.y);await page.mouse.down();assert.equal(await page.evaluate(()=>editor.drag?.kind),'roomedge');await page.mouse.move(at.x+at.n[0]*18,at.y+at.n[1]*18,{steps:6});await page.mouse.up();await page.evaluate(()=>editor.updateComplete);
  const after=await page.evaluate(()=>JSON.stringify(editor.building.floors[0]));assert.notEqual(after,before);
  await page.click('#editor >>> [aria-label="Undo"]');await page.evaluate(()=>editor.updateComplete);assert.equal(await page.evaluate(()=>JSON.stringify(editor.building.floors[0])),before);
  await page.click('#editor >>> [aria-label="Redo"]');await page.evaluate(()=>editor.updateComplete);assert.equal(await page.evaluate(()=>JSON.stringify(editor.building.floors[0])),after);
  await page.evaluate(()=>{editor.remove();mountEditor(parseExport(savedPlan));});await page.waitForFunction(()=>editor.floor?.rooms.length===6);assert.equal(await page.evaluate(()=>JSON.stringify(editor.building.floors[0])),after);
 }
 checks.push('left and bottom contour walls drag from visible face; exact undo/redo and save/reopen');
 await page.evaluate(()=>{editor.selectItem('room',editor.floor.rooms[0].id);editor._aureonContour=true;editor._view={scale:60,ox:100,oy:80};});await page.evaluate(()=>editor.updateComplete);
 const corner=await page.$eval('#editor >>> [data-vertex="0"]',el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 const beforeCorner=await page.evaluate(()=>JSON.stringify(editor.floor.rooms));await page.mouse.move(corner.x,corner.y);await page.mouse.down();assert.equal(await page.evaluate(()=>editor.drag?.kind),'vertex');await page.mouse.move(corner.x-12,corner.y-12,{steps:4});await page.mouse.up();await page.evaluate(()=>editor.updateComplete);assert.notEqual(await page.evaluate(()=>JSON.stringify(editor.floor.rooms)),beforeCorner);await page.click('#editor >>> [aria-label="Undo"]');await page.evaluate(()=>editor.updateComplete);assert.equal(await page.evaluate(()=>JSON.stringify(editor.floor.rooms)),beforeCorner);
 checks.push('corner handles remain draggable in contour mode; undo restores geometry');
 // Exact endpoint edits and outer-wall removal preserve room and furniture records.

 const count=await page.evaluate(()=>editor.floor.furniture.length);
 await page.evaluate(()=>{editor.selectItem('room',editor.floor.rooms[0].id);editor._aureonWall={roomId:editor.room.id,index:0};});await page.evaluate(()=>editor.updateComplete);
 const x=await page.evaluate(()=>editor.room.points[0][0]);
 await page.evaluate(x=>{const input=editor.shadowRoot.querySelector('[data-contour-coordinates] input');input.value=String(x-.1);input.dispatchEvent(new Event('change',{bubbles:true}));},x);await page.evaluate(()=>editor.updateComplete);assert.equal(await page.evaluate(()=>editor.room.points[0][0]),Math.round((x-.1)*1000)/1000);
 await page.evaluate(()=>editor.aureonRemoveDivider(true));await page.evaluate(()=>editor.updateComplete);assert.equal(await page.evaluate(()=>editor.room.wall_heights[0]),0);assert.equal(await page.evaluate(()=>editor.floor.rooms.length),6);assert.equal(await page.evaluate(()=>editor.floor.furniture.length),count);
 await page.evaluate(()=>editor.aureonRemoveDivider(false));await page.evaluate(()=>editor.updateComplete);assert.ok(await page.evaluate(()=>editor.room.wall_heights?.[0]==null));
 checks.push('numeric endpoint input, outer wall remove/restore, rooms and furniture retained');
 if(!privatePath){
  await page.evaluate(()=>{editor._aureonWall={roomId:editor.room.id,index:1};editor.aureonRemoveDivider(true);});await page.evaluate(()=>editor.updateComplete);
  assert.equal(await page.evaluate(()=>editor.floor.rooms[0].wall_heights[1]),0);assert.equal(await page.evaluate(()=>editor.floor.rooms[1].wall_heights[3]),0);
  await page.evaluate(()=>editor.aureonRemoveDivider(false));await page.evaluate(()=>editor.updateComplete);
  assert.ok(await page.evaluate(()=>editor.floor.rooms[0].wall_heights?.[1]==null&&editor.floor.rooms[1].wall_heights?.[3]==null));
  checks.push('shared divider remove/restore updates both rooms');
 }

 const fixed=await page.evaluate(()=>{editor._doc.settings.lock_plan=true;const before=JSON.stringify(editor._doc);editor.aureonSetCorner(editor.room.id,0,[100,100]);editor.aureonRemoveDivider(true);editor._doc.settings.lock_plan=false;return before.replace('"lock_plan":true','"lock_plan":false')===JSON.stringify(editor._doc);});assert.equal(fixed,true);
 checks.push('explicit plan lock still respected');
 await page.setViewport({width:390,height:844});await page.evaluate(()=>{editor.narrow=true;});await page.evaluate(()=>editor.updateComplete);assert.ok(await page.$('#editor >>> [data-contour-walls]'));
 if(!privatePath)await page.screenshot({path:out+'/contour-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({environment:privatePath?'private backup; local compiled editor, no HA':'synthetic browser fixture, no HA',passed:checks.length,checks}));
}finally{await browser?.close();server.close();}
