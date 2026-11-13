// Compiled stable dashboard; synthetic hass only, no HA installation. The open page survives a rebuild of the dashboard.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,readFileSync} from 'node:fs';
import puppeteer from '../floor-studio/neonplan3d-main/frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const bundle=readFileSync('dist/aureon-dashboard.js');
const server=createServer((req,res)=>{if(req.url.startsWith('/b.js')){res.writeHead(200,{'content-type':'text/javascript;charset=utf-8'}).end(bundle);return;}res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end('<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh"><script src="/b.js"></script>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
const mount=()=>{document.querySelectorAll('aureon-dashboard').forEach(e=>e.remove());const d=document.createElement('aureon-dashboard');d.style.cssText='display:block;height:100vh';document.body.append(d);d.hass={states:{},language:'en',locale:{language:'en'},user:{id:'u'},callWS:async()=>[]};d.setConfig({type:'custom:aureon-dashboard'});return d._page;};
try{
 const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium','/tmp/chromium'].find(existsSync);if(!executablePath)throw Error('Set CHROME_BIN');
 browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=`http://127.0.0.1:${server.address().port}`;await page.goto(base+'/lovelace/aureon');
 assert.equal(await page.evaluate(mount),'Início','a new browser starts at Início');
 await page.evaluate(()=>document.querySelector('aureon-dashboard')._navigate('Energie'));
 await page.reload();
 assert.equal(await page.evaluate(mount),'Energie','a rebuilt dashboard opens the page that was open');
 assert.equal(await page.evaluate(()=>document.querySelector('aureon-dashboard').shadowRoot.querySelector('nav .active')?.dataset.route),'Energie','the rail marks the restored page');
 await page.goto(base+'/lovelace/other');
 assert.equal(await page.evaluate(mount),'Início','each dashboard path keeps its own page');
 await page.evaluate(()=>localStorage.setItem('aureon.page.v1',JSON.stringify({'/lovelace/other':{page:'Planta'}})));
 assert.equal(await page.evaluate(mount),'Início','the plan link is never restored (it leaves the dashboard)');
 await page.evaluate(()=>localStorage.setItem('aureon.page.v1','not json'));
 assert.equal(await page.evaluate(mount),'Início','broken storage falls back to Início');
 assert.deepEqual(errors,[]);
 console.log('PASS: the open page survives a dashboard rebuild, per dashboard path, invalid entries ignored');
}finally{await browser?.close();server.close();}
