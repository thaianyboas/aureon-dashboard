import test from 'node:test';
import assert from 'node:assert/strict';
import windowWatch, {scan,windowConfig} from '../src/window-watch.mjs';
import {aureonModules} from '../src/module-settings.mjs';
const since=new Date(Date.now()-16*60_000).toISOString();
function host(config){
 const building={settings:{mods:{'aureon.window_watch':config}},floors:[{rooms:[]}]};
 const hass={states:{'binary_sensor.window':{state:'on',last_changed:since},'weather.outside':{attributes:{temperature:6}},'weather.other':{attributes:{temperature:22}}}};
 return {building:()=>building,hass:()=>hass,weather:()=> 'weather.other',openings:()=>[{id:'w1',entity:'binary_sensor.window',kind:'window',name:'Window',open:true,tilted:false,roomId:'room',floorId:'floor'}],language:()=> 'en',updateBuilding:fn=>fn(building)};
}
test('saved coldMinutes setting changes actual scan threshold',()=>{
 assert.equal(scan(host({coldMinutes:20,weatherEntity:'weather.outside'})).length,0);
 assert.equal(scan(host({coldMinutes:10,weatherEntity:'weather.outside'})).length,1);
});
test('saved weather entity overrides default host weather',()=>{
 assert.equal(scan(host({coldMinutes:10})).length,0);
 assert.equal(scan(host({coldMinutes:10,weatherEntity:'weather.outside'})).length,1);
});
test('module alerts read saved settings, not defaults',()=>{
 assert.equal(windowWatch.alerts(host({coldMinutes:10,weatherEntity:'weather.outside'})).length,1);
 assert.equal(windowWatch.alerts(host({coldMinutes:20,weatherEntity:'weather.outside'})).length,0);
});
test('settings editor updates building config used by scan',()=>{
 const h=host({coldMinutes:20,weatherEntity:'weather.outside'});
 const mod=aureonModules.find(x=>x.id==='aureon.window_watch');
 const field=mod.settings(h).find(x=>x.kind==='select'&&x.label==='Window open (min)');
 field.set('10');
 assert.equal(windowConfig(h).coldMinutes,10);
 assert.equal(scan(h).length,1);
});
test('configured weather is included in watched entities',()=>{
 assert.ok(windowWatch.watched(host({weatherEntity:'weather.outside'})).includes('weather.outside'));
});
