import test from 'node:test';
import assert from 'node:assert/strict';
import module, {scan, getTemperature, language} from '../src/window-watch.mjs';
const now = Date.parse('2026-10-30T12:00:00Z');
function host(minutes, action = 'idle', temp = 5) {
 const states = {'binary_sensor.window': {state:'on', last_changed:new Date(now-minutes*60000).toISOString(), attributes:{}}, 'climate.living':{state:'heat',attributes:{hvac_action:action}}, 'weather.home':{state:'cloudy',attributes:{temperature:temp,temperature_unit:'°C'}}};
 const hass={states,entities:{'climate.living':{area_id:'living'}},devices:{}};
 return {hass:()=>hass,language:()=> 'pt-BR',weather:()=> 'weather.home',openings:()=>[{id:'w1',entity:'binary_sensor.window',kind:'window',name:'Janela da sala',roomId:'living',floorId:'f1',open:true,tilted:false}]};
}
test('language supports pt/de/en',()=>{assert.equal(language('pt-BR'),'pt');assert.equal(language('de-DE'),'de');assert.equal(language('fr'),'en')});
test('cold window warns after 20 minutes',()=>assert.equal(scan(host(21),now)[0].kind,'cold'));
test('heating window warns after 10 minutes',()=>assert.equal(scan(host(11,'heating'),now)[0].kind,'heat'));
test('short openings are ignored',()=>assert.equal(scan(host(5,'heating'),now).length,0));
test('warm weather without heating does not warn',()=>assert.equal(scan(host(40,'idle',22),now).length,0));
test('Fahrenheit converted correctly',()=>assert.equal(getTemperature({states:{'weather.home':{attributes:{temperature:32,temperature_unit:'°F'}}}},'weather.home'),0));
test('module exports API 1',()=>assert.equal(module.api,1));
test('alerts include room, floor and localized text',()=>{const h=host(30,'heating');const old=Date.now;Date.now=()=>now;try{const a=module.alerts(h)[0];assert.equal(a.roomId,'living');assert.match(a.text,/Aquecimento ligado/)}finally{Date.now=old}});
test('maps NeonPlan room IDs to HA area IDs',()=>{const h=host(15,'heating');h.building=()=>({floors:[{rooms:[{id:'living',area_id:'living_ha'}]}]});h.hass().entities['climate.living'].area_id='living_ha';assert.equal(scan(h,now)[0].kind,'heat')});
